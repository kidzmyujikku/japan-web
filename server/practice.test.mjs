import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { makePracticeRequest, parsePracticeSet } from './practice.mjs';
import { createApp } from './app.mjs';
import { describeQuestion } from '../src/lib/practice.ts';
import { TutorError } from './stream.mjs';

const body = { lessonId: 'lesson-05', count: 5, level: 'basic', model: 'fixture-model', seen: [], focus: [] };
const fixture = () => ({ questions: [
  { id: 'a', type: 'choice', prompt: 'Apa arti kalimat ini?', japanese: 'わたしはりなです。', options: ['Saya Rina.', 'Saya Hana.', 'Dia Rina.', 'Saya guru.'], answer: 'Saya Rina.', explanation: 'わたし berarti saya; りな adalah nama Rina.', hint: 'Perhatikan nama setelah partikel.', focus: 'Identitas' },
  { id: 'b', type: 'choice', prompt: 'Pilih arti yang benar.', japanese: 'わたしはがくせいです。', options: ['Saya siswa.', 'Saya guru.', 'Dia siswa.', 'Dia guru.'], answer: 'Saya siswa.', explanation: 'がくせい berarti siswa.', hint: 'Kalimat ini menyebutkan pekerjaan.', focus: 'Pekerjaan' },
  { id: 'c', type: 'type', prompt: 'Ketik bacaan kana untuk nama Rina.', answers: ['りな'], script: 'hiragana', explanation: 'Rina ditulis りな.', hint: 'Dua bunyi: ri dan na.', focus: 'Kana' },
  { id: 'd', type: 'order', prompt: 'Susun: Saya Hana.', tokens: ['わたし', 'は', 'はな', 'です'], answer: ['わたし', 'は', 'はな', 'です'], explanation: 'Pola identitas memakai A は B です.', hint: 'Mulai dengan saya, lalu penanda topik.', focus: 'Identitas' },
  { id: 'e', type: 'match', prompt: 'Pasangkan kata dengan artinya.', pairs: [{ left: 'わたし', right: 'saya' }, { left: 'せんせい', right: 'guru' }, { left: 'がくせい', right: 'siswa' }], explanation: 'Tiga kata untuk mengenalkan diri.', hint: 'Cari kata yang menunjukkan diri sendiri terlebih dulu.', focus: 'Pekerjaan' },
] });

test('new exercises use the selected topic, prior vocabulary, a fresh variation, and validated controls', () => {
  const a = makePracticeRequest(body), b = makePracticeRequest(body);
  assert.ok(a.instructions.includes('Hajimemashite')); assert.ok(a.instructions.includes('kana') || a.instructions.includes('KANA'));
  assert.notEqual(a.input[0].content, b.input[0].content);
  for (const patch of [{ lessonId: 'missing' }, { count: 200 }, { level: 'override' }, { focus: ['x'.repeat(101)] }, { seen: [{}] }]) assert.throws(() => makePracticeRequest({ ...body, ...patch }));
});
test('all four formats have server-owned unique IDs and strip unknown provider fields', () => {
  const data = fixture(); data.questions[0].tools = ['injected'];
  const set = parsePracticeSet(JSON.stringify(data), makePracticeRequest(body), body);
  assert.equal(set.questions.length, 5); assert.equal(new Set(set.questions.map(q => q.id)).size, 5);
  assert.equal(set.questions[0].tools, undefined); assert.notEqual(set.questions[0].id, 'a');
});
test('learned spellings are provided to AI and kana word tiles become kanji without changing kana typing', () => {
  const request = makePracticeRequest(body);
  assert.ok(request.instructions.includes('私{わたし}'));
  assert.ok(request.instructions.includes('先生{せんせい}'));
  assert.ok(!request.instructions.includes('Semua teks Jepang dalam KANA'));
  const data = fixture();
  data.questions[3].tokens = ['わたし', 'は', 'せんせい', 'です'];
  data.questions[3].answer = [...data.questions[3].tokens];
  const set = parsePracticeSet(JSON.stringify(data), request, body);
  assert.deepEqual(set.questions[3].answer, ['私{わたし}', 'は', '先生{せんせい}', 'です']);
  assert.equal(set.questions[4].pairs[1].left, '先生{せんせい}');
  assert.deepEqual(set.questions[2].answers, ['りな']);
});
test('introduced kanji is accepted but future kanji is rejected', () => {
  const data = fixture(); data.questions[0].japanese = '私{わたし}はりなです。';
  assert.equal(parsePracticeSet(JSON.stringify(data), makePracticeRequest(body), body).questions[0].japanese, data.questions[0].japanese);
  data.questions[0].japanese = '学校{がっこう}です。';
  assert.throws(() => parsePracticeSet(JSON.stringify(data), makePracticeRequest(body), body), e => e.code === 'invalid_exercises');
});
test('kana and annotated kanji versions still count as the same repeated exercise', () => {
  const data = fixture();
  const previous = parsePracticeSet(JSON.stringify(data), makePracticeRequest(body), body);
  data.questions[3].tokens = ['私{わたし}', 'は', 'はな', 'です'];
  data.questions[3].answer = [...data.questions[3].tokens];
  assert.equal(describeQuestion(data.questions[3]).signature, describeQuestion(fixture().questions[3]).signature);
  assert.throws(() => parsePracticeSet(JSON.stringify(data), makePracticeRequest({ ...body, seen: previous.questions.map(describeQuestion) }), body));
});
test('malformed keys, wrong scripts, duplicates, wrong count and incomplete JSON are rejected', () => {
  for (const mutate of [
    d => d.questions[0].answer = 'outside choices',
    d => d.questions[0].options[1] = d.questions[0].options[0],
    d => d.questions[2].answers = ['rな'],
    d => d.questions[2].answers = ['リナ'],
    d => d.questions[3].answer.pop(),
    d => d.questions[4].pairs[1].right = d.questions[4].pairs[0].right,
    d => d.questions[1] = structuredClone(d.questions[0]),
    d => d.questions.pop(),
  ]) { const d = fixture(); mutate(d); assert.throws(() => parsePracticeSet(JSON.stringify(d), makePracticeRequest(body), body), e => e.code === 'invalid_exercises'); }
  assert.throws(() => parsePracticeSet('{"questions": [', makePracticeRequest(body), body));
});
test('rephrasing prompts or shuffling choices/tokens cannot pass the recent-question check', () => {
  const previous = parsePracticeSet(JSON.stringify(fixture()), makePracticeRequest(body), body);
  const repeated = fixture(); repeated.questions[0].options.reverse(); repeated.questions[0].prompt = 'Pilihan arti baru';
  repeated.questions[3].tokens.reverse(); repeated.questions[2].prompt = 'Tulis nama Rina dengan kana';
  const request = makePracticeRequest({ ...body, seen: previous.questions.map(describeQuestion) });
  assert.throws(() => parsePracticeSet(JSON.stringify(repeated), request, body), e => e.code === 'invalid_exercises');
  assert.equal(describeQuestion(repeated.questions[2]).signature, describeQuestion(fixture().questions[2]).signature);
  assert.equal(describeQuestion(repeated.questions[3]).signature, describeQuestion(fixture().questions[3]).signature);
});
test('HTTP generation rejects repeated sets and quota errors without publishing partial or static questions', async t => {
  let mode = 'ok';
  const fake = { status: async () => ({ activeId: 'fixture', connected: true, sharing: true, pending: false }), models: async () => [], close: () => {}, respond: async () => { if (mode === 'quota') throw new TutorError('usage_limit', 'Batas penggunaan tercapai.', 429); if (mode === 'partial') throw new TutorError('interrupted', 'Belum selesai.', 502); return JSON.stringify(fixture()); } };
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const port = server.address().port;
  const app = createApp({ client: fake, port, apiOnly: true }); server.on('request', app); t.after(() => { app.close(); server.close(); });
  const base = `http://127.0.0.1:${port}`;
  const status = await fetch(`${base}/api/ai/status`), cookie = status.headers.get('set-cookie').split(';')[0], { csrf } = await status.json();
  const post = () => fetch(`${base}/api/ai/practice`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: base, 'X-Nichi-CSRF': csrf }, body: JSON.stringify(body) });
  assert.equal((await post()).status, 200);
  const repeated = await post(); assert.equal(repeated.status, 502); assert.equal((await repeated.json()).questions, undefined);
  mode = 'quota'; const quota = await post(); assert.equal(quota.status, 429); assert.equal((await quota.json()).code, 'usage_limit');
  mode = 'partial'; const partial = await post(); assert.equal(partial.status, 502); assert.equal((await partial.json()).questions, undefined);
});
