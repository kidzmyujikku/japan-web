import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const ownerUid = import.meta.env.VITE_OWNER_UID as string | undefined;
export const firebaseReady = Object.values(config).every(Boolean) && Boolean(ownerUid);
const app = firebaseReady ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export function readableError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'Email atau kata sandi tidak cocok. Coba periksa kembali.';
  if (code === 'auth/too-many-requests') return 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.';
  if (code === 'auth/invalid-email') return 'Format email belum benar.';
  if (code === 'auth/network-request-failed' || code === 'unavailable') return 'Koneksi terputus. Hasil tetap menunggu di perangkat ini; coba lagi saat online.';
  if (code === 'permission-denied') return 'Akses penyimpanan ditolak. Periksa UID pribadi dan aturan Firestore.';
  return 'Belum berhasil. Periksa koneksi atau konfigurasi Firebase, lalu coba lagi.';
}
