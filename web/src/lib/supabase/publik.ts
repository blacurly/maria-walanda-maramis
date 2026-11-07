// Penghubung ke database Supabase untuk data PUBLIK (contoh: daftar pinjol).
// Memakai publishable key, sehingga hanya bisa melakukan hal yang diizinkan Row Level Security.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunci = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !kunci) {
  throw new Error("Alamat atau kunci Supabase belum diisi di .env.local");
}

export const supabase = createClient(url, kunci);