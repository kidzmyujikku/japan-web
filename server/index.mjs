import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createApp } from './app.mjs';

const args=process.argv.slice(2);
const flag=args.indexOf('--port');
const port=flag>=0?Number(args[flag+1]):5173;
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Port harus bilangan bulat 1024–65535.');
const app=createApp({port,apiOnly:args.includes('--api-only'),root:resolve(fileURLToPath(new URL('../dist',import.meta.url)))});
const server=createServer(app);
server.listen(port,args.includes('--api-only')?'127.0.0.1':'0.0.0.0',()=>console.log(`Nichi Nichi ${args.includes('--api-only')?'AI service':'website + tutor'}: http://localhost:${port}/`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} sedang dipakai. Hentikan server Nichi Nichi sebelumnya.`:'Layanan lokal belum dapat dimulai.');process.exitCode=1;});
const stop=()=>{app.close();server.close();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
