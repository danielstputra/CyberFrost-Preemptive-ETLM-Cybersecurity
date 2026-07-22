# Prompt Implementasi Core Threat Intelligence (EASM, MITRE, DRP, APT)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform keamanan siber B2B sekelas CYFIRMA DeCYFIR. Platform kita sudah memiliki ekosistem mitigasi yang matang, namun kita perlu melengkapinya dengan 4 pilar utama Intelijen Ancaman (*Threat Intelligence*) agar menjadi produk *Enterprise* paripurna.

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Anda **DILARANG KERAS** membuat elemen desain baru! Patuhi standarisasi Shadcn UI (Card, Button, Input, Switch, Badge, Table) dan tema **Premium Cyberpunk 2077** (Dark mode, neon glow, monospace accents).

---

### 1. Automated Attack Surface Discovery (EASM)
**Tugas Backend (`discovery-service` - MongoDB):**
- Buat *endpoint* POST `/api/discovery/scan` yang menerima 1 *Root Domain* dari klien (misal: `perusahaan.com`).
- Buat simulasi *background worker* (menggunakan Node.js `setTimeout` atau antrean `bullmq`) yang menyimulasikan pencarian aset otomatis (Subdomain, Open Ports, SSL Expiry) dari *root domain* tersebut.
**Tugas Frontend:**
- Buatkan halaman **Attack Surface** dengan tampilan UI yang memungkinkan klien hanya memasukkan satu domain utama, lalu sistem otomatis me-render *Datatable* berisi temuan subdomain dan *port* terbuka secara *real-time*.

### 2. MITRE ATT&CK Framework Mapping
**Tugas Backend (`ai-service`):**
- Perbarui *System Prompt* Gemini API di controller AI. 
- Wajibkan AI untuk mengekstrak dan memetakan setiap skenario serangan ke kode MITRE ATT&CK resmi (contoh: `T1566 - Phishing`, `T1190 - Exploit Public-Facing Application`).
**Tugas Frontend:**
- Di dalam halaman *Vulnerability Detail* atau *AI Threat Analyst*, buatkan komponen **MITRE Matrix** atau deretan **Shadcn Badges** dengan warna mencolok (*neon pink/cyan*) untuk menyoroti TTPs (*Tactics, Techniques, and Procedures*) yang digunakan peretas.

### 3. VIP / Executive Digital Risk Protection (DRP)
**Tugas Backend (`osint-service` - MongoDB):**
- Buat skema Mongoose `ExecutiveProfile` (menyimpan Nama, Jabatan, Email Pribadi, dan `tenantId`).
- Sesuaikan logika pencarian *Dark Web* agar secara konstan memonitor tereksposnya data pribadi para VIP ini.
**Tugas Frontend:**
- Buatkan UI **Executive Protection Dashboard**. Gunakan *Card* Shadcn untuk menampilkan profil VIP, status keamanan (Aman/Bocor), dan *Timeline* insiden jika kredensial mereka bocor di internet.

### 4. Threat Actor / APT Profiling
**Tugas Backend (`intelligence-service` - MongoDB):**
- Buat skema `ThreatActor` (menyimpan Nama Grup, Negara Asal, Motivasi, dan Target Industri).
**Tugas Frontend:**
- Buatkan halaman **Threat Actor Directory** (Ensiklopedia Hacker).
- Desain UI bergaya "Dossier / File Intelijen Rahasia" dengan tema *Cyberpunk*. Gunakan aksen *Red Neon* untuk grup peretas berskala negara (*State-Sponsored*). Hubungkan UI ini agar klien bisa melihat grup mana yang paling sering menyerang industri mereka.

---
**Tugas Anda (Claude):**
Kerjakan keempat fitur intelijen inti ini secara bertahap dan modular. Tuliskan kode *Schema* Database, *Controller* Node.js, dan komponen UI Next.js secara rapi. Pastikan *System Prompt* AI di backend benar-benar memaksa keluaran pemetaan MITRE ATT&CK berformat JSON!
