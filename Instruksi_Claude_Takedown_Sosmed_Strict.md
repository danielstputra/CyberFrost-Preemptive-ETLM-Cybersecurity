# Prompt Penambahan Fitur Takedown Akun Sosial Media (Strict UI/UX Edition)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Arsitektur Saat Ini:**
Kita sedang membangun platform keamanan siber sekelas CYFIRMA DeCYFIR. 
- Saat ini kita sudah memiliki `action-mitigation-service` (MongoDB + Mongoose) yang menangani Takedown untuk Domain Phishing.
- **Tujuan Saat Ini:** Memperluas fitur Takedown untuk menangani **Akun Sosial Media Palsu (Social Media Impersonation)**.

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Anda **DILARANG KERAS** membuat elemen visual, warna, padding, atau desain komponen baru yang keluar dari standarisasi proyek ini! 
- Gunakan kembali (*reuse*) komponen **Shadcn UI** yang sudah ada (Dialog, Form, Input, Select, Textarea, Button, Badge).
- Pastikan desain **Form/Modal** ini identik 100% dengan modal/form yang ada di modul lain (sama ukuran *border*, sama efek *neon glow*, sama *background color*, dan sama tipografinya).
- Jangan berkreasi membuat class Tailwind baru jika class standar proyek sudah ada. Konsistensi kelas *Enterprise* adalah prioritas utama!

---

### 1. Update Skema Database (Backend - MongoDB)
**Tugas Backend (`action-mitigation-service`):**
- Update skema Mongoose `TakedownRequest` yang sudah ada (atau buat relasi baru) untuk mengakomodasi field khusus Sosmed:
  - `targetType`: Enum (DOMAIN, SOCIAL_MEDIA)
  - `platform`: Enum (FACEBOOK, TWITTER, LINKEDIN, INSTAGRAM, TIKTOK, OTHER)
  - `profileUrl`: String (URL akun palsu)
  - `impersonatedEntity`: String (Nama eksekutif atau brand yang dipalsukan)
  - `evidenceFiles`: Array of Strings (URL ke file screenshot/bukti)

### 2. Legal Report Generator & Dispatcher (Backend)
**Tugas Backend (`action-mitigation-service`):**
- Buatkan fungsi/service Node.js yang berfungsi sebagai **Legal Report Generator**.
- Fungsi ini harus bisa menghasilkan *template* email hukum/laporan pelanggaran yang berbeda-beda tergantung `platform` (misal: template untuk Meta/Facebook berbeda dengan X/Twitter).
- Buatkan endpoint POST `/api/takedown/social-media` yang menerima *payload* form, menyimpan bukti, dan memicu pengiriman notifikasi via email (Nodemailer).

### 3. UI Form Takedown Sosial Media (Frontend)
**Tugas Frontend:**
- Buatkan komponen **Dialog / Modal (Shadcn UI)** khusus untuk "Submit Social Media Takedown".
- **Form Fields (Wajib mengikuti standar form aplikasi):** 
  1. Input URL Akun Target.
  2. Select/Dropdown Platform.
  3. Input Nama Eksekutif/Brand yang ditiru.
  4. Textarea untuk deskripsi ancaman.
  5. Area *Drag-and-Drop* untuk mengunggah bukti *screenshot*.
- Gunakan *state management* (Zustand/React Query) dan tampilkan *loading state* pada tombol *Submit* yang persis sama dengan form *submit* di modul lain.

### 4. Integrasi ke Datatable
**Tugas Frontend:**
- Pastikan riwayat pengajuan takedown sosial media ini muncul di **Datatable standar** yang sudah ada. 
- Berikan **Badge (Shadcn)** standar untuk membedakan target platformnya. Jangan membuat UI tabel baru, *inject* data ini ke dalam tabel yang sudah berjalan.

---
**Tugas Anda (Claude):**
Tuliskan kode untuk Schema Mongoose, Endpoint Express/Fastify Node.js, dan Komponen React/Next.js secara rapi. **Wajib lakukan pengecekan ulang (double-check) terhadap class Tailwind Anda untuk memastikan tidak ada pelanggaran Standarisasi UI!**
