import { NextResponse } from "next/server";

// Meneruskan penilaian "Apakah jawaban ini membantu?" ke server Puan AI.
// ANONIM: hanya nilai (1 / -1) + label topik/situasi/status. Tidak ada isi pertanyaan atau jawaban.
// Kunci rahasia Supabase hanya ada di server Puan; web cukup memakai PUAN_API_KEY.

const STATUS_SAH = ["pasal", "butuh_dana", "di_luar_topik", "tidak_ada_pasal"];
const POLA_LABEL = /^[a-z_]{1,40}$/;

function galat(pesan: string, status: number) {
  return NextResponse.json({ ok: false, detail: pesan }, { status });
}

export async function POST(req: Request) {
  const alamat = process.env.PUAN_API_URL;
  const kunci = process.env.PUAN_API_KEY;
  if (!alamat || !kunci) return galat("Layanan belum siap.", 500);

  let isi: Record<string, unknown>;
  try {
    isi = await req.json();
  } catch {
    return galat("Format tidak dikenali.", 400);
  }

  const { nilai, topik, situasi, status } = isi;
  const sah =
    (nilai === 1 || nilai === -1) &&
    typeof topik === "string" && POLA_LABEL.test(topik) &&
    typeof situasi === "string" && POLA_LABEL.test(situasi) &&
    typeof status === "string" && STATUS_SAH.includes(status);
  if (!sah) return galat("Data umpan balik tidak valid.", 422);

  try {
    const r = await fetch(`${alamat}/umpan-balik`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Puan-Key": kunci },
      body: JSON.stringify({ nilai, topik, situasi, status }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: r.ok && data.ok === true });
  } catch (e) {
    console.error("Gagal mengirim umpan balik:", e);
    return galat("Umpan balik belum terkirim.", 503);
  }
}