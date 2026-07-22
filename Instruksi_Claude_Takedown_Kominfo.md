# Prompt Integrasi Takedown Kominfo (Trust+ Positif Indonesia)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform keamanan siber sekelas CYFIRMA DeCYFIR. Modul Takedown kita sudah memiliki fitur *Human-in-the-Loop* dan *Automated Legal Drafting*. 
- **Tujuan Saat Ini:** Menambahkan rute pelaporan lokal (Indonesia) yang secara spesifik ditujukan ke **Kementerian Kominfo (Aduan Konten / Trust+ Positif)** via email `aduankonten@kominfo.go.id`. Ini adalah fitur esensial untuk mitigasi situs *phishing* atau judi *online* berskala nasional (Pemblokiran Level ISP).

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Anda **DILARANG KERAS** membuat desain, warna, atau komponen baru. Gunakan kembali komponen Shadcn UI yang ada (Dialog, Select, Button, Textarea, Badge). Pastikan UI tetap mematuhi tema **Premium Cyberpunk 2077**.

---

### 1. Update Skema Database (Backend - MongoDB)
**Tugas Backend (`action-mitigation-service`):**
- Pada skema `TakedownRequest`, tambahkan `KOMINFO_TRUST_POSITIF` ke dalam daftar Enum untuk *field* `platform` atau buat *field* baru bernama `routingTarget`.
- Tambahkan opsi jenis ancaman yang spesifik untuk konteks lokal jika perlu (misal: `JUDI_ONLINE`, `PHISHING_BANK_LOKAL`, `PENIPUAN_TRANSAKSI`).

### 2. Legal Template Engine Khusus Kominfo (Backend)
**Tugas Backend (Node.js):**
- Buatkan satu fungsi tambahan di dalam *helper* Handlebars Anda untuk men- *generate* draf email **berbahasa Indonesia formal**.
- **Struktur Draf Email ke Kominfo:**
  - Tujuan: `aduankonten@kominfo.go.id`
  - Subjek: `[Pelaporan Ancaman Siber] Permohonan Pemblokiran Situs - [Jenis Ancaman]`
  - Isi: Menyebutkan identitas pengirim (sebagai tim SOC perusahaan), URL target, deskripsi ancaman (mengapa melanggar UU ITE), dan referensi lampiran bukti *screenshot*.
- Pastikan endpoint `/api/takedown/:id/dispatch-email` mampu mendeteksi jika targetnya adalah `KOMINFO_TRUST_POSITIF`, maka email akan diarahkan ke alamat Kominfo tersebut.

### 3. Pembaruan Form UI & Analyst View (Frontend)
**Tugas Frontend (Next.js App Router):**
- Di dalam form pembuatan Takedown (atau saat Analis melakukan *generate draft*), tambahkan opsi **"Route to: Kominfo (Trust+ Positif)"** pada komponen `<Select>` Shadcn.
- Jika opsi Kominfo dipilih, pastikan komponen *preview* `<Textarea>` (yang menggunakan *font monospace* gaya terminal) menampilkan draf dalam **Bahasa Indonesia**.
- Tambahkan **Badge (Shadcn)** khusus di *Datatable* untuk kasus yang dilimpahkan ke Kominfo (misalnya menggunakan warna Merah-Putih *neon* atau Merah *Solid* bergaya Cyberpunk) agar Analis dengan mudah mengenali kasus lokal.

### 4. Audit Trail (Log)
**Tugas Backend & Frontend:**
- Saat email sukses terkirim ke `aduankonten@kominfo.go.id`, catat di `analystLogs` dengan pesan yang jelas (misal: `[SYSTEM] Escalated to Kominfo Trust+ via aduankonten@kominfo.go.id`).

---
**Tugas Anda (Claude):**
Tuliskan kode untuk penambahan rute pelaporan Kominfo ini, mencakup modifikasi Enum, pembuatan template Handlebars Bahasa Indonesia, dan penyesuaian logika di Frontend. Pastikan kodenya rapi, modular, dan mematuhi standarisasi UI Cyberpunk kita secara ketat!
