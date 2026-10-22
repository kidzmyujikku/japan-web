import { randomBytes, timingSafeEqual } from 'node:crypto';
import { stat, readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createChatGPT } from './chatgpt.mjs';
import { TutorError } from './stream.mjs';
import { makeTutorRequest } from './tutor.mjs';
import { makePracticeRequest, parsePracticeSet } from './practice.mjs';
import { describeQuestion } from '../src/lib/practice.ts';

const same = (a,b) => typeof a==='string' && typeof b==='string' && Buffer.byteLength(a)===Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
const loopback = address => address==='::1' || address?.startsWith('127.') || address?.startsWith('::ffff:127.');
const json = (res,status,value) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
async function readJson(req) {
  if(!req.headers['content-type']?.startsWith('application/json')) throw new TutorError('content_type','Permintaan tidak valid.',415);
  let text='';
  for await(const part of req){text+=part;if(Buffer.byteLength(text)>40000)throw new TutorError('size','Pertanyaan terlalu panjang.',413);}
  try{const value=JSON.parse(text);if(!value || typeof value!=='object' || Array.isArray(value))throw new Error();return value;}catch{throw new TutorError('json','Permintaan tidak dapat dibaca.',400);}
}

export function createApp({client=createChatGPT(),port=5173,apiOnly=false,root=resolve('dist')}={}) {
  const origins = new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`,'http://localhost:5173','http://127.0.0.1:5173']);
  const sessions = new Map();
  const practiceHistory = new Map();
  let activeRequest;
  const server = async (req,res) => {
    try {
      const url=new URL(req.url,`http://127.0.0.1:${port}`);
      if(url.pathname.startsWith('/api/ai/')) {
        const expectedHosts = new Set([`localhost:${port}`,`127.0.0.1:${port}`]);
        if(!expectedHosts.has(req.headers.host))throw new TutorError('host','Alamat layanan lokal tidak cocok.',403);
        if(!loopback(req.socket.remoteAddress) || (req.headers['x-nichi-client-address'] && !loopback(req.headers['x-nichi-client-address'])))throw new TutorError('local_only','Tutor AI tersedia di laptop yang menjalankan Nichi Nichi. Materi biasa tetap dapat dipakai di HP.',403);
        if((req.headers.origin && !origins.has(req.headers.origin)) || req.headers['sec-fetch-site']==='cross-site') throw new TutorError('origin','Tutor hanya menerima permintaan dari website lokal ini.',403);
        let sid=req.headers.cookie?.match(/(?:^|;\s*)nn_ai=([a-zA-Z0-9_-]+)/)?.[1];
        let session=sid && sessions.get(sid);
        if(session && Date.now()-session.at>12*60*60*1000){sessions.delete(sid);session=null;}
        if(!session){sid=randomBytes(32).toString('base64url');session={csrf:randomBytes(32).toString('base64url'),at:Date.now()};sessions.set(sid,session);res.setHeader('Set-Cookie',`nn_ai=${sid}; HttpOnly; SameSite=Strict; Path=/api/ai; Max-Age=43200`);}
        session.at=Date.now();
        if(sessions.size>100) for(const [id,value] of sessions)if(Date.now()-value.at>3600000)sessions.delete(id);
        if(req.method==='GET' && url.pathname==='/api/ai/status'){json(res,200,{...await client.status(),csrf:session.csrf});return;}
        if(req.method==='GET' && url.pathname==='/api/ai/models'){json(res,200,{models:await client.models()});return;}
        if(req.method!=='POST')throw new TutorError('method','Metode tidak tersedia.',405);
        if(!same(session.csrf,req.headers['x-nichi-csrf']))throw new TutorError('csrf','Sesi halaman perlu dimuat ulang sebelum melanjutkan.',403);
        const body=await readJson(req);
        if(activeRequest && ['/api/ai/auth/start','/api/ai/auth/select','/api/ai/auth/logout'].includes(url.pathname))throw new TutorError('busy','Hentikan jawaban tutor sebelum mengubah akun.',409);
        if(url.pathname==='/api/ai/auth/start'){const returnOrigin=origins.has(req.headers.origin)?req.headers.origin:`http://localhost:${port}`;json(res,200,await client.beginSignIn({profileId:body.profileId,returnOrigin}));return;}
        if(url.pathname==='/api/ai/auth/select'){json(res,200,await client.selectProfile(body.profileId));return;}
        if(url.pathname==='/api/ai/auth/logout'){json(res,200,await client.signOut());return;}
        if(url.pathname==='/api/ai/auth/welcome'){await client.acknowledgeWelcome();json(res,200,{ok:true});return;}
        if(url.pathname==='/api/ai/practice'){
          if(activeRequest)throw new TutorError('busy','Masih ada latihan atau jawaban yang sedang dibuat. Tunggu atau hentikan lebih dulu.',409);
          const status=await client.status();
          if(status.pending)throw new TutorError('busy','Selesaikan proses login sebelum membuat latihan.',409);
          if(typeof body.model!=='string' || body.model.length>120)throw new TutorError('model','Model latihan belum tersedia.',400);
          const key=`${status.activeId??sid}:${body.lessonId}`;
          const recent=practiceHistory.get(key)??[];
          const request=makePracticeRequest(body,recent);
          const controller=new AbortController();activeRequest=controller;
          const timeout=setTimeout(()=>controller.abort(),120000);
          res.on('close',()=>{if(!res.writableEnded)controller.abort();});
          try{
            const output=await client.respond({instructions:request.instructions,input:request.input,model:body.model,signal:controller.signal,onText:()=>{}});
            const set=parsePracticeSet(output,request,body);
            practiceHistory.set(key,[...recent,...set.questions.map(describeQuestion)].slice(-50));
            if(practiceHistory.size>64)practiceHistory.delete(practiceHistory.keys().next().value);
            if(!res.destroyed)json(res,200,set);
          }catch(error){
            if(error instanceof TutorError)throw error;
            throw new TutorError('network','Pembuatan latihan terputus atau melewati batas waktu. Coba lagi.',502);
          }finally{clearTimeout(timeout);activeRequest=undefined;}
          return;
        }
        if(url.pathname==='/api/ai/chat'){
          if(activeRequest)throw new TutorError('busy','Masih ada jawaban yang sedang diproses. Tunggu atau hentikan lebih dulu.',409);
          if((await client.status()).pending)throw new TutorError('busy','Selesaikan proses login sebelum bertanya.',409);
          if(typeof body.model!=='string' || body.model.length>120)throw new TutorError('model','Pilih model yang tersedia.',400);
          const request=makeTutorRequest(body);
          const controller=new AbortController();activeRequest=controller;
          const timeout=setTimeout(()=>controller.abort(),120000);
          res.on('close',()=>{if(!res.writableEnded)controller.abort();});
          const stream=value=>{if(!res.headersSent)res.writeHead(200,{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});if(!res.destroyed)res.write(JSON.stringify(value)+'\n');};
          try{await client.respond({...request,model:body.model,signal:controller.signal,onText:text=>stream({type:'delta',text})});stream({type:'done'});}
          catch(error){const known=error instanceof TutorError?error:new TutorError('network','Jawaban terputus atau melewati batas waktu. Coba lagi.',502);stream({type:'error',error:known.message,code:known.code});}
          finally{clearTimeout(timeout);activeRequest=undefined;if(!res.destroyed)res.end();}return;
        }
        throw new TutorError('route','Layanan tidak ditemukan.',404);
      }
      if(apiOnly || !['GET','HEAD'].includes(req.method)){json(res,404,{error:'Halaman tidak ditemukan.'});return;}
      let path;
      try{path=decodeURIComponent(url.pathname);}catch{throw new TutorError('path','Alamat tidak valid.',400);}
      const file=resolve(root,`.${path}`);
      if(file!==root && !file.startsWith(root+sep))throw new TutorError('path','Alamat tidak valid.',400);
      let target=file;
      try{if(!(await stat(target)).isFile())target=resolve(root,'index.html');}catch{target=resolve(root,'index.html');}
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png'};
      const bytes=await readFile(target);
      res.writeHead(200,{'Content-Type':types[extname(target)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':target.endsWith('index.html')?'no-cache':'public, max-age=3600'});
      res.end(req.method==='HEAD'?undefined:bytes);
    }catch(error){if(!res.headersSent){const known=error instanceof TutorError?error:new TutorError('server','Layanan tutor belum dapat dibuka. Periksa server lokal.',500);json(res,known.status,{error:known.message,code:known.code});}else res.end();}
  };
  server.close=()=>{activeRequest?.abort();client.close();};
  return server;
}
