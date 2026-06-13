# Utama POS

Point of Sale berbasis web (PWA) untuk toko jam **Utama Arloji**. Dibangun dengan React + TypeScript + Vite + Supabase.

Aplikasi mendukung pencatatan produk, transaksi penjualan dengan harga nego, stock opname berbasis barcode, dan laporan pendapatan — dengan dua peran: **Owner** dan **Kasir**.

---

## Teknologi

| Lapisan | Pilihan |
|---|---|
| UI | React 18 + Vite + TypeScript |
| Styling | CSS Modules + design tokens |
| State | Redux Toolkit + RTK Query |
| Routing | React Router v6 |
| Backend | Supabase (Postgres, Auth, RLS) |
| Barcode | @zxing/browser (kamera) |
| PWA | vite-plugin-pwa (installable, offline shell) |

---

## Langkah Setup

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan project Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel seluruh isi `supabase/migrations/001_initial_schema.sql`, lalu jalankan. Ini membuat 7 tabel, RLS policy, trigger, dan dua fungsi RPC (`record_transaction`, `scan_opname_item`).

### 3. Buat akun user

Auth ditangani Supabase, tapi role disimpan di tabel `public.users`. Untuk tiap user:

1. **Authentication → Users → Add user** (isi email + password).
2. Salin UUID user yang baru dibuat.
3. Di SQL Editor, jalankan (sesuaikan role `owner` / `cashier`):

```sql
insert into public.users (user_id, role_id, email)
values (
  '<uuid-dari-auth-users>',
  (select role_id from public.roles where role_name = 'owner'),
  'owner@utamaarloji.com'
);
```

### 4. Isi environment variable

```bash
cp .env.example .env
```

Isi `.env` dengan kredensial dari **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 5. Jalankan

```bash
npm run dev      # mode pengembangan
npm run build    # build produksi
npm run preview  # pratinjau hasil build
npm test         # unit test
```

---

## Hak Akses per Peran

| Fitur | Owner | Kasir |
|---|:---:|:---:|
| Login | ✅ | ✅ |
| Lihat produk | ✅ | ✅ |
| Tambah/edit/hapus produk | ✅ | — |
| Catat transaksi | ✅ | ✅ |
| Lihat omzet di beranda | ✅ | — |
| Riwayat transaksi (semua) | ✅ | — |
| Laporan pendapatan | ✅ | — |
| Stock opname & rekonsiliasi | ✅ | — |

Pembatasan ini ditegakkan di dua lapis: routing (`ProtectedRoute`) di frontend, dan **Row Level Security** di Supabase.

---

## Catatan Penting

- **Barcode butuh HTTPS.** Akses kamera hanya jalan di `localhost` atau domain HTTPS. Saat deploy (mis. Vercel), ini otomatis terpenuhi.
- **Satu barcode = satu model.** Stok dihitung sebagai jumlah unit (`available_stock`), bukan per nomor seri unik.
- **Harga nego.** Harga jual bebas diisi; jika di bawah harga pokok, muncul peringatan tapi transaksi tetap bisa disimpan.
- **Stock opname** memakai pola batch: scan barcode yang sama berkali-kali akan menambah hitungan, bukan membuat baris baru. Laporan rekonsiliasi membandingkan stok sistem vs. hasil scan fisik.

---

## Struktur Folder

```
src/
├── components/      # UI reusable (Button, Input, Scanner, Layout, ...)
├── features/        # Logika per domain + RTK Query API
│   ├── auth/        # login, session, slice
│   ├── brands/      # merk
│   ├── products/    # CRUD produk
│   ├── transactions/# pencatatan transaksi (RPC)
│   ├── stockOpname/ # sesi opname + rekonsiliasi
│   ├── reports/     # laporan pendapatan
│   └── ui/          # toast state
├── pages/           # Halaman per rute
├── lib/             # store, api base, supabase client, hooks
├── utils/           # format Rupiah, tanggal, kalkulasi
├── styles/          # design tokens + global
└── router/          # definisi rute
```
