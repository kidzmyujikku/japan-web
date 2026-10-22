import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createVault } from './vault.mjs';

test('credential vault persists host identity and protects Windows token storage',async t=>{
  const root=tmpdir();const directory=await mkdtemp(join(root,'nichinichi-vault-test-'));
  t.after(async()=>{assert.equal(dirname(directory),root);assert.ok(directory.includes('nichinichi-vault-test-'));await rm(directory,{recursive:true,force:true});});
  const vault=createVault(directory);const initial=await vault.load();assert.match(initial.hostId,/^urn:uuid:/);
  initial.profiles=[{id:'fixture',credentials:{accessToken:'not-a-real-secret-fixture'}}];await vault.save(initial);
  const reopened=await createVault(directory).load();assert.equal(reopened.hostId,initial.hostId);assert.equal(reopened.profiles[0].credentials.accessToken,'not-a-real-secret-fixture');
  if(process.platform==='win32'){const files=await readdir(directory);const bytes=await readFile(join(directory,files.find(name=>name.endsWith('.dpapi'))));assert.ok(!bytes.toString().includes('not-a-real-secret-fixture'));}
});
