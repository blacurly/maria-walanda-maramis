import { NextResponse } from "next/server";

// Jembatan antara browser dan server Puan AI (FastAPI).
// Browser hanya memanggil /api/chat; alamat dan kunci FastAPI tetap rahasia di server Next.js.

type Pesan = { peran: "user" | "puan"; teks: string };

const BATAS_PESAN = 2000; // sama dengan batas di FastAPI
const BATAS_RIWAYAT = 20; // jumlah pesan sebelumnya yang ikut dikirim
const BATAS_WAKTU_MS = 45_000; // kalau Puan tidak menjawab dalam 45 detik, berhenti menunggu

function galat(pesan: string, status: number) {
  return NextResponse.json({ detail: pesan }, { status });
}

function bersihkanRiwayat(riwayat: unknown): Pesan[] {
  if (!Array.isArray(riwayat)) return [];
  return riwayat
    .filter(
      (m): m is Pesan =>
        typeof m === "object" &&
        m !== null &&
        (m.peran === "user" || m.peran === "puan") &&
        typeof m.teks === "string" &&
        m.teks.trim() !== "",
    )
    .slice(-BATAS_RIWAYAT)
    .map((m) => ({ peran: m.peran, teks: m.teks.slice(0, 4000) }));
}

export async function POST(req: Request) {
  const alamat = process.env.PUAN_API_URL;
  const kunci = process.env.PUAN_API_KEY;
  if (!alamat || !kunci) {
    console.error("PUAN_API_URL atau PUAN_API_KEY belum diisi di .env.local");
    return galat("Puan AI belum siap. Coba lagi nanti ya.", 500);
  }

  let isi: { pesan?: unknown; riwayat?: unknown };
  try {
    isi = await req.json();
  } catch {
    return galat("Format pesan tidak dikenali.", 400);
  }

  const pesan = typeof isi.pesan === "string" ? isi.pesan.trim() : "";
  if (!pesan) return galat("Pesan tidak boleh kosong.", 422);
  if (pesan.length > BATAS_PESAN) {
    return galat(`Pesanmu terlalu panjang. Coba ringkas jadi maksimal ${BATAS_PESAN} huruf ya.`, 422);
  }

  try {
    const r = await fetch(`${alamat}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Puan-Key": kunci },
      body: JSON.stringify({ pesan, riwayat: bersihkanRiwayat(isi.riwayat) }),
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      if (r.status === 401) {
        // kunci di .env.local tidak sama dengan PUAN_API_KEY di server FastAPI
        console.error("Kunci Puan AI ditolak oleh FastAPI (cek PUAN_API_KEY).");
        return galat("Puan AI belum siap. Coba lagi nanti ya.", 500);
      }
      const detail = typeof data.detail === "string" ? data.detail : "Maaf, ada gangguan. Coba lagi sebentar lagi ya.";
      return galat(detail, r.status);
    }

    // Hanya kirim yang dipakai tampilan. Daftar "sumber" tidak ditampilkan karena bisa menyesatkan
    // (dasar hukum yang benar-benar dipakai sudah ditulis Puan di baris "Dasar aturannya").
    return NextResponse.json({ jawaban: data.jawaban, status: data.status, krisis: data.krisis === true });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      return galat("Puan butuh waktu terlalu lama untuk menjawab. Coba kirim lagi ya.", 504);
    }
    console.error("Gagal menghubungi Puan AI:", e);
    return galat("Puan AI belum bisa dihubungi. Coba lagi sebentar lagi ya.", 503);
  }
}