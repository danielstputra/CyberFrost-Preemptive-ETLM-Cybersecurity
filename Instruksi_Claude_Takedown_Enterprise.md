# Prompt Upgrade Takedown Module (Enterprise "Human-in-the-Loop" Edition)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform keamanan siber sekelas CYFIRMA DeCYFIR. Modul Takedown kita saat ini sudah bisa mengotomatisasi pengiriman laporan (ke platform sosmed/hosting). Namun, untuk mencapai standar **Enterprise sejati**, kita harus mengimplementasikan alur **"Human-in-the-Loop" (Kombinasi Software Otomatisasi + Analis Manusia + VIP Escalation)**.

Tidak ada takedown yang 100% instan di dunia nyata. Oleh karena itu, sistem kita harus mengakomodasi pembaruan status secara manual oleh analis SOC (Security Operations Center) internal yang mengawal kasus tersebut.

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Anda **DILARANG KERAS** membuat desain, warna, atau komponen baru. Gunakan kembali (reuse) komponen Shadcn UI yang ada. Pastikan desain tetap berada pada jalur **Premium Cyberpunk 2077** (gelap, neon border, hud style) dan konsisten dengan halaman lainnya.

---

### 1. Update Skema Database (Backend - MongoDB)
**Tugas Backend (`action-mitigation-service`):**
- Modifikasi skema `TakedownRequest` untuk mendukung status Enterprise yang realistis.
  - Ubah `status` Enum menjadi: `SUBMITTED`, `IN_REVIEW`, `ESCALATED_VIP`, `SUCCESSFUL`, `REJECTED`.
- Tambahkan field `analystLogs` (Array of Objects) untuk menyimpan jejak audit intervensi manusia (berisi `analystId`/`name`, `timestamp`, `note`, `previousStatus`, `newStatus`).

### 2. API Endpoint untuk Analis SOC (Backend)
**Tugas Backend:**
- Buatkan endpoint PATCH `/api/takedown/:id/status` khusus untuk tim internal.
- Endpoint ini menerima payload `status` baru dan `note` (catatan manual mengapa status diubah, misal: "Menunggu balasan tim Meta", atau "Menggunakan jalur prioritas VIP Registrar"). Log ini otomatis ditambahkan ke `analystLogs`.

### 3. Pembaruan Datatable (Frontend)
**Tugas Frontend:**
- Update komponen Datatable Takedown yang sudah ada.
- Buatkan variasi **Badge (Shadcn)** dengan warna khas Cyberpunk untuk status baru:
  - `SUBMITTED`: Kuning Neon / Amber (Laporan terkirim via sistem).
  - `IN_REVIEW`: Biru Neon (Sedang di-follow up).
  - `ESCALATED_VIP`: Ungu/Pink Neon (Jalur VIP/Hukum).
  - `SUCCESSFUL`: Hijau Neon (Akun target berhasil dihapus).
  - `REJECTED`: Merah Darah / Abu-abu gelap.

### 4. UI Analyst Command Center / Takedown Detail (Frontend)
**Tugas Frontend:**
- Buatkan komponen **Sheet (Shadcn UI)** bernama "Takedown Analyst View" (muncul dari samping layar saat baris di Datatable diklik).
- **Isi UI Sheet:**
  1. Ringkasan intelijen: URL target, Entitas yang diserang, dan *Evidence* (Bukti).
  2. **Audit & Log Timeline:** Tampilkan riwayat `analystLogs` dengan gaya UI terminal *hacker* (teks *monospace*, struktur linear).
  3. **Form Intervensi Manual:** Dropdown Shadcn untuk mengubah status takedown, dan Textarea bagi analis untuk memasukkan catatan progres. Tombol "Update Status" dengan efek transisi *hover* standar aplikasi kita.

---
**Tugas Anda (Claude):**
Tuliskan kode untuk pembaruan Schema Mongoose, Endpoint Controller Node.js, dan Komponen UI Next.js secara rapi. Pastikan Anda memeriksa ulang class Tailwind agar 100% patuh pada Standarisasi UI proyek ini!
