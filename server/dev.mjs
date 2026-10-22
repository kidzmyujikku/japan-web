import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const children=[
  spawn(process.execPath,[fileURLToPath(new URL('./index.mjs',import.meta.url)),'--api-only','--port','8787'],{cwd:root,stdio:'inherit',windowsHide:true}),
  spawn(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),'--host','0.0.0.0','--port','5173','--strictPort'],{cwd:root,stdio:'inherit',windowsHide:true}),
];
let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;children.forEach(child=>{if(child.exitCode===null)child.kill();});};
children.forEach(child=>{child.on('exit',code=>{if(!stopping){process.exitCode=code??1;stop();}});child.on('error',()=>{console.error('Layanan development belum dapat dimulai.');process.exitCode=1;stop();});});
process.on('SIGINT',stop);process.on('SIGTERM',stop);
