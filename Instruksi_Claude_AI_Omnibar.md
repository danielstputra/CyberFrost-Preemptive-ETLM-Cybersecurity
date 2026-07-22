# Prompt Implementasi AI & Semantic Search Omnibar (Enterprise Level)
*Silakan unggah file ini ke Claude sebagai instruksi panduan (Backend & Frontend).*

***

**Konteks Proyek & Arsitektur:**
Kita sedang mengembangkan platform keamanan siber sekelas CYFIRMA DeCYFIR. 
- **Backend Stack:** Node.js, Microservices, MongoDB (Mongoose), REST API.
- **Frontend Stack:** Next.js App Router, Tailwind CSS (Strict Cyberpunk Theme), Shadcn UI, Zustand, React Query.
- **Tujuan Saat Ini:** Mengintegrasikan **Google Gemini API** untuk mewujudkan 2 fitur utama kelas *Enterprise*: (1) AI-Powered Threat Summaries & Attack Scenarios, dan (2) Omnibar Global Search berbasis *Semantic/Vector Search*.

**INSTRUKSI UTAMA:**
Tolong berikan panduan komprehensif beserta *source code* modular untuk merealisasikan kedua fitur ini tanpa mengganggu sistem yang sudah berjalan.

### Bagian 1: AI Threat Summarizer & Attack Scenario (`ai-service`)
**Tugas Backend:**
1. Berikan perintah instalasi SDK resmi Google Gemini (`@google/generative-ai`) di *service* Node.js.
2. Buat *controller* POST `/api/ai/analyze-threat`. Endpoint ini menerima payload data mentah (misal: JSON berisi temuan *vulnerability* atau *dark web leak*).
3. Buat *System Prompt* (instruksi AI) agar Gemini bertindak sebagai Analis Intelijen Keamanan Siber Senior. AI harus merangkum data tersebut dan mengembalikan *output* berformat JSON dengan struktur: `summary`, `attack_scenario`, dan `mitigation_steps`.

**Tugas Frontend:**
4. Buatkan komponen UI `AIThreatAnalyst.tsx` (Bisa berupa Card atau Sheet dari Shadcn).
5. Gunakan `framer-motion` untuk membuat animasi *typewriter* (efek teks diketik otomatis huruf per huruf seolah-olah terminal AI sedang *scanning*) saat hasil dari `/api/ai/analyze-threat` ditampilkan.

### Bagian 2: Omnibar Global Search (Semantic Search)
Untuk mendapatkan pencarian "Kelas Dunia", kita tidak akan menggunakan pencarian teks biasa, melainkan pencarian berbasis Vektor (AI mengerti konteks kalimat).

**Tugas Backend (`investigation-service`):**
1. Buatkan fungsi utilitas Node.js untuk mengubah teks kueri pengguna menjadi representasi angka (*Vector Embeddings*) menggunakan model `text-embedding-004` dari Google Gemini.
2. Buatkan *controller* GET `/api/search/omnibar?q=...`. 
3. Berikan contoh integrasi *query* MongoDB (*Aggregation Pipeline*) khusus untuk **MongoDB Atlas Vector Search** (menggunakan `$vectorSearch`) untuk mencari kecocokan semantik di koleksi *Threats* atau *Assets*. Jika data kosong, AI harus fallback ke *regex text search* biasa.

**Tugas Frontend:**
4. Implementasikan komponen `Omnibar.tsx` menggunakan komponen **Command** (`cmdk`) dari Shadcn UI.
5. Buat logika *shortcut* *keyboard* `Ctrl+K` (atau `Cmd+K`) untuk memunculkan modal pencarian ini.
6. Buat fitur *debounce* (misal 300ms) pada *input* pencarian agar API tidak di-*spam* setiap kali user mengetik.
7. Pastikan UI Omnibar mengikuti **Standar Cyberpunk**: latar belakang gelap transparan (backdrop-blur), garis tepi (*border*) tipis berwarna *cyan* atau *kuning neon*, dan *font monospace* (hud style).

Tolong berikan kode dengan sangat rapi, *Production-Ready*, dan perhatikan penanganan error (*Error Handling*) saat koneksi ke API Gemini gagal!
