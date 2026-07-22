# Prompt Implementasi One-Click Takedown (SOAR Action)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform Threat Intelligence B2B. Kita perlu menambahkan kapabilitas **SOAR (Security Orchestration, Automation, and Response)** khusus untuk modul Takedown.
- **Tujuan Saat Ini:** Membuat tombol "One-Click Auto Report" (Satu Klik Eksekusi) di Frontend yang akan memicu Backend untuk mengirimkan payload/data secara otomatis via API/Webhook ke pihak ketiga (misal: API Takedown Vendor, API Meta BRP, atau Email Kominfo).

**🚨 PERINGATAN KERAS SOAL UI/UX (WAJIB DIPATUHI) 🚨**
Anda DILARANG KERAS membuat elemen desain baru! Patuhi standarisasi Shadcn UI. Pertahankan tema Premium Cyberpunk 2077. Gunakan efek transisi/loading yang mulus karena ini adalah aksi kritikal.

---

### 1. Backend: Takedown Dispatcher / Webhook Handler (`action-mitigation-service`)
**Tugas Backend (Node.js/Express):**
- Buat *endpoint* POST `/api/takedown/:id/execute-one-click`.
- *Endpoint* ini harus memiliki *switch-case* atau *routing logic* berdasarkan `platform` target:
  - `case 'KOMINFO'`: Panggil fungsi pengiriman Email Nodemailer (mengirim laporan ke `aduankonten@kominfo.go.id`).
  - `case 'META' / 'X'`: Panggil fungsi HTTP Client (Axios/Fetch) untuk menembak API pihak ketiga (Vendor/BRP API). *Catatan untuk Claude: Buatkan struktur Axios/Fetch-nya saja dengan URL placeholder (mock), karena klien akan memasukkan API Key aslinya nanti.*
- Setelah eksekusi sukses, perbarui status di *database* menjadi `SUBMITTED` atau `RESOLVED`, dan tulis log keberhasilan ke `analystLogs`.

### 2. Frontend: UI One-Click Execution (Next.js App Router)
**Tugas Frontend:**
- Di komponen `Takedown Analyst View` (atau di baris Datatable), tambahkan sebuah tombol **"⚡ Auto-Execute Takedown"**.
- Gunakan varian warna *Destructive* (merah/neon alert) atau *Primary* (cyan/neon glow) dari Shadcn, karena ini adalah tombol aksi kritikal (*High-stakes action*).
- **Wajib ada AlertDialog (Konfirmasi):** Jangan biarkan sistem langsung menembak API saat tombol ditekan. Gunakan komponen `<AlertDialog>` Shadcn yang menanyakan: *"Are you sure you want to execute this takedown directly to [Platform Name]? This action cannot be undone."*
- Saat API sedang dipanggil, tombol harus berubah menjadi *disabled* dengan efek animasi *loading spinner*.
- Tampilkan komponen *Toast* hijau/merah berdasarkan respons dari Backend (Sukses/Gagal).

---
**Tugas Anda (Claude):**
Buatkan logika Node.js untuk fungsi `dispatchTakedownAction` dengan penanganan *error* (Try/Catch) yang sangat ketat (karena ini menembak API eksternal). Kemudian buatkan komponen UI di Next.js lengkap dengan fungsi *Loading State* (React `useState` / `useMutation`) dan AlertDialog Shadcn.
