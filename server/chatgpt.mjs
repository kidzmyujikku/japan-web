import { createServer } from 'node:http';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import openSystemBrowser from 'open';
import { createVault } from './vault.mjs';
import { consumeResponseStream, providerError, TutorError } from './stream.mjs';

export const ISSUER = 'https://auth.openai.com';
export const RESOURCE = 'https://api.openai.com/v1';
const PLAN_SCOPE = 'chatgpt.tokens.use.direct';
const random = () => randomBytes(32).toString('base64url');
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const stateMatches = (expected, actual) => {
  if(typeof actual!=='string')return false;
  const left=Buffer.from(expected),right=Buffer.from(actual);
  return left.length===right.length && timingSafeEqual(left,right);
};

export async function verifyTokenIdentity(token, metadata, clientId, nonce, key = createRemoteJWKSet(new URL(metadata.jwks_uri))) {
  const { payload } = await jwtVerify(token,key,{issuer:ISSUER,audience:clientId,algorithms:['RS256'],requiredClaims:['iss','aud','exp','sub','nonce'],clockTolerance:5});
  if (typeof payload.sub !== 'string' || payload.nonce !== nonce) throw new TutorError('identity','Identitas akun belum dapat diverifikasi.',400);
  return payload;
}

export function buildAuthorization({ hostId, state, nonce, verifier, redirectUri, profile }) {
  const url = new URL(`${ISSUER}/api/accounts/authorize`);
  const params = { client_id: profile?.clientId ?? 'dynamic_agent_client', ext_agent_host_id: hostId, response_type:'code', redirect_uri:redirectUri, scope:`openid profile email offline_access resource.invoke ${PLAN_SCOPE}`, resource:RESOURCE, state, nonce, code_challenge_method:'S256', code_challenge:createHash('sha256').update(verifier).digest('base64url') };
  if (!profile) params.agent_name_hint = 'Nichi Nichi';
  else if (profile.email) params.login_hint = profile.email;
  if (profile?.sharingGranted === false) params.prompt = 'consent';
  Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,value));
  return url.toString();
}

export function createChatGPT({ vault = createVault(), fetcher = fetch, verifyIdentity, onChanged = () => {}, openBrowser = openSystemBrowser } = {}) {
  let discoveryPromise, refreshPromise, pending;
  const modelCache = new Map();
  const discovery = async () => {
    discoveryPromise ??= (async () => {
      const response = await fetcher(`${ISSUER}/.well-known/openid-configuration`, { signal:AbortSignal.timeout(15000) });
      if (!response.ok) throw new TutorError('discovery', 'Halaman login resmi belum dapat dihubungi. Periksa koneksi.', 502);
      const result = await response.json();
      if (result.issuer !== ISSUER || ['authorization_endpoint','token_endpoint','jwks_uri'].some(k => !result[k] || new URL(result[k]).origin !== ISSUER)) throw new TutorError('discovery', 'Konfigurasi login tidak valid.', 502);
      return result;
    })().catch(error => { discoveryPromise = undefined; throw error; });
    return discoveryPromise;
  };
  const tokens = async params => {
    const metadata = await discovery();
    let response;
    try { response = await fetcher(metadata.token_endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),signal:AbortSignal.timeout(20000)}); }
    catch { throw new TutorError('network','Koneksi ke ChatGPT terputus. Coba lagi saat online.',502); }
    const result = await response.json();
    if (!response.ok) throw providerError(result.error,response.status);
    if (!result.access_token || result.token_type?.toLowerCase() !== 'bearer' || !Number.isFinite(result.expires_in) || result.expires_in <= 0) throw new TutorError('token','Login belum menghasilkan sesi yang valid.',502);
    return result;
  };
  const selected = async () => {
    const data = await vault.load();
    const profile = data.profiles.find(p => p.id === data.activeId);
    return { data, profile };
  };
  const accessToken = async () => {
    const { data, profile } = await selected();
    if (!profile?.credentials?.accessToken) throw new TutorError('reconnect','Hubungkan akun ChatGPT untuk mulai memakai tutor.',401);
    if (!profile.credentials.scopes.includes(PLAN_SCOPE)) throw providerError(PLAN_SCOPE,403);
    if (profile.credentials.expiresAt > Date.now() + 60000) return profile.credentials.accessToken;
    if (refreshPromise) return refreshPromise;
    const profileId = profile.id;
    refreshPromise = (async () => {
      if (!profile.credentials.refreshToken) throw providerError('invalid_grant',401);
      let result;
      try { result = await tokens({grant_type:'refresh_token',client_id:profile.clientId,refresh_token:profile.credentials.refreshToken,resource:RESOURCE}); }
      catch (error) { if (error.code === 'reconnect') { profile.credentials = null; await vault.save(data); } throw error; }
      profile.credentials = {
        ...profile.credentials, accessToken:result.access_token,
        refreshToken:result.refresh_token ?? profile.credentials.refreshToken,
        idToken:result.id_token ?? profile.credentials.idToken,
        expiresAt:Date.now()+result.expires_in*1000,
        scopes:result.scope ? result.scope.split(' ') : profile.credentials.scopes,
      };
      await vault.save(data);
      if (data.activeId !== profileId) throw new TutorError('account_changed','Akun berubah. Kirim ulang pertanyaan dengan akun yang dipilih.',409);
      if (!profile.credentials.scopes.includes(PLAN_SCOPE)) throw providerError(PLAN_SCOPE,403);
      return profile.credentials.accessToken;
    })().finally(()=>{refreshPromise = undefined;});
    return refreshPromise;
  };

  const client = {
    async status() {
      const { data, profile } = await selected();
      return { connected:Boolean(profile?.credentials), sharing:Boolean(profile?.credentials?.scopes.includes(PLAN_SCOPE)), activeId:data.activeId, profiles:data.profiles.map(p=>({id:p.id,email:p.email,name:p.name,connected:Boolean(p.credentials),welcomeSeen:Boolean(p.welcomeSeen)})), pending:Boolean(pending), authError:client.authError ?? null };
    },
    authError:null,
    async beginSignIn({ profileId, returnOrigin }) {
      if (pending) { clearTimeout(pending.timer); pending.server.close(); pending = undefined; }
      const data = await vault.load();
      const profile = profileId ? data.profiles.find(p=>p.id === profileId) : null;
      if (profileId && !profile) throw new TutorError('profile','Akun tersimpan tidak ditemukan. Muat ulang halaman.',400);
      const state=random(),nonce=random(),verifier=random();
      const attempt = { state,nonce,verifier,profileId:profile?.id,clientId:profile?.clientId,returnOrigin };
      const callback = createServer(async (req,res) => {
        let url;
        try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400);res.end('Alamat callback tidak valid.');return;}
        if(req.method!=='GET'){res.writeHead(405);res.end();return;}
        if (url.pathname !== '/auth/callback') { res.writeHead(404); res.end(); return; }
        if (pending !== attempt || !stateMatches(state,url.searchParams.get('state'))) { res.writeHead(400); res.end('Permintaan login tidak cocok atau sudah kedaluwarsa.'); return; }
        pending=undefined; clearTimeout(attempt.timer);
        let ok=false, message='';
        try {
          if (url.searchParams.has('error')) throw new TutorError('consent','Login atau izin penggunaan paket belum disetujui. Kamu bisa mencoba lagi dari website.',400);
          const code=url.searchParams.get('code'), returnedId=url.searchParams.get('client_id');
          const clientId=profile?.clientId ?? returnedId;
          if (!code || !clientId || clientId==='dynamic_agent_client' || (profile && returnedId && returnedId!==profile.clientId)) throw new TutorError('registration','Registrasi aplikasi belum lengkap. Mulai login kembali dari website.',400);
          const record = profile ?? { id:randomUUID(),clientId,subject:null,issuer:ISSUER,welcomeSeen:false,email:'',name:'Koneksi belum selesai',credentials:null };
          if (!profile) { data.profiles.push(record); await vault.save(data); }
          const result=await tokens({grant_type:'authorization_code',client_id:clientId,code,code_verifier:verifier,redirect_uri:attempt.redirectUri,resource:RESOURCE});
          if (!result.id_token) throw new TutorError('identity','Identitas akun belum dapat diverifikasi.',400);
          const metadata=await discovery();
          const payload=verifyIdentity ? await verifyIdentity(result.id_token,{clientId,nonce}) : await verifyTokenIdentity(result.id_token,metadata,clientId,nonce);
          if (typeof payload.sub!=='string' || payload.nonce !== nonce || (profile?.subject && profile.subject!==payload.sub)) throw new TutorError('identity','Identitas akun tidak cocok. Pilih akun ChatGPT yang sesuai.',400);
          record.subject = payload.sub;
          record.email = typeof payload.email==='string' ? payload.email : 'Akun ChatGPT';
          record.name = typeof payload.name==='string' ? payload.name : record.email;
          record.credentials = { accessToken:result.access_token,refreshToken:result.refresh_token ?? null,idToken:result.id_token,expiresAt:Date.now()+result.expires_in*1000,scopes:(result.scope ?? '').split(' ') };
          record.sharingGranted = record.credentials.scopes.includes(PLAN_SCOPE);
          data.activeId = record.id;
          await vault.save(data); modelCache.clear(); client.authError=null; ok=true;
          message=record.credentials.scopes.includes(PLAN_SCOPE) ? 'Akunmu terhubung. Kembali ke Nichi Nichi untuk mulai bertanya.' : 'Identitas akun terhubung, tetapi izin penggunaan paket belum aktif. Hubungkan kembali dan izinkan penggunaan paket untuk memakai tutor.';
        } catch(error) { message=error instanceof TutorError ? error.message : 'Login belum dapat diselesaikan. Coba lagi dari Nichi Nichi.'; client.authError=message; }
        res.writeHead(ok?200:400,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"});
        res.end(`<!doctype html><html lang="id"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nichi Nichi — koneksi ChatGPT</title><style>body{font:18px system-ui;background:#fff8ee;color:#18233d;max-width:520px;margin:12vh auto;padding:24px;line-height:1.7}h1{font-size:32px}a{display:inline-block;background:#18233d;color:white;border-radius:30px;padding:13px 24px;text-decoration:none}</style><h1>${ok?'Koneksi selesai.':'Mari coba lagi.'}</h1><p>${escapeHtml(message)}</p><a href="${escapeHtml(returnOrigin)}/tutor">Kembali ke tutor</a><p>Tab ini boleh ditutup.</p></html>`);
        callback.close(); onChanged();
      });
      await new Promise((resolve,reject)=>{callback.once('error',reject);callback.listen(0,'127.0.0.1',resolve);});
      attempt.redirectUri=`http://127.0.0.1:${callback.address().port}/auth/callback`;
      attempt.server=callback;
      attempt.timer=setTimeout(()=>{if(pending===attempt){pending=undefined;client.authError='Login belum selesai. Klik Continue with ChatGPT untuk mencoba lagi.';}callback.close();},300000);
      attempt.timer.unref(); pending=attempt;client.authError=null;
      const url=buildAuthorization({hostId:data.hostId,state,nonce,verifier,redirectUri:attempt.redirectUri,profile});
      let opened=false;
      try{await openBrowser(url);opened=true;}catch{ /* The interface can offer a manual copy instead. */ }
      return {url,opened};
    },
    async selectProfile(id) {
      if (refreshPromise) await refreshPromise.catch(()=>{});
      const data=await vault.load();
      if (!data.profiles.some(p=>p.id===id)) throw new TutorError('profile','Akun tersimpan tidak ditemukan.',400);
      data.activeId=id;await vault.save(data);modelCache.clear();return client.status();
    },
    async acknowledgeWelcome() { const {data,profile}=await selected();if(profile){profile.welcomeSeen=true;await vault.save(data);} },
    async signOut() {
      if (refreshPromise) await refreshPromise.catch(()=>{});
      const {data,profile}=await selected();let revoked=true;
      if (profile?.credentials?.refreshToken) {
        revoked=false;
        for(let attempt=0;attempt<2;attempt++) {
          try {
            const metadata=await discovery();
            if (!metadata.revocation_endpoint || new URL(metadata.revocation_endpoint).origin!==ISSUER) break;
            const response=await fetcher(metadata.revocation_endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:profile.credentials.refreshToken,token_type_hint:'refresh_token',client_id:profile.clientId}),signal:AbortSignal.timeout(10000)});
            if(response.status===200){revoked=true;break;}if(response.status<500)break;
          }catch{ /* Keep the token for the next revocation attempt. */ }
          if(attempt===0) await new Promise(resolve=>setTimeout(resolve,300));
        }
      }
      if(profile){profile.credentials=null;await vault.save(data);}modelCache.clear();
      return {revoked,message:revoked?'Akun ChatGPT sudah diputuskan dari tutor.':'Koneksi lokal diputuskan, tetapi pencabutan sesi di ChatGPT belum terkonfirmasi. Putuskan aplikasi juga di pengaturan ChatGPT.'};
    },
    async models() {
      const {profile}=await selected();
      const cached=profile && modelCache.get(profile.id);
      if(cached && cached.until>Date.now()) return cached.models;
      const token=await accessToken();
      const response=await fetcher(`${RESOURCE}/models`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
      if(!response.ok) throw providerError('',response.status);
      const data=await response.json();
      const models=(data.models??[]).filter(m=>m.visibility==='list' && typeof m.slug==='string' && typeof m.display_name==='string').map(m=>({slug:m.slug,name:m.display_name}));
      if(!models.length) throw new TutorError('model_unavailable','Belum ada model yang ditampilkan untuk akun ini. Periksa akses akun di ChatGPT.',403);
      modelCache.set(profile.id,{models,until:Date.now()+300000});return models;
    },
    async respond({model,input,instructions,onText,signal}) {
      const models=await client.models();
      if(!models.some(m=>m.slug===model)) throw new TutorError('model_unavailable','Pilih model dari daftar akunmu.',400);
      const token=await accessToken();
      const response=await fetcher(`${RESOURCE}/responses`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({model,input,instructions,store:false,stream:true}),signal});
      if(!response.ok){let detail={};try{detail=await response.json();}catch{}throw providerError(detail.error?.code,response.status);}
      if(!response.body)throw new TutorError('interrupted','Jawaban belum dapat diterima.',502);
      return consumeResponseStream(response.body,onText,{signal});
    },
    close() { if(pending){clearTimeout(pending.timer);pending.server.close();pending=undefined;} },
  };
  return client;
}
