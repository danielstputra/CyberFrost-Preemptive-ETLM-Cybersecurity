# Prompt UI Semi-Automated & Bulk Takedown (Analyst Efficiency)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Platform intelijen keamanan siber kita akan menggunakan pendekatan **"Semi-Automated (Human-in-the-Middle)"** untuk pelaporan Takedown Sosial Media guna menghindari pemblokiran deteksi *bot* dari platform raksasa.
- **Tujuan Saat Ini:** Memaksimalkan efisiensi Analis SOC di Frontend dengan menambahkan fitur "Salin Cepat (Clipboard)" dan kapabilitas **Massive/Bulk Reporting** agar analis tidak perlu melakukan klik berulang-ulang (*repetitive actions*).

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Tetap patuhi standarisasi Shadcn UI (Datatable Checkbox, Button, Toast/Snackbar) dan tema **Premium Cyberpunk 2077**.

---

### 1. Fitur Semi-Automated UI (Takedown Analyst View)
**Tugas Frontend:**
- Di dalam komponen Sheet (Drawer) `Takedown Analyst View`, tambahkan dua tombol utilitas di dekat area `<Textarea>` draf hukum:
  1. **"📋 Copy Draft to Clipboard"**: Tombol yang menyalin teks draf secara otomatis ke *clipboard* perangkat analis, disusul dengan notifikasi *Toast* Shadcn (misal: "Draft copied! Ready to paste").
  2. **"📥 Download Evidence"**: Tombol untuk mengunduh file *screenshot* secara langsung.
- Ubah tombol "Approve & Send" menjadi **"✅ Mark as Submitted"**. (Karena analis mengirimnya secara manual di *browser* lain, tombol ini hanya berfungsi untuk memperbarui status *database* menjadi `SUBMITTED` dan mencatat waktu pelaporan).

### 2. Fitur Massive Report / Bulk Actions (Datatable)
**Tugas Frontend:**
- Aktifkan fitur **Row Selection (Checkboxes)** pada kolom paling kiri dari komponen Datatable Takedown (gunakan standar *checkbox* Shadcn).
- Jika analis memilih lebih dari 1 baris, tampilkan menu atau tombol **"Bulk Actions"** di atas tabel.
- **Opsi Bulk Actions:**
  - **"📑 Export CSV (Bulk Target)"**: Mengunduh data yang dipilih (Target URL, Platform, Nama Entitas) ke dalam format CSV. Ini sangat krusial agar analis bisa mengunggah puluhan URL sekaligus ke form pelaporan massal milik platform sosmed (seperti portal *Brand Rights Protection*).
  - **"🔄 Bulk Update Status"**: Memungkinkan analis mengubah status puluhan baris sekaligus menjadi `SUBMITTED` hanya dengan satu klik.

### 3. Backend Support untuk Bulk Actions (`action-mitigation-service`)
**Tugas Backend:**
- Buat *endpoint* POST `/api/takedown/bulk-export` yang menerima *array of IDs* dari Frontend, mengambil datanya dari MongoDB/Prisma, lalu men-*generate* dan mengirimkan respons berupa file `.csv`.
- Buat *endpoint* PATCH `/api/takedown/bulk-status` untuk memproses pembaruan status massal dan menyuntikkan catatan ke dalam `analystLogs` di masing-masing dokumen tiket secara efisien.

---
**Tugas Anda (Claude):**
Tuliskan kode untuk memperbarui *Datatable* Shadcn dengan fitur seleksi massal (*bulk select*), fungsi ekspor CSV di Node.js, dan fitur *Clipboard API* di komponen React. Pastikan *User Experience* (UX) sangat efisien dan meminimalkan jumlah klik yang harus dilakukan oleh Analis SOC!
