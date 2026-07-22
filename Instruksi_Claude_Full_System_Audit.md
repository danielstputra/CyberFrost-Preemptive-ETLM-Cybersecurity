# Prompt Full System Audit & Code Review
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita telah merancang dan menulis berbagai modul untuk platform B2B Threat Intelligence (sekelas CYFIRMA). Arsitektur kita menggunakan pendekatan Microservices di Backend (Node.js/Express, MongoDB/PostgreSQL) dan Next.js App Router di Frontend.
- **Tujuan Saat Ini:** Melakukan "Code Review" dan "System Audit" menyeluruh terhadap semua kode, fungsi, dan layanan yang telah dibuat sejauh ini sebelum melangkah ke tahap *deployment* atau penambahan fitur baru.

**🚨 ATURAN AUDIT (WAJIB DIPATUHI) 🚨**
Anda **DILARANG** membuat fitur baru atau mengubah desain UI/UX secara sepihak. Fokus Anda 100% pada perbaikan bug, optimalisasi logika, dan memastikan semua modul terintegrasi dengan sempurna.

---

### 1. Fokus Audit Backend (Microservices)
**Tugas Analisis:**
- **Integrasi Antar Layanan:** Periksa apakah komunikasi antar modul (misal: `action-mitigation-service`, `osint-service`, `ai-service`, `auth-service`, `report-service`) sudah sinkron. Apakah *payload* yang dikirimkan satu layanan sesuai dengan yang diharapkan oleh layanan lain?
- **Keamanan & Otorisasi:** Pastikan validasi *Role-Based Access Control* (RBAC) dan sistem *Multi-Tenancy* (isolasi data antar klien berdasarkan `tenantId`) tidak bisa ditembus/di-bypass di setiap *endpoint*.
- **Error Handling & Resiliensi:** Cek apakah fungsi krusial (seperti pemanggilan Gemini AI, ekspor PDF Puppeteer, Nodemailer Kominfo, atau integrasi API pihak ketiga) sudah dibungkus dengan blok `try-catch` yang kuat dan *timeout fallback* agar *server* tidak *crash* jika pihak ketiga *down*.
- **Database Schema:** Evaluasi keselarasan struktur data antara Prisma (PostgreSQL untuk Auth) dan Mongoose (MongoDB untuk data intelijen).

### 2. Fokus Audit Frontend (Next.js & UI/UX)
**Tugas Analisis:**
- **Data Fetching & State:** Periksa efisiensi pemanggilan API dari Frontend. Pastikan *loading state* (spinner/disabled button) ditangani dengan benar pada aksi kritikal seperti "Auto-Execute Takedown" atau "Bulk Action".
- **Kepatuhan UI/UX:** Cek silang seluruh komponen. Pastikan tidak ada *class* Tailwind atau elemen desain yang melenceng dari standarisasi Shadcn UI dan tema Premium Cyberpunk 2077.
- **Keamanan Route (Middleware):** Pastikan halaman *Dashboard* benar-benar terproteksi dan me- *redirect* pengguna yang tidak memiliki akses atau sesi JWT yang valid.

---
**Tugas Anda (Claude):**
1. Baca dan analisis seluruh struktur file, kode, dan konteks yang telah kita buat di *workspace* ini.
2. JANGAN langsung menulis ulang semua kode. Sebagai gantinya, berikan saya **"Laporan Hasil Audit"** yang terstruktur dengan format:
   - 🔴 **Kritikal (Critical/Blocker):** Bug fatal, celah keamanan, atau *error* logika yang akan merusak sistem.
   - 🟡 **Peringatan (Warnings):** Kode yang kurang efisien, duplikasi, atau kurang validasi *error handling*.
   - 🟢 **Saran Optimalisasi (Best Practices):** Hal-hal yang bisa dirapikan (misal: ekstraksi komponen Frontend atau utilitas Backend).
3. Setelah menyajikan laporan tersebut, tunggu instruksi saya mengenai poin mana yang akan kita perbaiki terlebih dahulu.
