export class TutorError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}

export function providerError(code, status = 400) {
  if (code === 'subscription_sharing_usage_unavailable' || code === 'subscription_sharing_user_unavailable' || status === 503) return new TutorError('temporarily_unavailable', 'Layanan ChatGPT belum dapat memeriksa ketersediaan pemakaian. Akun tetap terhubung; coba lagi nanti.', 503);
  if (code === 'subscription_sharing_user_not_eligible') return new TutorError('not_eligible', 'Akun atau workspace ini belum memenuhi syarat penggunaan paket pada aplikasi ini. Periksa akses akun di ChatGPT.', 403);
  if (code === 'subscription_sharing_unsupported_capability' || code === 'subscription_sharing_route_not_supported') return new TutorError('unsupported', 'Permintaan ini belum didukung melalui paket ChatGPT. Periksa integrasi atau pilih model lain.', status);
  if (code?.includes('usage_limit') || code === 'rate_limit_exceeded' || status === 429) return new TutorError('usage_limit', 'Batas penggunaan ChatGPT tercapai. Periksa kuota dan batas aplikasi di Manage usage.', 429);
  if (code?.includes('scope') || status === 403) return new TutorError('plan_permission', 'Akun belum mengizinkan penggunaan paket ChatGPT, atau akses ini belum tersedia. Hubungkan ulang dan periksa izin penggunaan paket.', 403);
  if (['invalid_grant','invalid_refresh_token','token_expired','refresh_token_expired','refresh_token_invalidated','refresh_token_reused'].includes(code) || status === 401) return new TutorError('reconnect', 'Sesi ChatGPT perlu dihubungkan kembali. Pilih Continue with ChatGPT.', 401);
  if (code?.includes('model')) return new TutorError('model_unavailable', 'Model ini belum dapat dipakai oleh akunmu. Pilih model lain atau muat ulang daftar model.', 400);
  return new TutorError('provider_error', 'ChatGPT belum menyelesaikan jawaban. Coba lagi sebentar lagi.', 502);
}

export async function consumeResponseStream(body, onText, { signal } = {}) {
  const decoder = new TextDecoder();
  let buffer = '', text = '', completed = false;
  const parse = frame => {
    const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data || data === '[DONE]') return;
    let event;
    try { event = JSON.parse(data); } catch { throw new TutorError('invalid_stream', 'Jawaban terputus saat diterima. Coba kirim ulang pertanyaan.', 502); }
    if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
      text += event.delta;
      if (text.length > 48000) throw new TutorError('output_limit', 'Jawaban terlalu panjang. Coba pertanyaan yang lebih spesifik.', 502);
      onText(event.delta);
    }
    if (event.type === 'response.failed' || event.type === 'error') throw providerError(event.response?.error?.code ?? event.error?.code ?? event.code);
    if (event.type === 'response.incomplete') throw new TutorError('incomplete', 'Jawaban belum selesai. Coba ulang atau buat pertanyaan lebih singkat.', 502);
    if (event.type === 'response.completed') completed = true;
  };
  for await (const chunk of body) {
    if (signal?.aborted) throw new TutorError('cancelled', 'Permintaan dihentikan.', 499);
    buffer += decoder.decode(chunk, { stream: true });
    let boundary;
    while ((boundary = buffer.search(/\r?\n\r?\n/)) >= 0) {
      const separator = buffer.slice(boundary).startsWith('\r\n') ? 4 : 2;
      parse(buffer.slice(0,boundary)); buffer = buffer.slice(boundary + separator);
    }
    if (completed) break;
    if (buffer.length > 1000000) throw new TutorError('invalid_stream', 'Jawaban tidak dapat dibaca.', 502);
  }
  if (!completed) {
    buffer += decoder.decode();
    if (buffer.trim()) parse(buffer);
  }
  if (!completed) throw new TutorError('interrupted', 'Koneksi terputus sebelum jawaban selesai. Coba lagi saat koneksi stabil.', 502);
  if (!text.trim()) throw new TutorError('empty_response', 'Model tidak mengirim jawaban teks. Coba lagi atau pilih model lain.', 502);
  return text;
}
