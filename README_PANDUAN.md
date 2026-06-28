# 🚀 Panduan Pengelolaan Taul StaticWeb

Selamat datang di repositori Taul StaticWeb. File ini berfungsi sebagai panduan operasional bagi Anda untuk mengelola kode website dan alur kerja saat mendapatkan klien baru.

---

## 📂 Struktur Proyek
- `jasa_web/index.html`: Landing page utama (Web Penjualan Anda).
- `jasa_web/paket_express.html`: Halaman penawaran khusus Paket Express.
- `jasa_web/Tema_*/`: Folder berisi berbagai tema website untuk klien.
- `jasa_web/gas_template.gs`: Kode Google Apps Script (GAS) untuk menghubungkan Google Sheets ke website.

---

## 🛠️ 1. Cara Mengubah Kode & Tampilan

### Mengubah Warna Global
Setiap halaman menggunakan variabel CSS di bagian `:root`. Untuk mengubah tema warna seluruh website, cukup ganti kode Hex di sini:
```css
:root {
    --color-default: #0a1645; /* Biru Gelap Utama */
    --color-accent: #0eeef7;  /* Warna Aksen/Tombol */
    --color-secondary: #126bdd;
}
```

### Mengubah Teks & Konten
- Cari teks yang ingin diubah langsung di file `.html`.
- Gunakan class `reveal` pada elemen baru jika ingin elemen tersebut muncul dengan efek animasi saat di-scroll.

### Mengubah Animasi
- Gunakan class `btn-bounce` pada tombol yang ingin diberi efek "melompat/mantul".
- Animasi didefinisikan di bagian `@keyframes` dalam blok `<style>`.

---

## 🤝 2. Alur Kerja Klien Baru (Setup Delivery)

Jika ada klien yang memesan, ikuti langkah-langkah ini:

### Langkah A: Persiapan Google Sheets
1. Buka Google Sheets template Anda.
2. Buat salinan (Make a copy) untuk klien tersebut.
3. Isi data produk awal klien di dalam Sheet tersebut.

### Langkah B: Setup API (Google Apps Script)
1. Di Google Sheets klien, klik **Extensions > Apps Script**.
2. Copy seluruh isi file `jasa_web/gas_template.gs` dan paste ke editor script tersebut.
3. Klik tombol **Deploy > New Deployment**.
4. Pilih type: **Web App**.
5. Set "Execute as": **Me**.
6. Set "Who has access": **Anyone**.
7. Salin **Web App URL** yang dihasilkan.

### Langkah C: Setup Website Klien
1. Pilih folder Tema yang diinginkan klien (misal: `Tema_Neubrutalism`).
2. Buka file `index.html` (atau file JS di dalamnya jika ada).
3. Cari variabel `scriptURL` atau `API_URL` dan ganti dengan URL yang Anda salin dari Langkah B.
4. Sesuaikan logo dan nama brand klien di dalam kode HTML.

### Langkah D: Deployment
1. Upload folder tema tersebut ke hosting (GitHub Pages, Netlify, atau Vercel).
2. Kirim link website yang sudah jadi kepada klien.
3. Berikan link `tutorial_klien.html` agar klien bisa belajar cara update data sendiri dari HP.

---

## 📱 3. Optimasi Tampilan Mobile
Pastikan selalu mengecek `@media (max-width: 768px)` di bagian CSS. 
- Jika elemen terlalu besar/kecil di HP, sesuaikan di bagian ini.
- Gunakan `flex-wrap: nowrap` jika ingin tombol tetap sejajar dalam satu baris.

---

## 📝 Catatan Penting
- **Backup:** Selalu lakukan backup file sebelum melakukan perubahan besar.
- **Testing:** Selalu cek tampilan di mode "Inspect Element" (Mobile View) di browser setelah mengubah CSS.

---
*Dibuat dengan ❤️ oleh Antigravity untuk Taul StaticWeb.*
