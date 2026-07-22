# Prompt Arsitektur RBAC & Multi-Tenancy (Enterprise Scale)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform keamanan siber B2B sekelas CYFIRMA DeCYFIR. Agar layak dijual ke perusahaan Enterprise, kita harus segera mengimplementasikan arsitektur **Multi-Tenancy** (Pemisahan data antar perusahaan klien) dan **Role-Based Access Control (RBAC)** yang kompleks.

**🚨 INSTRUKSI SUPER PENTING (UI/UX & DATABASE) 🚨**
1. `auth-service` **WAJIB** menggunakan **PostgreSQL + Prisma**. (Layanan lain tetap MongoDB).
2. Di Frontend, jangan merusak UI Cyberpunk kita. Standarisasi komponen wajib dipatuhi.

---

### 1. Desain Database Relasional (Backend - PostgreSQL & Prisma)
**Tugas Backend (`auth-service`):**
Buatkan file `schema.prisma` yang mendefinisikan relasi kuat untuk entitas berikut:
- **Tenant:** Mewakili satu entitas bisnis/klien (misal: Bank Mandiri, Telkomsel). Menyimpan info dasar dan batas langganan.
- **Role:** Enum atau Tabel untuk menyimpan Peran. Buat pembagian yang jelas:
  - *Internal (Tim Platform):* `SUPER_ADMIN`, `SOC_ANALYST`, `SOC_MANAGER`
  - *Eksternal (Klien):* `TENANT_ADMIN`, `SECURITY_OPERATOR`, `COMPLIANCE_OFFICER`, `EXECUTIVE`
- **User:** Terhubung ke *Tenant* (kecuali untuk Internal). Memiliki *Role*.
- **Permission/Capabilities (Opsional tapi disarankan):** Pemetaan spesifik tentang apa yang bisa dilakukan (misal: `CAN_REQUEST_TAKEDOWN`, `CAN_APPROVE_TAKEDOWN`).

### 2. Autentikasi & Middleware Pengamanan Akses (Backend)
**Tugas Backend (Node.js/Express):**
- Buatkan utilitas otorisasi yang akan disematkan pada setiap *endpoint* API. 
- Middleware harus memverifikasi token (JWT/Session) dan mengecek dua hal:
  1. Apakah *User* memiliki *Role* yang diizinkan untuk mengakses *endpoint* tersebut?
  2. **Isolasi Data (Penting):** Jika *User* adalah Eksternal, mereka HANYA BOLEH mengakses data (misal: Vulnerability, Takedown) yang memiliki `tenantId` yang sama dengan milik mereka.

### 3. Frontend Route Protection (Next.js App Router)
**Tugas Frontend:**
- Buatkan *Middleware* di Next.js (`middleware.ts`) yang memblokir akses ke halaman tertentu berdasarkan *Role*.
- Contoh: Halaman `/app/dashboard/admin/tenants` hanya untuk `SUPER_ADMIN`. Halaman Takedown Analyst View (untuk merespons/menyetujui *draft*) hanya untuk `SOC_ANALYST` atau `SOC_MANAGER`.

### 4. UI Penyesuaian Komponen Berdasarkan Role
**Tugas Frontend:**
- Buatkan komponen utilitas khusus, misalnya `<RoleGuard allowedRoles={['TENANT_ADMIN', 'SOC_MANAGER']}> ... </RoleGuard>`.
- Jika `SECURITY_OPERATOR` (Eksternal) login, tombol Takedown di Datatable tulisannya **"Request Takedown"**. Jika `SOC_ANALYST` (Internal) yang login, tombol berubah fungsi untuk me-review *draft* Takedown. Jika eksekutif (*View Only*) yang login, tombol aksi tersebut hilang (hidden) dari Datatable.

---
**Tugas Anda (Claude):**
Tuliskan draf `schema.prisma` dengan teliti, kode *Middleware* Node.js, Next.js Middleware, dan komponen pembungkus UI (`RoleGuard`) secara modular. Ingat, keamanan data antar *Tenant* (klien) adalah harga mati di proyek B2B!
