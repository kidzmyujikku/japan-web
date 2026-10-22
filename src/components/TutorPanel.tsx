import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, LoaderCircle, MessageCircle, Send, Square, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAI } from '../ai-context';
import type { TutorMessage } from '../ai-context';
import type { Lesson } from '../types';
import ChatGPTConnection from './ChatGPTConnection';

type VisibleMessage = TutorMessage & {failed?:boolean;pending?:boolean};
export default function TutorPanel({ lesson, standalone = false }: { lesson: Lesson; standalone?: boolean }) {
  const {status,models,post,refresh,connecting}=useAI();
  const [mode,setMode]=useState<'explain'|'correct'>('explain');
  const [draft,setDraft]=useState('');
  const [model,setModel]=useState('');
  const [messages,setMessages]=useState<VisibleMessage[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [limit,setLimit]=useState(false);
  const controller=useRef<AbortController | null>(null);
  const transcript=useRef<HTMLDivElement>(null);
  const previousAccount=useRef(status?.activeId);
  useEffect(()=>{if(!models.some(m=>m.slug===model))setModel(models[0]?.slug??'');},[models,model]);
  useEffect(()=>{
    if(previousAccount.current!==status?.activeId){const active=controller.current;controller.current=null;active?.abort();setMessages([]);setError('');setBusy(false);previousAccount.current=status?.activeId;}
  },[status?.activeId]);
  useEffect(()=>()=>{const active=controller.current;controller.current=null;active?.abort();},[]);
  const ready=Boolean(status?.sharing && model && !connecting);
  const ask=async(text=draft,requestMode=mode)=>{
    const message=text.trim();if(!message||busy||!ready)return;
    setError('');setLimit(false);setBusy(true);setDraft('');
    const history=messages.filter(m=>!m.failed&&!m.pending).slice(-8).map(({role,content})=>({role,content:content.slice(0,6000)}));
    while(history.length>2 && history.reduce((n,m)=>n+m.content.length,0)>20000)history.splice(0,2);
    const before=messages;
    const current=new AbortController();controller.current=current;
    setMessages([...before,{role:'user',content:message},{role:'assistant',content:'',pending:true}]);
    let output='',completed=false;
    const update=()=>{if(controller.current===current)setMessages([...before,{role:'user',content:message},{role:'assistant',content:output,pending:true}]);};
    try{
      const response=await post('chat',{lessonId:lesson.id,mode:requestMode,message,model,history},current.signal);
      if(!response.ok){const data=await response.json();setLimit(data.code==='usage_limit');throw new Error(data.error||'Tutor belum dapat menjawab.');}
      if(!response.body)throw new Error('Jawaban belum dapat diterima.');
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
      const consume=(line:string)=>{
        if(!line.trim())return;
        const event=JSON.parse(line) as {type:string;text?:string;error?:string;code?:string};
        if(event.type==='delta'){output+=event.text??'';update();}
        if(event.type==='done')completed=true;
        if(event.type==='error'){setLimit(event.code==='usage_limit');throw new Error(event.error||'Jawaban belum selesai.');}
      };
      while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let boundary;while((boundary=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,boundary));buffer=buffer.slice(boundary+1);}}
      buffer+=decoder.decode();if(buffer.trim())consume(buffer);
      if(!completed||!output.trim())throw new Error('Koneksi terputus sebelum jawaban selesai. Silakan coba lagi.');
      if(controller.current===current)setMessages([...before,{role:'user',content:message},{role:'assistant',content:output}]);
    }catch(e){if(controller.current!==current)return;setMessages([...before,{role:'user',content:message,failed:true},...(output?[{role:'assistant' as const,content:output,failed:true}]:[])]);setDraft(message);setError(current.signal.aborted?'Permintaan dihentikan. Jawaban parsial tidak dipakai sebagai konteks berikutnya.':e instanceof Error?e.message:'Koneksi tutor terputus.');}
    finally{if(controller.current===current){controller.current=null;setBusy(false);}void refresh();}
  };
  const scrollToLatest=()=>{if(transcript.current)transcript.current.scrollTop=transcript.current.scrollHeight;};
  return <section className={`tutor-panel ${standalone?'standalone':''}`} id="tutor" aria-labelledby="tutor-title"><div className="tutor-heading"><div className="tutor-symbol"><MessageCircle size={25}/></div><div><p className="eyebrow">SATU PERTANYAAN, SATU LANGKAH LAGI</p><h2 id="tutor-title">Teman memahami Jepang.</h2></div>{!standalone && <Link className="icon-button" aria-label="Buka halaman tutor" to={`/tutor?materi=${lesson.id}`}><ArrowUpRight size={19}/></Link>}</div><p className="tutor-context"><span>Kita sedang membahas</span><strong>{lesson.title}</strong></p>
    <ChatGPTConnection compact/>
    {status?.sharing && <><div className="tutor-model"><label>Model<select value={model} disabled={busy} onChange={e=>setModel(e.target.value)}>{!models.length && <option value="">Daftar model belum tersedia</option>}{models.map(m=><option key={m.slug} value={m.slug}>{m.name}</option>)}</select></label><span><Check size={13}/>Using ChatGPT plan</span></div><div className="tutor-modes" role="group" aria-label="Jenis bantuan tutor"><button aria-pressed={mode==='explain'} disabled={busy} onClick={()=>setMode('explain')}><Sparkles size={16}/>Jelaskan materi</button><button aria-pressed={mode==='correct'} disabled={busy} onClick={()=>setMode('correct')}><Check size={16}/>Koreksi kalimat</button></div>
      {!messages.length && <div className="tutor-starters"><p>Apa yang ingin kamu pahami?</p><button disabled={!ready||busy} onClick={()=>{void ask('Jelaskan inti pelajaran ini dengan lebih sederhana, lalu beri dua contoh pendek.','explain');}}>Jelaskan lebih sederhana<ArrowRight size={15}/></button><button disabled={!ready||busy} onClick={()=>{setMode('correct');setDraft('');document.getElementById(`tutor-input-${lesson.id}`)?.focus();}}>Coba koreksi kalimatku<ArrowRight size={15}/></button></div>}
      {messages.length>0 && <><div className="tutor-transcript" ref={transcript} role="log" aria-label="Percakapan tutor" aria-live="off">{messages.map((message,i)=><article key={i} className={`tutor-message ${message.role} ${message.failed?'failed':''}`}><span className="message-author">{message.role==='user'?'Kamu':'Tutor Jepang'}{message.pending && <LoaderCircle size={13} className="spin"/>}{message.failed && <small>Belum selesai</small>}</span>{message.content?<ReactMarkdown components={{a:({children})=><span>{children}</span>,img:()=>null}}>{message.content}</ReactMarkdown>:<p className="thinking" role="status">Sedang menyusun penjelasan…</p>}</article>)}</div><button className="text-link latest-message" onClick={scrollToLatest}>Lihat jawaban terakhir<ArrowRight size={15}/></button></>}
      {error && <div className="tutor-error" role="alert"><X size={17}/><div><p>{error}</p>{limit && <a className="button button-dark button-small" href="https://chatgpt.com/settings/usage" target="_blank" rel="noreferrer">Manage usage<ArrowUpRight size={16}/></a>}</div></div>}
      <form className="tutor-composer" onSubmit={e=>{e.preventDefault();void ask();}}><label htmlFor={`tutor-input-${lesson.id}`}>{mode==='correct'?'Kalimat Jepang yang ingin kamu periksa':'Pertanyaanmu tentang materi ini'}</label><textarea id={`tutor-input-${lesson.id}`} value={draft} onChange={e=>setDraft(e.target.value)} disabled={busy} maxLength={2000} rows={3} placeholder={mode==='correct'?'Contoh: 私は日本語を好きです。':'Misalnya: kapan は dibaca wa?'} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();void ask();}}}/><div className="composer-footer"><small>{draft.length}/2.000 · Ctrl+Enter untuk kirim</small>{busy?<button type="button" className="button button-outline button-small" onClick={()=>controller.current?.abort()}><Square size={14}/>Hentikan</button>:<button className="button button-dark button-small" type="submit" disabled={!draft.trim()||!ready}><Send size={15}/>{mode==='correct'?'Periksa kalimat':'Tanya tutor'}</button>}</div></form><div className="tutor-bottom"><small>Percakapan ini hanya ada selama halaman terbuka. Jawaban tutor tidak mengubah nilai kuis.</small>{messages.length>0 && <button className="text-link" disabled={busy} onClick={()=>{setMessages([]);setError('');setDraft('');}}>Percakapan baru</button>}</div>
    </>}
  </section>;
}
