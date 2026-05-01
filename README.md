# HikeIt.

HikeIt adalah sebuah platform *marketplace* penyewaan peralatan *outdoor* (hiking dan camping) yang mempertemukan pendaki dengan toko penyewaan (mitra) di sekitarnya. Aplikasi ini mempermudah pendaki dalam mencari, membooking, dan mengelola perlengkapan mendaki, sekaligus membantu mitra dalam mengelola stok, paket bundling, dan pelacakan status sewa secara digital.

---

### Link Akses Aplikasi
Kamu dapat mengakses dan mencoba aplikasi ini secara langsung melalui tautan berikut:
**[https://hike-it.vercel.app](https://hike-it.vercel.app)**

---

### Teknologi yang Digunakan
Aplikasi ini dikembangkan menggunakan tumpukan teknologi (*tech stack*) modern untuk memastikan performa yang cepat dan antarmuka yang responsif:
*   **Framework:** Next.js (App Router)
*   **Bahasa Pemrograman:** TypeScript / JavaScript
*   **Styling:** Tailwind CSS
*   **Database & Auth:** Supabase (PostgreSQL, Authentication, dan Storage)
*   **Peta & Geolocation:** Leaflet & React-Leaflet
*   **Deployment & Hosting:** Vercel

---

### Pengujian Aplikasi (System Testing)
Pengujian ini dilakukan menggunakan metode *Black Box Testing* berdasarkan skenario *Use Case* (Daily Project 6) untuk memastikan seluruh aspek fungsionalitas berjalan sesuai ekspektasi.

| Modul / Paket | Use Case | Aktor | Skenario Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Tracking Status Sewa** | Melihat status sewa | Penyewa | Mengakses halaman pesanan untuk mengecek status pesanan terkini. | Sistem menampilkan status pesanan (diproses, dikirim, digunakan, selesai). | ✅ Pass |
| | Update status sewa | Penyedia | Mengubah status transaksi pesanan pelanggan dari halaman kelola sewa. | Sistem berhasil memperbarui status dan menampilkannya di sisi penyewa. | ✅ Pass |
| **Rekomendasi & Checklist** | Melihat rekomendasi & Menggunakan checklist | Penyewa | Mengakses halaman checklist untuk melihat rekomendasi alat sebelum mendaki. | Sistem menampilkan daftar alat yang direkomendasikan. | ✅ Pass |
| | Menandai checklist | Penyewa | Mengklik opsi centang (sudah/belum) pada daftar kelengkapan alat. | Sistem menyimpan dan memperbarui indikator kelengkapan alat penyewa. | ✅ Pass |
| **Booking & Ketersediaan** | Melihat daftar alat | Penyewa | Membuka halaman utama (katalog) untuk melihat barang yang tersedia. | Sistem menampilkan seluruh daftar alat lengkap dengan gambar, harga, dan toko. | ✅ Pass |
| | Melakukan booking alat & Cek stok | Penyewa | Memasukkan alat ke keranjang, mengatur durasi, mengecek batas stok, dan checkout. | Sistem memproses pesanan, memvalidasi limit stok, dan meneruskan ke pop-up pembayaran. | ✅ Pass |
| | Mengelola ketersediaan alat | Penyedia | Menambahkan, mengedit (harga/stok), dan menghapus alat dari dashboard toko. | Sistem memperbarui katalog secara real-time dan menyimpan data ke database. | ✅ Pass |
| **Review & Rating** | Memberikan rating & review | Penyewa | Mengisi form ulasan dan memberikan bintang setelah transaksi selesai. | Sistem menyimpan ulasan dan menampilkannya di halaman profil toko. | ✅ Pass |
| | Menanggapi review | Penyedia | Membalas ulasan yang diberikan pelanggan melalui dashboard mitra. | Sistem berhasil mengirim balasan dan menampilkannya di bawah komentar pelanggan. | ✅ Pass |
| **Pencarian & Lokasi** | Mencari rental terdekat | Penyewa | Mengaktifkan filter lokasi GPS pada halaman katalog utama. | Sistem meminta izin GPS dan mengurutkan alat berdasarkan jarak terdekat (radius 15km). | ✅ Pass |
| | Melihat lokasi di peta | Penyewa | Membuka halaman registrasi toko atau halaman detail untuk melihat map. | Sistem merender peta interaktif (Leaflet) dengan pin lokasi yang akurat. | ✅ Pass |
| | Mengelola lokasi | Penyedia | Menentukan titik koordinat saat mendaftar atau mengatur profil toko. | Sistem menyimpan titik koordinat secara akurat ke dalam database. | ✅ Pass |
| **Paket Bundling** | Melihat & Booking paket | Penyewa | Mencari kategori "Paket Bundling" dan menambahkannya ke keranjang. | Sistem menampilkan paket khusus dengan potongan harga dan berhasil di-checkout. | ✅ Pass |
| | Mengelola paket bundling | Penyedia | Memilih minimal 2 alat dari katalog untuk digabungkan menjadi satu produk paket. | Sistem mengkalkulasi diskon otomatis (5%) dan menerbitkan paket ke katalog. | ✅ Pass |

---

### Informasi Login (Testing)
Untuk keperluan pengujian fitur, silakan gunakan kredensial (*dummy account*) di bawah ini:

**Akun Mitra / Penyedia Toko:**
*   **Email:** `mitra@gmail.com`
*   **Password:** `mitra123`

**Akun Pendaki / Penyewa:**
*   **Email:** `penyewa@gmail.com`
*   **Password:** `penyewa123`
