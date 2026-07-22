# Prompt Automasi Legal Template & Email Dispatcher (Human-in-the-Loop)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform keamanan siber sekelas CYFIRMA DeCYFIR. Sebelumnya kita telah merancang alur *Takedown* dengan sistem *Human-in-the-Loop* dan telah memiliki draf template hukum (*Legal Notice* untuk *Impersonation*). 
- **Tujuan Saat Ini:** Mengotomatisasi pembuatan (generate) dokumen hukum ini berdasarkan data dari *database*, menampilkannya ke Analis SOC untuk di- *review/edit* di Frontend, lalu mengirimkannya via Email menggunakan Backend.

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Anda **DILARANG KERAS** membuat desain, warna, atau komponen baru yang keluar dari standarisasi proyek ini! Gunakan kembali komponen Shadcn UI (Textarea, Dialog, Button). Pastikan area *preview* dokumen hukum menggunakan *font monospace* agar terlihat seperti teks di dalam terminal.

---

### 1. Backend: Legal Template Engine (`action-mitigation-service`)
**Tugas Backend (Node.js):**
- Berikan instruksi instalasi untuk `nodemailer` dan `handlebars` (sebagai *template engine*).
- Buat sebuah fungsi *helper/utility* (misal: `generateLegalDraft`) yang menerima data *takedown* (nama target, url, bukti) dan mengisinya ke dalam *template* HTML/Text "Notice of Impersonation & Trademark Infringement" menggunakan Handlebars.
- Buat endpoint POST `/api/takedown/:id/generate-draft` yang merespons dengan teks *draft* hukum tersebut tanpa mengirimkannya dulu.
- Buat endpoint POST `/api/takedown/:id/dispatch-email` yang menerima teks final dari Frontend, lalu mengirimkannya via Nodemailer ke alamat tujuan (misal `abuse@platform.com`) beserta *attachment* buktinya.

### 2. Frontend: UI Legal Draft Preview & Editor
**Tugas Frontend (Next.js App Router):**
- Di dalam komponen `Takedown Analyst View` (Sheet) yang sudah ada, tambahkan tombol **"📝 Generate Legal Draft"**.
- Ketika tombol diklik, *fetch* data dari endpoint `/generate-draft` dan buka sebuah **Dialog/Modal (Shadcn UI)**.
- **Isi Dialog Preview:**
  - Tampilkan *draft* email yang di- *generate* di dalam sebuah komponen `<Textarea>` Shadcn berukuran besar (agar Analis bisa mengedit/menyesuaikan kata-kata sebelum dikirim).
  - Gunakan *font monospace* (class `font-mono`) pada *Textarea* tersebut dengan latar belakang hitam pekat dan teks berwarna *cyan* atau *green* (Cyberpunk Terminal Style).
  - Sediakan *input field* untuk email tujuan ("To") dan ("CC").
- Tambahkan tombol **"🚀 Approve & Send Legal Notice"** dengan efek *glowing* standar kita yang akan menembak endpoint `/dispatch-email`.

### 3. Integrasi Log Analis (Audit Trail)
**Tugas Backend & Frontend:**
- Ketika email berhasil dikirim, pastikan sistem otomatis menambahkan log ke dalam `analystLogs` di *database* (misal: "Legal Notice sent successfully to abuse@platform.com") dan mengubah status *Takedown* menjadi `SUBMITTED` atau `ESCALATED_VIP`.

---
**Tugas Anda (Claude):**
Tuliskan kode untuk konfigurasi Nodemailer/Handlebars di Backend, Controller endpoint, dan pembaruan komponen UI di Frontend. Pastikan kodenya modular, aman (tambahkan error handling untuk email gagal terkirim), dan 100% mematuhi gaya visual proyek kita!
