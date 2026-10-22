import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

function dpapi(data, decrypt) {
  const action = decrypt ? 'Unprotect' : 'Protect';
  const script = `Add-Type -AssemblyName System.Security; $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $entropy=[Text.Encoding]::UTF8.GetBytes('nichinichi-siwc-v1'); $result=[Security.Cryptography.ProtectedData]::${action}($bytes,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($result));`;
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, stdio: ['pipe','pipe','pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.resume();
    child.on('error', () => reject(new Error('Penyimpanan akun Windows belum dapat dibuka.')));
    child.on('exit', code => code === 0 ? resolve(Buffer.from(output.trim(), 'base64')) : reject(new Error('Penyimpanan akun Windows belum dapat dibuka.')));
    child.stdin.end(data.toString('base64'));
  });
}

export function createVault(directory = join(homedir(), '.nichinichi', 'chatgpt')) {
  const file = join(directory, process.platform === 'win32' ? 'accounts.dpapi' : 'accounts.json');
  let current;
  let saving = Promise.resolve();
  return {
    async load() {
      if (current) return current;
      await mkdir(directory, { recursive: true, mode: 0o700 });
      try {
        let bytes = await readFile(file);
        if (process.platform === 'win32') bytes = await dpapi(bytes, true);
        current = JSON.parse(bytes.toString('utf8'));
        if (!current.hostId?.startsWith('urn:uuid:') || !Array.isArray(current.profiles)) throw new Error('Invalid vault');
      } catch (error) {
        if (error.code !== 'ENOENT') throw new Error('Data koneksi ChatGPT tidak bisa dibuka. Jangan mengganti file akun; periksa akun Windows yang dipakai.');
        current = { hostId: `urn:uuid:${randomUUID()}`, activeId: null, profiles: [] };
        await this.save(current);
      }
      return current;
    },
    async save(value) {
      const serialized = Buffer.from(JSON.stringify(value), 'utf8');
      current = value;
      const write = async () => {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const bytes = process.platform === 'win32' ? await dpapi(serialized, false) : serialized;
        const temporary = `${file}.${randomUUID()}.tmp`;
        await writeFile(temporary, bytes, { mode: 0o600 });
        await rename(temporary, file);
      };
      saving = saving.catch(() => {}).then(write);
      await saving;
    },
  };
}
