import type { Example, Lesson, Question, Vocabulary } from '../types';

export const groups = [
  { title: 'Mulai dari bunyi', name: 'Huruf & ungkapan awal', kana: 'あ', description: 'Kenali huruf, bunyi, dan ungkapan kecil yang membuka percakapan.', color: 'coral' },
  { title: 'Ini tentang kamu', name: 'Mengenalkan diri', kana: '私', description: 'Ceritakan namamu, keluargamu, dan sedikit tentang dirimu.', color: 'yellow' },
  { title: 'Dunia di sekitarmu', name: 'Benda & tempat', kana: '家', description: 'Tunjuk benda, temukan tempat, dan tanyakan arah.', color: 'teal' },
  { title: 'Sehari dalam bahasa Jepang', name: 'Rutinitas', kana: '日', description: 'Dari bangun pagi sampai pulang. Ungkapkan kegiatanmu.', color: 'lilac' },
  { title: 'Pakai di kehidupan nyata', name: 'Kebutuhan sehari-hari', kana: '食', description: 'Pesan makanan, ceritakan kesukaan, dan berbelanja.', color: 'yellow' },
  { title: 'Rangkai ceritamu', name: 'Menggabungkan kemampuan', kana: '話', description: 'Gabungkan semuanya menjadi dialog dan bacaan sederhana.', color: 'coral' },
];

type Word = [word: string, reading: string, romaji: string, meaning: string];
type Sentence = [japanese: string, romaji: string, meaning: string, tokens: string[], note: string];
type Spec = { title: string; subtitle: string; goal: string; concepts: [string, string][]; tip: string; words: Word[]; sentences: Sentence[] };

const specs: Spec[] = [
  {
    title: 'Halo, hiragana.', subtitle: 'Satu huruf, satu langkah.', goal: 'Membaca kata pendek yang ditulis dalam hiragana.',
    concepts: [['Lima bunyi dasar', 'あ・い・う・え・お dibaca a, i, u, e, o. Hiragana mewakili unit bunyi: か adalah ka, bukan huruf k dan a yang terpisah. Ucapkan setiap bunyi dengan pendek dan jelas.'], ['Membaca dari kiri ke kanan', 'Teks mendatar dibaca dari kiri ke kanan. Mulai dengan kata dua atau tiga kana. Jangan terburu-buru menebak dari bentuk huruf; perhatikan perbedaan さ dan ち, serta ぬ dan め.']],
    tip: 'Sudah mengenal kana? Jadikan pelajaran ini pemanasan. Dalam mode eksplorasi kamu boleh langsung memilih topik lain.',
    words: [['ねこ','ねこ','neko','kucing'],['いぬ','いぬ','inu','anjing'],['いえ','いえ','ie','rumah'],['うみ','うみ','umi','laut'],['そら','そら','sora','langit'],['はな','はな','hana','bunga']],
    sentences: [['ねこです。','Neko desu.','Ini kucing.',['ねこ','です'], 'です memberi akhir kalimat yang sopan.'],['いぬです。','Inu desu.','Ini anjing.',['いぬ','です'],'Nama benda atau hewan dapat diikuti です.']],
  },
  {
    title: 'Kenalan dengan katakana', subtitle: 'Huruf baru, bunyi yang familiar.', goal: 'Membaca kata serapan sederhana dalam katakana.',
    concepts: [['Bunyi sama, bentuk berbeda', 'Katakana memakai bunyi dasar yang sama dengan hiragana: ア・イ・ウ・エ・オ. Katakana sering dipakai untuk kata serapan, nama asing, dan penekanan.'], ['Garis panjang ー', 'Tanda ー memanjangkan vokal sebelumnya. コーヒー dibaca koohii. Perhatikan シ dan ツ: titik シ lebih mendatar, sedangkan titik ツ lebih tegak.']],
    tip: 'Nama asing biasanya ditulis berdasarkan bunyinya, bukan dengan mengganti setiap huruf alfabet satu per satu.',
    words: [['パン','ぱん','pan','roti'],['バス','ばす','basu','bus'],['カメラ','かめら','kamera','kamera'],['ホテル','ほてる','hoteru','hotel'],['コーヒー','こーひー','koohii','kopi'],['テレビ','てれび','terebi','televisi']],
    sentences: [['パンです。','Pan desu.','Ini roti.',['パン','です'],'Kata serapan pun dapat diikuti です.'],['バスです。','Basu desu.','Ini bus.',['バス','です'],'ス di akhir basu sering terdengar ringan, tetapi tetap ditulis.']],
  },
  {
    title: 'Bunyi kecil, beda besar', subtitle: 'Dakuten, bunyi gabungan, dan vokal panjang.', goal: 'Membedakan bunyi biasa, bunyi gabungan, dan konsonan ganda.',
    concepts: [['Tanda yang mengubah bunyi', 'Dakuten ゛mengubah か menjadi が, さ menjadi ざ, た menjadi だ, dan は menjadi ば. Handakuten ゜mengubah は menjadi ぱ. Kana kecil ゃ・ゅ・ょ digabung dengan kana berakhiran i: きゃ adalah kya.'], ['Jeda kecil dan panjang vokal', 'っ kecil menandai jeda sebelum konsonan berikutnya: きって adalah kitte. Vokal panjang dapat mengubah makna. Dalam hiragana, bunyi oo sering ditulis おう; misalnya きょう (kyou).']],
    tip: 'Pada input romaji, ketik kitte untuk きって, kya untuk きゃ, dan nn untuk ん. Jangan menghapus vokal panjang saat menjawab.',
    words: [['きって','きって','kitte','perangko'],['きょう','きょう','kyou','hari ini'],['がっこう','がっこう','gakkou','sekolah'],['びょういん','びょういん','byouin','rumah sakit'],['おちゃ','おちゃ','ocha','teh'],['ざっし','ざっし','zasshi','majalah']],
    sentences: [['きょうです。','Kyou desu.','Hari ini.',['きょう','です'],'きょ adalah satu gabungan bunyi; う memanjangkan bunyi o.'],['おちゃです。','Ocha desu.','Ini teh.',['おちゃ','です'],'ちゃ dibaca cha, bukan chi-ya.']],
  },
  {
    title: 'Percakapan dimulai di sini', subtitle: 'Salam dan ungkapan yang menyelamatkanmu.', goal: 'Memilih salam dan meminta bantuan saat belum memahami percakapan.',
    concepts: [['Salam mengikuti situasi', 'おはようございます dipakai pada pagi hari, こんにちは pada siang atau sapaan umum, dan こんばんは pada malam hari. は di akhir こんにちは dan こんばんは dibaca wa.'], ['Boleh meminta pengulangan', 'すみません berarti permisi atau maaf, tergantung situasi. もういちど、おねがいします berarti tolong sekali lagi. Gunakan わかりません untuk mengatakan belum mengerti.']],
    tip: 'Saat pergi sebelum orang lain di tempat kerja, おさきにしつれいします lebih sesuai daripada selalu memakai さようなら.',
    words: [['こんにちは','こんにちは','konnichiwa','halo / selamat siang'],['こんばんは','こんばんは','konbanwa','selamat malam'],['ありがとう','ありがとう','arigatou','terima kasih'],['すみません','すみません','sumimasen','permisi / maaf'],['もういちど','もういちど','mou ichido','sekali lagi'],['わかりません','わかりません','wakarimasen','tidak mengerti']],
    sentences: [['もういちど、おねがいします。','Mou ichido, onegaishimasu.','Tolong sekali lagi.',['もういちど','おねがいします'],'おねがいします membuat permintaan terdengar sopan.'],['すみません、わかりません。','Sumimasen, wakarimasen.','Maaf, saya tidak mengerti.',['すみません','わかりません'],'すみません dapat membuka permintaan bantuan.']],
  },
  {
    title: 'Hajimemashite, ini aku', subtitle: 'Nama, asal, dan kalimat pertamamu.', goal: 'Memperkenalkan identitas dengan pola N は N です.',
    concepts: [['Topik dengan は', '私{わたし}はリナです berarti saya Rina. Partikel は ditulis ha tetapi dibaca wa. は menunjukkan topik yang sedang dibicarakan; です menutup kalimat nominal dengan sopan.'], ['Asal dengan から', 'インドネシアから来{き}ました berarti saya berasal dari Indonesia. Dalam perkenalan, hajimemashite dan yoroshiku onegaishimasu adalah pasangan ungkapan yang lazim. Subjek dapat dihilangkan jika sudah jelas.']],
    tip: 'です bukan padanan langsung semua kata “adalah”. Kata kerja seperti 行きます nanti tidak perlu ditambah です.',
    words: [['私','わたし','watashi','saya'],['名前','なまえ','namae','nama'],['国','くに','kuni','negara'],['学生','がくせい','gakusei','pelajar / mahasiswa'],['先生','せんせい','sensei','guru'],['日本','にほん','nihon','Jepang']],
    sentences: [['私{わたし}はリナです。','Watashi wa Rina desu.','Saya Rina.',['私','は','リナ','です'],'は menunjukkan topik; です adalah bentuk sopan.'],['私{わたし}は学生{がくせい}です。','Watashi wa gakusei desu.','Saya pelajar.',['私','は','学生','です'],'Sebutkan profesi atau status setelah は.']],
  },
  {
    title: 'Bertanya, menjawab, menyangkal', subtitle: 'Satu partikel membuka pertanyaan.', goal: 'Membuat pertanyaan sopan dan kalimat nominal negatif.',
    concepts: [['Pertanyaan dengan か', 'Tambahkan か pada akhir kalimat: 学生{がくせい}ですか。 berarti apakah kamu pelajar? Nada bertanya membantu, tetapi か sudah menandai pertanyaan. Untuk jawaban ya/tidak, gunakan はい atau いいえ.'], ['Bukan, dan juga', '学生{がくせい}じゃないです berarti bukan pelajar. Bentuk lebih formalnya ではありません. Partikel も berarti juga: 私{わたし}も学生{がくせい}です。']],
    tip: 'Tidak semua はい berarti menyetujui seluruh isi kalimat; kadang berarti “saya mendengar”. Dalam latihan ini, gunakan konteks pertanyaan yang diberikan.',
    words: [['はい','はい','hai','ya'],['いいえ','いいえ','iie','tidak'],['だれ','だれ','dare','siapa'],['何','なに','nani','apa'],['会社員','かいしゃいん','kaishain','pegawai perusahaan'],['友達','ともだち','tomodachi','teman']],
    sentences: [['学生{がくせい}ですか。','Gakusei desu ka.','Apakah kamu pelajar?',['学生','です','か'],'か berada di akhir pertanyaan sopan.'],['会社員{かいしゃいん}じゃないです。','Kaishain ja nai desu.','Saya bukan pegawai perusahaan.',['会社員','じゃない','です'],'じゃないです menyangkal kalimat nominal.']],
  },
  {
    title: 'Orang-orang terdekat', subtitle: 'Keluarga dan kepemilikan dengan の.', goal: 'Menyebut keluarga sendiri dan hubungan kepemilikan.',
    concepts: [['Hubungkan dua kata dengan の', '私{わたし}の本{ほん} berarti buku saya. Pemilik diletakkan sebelum の, benda setelahnya. の juga menyatakan hubungan: 日本語{にほんご}の先生{せんせい} berarti guru bahasa Jepang.'], ['Keluargaku, keluargamu', 'Saat membicarakan keluarga sendiri kepada orang lain, gunakan 父{ちち}, 母{はは}, 兄{あに}, dan 姉{あね}. Untuk keluarga orang lain biasanya お父さん, お母さん, お兄さん, お姉さん.']],
    tip: 'Di dalam keluarga sendiri, orang tetap dapat memanggil ayah “お父さん”. Pilihan istilah bergantung kepada siapa kamu berbicara.',
    words: [['家族','かぞく','kazoku','keluarga'],['父','ちち','chichi','ayah saya'],['母','はは','haha','ibu saya'],['兄','あに','ani','kakak laki-laki saya'],['姉','あね','ane','kakak perempuan saya'],['本','ほん','hon','buku']],
    sentences: [['私{わたし}の本{ほん}です。','Watashi no hon desu.','Ini buku saya.',['私','の','本','です'],'Pemilik → の → benda.'],['母{はは}は先生{せんせい}です。','Haha wa sensei desu.','Ibu saya seorang guru.',['母','は','先生','です'],'はは dipakai untuk ibu sendiri saat berbicara kepada orang lain.']],
  },
  {
    title: 'Angka dan umur', subtitle: 'Dari satu sampai perkenalan lebih lengkap.', goal: 'Membaca angka dasar dan menyatakan umur.',
    concepts: [['Membangun angka', '11 adalah じゅういち (10 + 1), 20 adalah にじゅう (2 × 10), dan 25 adalah にじゅうご. Empat dapat dibaca よん atau し; tujuh なな atau しち. Bacaan berubah pada beberapa satuan.'], ['Umur dengan 歳', '歳{さい} dibaca sai. 1 tahun いっさい, 8 tahun はっさい, 10 tahun じゅっさい, dan 20 tahun はたち. Untuk bertanya sopan gunakan おいくつですか。']],
    tip: 'Umur 20 tahun dibaca はたち, bukan にじゅうさい dalam latihan dasar ini. Angka biasa dan angka dengan satuan tidak selalu memiliki bacaan identik.',
    words: [['一','いち','ichi','satu'],['二','に','ni','dua'],['三','さん','san','tiga'],['四','よん','yon','empat'],['十','じゅう','juu','sepuluh'],['二十歳','はたち','hatachi','dua puluh tahun (umur)']],
    sentences: [['二十歳{はたち}です。','Hatachi desu.','Saya berumur dua puluh tahun.',['二十歳','です'],'Umur 20 memakai bacaan khusus はたち.'],['おいくつですか。','Oikutsu desu ka.','Berapa umur Anda?',['おいくつ','です','か'],'おいくつ adalah cara sopan menanyakan umur.']],
  },
  {
    title: 'Ini, itu, yang di sana', subtitle: 'Jarak kecil, pilihan kata berbeda.', goal: 'Memilih これ・それ・あれ dan この・その・あの.',
    concepts: [['これ・それ・あれ', 'これ menunjuk benda dekat pembicara; それ dekat lawan bicara; あれ jauh dari keduanya. Ketiganya berdiri sendiri: これは本{ほん}です。 Untuk “yang mana”, gunakan どれ.'], ['この harus diikuti benda', 'この・その・あの harus diikuti kata benda: この本{ほん} (buku ini). Jangan memakai このです tanpa benda. Untuk menanyakan milik siapa: これはだれの本{ほん}ですか。']],
    tip: 'Pilih berdasarkan posisi benda terhadap pembicara dan lawan bicara, bukan hanya jarak benda dari layar.',
    words: [['これ','これ','kore','ini (benda dekat saya)'],['それ','それ','sore','itu (benda dekat kamu)'],['あれ','あれ','are','itu di sana (jauh dari keduanya)'],['どれ','どれ','dore','yang mana'],['かばん','かばん','kaban','tas'],['時計','とけい','tokei','jam / arloji']],
    sentences: [['これは本{ほん}です。','Kore wa hon desu.','Ini buku.',['これ','は','本','です'],'これ berdiri sendiri, tidak langsung menerangkan 本.'],['この本{ほん}は私{わたし}のです。','Kono hon wa watashi no desu.','Buku ini milik saya.',['この','本','は','私','の','です'],'この menerangkan 本; の di akhir dapat menggantikan benda yang sudah jelas.']],
  },
  {
    title: 'Benda-benda sehari-hari', subtitle: 'Apa ini dalam bahasa Jepang?', goal: 'Mengenali benda dan bertanya namanya.',
    concepts: [['Menanyakan nama benda', 'これは何{なん}ですか。 berarti ini apa? 何 dibaca なん sebelum です. Untuk bertanya padanan bahasa: これは日本語{にほんご}で何{なん}ですか。'], ['Jawaban pendek cukup', 'Kalau bendanya sudah jelas, cukup jawab ペンです。 Kamu tidak perlu mengulang これは setiap saat. の dapat menghubungkan benda dan pemilik: リナのかばん.']],
    tip: '何 bisa dibaca なに atau なん. Pelajari bacaannya bersama pola kalimat, bukan menganggap satu kanji selalu punya satu bacaan.',
    words: [['机','つくえ','tsukue','meja'],['椅子','いす','isu','kursi'],['紙','かみ','kami','kertas'],['鍵','かぎ','kagi','kunci'],['ペン','ぺん','pen','pena'],['電話','でんわ','denwa','telepon']],
    sentences: [['これは何{なん}ですか。','Kore wa nan desu ka.','Ini apa?',['これ','は','何','です','か'],'何 dibaca なん dalam pola 何ですか.'],['これは机{つくえ}です。','Kore wa tsukue desu.','Ini meja.',['これ','は','机','です'],'Gunakan kata benda untuk menjawab pertanyaan nama benda.']],
  },
  {
    title: 'Ada di mana?', subtitle: 'Keberadaan benda, orang, dan hewan.', goal: 'Memakai あります dan います bersama kata posisi.',
    concepts: [['あります atau います', 'あります dipakai untuk benda dan tumbuhan; います untuk orang dan hewan. Contoh: 本{ほん}があります (ada buku), 猫{ねこ}がいます (ada kucing). が menandai yang keberadaannya dinyatakan.'], ['Lokasi dengan に', '机{つくえ}の上{うえ}に本{ほん}があります。 berarti ada buku di atas meja. Susun lokasi + に + benda + が + あります. Untuk posisi gunakan 上, 下, 中, dan 隣.']],
    tip: 'に di sini menunjukkan lokasi keberadaan. Nanti, lokasi melakukan kegiatan biasanya memakai で.',
    words: [['上','うえ','ue','atas'],['下','した','shita','bawah'],['中','なか','naka','dalam'],['隣','となり','tonari','sebelah'],['猫','ねこ','neko','kucing'],['部屋','へや','heya','kamar']],
    sentences: [['部屋{へや}に猫{ねこ}がいます。','Heya ni neko ga imasu.','Ada kucing di kamar.',['部屋','に','猫','が','います'],'Kucing adalah makhluk hidup, jadi gunakan います.'],['机{つくえ}の上{うえ}に本{ほん}があります。','Tsukue no ue ni hon ga arimasu.','Ada buku di atas meja.',['机','の','上','に','本','が','あります'],'の menghubungkan meja dengan posisi atas; buku memakai あります.']],
  },
  {
    title: 'Temukan jalanmu', subtitle: 'Tempat dan petunjuk arah sederhana.', goal: 'Menanyakan lokasi tempat dan memahami arah dasar.',
    concepts: [['ここ・そこ・あそこ', 'ここ adalah di sini, そこ di situ dekat lawan bicara, dan あそこ di sana jauh dari keduanya. Untuk menanyakan lokasi: 駅{えき}はどこですか。'], ['Arah sederhana', '右{みぎ} adalah kanan, 左{ひだり} kiri, dan まっすぐ lurus. 右{みぎ}に曲{ま}がってください berarti belok kanan, silakan. Bentuk 〜てください akan dibahas pada pelajaran permintaan.']],
    tip: 'すみません adalah pembuka yang berguna saat bertanya arah kepada orang yang belum dikenal.',
    words: [['駅','えき','eki','stasiun'],['店','みせ','mise','toko'],['右','みぎ','migi','kanan'],['左','ひだり','hidari','kiri'],['まっすぐ','まっすぐ','massugu','lurus'],['どこ','どこ','doko','di mana']],
    sentences: [['駅{えき}はどこですか。','Eki wa doko desu ka.','Stasiun ada di mana?',['駅','は','どこ','です','か'],'どこ menanyakan tempat.'],['店{みせ}はあそこです。','Mise wa asoko desu.','Tokonya di sana.',['店','は','あそこ','です'],'あそこ menunjuk lokasi jauh dari kedua orang.']],
  },
  {
    title: 'Jam berapa sekarang?', subtitle: 'Waktu, hari, dan tanggal.', goal: 'Menyatakan waktu sederhana dan mengenali bacaan khusus.',
    concepts: [['Jam dengan 時', '時{じ} dipakai untuk jam: 一時{いちじ}, 二時{にじ}. Bacaan khusus penting: 四時{よじ}, 七時{しちじ}, 九時{くじ}. 半{はん} berarti setengah: 七時半 adalah 7.30.'], ['Hari dan tanggal', '今日{きょう}, 明日{あした}, 昨日{きのう} berarti hari ini, besok, kemarin. Tanggal punya bacaan khusus: 一日{ついたち}, 二日{ふつか}, 三日{みっか}. 月曜日{げつようび} adalah Senin.']],
    tip: 'Pada contoh 今は七時です, bacaan yang diajarkan adalah しちじ. Jangan memakai ななじ untuk pola ini.',
    words: [['今','いま','ima','sekarang'],['朝','あさ','asa','pagi'],['夜','よる','yoru','malam'],['明日','あした','ashita','besok'],['昨日','きのう','kinou','kemarin'],['月曜日','げつようび','getsuyoubi','Senin']],
    sentences: [['今{いま}は七時{しちじ}です。','Ima wa shichiji desu.','Sekarang jam tujuh.',['今','は','七時','です'],'七時 dibaca しちじ dalam contoh ini.'],['明日{あした}は月曜日{げつようび}です。','Ashita wa getsuyoubi desu.','Besok hari Senin.',['明日','は','月曜日','です'],'Kata waktu dapat menjadi topik dengan は.']],
  },
  {
    title: 'Hal-hal yang kamu lakukan', subtitle: 'Kata kerja bentuk sopan.', goal: 'Mengungkapkan kegiatan dengan 〜ます dan 〜ません.',
    concepts: [['Bentuk ます', '食{た}べます berarti makan; 飲{の}みます minum; 行{い}きます pergi. Bentuk ます adalah bentuk sopan untuk kebiasaan atau kegiatan sekarang/masa depan. Konteks waktu menjelaskan kapan kegiatan dilakukan.'], ['Bentuk negatif', 'Ganti ます dengan ません: 食{た}べません berarti tidak makan. Jangan menambahkan です setelah ます. Pertanyaan dibuat dengan か: 行{い}きますか。']],
    tip: 'Bahasa Jepang tidak mengubah kata kerja berdasarkan saya/kamu/dia. Subjek yang sudah jelas sering tidak disebutkan.',
    words: [['食べます','たべます','tabemasu','makan (sopan)'],['飲みます','のみます','nomimasu','minum (sopan)'],['行きます','いきます','ikimasu','pergi (sopan)'],['帰ります','かえります','kaerimasu','pulang (sopan)'],['起きます','おきます','okimasu','bangun (sopan)'],['寝ます','ねます','nemasu','tidur (sopan)']],
    sentences: [['パンを食{た}べます。','Pan o tabemasu.','Saya makan roti.',['パン','を','食べます'],'を menandai objek yang dimakan.'],['明日{あした}、行{い}きます。','Ashita, ikimasu.','Saya akan pergi besok.',['明日','行きます'],'明日 membuat bentuk ます merujuk masa depan.']],
  },
  {
    title: 'Kegiatan, tempat, tujuan', subtitle: 'Kenali を・で・に melalui contoh.', goal: 'Membedakan objek, tempat kegiatan, dan tujuan.',
    concepts: [['Objek dengan を', '本{ほん}を読{よ}みます berarti membaca buku. を ditulis wo tetapi biasanya dibaca o. Tempat melakukan kegiatan memakai で: 家{いえ}で勉強{べんきょう}します。'], ['Tujuan dan waktu dengan に', '学校{がっこう}に行{い}きます berarti pergi ke sekolah. 七時{しちじ}に起{お}きます berarti bangun pukul tujuh. Kata relatif seperti 今日, 明日 biasanya tidak perlu に.']],
    tip: 'Bandingkan 家にいます (ada di rumah) dengan 家で勉強します (belajar di rumah). に menunjukkan keberadaan; で menunjukkan tempat kegiatan.',
    words: [['読みます','よみます','yomimasu','membaca (sopan)'],['書きます','かきます','kakimasu','menulis (sopan)'],['見ます','みます','mimasu','melihat / menonton (sopan)'],['勉強します','べんきょうします','benkyou shimasu','belajar (sopan)'],['学校','がっこう','gakkou','sekolah'],['家','いえ','ie','rumah']],
    sentences: [['家{いえ}で勉強{べんきょう}します。','Ie de benkyou shimasu.','Saya belajar di rumah.',['家','で','勉強します'],'で menunjukkan tempat kegiatan belajar.'],['本{ほん}を読{よ}みます。','Hon o yomimasu.','Saya membaca buku.',['本','を','読みます'],'を menandai buku sebagai objek kegiatan.']],
  },
  {
    title: 'Cerita tentang kemarin', subtitle: 'Bentuk lampau yang sopan.', goal: 'Mengungkapkan kegiatan lampau positif dan negatif.',
    concepts: [['〜ました', 'Bentuk lampau sopan dibuat dengan mengganti ます menjadi ました: 食{た}べました (sudah makan), 行{い}きました (sudah pergi). Gunakan konteks seperti 昨日{きのう} untuk menempatkan cerita pada masa lalu.'], ['〜ませんでした', 'Negatif lampau memakai ませんでした: 食{た}べませんでした berarti tidak makan saat itu. Untuk kata benda, gunakan でした / じゃなかったです; misalnya 休{やす}みでした (waktu itu libur).']],
    tip: '〜ました menunjukkan kegiatan lampau, bukan otomatis menyatakan semua makna “sudah” dalam bahasa Indonesia. Perhatikan konteks kalimat.',
    words: [['食べました','たべました','tabemashita','makan (lampau sopan)'],['行きました','いきました','ikimashita','pergi (lampau sopan)'],['見ました','みました','mimashita','melihat (lampau sopan)'],['買いました','かいました','kaimashita','membeli (lampau sopan)'],['休み','やすみ','yasumi','libur'],['映画','えいが','eiga','film']],
    sentences: [['昨日{きのう}、映画{えいが}を見{み}ました。','Kinou, eiga o mimashita.','Kemarin saya menonton film.',['昨日','映画','を','見ました'],'見ました adalah bentuk lampau dari 見ます.'],['昨日{きのう}は休{やす}みでした。','Kinou wa yasumi deshita.','Kemarin hari libur.',['昨日','は','休み','でした'],'Kata benda 休み memakai でした pada bentuk lampau.']],
  },
  {
    title: 'Makan apa hari ini?', subtitle: 'Kosakata makanan dan memesan.', goal: 'Mengenali menu sederhana dan memesan dengan ください.',
    concepts: [['Memesan dengan N をください', '水{みず}をください berarti tolong beri saya air. Pola ini berguna untuk pesanan makanan atau barang. お願{ねが}いします juga dapat dipakai pada pesanan: コーヒーをお願{ねが}いします。'], ['Menanyakan menu', 'これは何{なん}ですか menanyakan nama hidangan. おすすめは何{なん}ですか berarti apa rekomendasinya? Pesanan tidak perlu subjek 私は karena situasinya sudah jelas.']],
    tip: 'ご飯 dapat berarti nasi atau makanan, tergantung konteks. 朝ご飯 berarti sarapan, bukan selalu nasi pagi.',
    words: [['水','みず','mizu','air'],['ご飯','ごはん','gohan','nasi / makanan'],['肉','にく','niku','daging'],['魚','さかな','sakana','ikan'],['野菜','やさい','yasai','sayuran'],['卵','たまご','tamago','telur']],
    sentences: [['水{みず}をください。','Mizu o kudasai.','Tolong beri saya air.',['水','を','ください'],'Kata benda + をください adalah pola meminta benda.'],['魚{さかな}を食{た}べます。','Sakana o tabemasu.','Saya makan ikan.',['魚','を','食べます'],'を menandai makanan sebagai objek.']],
  },
  {
    title: 'Apa yang kamu suka?', subtitle: 'Kesukaan dan hobi.', goal: 'Menyatakan suka atau tidak suka dengan が好きです.',
    concepts: [['N が好きです', '日本語{にほんご}が好{す}きです berarti saya suka bahasa Jepang. 好き adalah kata sifat-na, bukan kata kerja “menyukai”, sehingga benda yang disukai memakai が dalam pola dasar ini.'], ['Tidak suka dan sangat suka', '好{す}きじゃないです berarti tidak suka. 大好{だいす}きです berarti sangat suka. Untuk pertanyaan: 何{なに}が好{す}きですか。 趣味{しゅみ}は読書{どくしょ}です menyebut hobi membaca.']],
    tip: '嫌い (kirai) dapat terdengar kuat. あまり好きじゃないです berarti tidak terlalu suka dan sering lebih halus.',
    words: [['音楽','おんがく','ongaku','musik'],['料理','りょうり','ryouri','masakan / memasak'],['旅行','りょこう','ryokou','perjalanan / wisata'],['読書','どくしょ','dokusho','kegiatan membaca'],['趣味','しゅみ','shumi','hobi'],['日本語','にほんご','nihongo','bahasa Jepang']],
    sentences: [['音楽{おんがく}が好{す}きです。','Ongaku ga suki desu.','Saya suka musik.',['音楽','が','好き','です'],'Dalam pola kesukaan ini, musik ditandai dengan が.'],['趣味{しゅみ}は読書{どくしょ}です。','Shumi wa dokusho desu.','Hobi saya membaca.',['趣味','は','読書','です'],'は menetapkan hobi sebagai topik kalimat.']],
  },
  {
    title: 'Belanja tanpa bingung', subtitle: 'Harga, barang, dan hitungan sederhana.', goal: 'Menanyakan harga dan memilih barang di toko.',
    concepts: [['いくらですか', 'これはいくらですか berarti berapa harga ini? 円{えん} adalah yen. Bacaan ratusan khusus: 三百{さんびゃく}, 六百{ろっぴゃく}, 八百{はっぴゃく}. 千{せん} berarti seribu.'], ['Memilih dan menghitung', 'これをください berarti saya mau yang ini. Untuk hitungan benda umum gunakan ひとつ・ふたつ・みっつ. Penghitung khusus berbeda menurut benda, tetapi hitungan umum cukup untuk banyak situasi awal.']],
    tip: 'Saat meminta jumlah, jangan selalu menambahkan angka biasa saja: ひとつください lebih alami daripada いちください untuk satu benda umum.',
    words: [['いくら','いくら','ikura','berapa harganya'],['円','えん','en','yen'],['百','ひゃく','hyaku','seratus'],['千','せん','sen','seribu'],['ひとつ','ひとつ','hitotsu','satu buah (umum)'],['ふたつ','ふたつ','futatsu','dua buah (umum)']],
    sentences: [['これはいくらですか。','Kore wa ikura desu ka.','Berapa harga ini?',['これ','は','いくら','です','か'],'いくら menanyakan harga.'],['これをください。','Kore o kudasai.','Saya mau yang ini, tolong.',['これ','を','ください'],'これ menggantikan barang yang ditunjuk.']],
  },
  {
    title: 'Minta dengan sopan', subtitle: 'Dari meminta benda menjadi meminta tindakan.', goal: 'Memahami beberapa bentuk 〜てください yang sering dipakai.',
    concepts: [['Kata kerja bentuk て + ください', '待{ま}ってください berarti tolong tunggu; 見{み}てください berarti tolong lihat. Ini meminta tindakan, berbeda dari N をください yang meminta benda. Bentuk て punya beberapa pola perubahan.'], ['Pelajari contoh sebagai pasangan', '見ます → 見て, 食べます → 食べて, 待ちます → 待って, 書きます → 書いて. 行きます memiliki bentuk khusus 行って. Pada tahap awal, hafalkan pasangan yang sering dipakai sebelum mempelajari seluruh kelompok kata kerja.']],
    tip: '〜てください sopan tetapi tetap merupakan permintaan langsung. Untuk bantuan yang lebih halus, ada pola lain yang dapat dipelajari setelah fondasi ini.',
    words: [['待って','まって','matte','tunggu (bentuk te)'],['見て','みて','mite','lihat (bentuk te)'],['書いて','かいて','kaite','tulis (bentuk te)'],['読んで','よんで','yonde','baca (bentuk te)'],['聞いて','きいて','kiite','dengar / tanya (bentuk te)'],['食べて','たべて','tabete','makan (bentuk te)']],
    sentences: [['少{すこ}し待{ま}ってください。','Sukoshi matte kudasai.','Tolong tunggu sebentar.',['少し','待って','ください'],'待って adalah bentuk て dari 待ちます.'],['名前{なまえ}を書{か}いてください。','Namae o kaite kudasai.','Tolong tulis nama.',['名前','を','書いて','ください'],'書いて meminta tindakan menulis; 名前 adalah objeknya.']],
  },
  {
    title: 'Beri warna pada kalimatmu', subtitle: 'Kata sifat i dan na.', goal: 'Menerangkan benda serta membentuk negatif kata sifat.',
    concepts: [['Kata sifat i', 'おいしい・大きい・小さい termasuk kata sifat-i. Langsung letakkan sebelum benda: 大{おお}きい家{いえ}. Negatifnya ubah い menjadi くない: おいしくないです. いい memiliki bentuk khusus よくないです.'], ['Kata sifat na', '静{しず}か・きれい termasuk kata sifat-na. Sebelum benda tambahkan な: 静{しず}かな部屋{へや}. Di akhir kalimat gunakan 静{しず}かです; negatif 静{しず}かじゃないです. きれい berakhiran i tetapi termasuk kata sifat-na.']],
    tip: '高い dapat berarti tinggi atau mahal. Arti yang tepat ditentukan oleh benda dan situasinya.',
    words: [['大きい','おおきい','ookii','besar'],['小さい','ちいさい','chiisai','kecil'],['高い','たかい','takai','tinggi / mahal'],['安い','やすい','yasui','murah'],['静か','しずか','shizuka','tenang'],['おいしい','おいしい','oishii','enak']],
    sentences: [['この家{いえ}は大{おお}きいです。','Kono ie wa ookii desu.','Rumah ini besar.',['この','家','は','大きい','です'],'大きい adalah kata sifat-i.'],['静{しず}かな部屋{へや}です。','Shizuka na heya desu.','Ini kamar yang tenang.',['静か','な','部屋','です'],'静か membutuhkan な sebelum kata benda 部屋.']],
  },
  {
    title: 'Bagaimana kalau bersama?', subtitle: 'Ajakan dan rencana sederhana.', goal: 'Mengajak kegiatan dan menyatakan rencana dengan konteks waktu.',
    concepts: [['〜ませんか untuk mengajak', '一緒{いっしょ}に食{た}べませんか berarti mau makan bersama? Meskipun memakai bentuk negatif, pola ini berfungsi sebagai ajakan. Jawaban menerima: いいですね (ide bagus).'], ['〜ましょう dan rencana', '行{い}きましょう berarti ayo pergi. 明日{あした}、公園{こうえん}に行{い}きます menyatakan rencana besok melalui kata waktu dan bentuk ます. Hindari menganggap semua rencana harus memakai pola baru yang rumit.']],
    tip: 'Untuk menolak dengan halus, 明日はちょっと… dapat menyiratkan bahwa besok kurang memungkinkan. Konteks percakapan penting.',
    words: [['一緒に','いっしょに','issho ni','bersama'],['公園','こうえん','kouen','taman'],['週末','しゅうまつ','shuumatsu','akhir pekan'],['今日','きょう','kyou','hari ini'],['明日','あした','ashita','besok'],['いいですね','いいですね','ii desu ne','ide bagus / bagus ya']],
    sentences: [['一緒{いっしょ}に食{た}べませんか。','Issho ni tabemasen ka.','Mau makan bersama?',['一緒に','食べません','か'],'〜ませんか adalah bentuk ajakan dalam konteks ini.'],['公園{こうえん}に行{い}きましょう。','Kouen ni ikimashou.','Ayo pergi ke taman.',['公園','に','行きましょう'],'に menandai tujuan, ましょう mengajak melakukan kegiatan.']],
  },
  {
    title: 'Percakapan kecil, koneksi besar', subtitle: 'Gabungkan salam, pertanyaan, dan jawaban.', goal: 'Memahami dialog pendek di kedai dan saat bertemu orang baru.',
    concepts: [['Dialog di kedai', 'A: すみません、コーヒーをください。 B: はい。 A: いくらですか。 B: 三百円です。 Mulai dari meminta perhatian, memesan, lalu menanyakan harga. Ketika konteksnya jelas, kalimat boleh pendek.'], ['Perkenalan dua arah', 'A: はじめまして。リナです。 B: はじめまして。けんです。 A: 趣味{しゅみ}は何{なん}ですか。 B: 旅行{りょこう}です。 Pertanyaan yang relevan membuat percakapan berlanjut, bukan sekadar menyebut identitas sendiri.']],
    tip: 'Saat membaca dialog, cari dulu tujuannya: siapa meminta apa, dan informasi mana yang menjadi jawaban. Jangan menerjemahkan setiap partikel secara terpisah.',
    words: [['注文','ちゅうもん','chuumon','pesanan'],['会話','かいわ','kaiwa','percakapan'],['お店','おみせ','omise','toko / kedai'],['お名前','おなまえ','onamae','nama (sopan)'],['おすすめ','おすすめ','osusume','rekomendasi'],['三百円','さんびゃくえん','sanbyaku en','tiga ratus yen']],
    sentences: [['コーヒーをください。','Koohii o kudasai.','Tolong beri saya kopi.',['コーヒー','を','ください'],'Pesanan memakai benda + をください.'],['趣味{しゅみ}は何{なん}ですか。','Shumi wa nan desu ka.','Apa hobi Anda?',['趣味','は','何','です','か'],'趣味 adalah topik; 何 menanyakan informasinya.']],
  },
  {
    title: 'Kamu sudah bisa membaca ini', subtitle: 'Satu cerita kecil, banyak hal yang sudah kamu tahu.', goal: 'Mengambil informasi dari bacaan pendek dan merangkai kalimat dasar.',
    concepts: [['Bacaan: hari Rina', '私{わたし}はリナです。学生{がくせい}です。朝{あさ}、七時{しちじ}に起{お}きます。学校{がっこう}で日本語{にほんご}を勉強{べんきょう}します。日本語{にほんご}が好{す}きです。昨日{きのう}、友達{ともだち}と映画{えいが}を見{み}ました。'], ['Cari inti kalimat', 'Rina adalah pelajar, bangun jam tujuh, belajar bahasa Jepang di sekolah, dan kemarin menonton film bersama teman. と pada 友達と berarti bersama teman. Pisahkan topik, waktu, tempat, objek, dan kata kerja untuk memahami setiap kalimat.']],
    tip: 'Setelah membaca, coba ceritakan harimu dengan tiga kalimat sendiri. Kamu boleh mengganti nama, tempat, dan kegiatan dari contoh.',
    words: [['毎日','まいにち','mainichi','setiap hari'],['朝ご飯','あさごはん','asagohan','sarapan'],['午後','ごご','gogo','sore / setelah tengah hari'],['午前','ごぜん','gozen','pagi / sebelum tengah hari'],['友達','ともだち','tomodachi','teman'],['日本語','にほんご','nihongo','bahasa Jepang']],
    sentences: [['学校{がっこう}で日本語{にほんご}を勉強{べんきょう}します。','Gakkou de nihongo o benkyou shimasu.','Saya belajar bahasa Jepang di sekolah.',['学校','で','日本語','を','勉強します'],'で menandai tempat kegiatan; を menandai yang dipelajari.'],['昨日{きのう}、友達{ともだち}と映画{えいが}を見{み}ました。','Kinou, tomodachi to eiga o mimashita.','Kemarin saya menonton film bersama teman.',['昨日','友達','と','映画','を','見ました'],'と berarti bersama; 見ました menyatakan kegiatan lampau.']],
  },
];

export const plainJapanese = (s: string) => s.replace(/\{[^}]+\}/g, '');

export const lessons: Lesson[] = specs.map((spec, index) => {
  const id = `lesson-${String(index + 1).padStart(2, '0')}`;
  const vocabulary: Vocabulary[] = spec.words.map(([word, reading, romaji, meaning], n) => ({ id: `${id}-word-${n + 1}`, word, reading, romaji, meaning }));
  const examples: Example[] = spec.sentences.map(([japanese, romaji, meaning, tokens, note]) => ({ japanese, romaji, meaning, tokens, note }));
  const questions: Question[] = [
    ...vocabulary.slice(0, 4).map((word, n): Question => ({
      id: `${id}-q${n + 1}`, type: 'choice', prompt: 'Apa arti kata ini?', japanese: word.word,
      options: Array.from({ length: 4 }, (_, offset) => vocabulary[(n + offset) % vocabulary.length].meaning),
      answer: word.meaning, explanation: `${word.word} dibaca ${word.reading} (${word.romaji}), artinya ${word.meaning}.`,
    })),
    ...[vocabulary.slice(0, 3), vocabulary.slice(3, 6)].map((words, n): Question => ({
      id: `${id}-q${n + 5}`, type: 'match', prompt: 'Pasangkan kata dengan artinya.',
      pairs: words.map(w => ({ left: w.word, right: w.meaning })),
      explanation: words.map(w => `${w.word} = ${w.meaning}`).join(' · '),
    })),
    ...examples.map((example, n): Question => ({ id: `${id}-q${n + 7}`, type: 'order', prompt: `Susun kalimat: “${example.meaning}”`, tokens: example.tokens, answer: example.tokens, explanation: `${plainJapanese(example.japanese)} — ${example.note}` })),
    ...[vocabulary[0], vocabulary[2]].map((word, n): Question => ({ id: `${id}-q${n + 9}`, type: 'type', prompt: `Ketik bacaan kana untuk “${word.word}” (${word.meaning}).`, answers: [word.reading, ...(index === 1 ? [word.word] : [])], script: index === 1 ? 'katakana' : 'hiragana', explanation: `Bacaannya ${word.reading} (${word.romaji}). ${word.meaning}.` })),
  ];
  return { id, index, group: Math.floor(index / 4), title: spec.title, subtitle: spec.subtitle, goal: spec.goal, concepts: spec.concepts.map(([title, text]) => ({ title, text })), tip: spec.tip, vocabulary, examples, questions };
});

export const allVocabulary = lessons.flatMap(l => l.vocabulary);
export const kanaRows = [
  ['a','i','u','e','o'], ['ka','ki','ku','ke','ko'], ['sa','shi','su','se','so'], ['ta','chi','tsu','te','to'],
  ['na','ni','nu','ne','no'], ['ha','hi','fu','he','ho'], ['ma','mi','mu','me','mo'], ['ya','','yu','','yo'],
  ['ra','ri','ru','re','ro'], ['wa','','','','wo'], ['n','','','',''],
];
