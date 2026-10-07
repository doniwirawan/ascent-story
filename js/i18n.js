/* English / Bahasa Indonesia. English is the source text in the page; Indonesian
   lives in TR_ID keyed by that English text (wording follows Ascent's own
   translations). Text with markup is keyed by element id via data-i18n-html.
   The language is detected from the browser (Indonesian → ID), remembered, and
   switched from the EN / ID control in the top bar. */

window.LANG = (() => {
  try { const s = localStorage.getItem('story_lang'); if (s === 'en' || s === 'id') return s; } catch {}
  return /^id\b/i.test(navigator.language || '') ? 'id' : 'en';
})();

const TR_ID = {
  // shell
  'Runs in your browser — your files never leave your device': 'Berjalan di browser Anda — file Anda tidak pernah keluar dari perangkat',
  'Language': 'Bahasa',
  // source
  'Source': 'Sumber',
  'Activity file': 'File aktivitas',
  'Connect with Strava': 'Hubungkan dengan Strava',
  'Load my activities': 'Muat aktivitas saya',
  'Disconnect': 'Putuskan',
  'Reads your recent activities to draw the card. Nothing is stored on a server.': 'Membaca aktivitas terbaru Anda untuk membuat kartu. Tidak ada yang disimpan di server.',
  "Strava only lets a few athletes connect to a new app until it has been reviewed. If connecting fails, export the activity as a GPX file and use the Activity file tab.": 'Strava hanya mengizinkan sedikit atlet terhubung ke aplikasi baru sampai aplikasinya ditinjau. Jika gagal terhubung, ekspor aktivitas sebagai file GPX lalu pakai tab File aktivitas.',
  'Files are read in your browser and never uploaded.': 'File dibaca di browser Anda dan tidak pernah diunggah.',
  'How do I get a GPX or FIT file?': 'Bagaimana cara mendapatkan file GPX atau FIT?',
  // activity
  'Activity': 'Aktivitas',
  'Activity name': 'Nama aktivitas',
  'Size': 'Ukuran',
  'Units': 'Satuan',
  'Story 9:16': 'Story 9:16',
  'Portrait 4:5': 'Potret 4:5',
  'Square 1:1': 'Persegi 1:1',
  'Metric': 'Metrik',
  'Imperial': 'Imperial',
  'Template': 'Template',
  // card options
  'Display': 'Tampilan',
  'Hide Title': 'Sembunyikan judul',
  'Hide Date': 'Sembunyikan tanggal',
  'Hide Map': 'Sembunyikan peta',
  'Hide watermark': 'Sembunyikan watermark',
  'Theme': 'Tema',
  'Accent': 'Aksen',
  'Reset': 'Atur ulang',
  'Background Image': 'Gambar latar',
  'Upload Photo': 'Unggah foto',
  '✕ Clear': '✕ Hapus',
  'Collage': 'Kolase',
  'Stats': 'Statistik',
  // stats (same wording as Ascent)
  'Distance': 'Jarak',
  'Moving Time': 'Waktu Bergerak',
  'Pace': 'Pace',
  'Avg Speed': 'Kecepatan Rata-rata',
  'Max Speed': 'Kecepatan Maks',
  'Avg Heart Rate': 'Detak Jantung Rata-rata',
  'Max Heart Rate': 'Detak Jantung Maks',
  'Avg Cadence': 'Cadence Rata-rata',
  'Avg Power': 'Daya Rata-rata',
  'Elevation': 'Elevasi',
  'Energy': 'Energi',
  'Calories': 'Kalori',
  'Suffer Score': 'Suffer Score',
  'Achievements': 'Pencapaian',
  // custom editor
  'Smaller': 'Lebih kecil',
  'Bigger': 'Lebih besar',
  'Flip route horizontally': 'Balik rute secara horizontal',
  'Flip route vertically': 'Balik rute secara vertikal',
  'Hide selected': 'Sembunyikan yang dipilih',
  'Reset selected': 'Atur ulang yang dipilih',
  'Hide': 'Sembunyikan',
  'Reset all': 'Atur ulang semua',
  'Tap an element to select it. Drag to move (snaps to centre & edges) · drag the corner handles, scroll, or A−/A+ to resize.': 'Ketuk elemen untuk memilihnya. Seret untuk memindahkan (menempel ke tengah & tepi) · seret sudutnya, scroll, atau A−/A+ untuk mengubah ukuran.',
  // actions
  'Copy': 'Salin',
  'Share': 'Bagikan',
  'Download PNG': 'Unduh PNG',
  // messages (app.js)
  'Showing a sample ride. Add your own file to replace it.': 'Ini contoh aktivitas. Tambahkan file Anda untuk menggantinya.',
  'Sample ride': 'Contoh bersepeda',
  'Loading your Strava activities…': 'Memuat aktivitas Strava Anda…',
  '{0} activities loaded from Strava': '{0} aktivitas dimuat dari Strava',
  'No activities found on your Strava account.': 'Tidak ada aktivitas di akun Strava Anda.',
  'Disconnected from Strava': 'Terputus dari Strava',
  'Loaded {0}': '{0} dimuat',
  'Loaded {0} files': '{0} file dimuat',
  'Image copied': 'Gambar disalin',
  'Copy is not allowed here — use Download': 'Salin tidak diizinkan di sini — gunakan Unduh',
  'Use a .gpx or .fit file': 'Gunakan file .gpx atau .fit',
  'No GPS track in this file': 'Tidak ada jalur GPS di file ini',
  'Not a valid GPX file': 'Bukan file GPX yang valid',
  'Not a valid FIT file': 'Bukan file FIT yang valid',
  'Could not read this FIT file': 'File FIT ini tidak bisa dibaca',
  'Strava login is not configured on this server. You can still upload a GPX or FIT file.': 'Login Strava belum dikonfigurasi di server ini. Anda tetap bisa mengunggah file GPX atau FIT.',
  'Strava session expired — connect again': 'Sesi Strava berakhir — hubungkan lagi',
  'Not connected to Strava': 'Belum terhubung ke Strava',
};

// Text that contains markup, keyed by element id.
const HTML_ID = {
  dropZone: 'Letakkan file <b>.gpx</b> atau <b>.fit</b>, atau klik untuk memilih',
  howtoList: `<li><b>Strava</b> (di komputer): buka aktivitas, klik <b>⋯</b> di kiri, lalu <b>Export GPX</b>.</li>
                <li><b>Aplikasi Strava</b>: aplikasi ponsel tidak bisa mengekspor; buka strava.com di browser ponsel Anda dan ikuti langkah di atas.</li>
                <li><b>Garmin Connect</b>: buka aktivitas, klik ikon roda gigi, lalu <b>Export to GPX</b> atau <b>Export Original</b> (file FIT).</li>
                <li><b>Wahoo, Coros, Huawei, Komoot…</b>: cari <b>Export</b> atau <b>Share → GPX</b> pada aktivitas.</li>`,
  templateHint: 'Pilih <b>Custom</b> untuk menyeret, mengubah ukuran, membalik, atau menyembunyikan tiap elemen di kartu (klik kanan elemen untuk opsi lain).',
  collageHint: 'Rute terpanjang tampil lebih dulu. Seret kotak putus-putus <b>“keep clear”</b> di pratinjau untuk menentukan area yang bebas stiker.',
  footer: 'Open source (MIT) · <a href="https://github.com/doniwirawan/ascent-story">GitHub</a> · Bagian dari <a href="https://ascent-analytics.doniwirawan.xyz/">Ascent</a> · Tidak berafiliasi dengan Strava',
};

function tr(s) { return (window.LANG === 'id' && TR_ID[s] != null) ? TR_ID[s] : s; }
function trf(s, ...v) { return tr(s).replace(/\{(\d+)\}/g, (_, i) => v[i] ?? ''); }

// Swap every translatable text node, attribute and marked-up block in the page.
// The English original is remembered on first sight, so switching back works.
const _orig = new WeakMap();
function applyLang() {
  document.documentElement.lang = window.LANG;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.parentElement && !n.parentElement.closest('script,style,canvas,[data-i18n-html]') && n.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!_orig.has(n)) _orig.set(n, n.nodeValue);
    const en = _orig.get(n), key = en.trim();
    if (TR_ID[key] == null) continue;
    n.nodeValue = en.replace(key, tr(key));
  }
  document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el => {
    ['placeholder', 'title', 'aria-label'].forEach(a => {
      if (!el.hasAttribute(a)) return;
      const k = 'en' + a.replace(/-./, m => m[1].toUpperCase()).replace(/^./, c => c.toUpperCase());
      if (el.dataset[k] == null) el.dataset[k] = el.getAttribute(a);
      el.setAttribute(a, tr(el.dataset[k]));
    });
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    if (el.dataset.enHtml == null) el.dataset.enHtml = el.innerHTML;
    el.innerHTML = window.LANG === 'id' && HTML_ID[el.dataset.i18nHtml] ? HTML_ID[el.dataset.i18nHtml] : el.dataset.enHtml;
  });
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === window.LANG));
}

function setLang(lang) {
  window.LANG = lang;
  try { localStorage.setItem('story_lang', lang); } catch {}
  applyLang();
}
