# Prompt Implementasi SOAR: Integrasi ITSM Kominfo
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang mengembangkan fitur "One-Click SOAR" pada platform Threat Intelligence B2B kita. Target integrasi pertama kita adalah pelaporan otomatis ke Kementerian Kominfo (Pemerintah Indonesia) via email `aduankonten@kominfo.go.id`. 
- **Tujuan Saat Ini:** Membangun utilitas *Backend* yang memformat email (*payload*) agar lolos dari *Spam Filter* dan mudah dibaca oleh sistem tiket (ITSM) pemerintah, serta menghubungkannya dengan tombol eksekusi di *Frontend*.

**🚨 PERINGATAN KERAS SOAL UI/UX (WAJIB DIPATUHI) 🚨**
Anda DILARANG KERAS membuat elemen desain baru! Patuhi standarisasi Shadcn UI. Pertahankan tema Premium Cyberpunk 2077.

---

### 1. Backend: Kominfo Email Dispatcher (`action-mitigation-service`)
**Tugas Backend (Node.js/Express):**
- Instal dan gunakan `nodemailer`. (Gunakan konfigurasi SMTP standar atau *mock* untuk *development*).
- Buat *helper* khusus: `services/kominfoDispatcher.ts`.
- **Logika Pemformatan Email (Sangat Krusial):**
  - **Subject:** Wajib mengikuti format `[LAPORAN {Kategori Ancaman}] {Nama Klien/Entitas} - Segera Tindak Lanjut`. (Contoh: `[LAPORAN PHISHING] Peniruan Merek Bank Mandiri - Segera Tindak Lanjut`).
  - **Body (HTML/Text):** Gunakan *template* string atau Handlebars yang memuat 5W1H secara kaku dan formal:
    - Kategori Pelanggaran
    - URL Target (Format *plain text*, DILARANG di-*hyperlink* secara terselubung untuk menghindari deteksi *spam*)
    - Penjelasan / Konteks Hukum Singkat (misal: "Situs ini melanggar UU ITE terkait penipuan/phishing...")
  - **Attachments:** Logika pengambilan file PDF/Screenshot hasil dari `report-service`. *Penting:* Tambahkan validasi ukuran file maksimal 5MB sebelum dikirim. Jika lebih dari 5MB, kompres atau tolak pengiriman.

### 2. Update Endpoint SOAR
**Tugas Backend:**
- Perbarui *endpoint* `POST /api/takedown/:id/execute-one-click` yang sudah dibuat sebelumnya.
- Jika `payload.platform === 'KOMINFO'`, panggil fungsi `kominfoDispatcher` di atas. 
- Berikan respons JSON sukses lengkap dengan *timestamp* pengiriman untuk dicatat ke `analystLogs`.

### 3. Frontend: Integrasi UI One-Click Kominfo
**Tugas Frontend:**
- Pastikan tombol **"⚡ Auto-Execute Takedown"** di komponen `Takedown Analyst View` memanggil *endpoint* di atas dengan membawa platform "KOMINFO".
- Tampilkan notifikasi (Shadcn Toast): *"Report successfully dispatched to Kominfo ITSM"* setelah API merespons dengan status 200.

---
**Tugas Anda (Claude):**
Buatkan struktur kode *Backend* (Node.js/Nodemailer) yang fokus pada pemformatan email legal dan batas ukuran *attachment* 5MB. Setelah itu pastikan fungsi pemanggilan API di *Frontend* Next.js berjalan sinkron dengan *loading state* yang mulus.
