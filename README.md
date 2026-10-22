# Nichi Nichi

Website pribadi belajar bahasa Jepang, dengan UI gpt-taste yang disesuaikan untuk belajar. React + TypeScript + Vite, GSAP, WanaKana, tutor melalui langganan ChatGPT, serta integrasi opsional Firebase Auth dan Firestore.

## Menjalankan

```sh
npm install
npm run dev
```

Gunakan **Node.js 24 atau lebih baru**. `npm run dev` menjalankan Vite pada port 5173 dan layanan AI lokal pada port 8787. Buka alamat Local yang ditampilkan Vite. Tanpa konfigurasi Firebase, aplikasi langsung dapat dipakai dalam **mode lokal**, dengan progres tersimpan di browser dan penanda "Di perangkat ini". Untuk materi dan kuis lewat HP, buka alamat Network Vite dari jaringan Wi-Fi yang sama; firewall laptop perlu mengizinkan koneksi port dev server. Tutor AI pada versi ini hanya menerima permintaan dari laptop tempat layanan berjalan.

```sh
npm test
npm run build
npm run preview
```

Untuk pemakaian sehari-hari, setelah build jalankan `npm start` atau `npm run preview`. Keduanya menyajikan `dist/` dan layanan tutor di `http://localhost:5173/`. Hentikan server lama dengan Ctrl+C sebelum menjalankan server yang lain pada port yang sama. Tidak perlu API key untuk tutor.

## Tutor dengan langganan ChatGPT Plus

1. Jalankan website melalui `npm start`, `npm run preview`, atau `npm run dev`, lalu buka menu **Tutor** atau tombol **Tanya tutor** pada pelajaran.
2. Buka **Pengaturan → Latihan AI & langganan ChatGPT** dan klik **Continue with ChatGPT**. Layanan membuka browser sistem bawaan laptop, bukan popup browser tertanam. Login dan tinjau izin pada halaman resmi `auth.openai.com` menggunakan akun ChatGPT Plus milikmu. Nichi Nichi mendaftar dengan nama aplikasinya sendiri melalui alur resmi OAuth; tidak mengambil cookie atau token dari aplikasi Codex. Jika browser tidak terbuka, gunakan **Salin tautan untuk Chrome / Edge**. Jika halaman otorisasi gagal sebelum callback, gunakan **Mulai ulang login** untuk membuat state, nonce, dan PKCE baru; jangan memakai ulang tautan lama.
3. Izinkan penggunaan paket ChatGPT bila kamu ingin memakai tutor. Login identitas tanpa izin tersebut tidak membuka permintaan AI. Setelah callback selesai, kembali ke website. Status diperbarui melalui pemeriksaan berkala selama login dan ketika tab mendapat fokus kembali.
4. Pada koneksi pertama, baca penjelasan pemakaian paket lalu pilih **Got it**. Daftar model berasal dari akun yang dipilih; katalog bukan bukti bahwa suatu model pasti dapat dipakai hingga permintaan berhasil selesai.
5. Buka **Latihan**, pilih topik, tingkat dasar/penerapan, dan 5/10 soal, lalu **Buat latihan**. Set dibuat baru melalui ChatGPT; berisi kunci, petunjuk, serta pembahasan. Setelah selesai, **Buat set baru** memberi variasi lain; **Latih bagian yang belum tepat** mengarahkan set berikutnya ke konsep yang salah. Bantuan penjelasan tambahan masih tersedia melalui tautan di Pengaturan.
6. **Manage usage** membuka pengaturan pemakaian ChatGPT. Tutor berbagi batas pemakaian paketmu, bukan memberi kuota terpisah. Tidak ada fallback otomatis ke API key atau tagihan Platform API. Pengaturan kredit dan batas penggunaan mengikuti pilihanmu di ChatGPT.

Koneksi akun dan progres belajar adalah dua hal terpisah. Login ChatGPT untuk tutor tidak mengaktifkan sinkronisasi Firebase. Halaman Pengaturan menyediakan pemilih akun, tambah akun, hubungkan ulang, dan putuskan koneksi. Registrasi lama dipertahankan untuk login berikutnya; keluar tidak menghapus progres belajar.

Token disimpan dalam folder `~/.nichinichi/chatgpt/` oleh layanan lokal. Pada Windows, isinya dienkripsi dengan DPAPI untuk akun Windows saat ini; pada sistem lain, folder dan berkas memakai izin 0700/0600. Token tidak dikirim ke React/browser, tidak disimpan di localStorage, tidak ditulis ke repository, dan tidak dicetak ke log. Host ID tetap dipakai setelah restart. JWT diperiksa dengan JWKS resmi, issuer, audience, nonce, dan waktu kedaluwarsa. Refresh token diserialkan; logout mencoba mencabut sesi resmi sebelum membersihkan kredensial lokal.

Layanan memanggil `POST https://api.openai.com/v1/responses` memakai token OAuth yang memiliki scope penggunaan paket, dengan `store: false` dan `stream: true`. Tidak menggunakan endpoint ChatGPT `backend-api`. Jawaban sukses hanya ditandai setelah `response.completed`; kegagalan setelah teks parsial ditampilkan sebagai belum selesai dan tidak dimasukkan ke konteks lanjutan. Server menolak origin lain, memeriksa CSRF, membatasi panjang pertanyaan/riwayat, serta membatasi satu jawaban aktif dan durasi dua menit.

Integrasi ini ditujukan untuk proyek pribadi yang berjalan lokal. Website biasa tetap responsif di HP, tetapi akses tutor dari jaringan LAN ditolak pada versi ini. Callback OAuth adalah loopback laptop; login dari HP tidak menggantikan login pada laptop. Hosting Vercel statis tidak menjalankan layanan tutor lokal; publikasi AI pada aplikasi remote membutuhkan integrasi dan persyaratan tersendiri.

Referensi resmi:

- [SIWC untuk proyek pribadi lokal](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt)
- [Registrasi dan login](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)
- [Model dan inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
- [Akun, sesi, dan batas penggunaan](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)

## Mengaktifkan akun pribadi dan sinkronisasi

1. Buat proyek Firebase di paket Spark, lalu daftarkan sebuah Web App.
2. Aktifkan Authentication → Sign-in method → Email/Password. Pada tab Users, buat satu akun pribadi dengan email dan kata sandi milikmu. Salin UID akun tersebut. Website tidak memiliki pendaftaran publik.
3. Buat Cloud Firestore **Standard edition** di lokasi yang sesuai, misalnya Singapore. Hindari test mode dengan akses publik.
4. Salin `.env.example` menjadi `.env.local`. Isi empat nilai konfigurasi Web App dan `VITE_OWNER_UID`. Firebase Web API key adalah identitas konfigurasi aplikasi, bukan pengganti security rules. Jangan menaruh kata sandi, service-account key, atau private key dalam variabel `VITE_*`.
5. Dalam `firestore.rules`, ganti `OWNER_UID_HERE` dengan UID yang sama. Tempel seluruh aturan di Firestore → Rules dan Publish. Aturan bawaan menolak akses sampai UID diganti.
6. Tambahkan `localhost` dan domain website ke Authentication → Settings → Authorized domains bila belum terdaftar. Atur template reset kata sandi di Authentication → Templates sesuai kebutuhan.
7. Restart Vite. Sekarang aplikasi menampilkan login dan hanya menerima akun pribadi tersebut. Setelah login, selesaikan satu materi dan kuis, lalu masuk dari perangkat kedua untuk memeriksa progres yang sama.

**Penting:** cache mode lokal dan cache akun dipisahkan. Progres lokal yang dibuat sebelum Firebase dikonfigurasi tidak otomatis diunggah ke akun. Untuk pemakaian sinkron, aktifkan Firebase sebelum mulai belajar serius. Hasil akun yang gagal dikirim disimpan di antrean browser akun tersebut; tombol "Coba lagi", koneksi yang kembali online, atau retry berkala akan mengirim ulang. Jangan menghapus data browser sebelum sinkron selesai.

## Hosting Vercel

1. Gunakan proyek pribadi di Vercel Hobby. Impor repository ini, atau gunakan Vercel CLI dari direktori ini.
2. Framework: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Isi lima environment variables dari `.env.local` pada pengaturan proyek Vercel. Jangan memasukkan nilai rahasia lain. Deploy ulang setelah mengubah environment variables.
4. Tambahkan domain Vercel ke daftar Authorized domains Firebase dan periksa login/reset password di domain tersebut.
5. `vercel.json` menangani direct link dan refresh pada `/materi/...` serta `/kuis/...`.

Paket gratis mempunyai kuota. Penyimpanan belajar tidak menggunakan Cloud Functions atau Cloud Storage. Tutor memakai kuota langganan ChatGPT melalui OAuth pada layanan lokal. Jangan mengaktifkan paket Blaze otomatis jika ingin tetap memakai batas gratis Firebase.

## Materi dan aturan belajar

- 24 pelajaran asli, enam kelompok, 144 entri kosakata, 240 soal: empat pilihan ganda, dua mencocokkan, dua menyusun, dan dua mengetik per pelajaran.
- Kosakata dan kuis latihan dibentuk dari materi setiap pelajaran; tidak ada konten placeholder. Contoh Jepang memakai anotasi `漢字{かな}` untuk furigana, serta token susunan kalimat yang eksplisit.
- Eksplorasi membuka semua pelajaran; tantangan mensyaratkan semua kuis sebelumnya minimal 80%. Nilai terbaik tidak berkurang saat mengulang.
- Kuis mempunyai sepuluh soal berbobot sama. Satu soal mencocokkan benar jika semua pasangannya benar. Jawaban ketik memakai kana, menerima alternatif yang dinyatakan dalam data, normalisasi NFKC dan spasi luar, tetapi tidak menerima salah eja.
- Konversi romaji mengikuti ejaan keyboard IME, bukan terjemahan. Salam umum menerima ejaan romaji `konnichiwa` → `こんにちは` serta `konbanwa` → `こんばんは`; penyesuaian ini hanya pada input romaji. Kana yang diketik langsung tetap dinilai sesuai ejaannya. Untuk partikel は/へ/を, ketik `ha`/`he`/`wo` meskipun dibaca wa/e/o. Gunakan `nn` untuk ん. Ketik tanpa spasi di tengah bacaan kana. Keyboard Jepang bawaan tetap dapat digunakan dengan mematikan konversi.
- Timer mati secara default; 10/20/30 atau 5–300 detik per soal. Waktu habis dihitung salah. Timer berbasis deadline, bukan jumlah tick. Keluar sebelum seluruh kuis selesai tidak menyimpan percobaan parsial.
- Flashcard maksimal 20 per sesi. "Ingat" memakai 1/3/7/14/30 hari; "ulang" kembali besok. Penilaian diri dilakukan setelah membuka arti.
- Poin: 10 per materi pertama, 20 per kuis pertama yang lulus, dan 5 per hari dengan minimal lima flashcard. Streak aktif setelah kuis selesai atau lima kartu; tanggal dihitung Asia/Jakarta. Pencapaian streak yang pernah diperoleh tetap tersimpan secara turunan dari riwayat harian.

## Data dan keandalan

`users/{uid}/progress/main` menyimpan ringkasan progres, jadwal review, aktivitas harian dan preferensi. `events/{eventId}` adalah receipt immutable; `attempts/{attemptId}` menyimpan hasil kuis. Transaksi Firestore memeriksa receipt sebelum memperbarui ringkasan, sehingga retry tidak menggandakan aktivitas atau poin. Listener menerima pembaruan antarperangkat; nilai terbaik memakai maksimum dan preferensi memakai waktu perubahan terbaru. Konflik review memakai waktu jawaban terbaru.

Riwayat hasil yang ditampilkan dibatasi 30 percobaan terbaru. Antrean yang belum dikirim tersimpan lokal per UID. Tombol keluar tidak menghapus antrean; masuk kembali ke akun yang sama untuk melanjutkan pengiriman. Semua isi browser lokal bersifat pribadi pada profil browser tersebut; gunakan profil perangkat yang sesuai.

## Sumber untuk memeriksa materi

Materi ditulis untuk aplikasi ini, dengan cakupan situasi pemula diperiksa terhadap daftar isi Irodori Starter. Ini bukan salinan buku atau sertifikasi kesetaraan JLPT. Referensi untuk pemeriksaan lanjutan:

- [Irodori Starter — daftar isi](https://www.irodori.jpf.go.jp/assets/data/starter/pdf/X_contents_en.pdf)
- [Irodori — sumber pembelajaran](https://www.irodori.jpf.go.jp/en/resources.html)
- [WanaKana](https://wanakana.com/)
- [Firebase — transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)

UI memakai Outfit, Noto Sans JP, ikon Lucide, SVG kana asli, dan GSAP. Font disertakan secara lokal; aplikasi tidak membutuhkan Google Fonts saat dipakai. Beranda menerapkan pengacakan desain seed 41; reduced motion mematikan gerak besar.

## Batas verifikasi

Versi ini dipakai secara lokal sesuai pilihan pengguna. Pemeriksaan awal mencakup desktop 1440px serta layar 375px dan 320px; hero beranda dua baris dan tidak ada overflow horizontal pada halaman yang diperiksa. Satu kuis lengkap diuji hingga nilai 100, termasuk pasangan dan susunan melalui keyboard, serta konversi romaji langsung. Pengulangan, poin, mode tantangan, pencarian, furigana, penyimpanan setelah refresh, dan waktu habis juga diperiksa. Progres pengujian browser memakai origin `127.0.0.1`, terpisah dari preview utama `localhost`.

Setelah tutor ditambahkan, 65 tes lulus (52 tes antarmuka/domain dan 13 tes layanan lokal). Tes otomatis memakai kredensial contoh dan provider simulasi: validasi JWT, state/PKCE, izin paket, kode registrasi kedaluwarsa, refresh yang berjalan bersamaan, stream parsial/gagal, isolasi percakapan antar-akun, penolakan origin/CSRF/LAN, serta round-trip penyimpanan DPAPI Windows.

Verifikasi langsung juga selesai: pengguna menyelesaikan login Plus di browser sistem; layanan melaporkan izin paket aktif dan daftar model berhasil dimuat. Dua permintaan melalui GPT-6.1-Sol selesai diterima: koreksi `私は日本語を好きです。` menjadi `私は日本語が好きです。`, serta penjelasan perbedaan は dan も dengan contoh perkenalan. Tidak ada error runtime pada tab pengujian. Tutor pada lebar 375px tidak menimbulkan overflow horizontal. Build produksi berhasil dan audit npm melaporkan 0 kerentanan. Keberhasilan ini memverifikasi akses pada saat pengujian, bukan menjamin kuota atau akses model tidak berubah.

Login nyata, email reset, akses security rules pada proyek, dan sinkronisasi dua perangkat harus diperiksa setelah konfigurasi Firebase tersedia. File aturan yang disediakan bukan bukti aturan sudah dipublikasikan. Website belum di-host sampai langkah deployment Vercel dilakukan.

## Latihan dinamis per topik

- Rute utama /latihan menggantikan tab Tutor. Rute lama /tutor menampilkan latihan; bantuan percakapan tetap tersedia di /bantuan. Tautan latihan ada pada materi, beranda, dan hasil kuis.
- Server menyusun konteks dari topik yang dipilih dan kosakata pelajaran sebelumnya. Set memiliki 5 atau 10 soal, tingkat dasar atau penerapan, serta sedikitnya dua jenis soal. Soal Jepang memakai kana agar mudah dibaca dari nol. Jawaban ketik berupa kana singkat dengan alternatif yang ditentukan saat set dibuat; penilaian memakai kunci set tanpa permintaan AI tambahan setiap jawaban.
- Generasi memakai koneksi ChatGPT yang sudah disetujui. Model dipilih di Pengaturan; pilihan tersimpan per akun. Set hanya diterbitkan sesudah inference selesai dan JSON lolos pemeriksaan jumlah, format, kunci, pasangan unik, token, script kana, serta duplikasi. Pemeriksaan ini tidak membuktikan seluruh ketepatan bahasa; petunjuk dan kunci merupakan materi buatan AI. Tidak ada fallback ke bank soal saat AI gagal.
- Fingerprint menolak pengulangan isi pilihan, bacaan ketik, kumpulan token, dan pasangan yang sama, meskipun urutan jawaban berubah. Riwayat dibatasi 50 soal terakhir per akun/topik pada perangkat dan proses server; bukan jaminan semua soal selamanya unik. Data ringkas soal sebelumnya dan konsep salah dikirim sebagai referensi ke ChatGPT saat membuat set baru.
- Satu sesi terakhir per akun/topik dan jawaban yang sudah dilanjutkan tersimpan di localStorage. Refresh dapat melanjutkan sesi, tanpa sinkronisasi Firebase untuk latihan AI. Jawaban yang masih diketik atau pembahasan yang belum dilanjutkan belum masuk catatan. Kegagalan membuat set baru tidak mengganti set sebelumnya. Akun/topik berganti membatalkan permintaan aktif dan tidak menampilkan hasil akun lama.
- Nilai latihan AI tidak mengubah kelulusan kuis, poin, atau streak. Kuis tetap terkurasi untuk progres. Timer latihan AI mati; pengaturan timer kuis tetap tersedia.
- Latihan AI tetap membutuhkan layanan lokal di laptop. Koneksi internet diperlukan untuk membuat set; mengerjakan set yang sudah tersimpan tidak memerlukan inference tambahan.


Verifikasi latihan dinamis: 75 tes otomatis lulus. Tiga set AI nyata diselesaikan: dua variasi topik perkenalan (set kedua diarahkan ke kesalahan tentang asal), serta satu set hiragana. Empat bentuk latihan, petunjuk, konversi romaji, susun/pasangkan dengan keyboard, refresh sesi, layar 320px, dan desktop 1440px diperiksa. Tidak ada token atau identitas akun dalam catatan QA.

Perbaikan kuis (11 Oktober 2026): soal pasangan memakai garis SVG responsif dan nomor pasangan di kedua ujung. Koneksi bertahan saat memilih ulang kata dan berpindah saat mengganti arti; ketuk, keyboard, dan drag tetap tersedia. Input romaji mempertahankan n sebelum vokal pada konnichiwa, menerima ejaan salam umum, dan menjaga input Jepang bawaan serta pengecekan kana yang ketat. Kuis salam diuji langsung: konnichiwa menjadi こんにちは dan dinilai benar. Garis diperiksa pada desktop serta layar 320px. Tes regresi input, pasangan, dan penilaian serta build lulus.
