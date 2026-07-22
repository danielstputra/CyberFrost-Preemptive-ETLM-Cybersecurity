# Prompt Penambahan Status DRAFT pada Takedown Module
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Tujuan:**
Kita sedang membangun platform keamanan siber sekelas CYFIRMA DeCYFIR. Pada pembaruan sebelumnya, kita membuat fitur *Automated Legal Drafting*. Namun, kita melewatkan satu status operasional yang sangat krusial: **DRAFT**. 
- **Tujuan Saat Ini:** Menambahkan status `DRAFT` ke dalam siklus hidup (*lifecycle*) pelaporan Takedown. Sebelum email dikirim (`SUBMITTED`), laporan hukum yang sudah di-*generate* harus bisa disimpan di *database* sebagai draf agar pekerjaan analis tidak hilang.

**🚨 INSTRUKSI SUPER PENTING (UI/UX STANDARDIZATION) 🚨**
Tetap patuhi aturan ketat UI Cyberpunk kita. Gunakan ulang komponen Shadcn UI yang ada.

---

### 1. Update Skema Database (Backend - MongoDB)
**Tugas Backend (`action-mitigation-service`):**
- Tambahkan status `DRAFT` ke dalam Enum `status` di skema `TakedownRequest`. (Urutan siklus logis: `DRAFT` -> `SUBMITTED` -> `IN_REVIEW` -> `ESCALATED_VIP` -> `SUCCESSFUL`/`REJECTED`).
- Tambahkan *field* `draftContent` (String) untuk menyimpan teks draf email/hukum sementara agar tidak hilang jika analis menutup *tab browser* atau aplikasi mati.

### 2. Update Endpoint Draft (Backend)
**Tugas Backend (Node.js):**
- Modifikasi endpoint `/api/takedown/:id/generate-draft`. Saat dipanggil, selain merespons dengan teks draf Handlebars/AI, endpoint ini harus meng-update `status` menjadi `DRAFT` dan menyimpan teks tersebut ke *field* `draftContent`.
- Buat atau sesuaikan endpoint PATCH `/api/takedown/:id/draft` untuk melakukan fungsi *Save* manual/otomatis atas perubahan teks yang diketik oleh analis sebelum dikirim.

### 3. Pembaruan UI & Datatable (Frontend)
**Tugas Frontend (Next.js App Router):**
- **Update Datatable:** Tambahkan variasi **Badge (Shadcn)** untuk status `DRAFT` (gunakan warna netral seperti abu-abu redup / putih transparan / *muted color* agar terlihat seperti *Work in Progress* yang belum dieksekusi).
- **Takedown Analyst View (Sheet):** Jika status data adalah `DRAFT`, otomatis tampilkan `<Textarea>` yang berisi `draftContent` dari *database*, beserta dua tombol: 
  1. **"💾 Save Draft"** (Gunakan *Outline button* atau *Ghost button* standar proyek kita).
  2. **"🚀 Approve & Send"** (*Primary button* dengan efek *glowing* yang akan menembak rute dispatch email).

---
**Tugas Anda (Claude):**
Tuliskan kode untuk memperbarui Enum Mongoose, modifikasi Controller Node.js, dan pembaruan Komponen Frontend ini. Pastikan *state management* (React Query / Zustand) di-handle dengan baik agar teks yang sedang diedit oleh analis tidak hilang saat me-render ulang!
