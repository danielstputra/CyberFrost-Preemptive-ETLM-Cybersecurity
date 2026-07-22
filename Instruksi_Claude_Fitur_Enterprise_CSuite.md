# Prompt Upgrade Fitur C-Suite & Enterprise (TPRM, SSO, War Room)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Arsitektur Saat Ini:**
Kita sedang membangun platform keamanan siber sekelas CYFIRMA DeCYFIR. 
- **Backend Stack:** Node.js, Microservices. **PENTING:** `auth-service` menggunakan PostgreSQL + Prisma. Layanan lainnya (`discovery`, `intelligence`, `osint`, `ai`, `action`) menggunakan MongoDB + Mongoose.
- **Frontend Stack:** Next.js App Router, Tailwind CSS, Shadcn UI, Zustand, React Query, Socket.io-client.
- **Tema Desain (Strict):** Premium Cyberpunk 2077 (Gelap, *neon glow*, *glitch effects*, *angled edges*). **DILARANG** merusak standarisasi UI (Card, Datatable, Button) yang sudah ada.

**Tujuan Saat Ini:**
Saya ingin mengimplementasikan 5 fitur "Killer" kelas Enterprise (C-Suite & SOC). Tolong berikan kode dan panduan langkah demi langkah untuk setiap poin di bawah ini tanpa merusak fitur atau layanan yang sudah berjalan.

---

### 1. Third-Party & Supply Chain Risk Management (TPRM)
**Tugas Backend (`osint-service` atau `discovery-service` - MongoDB):**
- Buatkan skema Mongoose `Vendor` (menyimpan nama vendor, domain, dan `tenantId` klien).
- Buatkan relasi atau skema `VendorRisk` untuk melacak temuan Dark Web/Vulnerability spesifik milik vendor.
**Tugas Frontend:**
- Buatkan halaman `/app/dashboard/tprm/page.tsx` dengan Datatable Shadcn standar kita untuk mengelola daftar Vendor dan status risiko mereka (Aman/Peringatan Dini).

### 2. Attack Path Visualizer (Graph Node UI)
**Tugas Frontend:**
- Berikan perintah instalasi **React Flow** (`@xyflow/react`).
- Buatkan komponen `AttackPathGraph.tsx`. Tampilkan visualisasi *node* (misal: Phishing Domain -> Credential Leak -> Target Server).
- **Wajib UI Cyberpunk:** Desain *node* tersebut agar bercahaya (neon cyan/merah), berlatar gelap, dan memiliki garis koneksi (*edges*) yang beranimasi seperti aliran data.

### 3. Enterprise SSO & Immutable Audit Trail
**Tugas Backend (`auth-service` - PostgreSQL + Prisma):**
- **Update Prisma Schema:** Tambahkan model `AuditLog` (action, userId, timestamp, ipAddress, details) yang sifatnya *append-only* (immutable). Tambahkan konfigurasi SSO (SAML/OAuth) di model `Tenant` atau `User`.
- Buatkan *middleware* atau *helper* fungsi untuk mencatat setiap aktivitas (misal: pencarian Omnibar, eksekusi Takedown) ke dalam tabel `AuditLog`.
**Tugas Frontend:**
- Update UI halaman Login untuk memiliki tombol "Login with Enterprise SSO (Azure AD / Okta)".

### 4. SOC War Room (Real-time Collaboration)
**Tugas Backend (`notification-service` - Socket.io):**
- Buat *event handlers* Socket.io untuk `join_war_room`, `send_message`, dan `upload_evidence`.
**Tugas Frontend:**
- Buatkan halaman/komponen `/app/dashboard/war-room/[incidentId]/page.tsx`.
- Desain UI *chat* waktu-nyata gaya terminal *hacker* tempat analis bisa berdiskusi, *drag-and-drop* gambar (*screenshot* bukti log), dan menandai status insiden.

### 5. Automated Compliance Mapping
**Tugas Backend (`ai-service`):**
- Update *System Prompt* Gemini AI yang sudah kita buat sebelumnya.
- Instruksikan AI agar pada saat memberikan *threat summary*, AI juga **wajib** memetakan kerentanan (CVE) tersebut ke standar regulasi (misalnya pelanggaran ISO-27001 Pasal X, atau GDPR/HIPAA).
**Tugas Frontend:**
- Tampilkan hasil *Compliance Mapping* ini di dalam UI *AI Threat Analyst* atau detail kerentanan menggunakan komponen **Badge** Shadcn yang bercahaya neon.

---
**Tugas Anda (Claude):**
Berikan kodenya secara modular, mulai dari *Schema Database*, *Backend Controllers*, hingga *Frontend Components*. Pastikan seluruh instruksi instalasi (*npm/pnpm*) disertakan!
