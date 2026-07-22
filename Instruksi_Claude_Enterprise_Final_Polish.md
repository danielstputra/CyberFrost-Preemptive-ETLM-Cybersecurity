# Prompt Implementasi Fitur Pamungkas Enterprise (Final Polish)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform keamanan siber B2B sekelas CYFIRMA DeCYFIR. Aplikasi ini sudah memiliki fitur intelijen AI, otomatisasi Takedown, dan arsitektur Multi-Tenancy (RBAC). 
- **Tujuan Saat Ini:** Mengimplementasikan fitur "Killer" kelas Enterprise untuk melengkapi ekosistem platform, yaitu: **Board-Ready PDF Reports**, **SIEM/ITSM Integrations**, dan **Data Masking (UU PDP/GDPR Compliance)**.

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Anda **DILARANG KERAS** membuat elemen desain baru! Patuhi standarisasi Shadcn UI (Card, Button, Input, Switch, Badge) dan tema **Premium Cyberpunk 2077** (Dark mode, neon glow, monospace accents).

---

### 1. Board-Ready PDF Reports (Automated Executive Reporting)
**Tugas Backend (`notification-service` atau service baru `report-service`):**
- Berikan instruksi instalasi `puppeteer` (atau library PDF generator yang relevan).
- Buat sebuah endpoint POST `/api/reports/generate` yang bertugas mengambil data ringkasan ancaman (berdasarkan `tenantId`) dan merendernya menjadi file PDF beresolusi tinggi.
- Desain *template* HTML internal untuk PDF ini harus terlihat sangat profesional (seperti laporan eksekutif majalah) dengan logo perusahaan/tenant.
**Tugas Frontend:**
- Di dalam halaman Executive Dashboard, tambahkan komponen tombol **"📄 Export Executive Report"** (Gunakan *primary button* Shadcn dengan icon). Tombol ini akan mengunduh PDF secara langsung.

### 2. SIEM & ITSM Integrations (Jira & Webhook Hub)
**Tugas Backend (`action-mitigation-service`):**
- Buat skema database/Prisma `TenantIntegration` yang menyimpan konfigurasi API Key pihak ketiga (misalnya: Jira API Token, Splunk Webhook URL). Enkripsi API Key ini sebelum disimpan!
- Buat *helper* / fungsi `dispatchToSIEM(alertData, tenantId)` yang secara otomatis menembak *Webhook* pihak ketiga jika *Tenant* tersebut menyalakan integrasinya.
**Tugas Frontend:**
- Buatkan halaman `/app/dashboard/admin/integrations/page.tsx`.
- Desain UI **Integration Hub** menggunakan susunan *Card* Shadcn (Grid). Tampilkan logo Jira, ServiceNow, Splunk, dan Custom Webhook.
- Setiap *Card* memiliki tombol **"Configure"** yang membuka *Dialog/Modal* untuk memasukkan API Key dan URL.

### 3. Data Masking & UU PDP Compliance (Privasi Data)
**Tugas Backend (`osint-service` & `ai-service`):**
- Di fungsi pencarian *Dark Web Leak* (kebocoran data), implementasikan utilitas *Regex Masking*. 
- Secara otomatis menyensor Nomor Induk Kependudukan (NIK), Kartu Kredit, atau Email sebelum dikirim ke UI. (Contoh: `johndoe@gmail.com` menjadi `joh****@gmail.com`, `327101...` menjadi `3271********`).
**Tugas Frontend:**
- Pada *Datatable* yang menampilkan kebocoran data (*Data Leaks*), pastikan data yang tampil sudah tersensor.
- Berikan **Badge** kecil berwarna hijau/cyan dengan tulisan "PII Masked" atau "UU PDP Compliant" di sudut tabel tersebut untuk meyakinkan CISO bahwa platform ini aman secara regulasi.

---
**Tugas Anda (Claude):**
Tuliskan kode untuk ketiga fitur di atas secara modular. Pastikan fungsionalitas Backend (terutama Puppeteer dan Integrasi Webhook) memiliki *Error Handling* yang tangguh, dan UI di Frontend tetap 100% Cyberpunk!
