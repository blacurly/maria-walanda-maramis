// Penghubung ke Supabase KHUSUS SERVER, memakai kunci SECRET.
// Kunci secret melewati Row Level Security, jadi HANYA boleh dipakai di Route Handler / Server Action
// untuk MENULIS data (tambah, ubah, hapus) setelah izin admin dicek.
// Untuk MEMBACA data publik, tetap pakai lib/supabase/publik.ts (tunduk pada RLS).
//
// Aman dari browser: SUPABASE_SECRET_KEY tidak diawali NEXT_PUBLIC_, jadi Next.js tidak pernah
// mengirimkannya ke browser. Kalau file ini tidak sengaja dipakai di komponen client, nilainya kosong.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let klien: SupabaseClient | null = null;

// Mengembalikan null kalau pengaturan server belum lengkap, supaya route bisa membalas 500 yang jelas.
export function supabaseServer(): SupabaseClient | null {
  if (klien) return klien;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.SUPABASE_SECRET_KEY;
  if (!url || !kunci) return null;
  klien = createClient(url, kunci, { auth: { persistSession: false, autoRefreshToken: false } });
  return klien;
}
