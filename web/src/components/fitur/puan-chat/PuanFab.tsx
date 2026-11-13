"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { nilaiJawabanPuan } from "@/lib/puan/aksi";

// Tombol "Tanya Puan AI" + jendela chat yang melayang di pojok kanan bawah semua halaman.
// Tampilan mengikuti prototype EduPuan; isinya tersambung ke /api/chat (Puan AI).
// Percakapan disimpan sementara di sessionStorage: bertahan saat halaman di-refresh,
// otomatis terhapus saat tab ditutup. Tidak dikirim atau disimpan di database EduPuan.

// topik/situasi/status = label anonim dari Puan; nilai = penilaian user (1 membantu, -1 belum membantu)
type Pesan = {
  peran: "user" | "puan";
  teks: string;
  krisis?: boolean;
  topik?: string;
  situasi?: string;
  status?: string;
  nilai?: 1 | -1;
};

const BATAS_PESAN = 2000;
const TINGGI_MIN = 40;
const TINGGI_MAKS = 136;
const KUNCI_SIMPAN = "edupuan.puan.percakapan.v1";
const MAKS_DISIMPAN = 40; // pesan terakhir yang disimpan di tab ini

// Membaca percakapan dari sessionStorage dan memastikan isinya berbentuk benar
function bacaTersimpan(): Pesan[] {
  try {
    const mentah = sessionStorage.getItem(KUNCI_SIMPAN);
    if (!mentah) return [];
    const data: unknown = JSON.parse(mentah);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (p): p is Pesan =>
          typeof p === "object" && p !== null &&
          (p.peran === "user" || p.peran === "puan") && typeof p.teks === "string",
      )
      .map((p) => ({
        peran: p.peran,
        teks: p.teks.slice(0, 8000),
        krisis: p.krisis === true,
        topik: typeof p.topik === "string" ? p.topik : undefined,
        situasi: typeof p.situasi === "string" ? p.situasi : undefined,
        status: typeof p.status === "string" ? p.status : undefined,
        nilai: p.nilai === 1 || p.nilai === -1 ? p.nilai : undefined,
      }))
      .slice(-MAKS_DISIMPAN);
  } catch {
    return []; // sessionStorage tidak tersedia (mis. mode privat tertentu): chat tetap jalan tanpa disimpan
  }
}

const SAPAAN =
  "Halo! 👋 Aku Puan, asisten EduPuan. Kamu bisa cerita atau tanya soal pinjaman online: penagihan, data pribadi, biaya, atau ke mana harus melapor. Aku jawab berdasarkan aturan OJK dan UU Pelindungan Data Pribadi.";

const PILIHAN_CEPAT = [
  "DC nagih ke kantor aku, boleh gak?",
  "Data kontakku disebar penagih, lapor ke mana?",
  "Bunga pinjol maksimal berapa per hari?",
  "Aku butuh uang cepat, harus gimana?",
];

// Fitur EduPuan yang bisa disarankan Puan. "kata" = cara Puan menyebutnya di jawaban.
const FITUR = [
  { nama: "Cek Legalitas Pinjol", href: "/mau-pinjam/cek-legalitas", kata: ["cek legalitas"] },
  { nama: "Cek Penawaran", href: "/mau-pinjam/cek-penawaran", kata: ["cek penawaran"] },
  { nama: "Cari Alternatif", href: "/mau-pinjam/cari-alternatif", kata: ["cari alternatif"] },
  { nama: "Rangkum Semua Utang", href: "/sudah-terjerat/rangkum-utang", kata: ["rangkum semua utang", "rangkum utang"] },
  { nama: "Hak Saat Ditagih", href: "/sudah-terjerat/hak-saat-ditagih", kata: ["hak saat ditagih"] },
  { nama: "Analisis Pesan Penagih", href: "/sudah-terjerat/analisis-pesan", kata: ["analisis pesan"] },
  { nama: "Dokumentasi & Lapor", href: "/sudah-terjerat/dokumentasi-lapor", kata: ["dokumentasi & lapor", "dokumentasi dan lapor"] },
  { nama: "Beritahu Keluarga", href: "/sudah-terjerat/beritahu-keluarga", kata: ["beritahu keluarga"] },
];

// Mencari fitur yang disebut di jawaban Puan (maksimal 3, sesuai urutan kemunculan)
function fiturDisebut(teks: string) {
  const t = teks.toLowerCase();
  return FITUR.map((f) => ({ f, posisi: Math.min(...f.kata.map((k) => (t.includes(k) ? t.indexOf(k) : Infinity))) }))
    .filter((x) => x.posisi !== Infinity)
    .sort((a, b) => a.posisi - b.posisi)
    .slice(0, 3)
    .map((x) => x.f);
}

// Kontak lembaga yang bisa disarankan Puan. "pola" = cara Puan menyebutnya di jawaban.
const KONTAK = [
  { label: "📞 Telepon OJK 157", href: "tel:157", pola: /kontak ojk 157|ojk 157|telepon 157|kontak 157/ },
  { label: "💬 WhatsApp OJK", href: "https://wa.me/6281157157157", pola: /081-157-157-157|whatsapp ojk|wa ojk/ },
  { label: "✉️ Email OJK", href: "mailto:konsumen@ojk.go.id", pola: /konsumen@ojk\.go\.id/ },
  { label: "✉️ Email Satgas PASTI", href: "mailto:satgaspasti@ojk.go.id", pola: /satgaspasti@ojk\.go\.id|satgas pasti/ },
  { label: "🚓 Telepon Polisi 110", href: "tel:110", pola: /polisi/ },
];

// Mencari kontak yang disebut di jawaban Puan (maksimal 5, sesuai urutan di daftar)
function kontakDisebut(teks: string) {
  const t = teks.toLowerCase();
  return KONTAK.filter((k) => k.pola.test(t)).slice(0, 5);
}

// Mengubah **tebal** jadi <strong> dan `kode` jadi teks biasa, tanpa memakai HTML mentah (lebih aman)
function tebal(baris: string): ReactNode[] {
  return baris.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((bagian, i) => {
    if (bagian.startsWith("**") && bagian.endsWith("**")) return <strong key={i}>{bagian.slice(2, -2)}</strong>;
    if (bagian.startsWith("`") && bagian.endsWith("`")) return <span key={i} className="font-medium">{bagian.slice(1, -1)}</span>;
    return bagian;
  });
}

function IsiJawaban({ teks }: { teks: string }) {
  return (
    <>
      {teks.split("\n").map((b, i) => {
        if (!b.trim()) return <div key={i} className="h-1.5" />;
        if (b.startsWith("Dasar aturannya:")) {
          return (
            <p key={i} className="mt-1.5 border-t border-gray-200 pt-1.5 text-[11px] text-gray-500">
              {b}
            </p>
          );
        }
        return <p key={i}>{tebal(b)}</p>;
      })}
    </>
  );
}

function KartuKrisis() {
  return (
    <div role="alert" className="max-w-[85%] rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-900">
      <p className="font-bold">Kamu tidak sendirian. Ada yang siap mendengarkan sekarang.</p>
      <p className="mt-1">
        Hubungi <strong>Healing119</strong> (Kemenkes): telepon{" "}
        <a href="tel:119" className="font-bold underline">
          119
        </a>
        , lalu pilih ekstensi <strong>8</strong>, atau buka{" "}
        <a href="https://www.healing119.id" target="_blank" rel="noopener noreferrer" className="underline">
          healing119.id
        </a>
        .
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <a href="tel:119" className="rounded-full bg-red-600 px-3 py-1 font-bold text-white">
          📞 Telepon Healing119
        </a>
        <a href="tel:112" className="rounded-full border border-red-600 bg-white px-3 py-1 font-bold text-red-700">
          🚑 Darurat 112
        </a>
      </div>
      <p className="mt-2">
        Kalau kamu dalam bahaya saat ini, hubungi{" "}
        <a href="tel:112" className="font-bold underline">
          112
        </a>{" "}
        atau datang ke IGD terdekat.
      </p>
    </div>
  );
}

function Avatar({ kelas }: { kelas: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-full bg-white ${kelas}`}>
      <Image src="/puan-avatar.jpg" alt="" width={84} height={84} className="h-full w-full object-cover" />
    </span>
  );
}

export default function PuanFab() {
  const [buka, setBuka] = useState(false);
  const [daftar, setDaftar] = useState<Pesan[]>([]);
  const [ketikan, setKetikan] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesanGagal, setPesanGagal] = useState<string | null>(null);
  const [detik, setDetik] = useState(0);
  const [siap, setSiap] = useState(false); // true setelah percakapan tersimpan selesai dibaca
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  const daftarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Saat pertama dimuat: ambil percakapan yang tersimpan di tab ini
  useEffect(() => {
    setDaftar(bacaTersimpan());
    setSiap(true);
  }, []);

  // Setiap percakapan berubah: simpan ke tab ini (atau hapus kalau kosong)
  useEffect(() => {
    if (!siap) return;
    try {
      if (daftar.length) sessionStorage.setItem(KUNCI_SIMPAN, JSON.stringify(daftar.slice(-MAKS_DISIMPAN)));
      else sessionStorage.removeItem(KUNCI_SIMPAN);
    } catch {
      // penyimpanan penuh atau diblokir: abaikan, chat tetap berjalan
    }
  }, [daftar, siap]);

  function hapusPercakapan() {
    setDaftar([]);
    setGalat(null);
    setPesanGagal(null);
    setKonfirmasiHapus(false);
    try {
      sessionStorage.removeItem(KUNCI_SIMPAN);
    } catch {}
  }

  // "Apakah jawaban ini membantu?": hanya nilai + label yang dikirim, tanpa isi chat.
  // Dikirim lewat SERVER ACTION nilaiJawabanPuan (lib/puan/aksi.ts), bukan fetch ke URL API.
  // Tombol langsung berubah jadi ucapan terima kasih; kalau pengiriman gagal, pengguna tidak diganggu.
  function nilaiJawaban(indeks: number, nilai: 1 | -1) {
    const p = daftar[indeks];
    if (!p || p.peran !== "puan" || p.nilai || !p.topik || !p.situasi || !p.status) return;
    setDaftar((d) => d.map((m, i) => (i === indeks ? { ...m, nilai } : m)));
    nilaiJawabanPuan({ nilai, topik: p.topik, situasi: p.situasi, status: p.status }).catch(() => {});
  }

  // Fokus ke kolom ketik saat jendela dibuka
  useEffect(() => {
    if (buka) setTimeout(() => inputRef.current?.focus(), 100);
  }, [buka]);

  // Gulir ke pesan terbaru
  useEffect(() => {
    const el = daftarRef.current;
    if (buka && el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [daftar, memuat, galat, buka]);

  // Menghitung lama menunggu jawaban, untuk mengganti teks "sedang menyiapkan"
  useEffect(() => {
    if (!memuat) return;
    const jam = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(jam);
  }, [memuat]);

  // Kolom ketik membesar mengikuti isi (1 baris sampai ±6 baris)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = `${TINGGI_MIN}px`;
    const tinggi = Math.min(Math.max(el.scrollHeight, TINGGI_MIN), TINGGI_MAKS);
    el.style.height = `${tinggi}px`;
    el.style.overflowY = el.scrollHeight > TINGGI_MAKS ? "auto" : "hidden";
  }, [ketikan, buka]);

  async function kirim(teks: string) {
    const pesan = teks.trim();
    if (!pesan || memuat) return;
    if (pesan.length > BATAS_PESAN) {
      setGalat(`Pesanmu terlalu panjang. Maksimal ${BATAS_PESAN} huruf ya.`);
      return;
    }

    const riwayat = daftar.map(({ peran, teks }) => ({ peran, teks }));
    setDaftar((d) => [...d, { peran: "user", teks: pesan }]);
    setKetikan("");
    setGalat(null);
    setPesanGagal(null);
    setDetik(0);
    setMemuat(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan, riwayat }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Maaf, ada gangguan. Coba lagi ya.");
      setDaftar((d) => [
        ...d,
        {
          peran: "puan",
          teks: String(data.jawaban ?? ""),
          krisis: data.krisis === true,
          topik: typeof data.topik === "string" ? data.topik : undefined,
          situasi: typeof data.situasi === "string" ? data.situasi : undefined,
          status: typeof data.status === "string" ? data.status : undefined,
        },
      ]);
    } catch (e) {
      // Pesan user dikeluarkan lagi supaya riwayat tetap rapi, lalu bisa dikirim ulang
      setDaftar((d) => d.slice(0, -1));
      setPesanGagal(pesan);
      setGalat(e instanceof Error ? e.message : "Puan AI belum bisa dihubungi. Coba lagi ya.");
    } finally {
      setMemuat(false);
    }
  }

  return (
    <>
      {buka && (
        <section
          aria-label="Chat Tanya Puan AI"
          className="fixed bottom-[90px] right-7 z-[999] flex max-h-[min(520px,calc(100dvh-214px))] w-[360px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(0,0,0,.18),0_4px_16px_rgba(0,0,0,.10)] max-md:bottom-[76px] max-md:left-4 max-md:right-4 max-md:w-auto max-md:max-w-none max-md:max-h-[calc(100dvh-172px)]"
        >
          {/* Kepala */}
          <header className="flex shrink-0 items-center gap-2.5 bg-[#0d6e4b] px-4 py-3.5">
            <Avatar kelas="h-9 w-9" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">Tanya Puan AI</p>
              <p className="text-[11px] text-white/75">Asisten literasi pinjaman online EduPuan</p>
            </div>
            {daftar.length > 0 && (
              <button
                type="button"
                onClick={() => setKonfirmasiHapus(true)}
                disabled={memuat}
                aria-label="Hapus percakapan"
                title="Hapus percakapan"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm text-white disabled:opacity-40"
              >
                🗑
              </button>
            )}
            <button
              type="button"
              onClick={() => setBuka(false)}
              aria-label="Tutup chat"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm text-white"
            >
              ✕
            </button>
          </header>

          {/* Konfirmasi hapus percakapan */}
          {konfirmasiHapus && (
            <div role="alertdialog" aria-label="Konfirmasi hapus percakapan" className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-900">
              <p className="font-semibold">Hapus semua percakapan di tab ini?</p>
              <p className="mt-0.5 text-red-800/80">Percakapan yang dihapus tidak bisa dikembalikan.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={hapusPercakapan} className="rounded-full bg-red-600 px-3 py-1 font-bold text-white">
                  Ya, hapus
                </button>
                <button type="button" onClick={() => setKonfirmasiHapus(false)} className="rounded-full border border-red-300 bg-white px-3 py-1 font-bold text-red-700">
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Daftar pesan */}
          <div ref={daftarRef} aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pt-3.5">
            <div className="flex flex-col items-start gap-1.5">
              <div className="max-w-[85%] rounded-[16px_16px_16px_4px] bg-gray-100 px-[13px] py-[9px] text-[13px] leading-normal text-gray-900">
                {SAPAAN}
              </div>
              {siap && daftar.length === 0 && (
                <div className="flex max-w-[90%] flex-wrap gap-1.5">
                  {PILIHAN_CEPAT.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => kirim(p)}
                      className="rounded-full border-[1.5px] border-[#0d6e4b] bg-white px-[11px] py-[5px] text-left text-xs font-semibold text-[#0d6e4b] transition-colors hover:bg-[#0d6e4b] hover:text-white"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {daftar.map((p, i) =>
              p.peran === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[16px_16px_4px_16px] bg-[#0d6e4b] px-[13px] py-[9px] text-[13px] leading-normal text-white">
                    {p.teks}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex flex-col items-start gap-1.5">
                  {p.krisis && <KartuKrisis />}
                  <div className="max-w-[85%] rounded-[16px_16px_16px_4px] bg-gray-100 px-[13px] py-[9px] text-[13px] leading-normal text-gray-900 [overflow-wrap:anywhere]">
                    <IsiJawaban teks={p.teks} />
                  </div>
                  {!p.krisis && p.topik && p.situasi && p.status && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      {p.nilai ? (
                        <span>Terima kasih atas masukanmu.</span>
                      ) : (
                        <>
                          <span>Apakah jawaban ini membantu?</span>
                          <button
                            type="button"
                            onClick={() => nilaiJawaban(i, 1)}
                            aria-label="Ya, membantu"
                            title="Membantu"
                            className="rounded-full border border-gray-200 bg-white px-2 py-0.5 hover:border-[#0d6e4b]"
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            onClick={() => nilaiJawaban(i, -1)}
                            aria-label="Belum membantu"
                            title="Belum membantu"
                            className="rounded-full border border-gray-200 bg-white px-2 py-0.5 hover:border-[#0d6e4b]"
                          >
                            👎
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {!p.krisis && fiturDisebut(p.teks).length > 0 && (
                    <div className="flex max-w-[90%] flex-col gap-1.5">
                      <p className="text-[11px] font-semibold text-gray-500">Buka fitur yang disarankan:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {fiturDisebut(p.teks).map((f) => (
                          <Link
                            key={f.href}
                            href={f.href}
                            onClick={() => setBuka(false)}
                            className="rounded-full border-[1.5px] border-[#0d6e4b] bg-white px-[11px] py-[5px] text-xs font-semibold text-[#0d6e4b] transition-colors hover:bg-[#0d6e4b] hover:text-white"
                          >
                            {f.nama} →
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {!p.krisis && kontakDisebut(p.teks).length > 0 && (
                    <div className="flex max-w-[90%] flex-col gap-1.5">
                      <p className="text-[11px] font-semibold text-gray-500">Hubungi langsung:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {kontakDisebut(p.teks).map((k) => (
                          <a
                            key={k.href}
                            href={k.href}
                            target={k.href.startsWith("http") ? "_blank" : undefined}
                            rel={k.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="rounded-full border-[1.5px] border-[#0d6e4b] bg-[#ecfdf5] px-[11px] py-[5px] text-xs font-semibold text-[#0d6e4b] transition-colors hover:bg-[#0d6e4b] hover:text-white"
                          >
                            {k.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ),
            )}

            {memuat && (
              <div className="flex w-fit items-center gap-2 rounded-[16px_16px_16px_4px] bg-gray-100 px-[13px] py-[9px] text-[13px] text-gray-500">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0d6e4b] [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0d6e4b] [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0d6e4b]" />
                </span>
                {detik < 4
                  ? "Puan sedang membaca pesanmu"
                  : detik < 10
                    ? "Puan sedang mencari aturan yang relevan"
                    : "Sebentar lagi ya, jawabannya sedang disusun"}
              </div>
            )}

            {galat && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                <p>{galat}</p>
                {pesanGagal && (
                  <button type="button" onClick={() => kirim(pesanGagal)} className="mt-1.5 font-bold underline">
                    Kirim ulang
                  </button>
                )}
              </div>
            )}
            <div className="h-1 shrink-0" />
          </div>

          {/* Kolom ketik */}
          <div className="shrink-0 border-t border-gray-100 px-3 pb-2 pt-2.5">
            <div className="flex items-end gap-2">
              <label htmlFor="pesan-puan" className="sr-only">
                Tulis pesan untuk Puan
              </label>
              <textarea
                id="pesan-puan"
                ref={inputRef}
                rows={1}
                value={ketikan}
                maxLength={BATAS_PESAN}
                onChange={(e) => setKetikan(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    kirim(ketikan);
                  }
                }}
                placeholder="Ketik pertanyaanmu di sini..."
                className="h-10 min-w-0 flex-1 resize-none overflow-hidden [overflow-wrap:anywhere] rounded-xl border-[1.5px] border-gray-200 px-3 py-[9px] text-[13px] leading-5 outline-none focus:border-[#0d6e4b]"
              />
              <button
                type="button"
                onClick={() => kirim(ketikan)}
                disabled={memuat}
                aria-label="Kirim"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d6e4b] text-base text-white disabled:opacity-50"
              >
                ➤
              </button>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-gray-400">
              Edukasi, bukan nasihat hukum final. Jangan tulis nomor KTP, rekening, atau kata sandi. Pesan diproses
              layanan AI pihak ketiga (Google Gemini). Percakapan hanya tersimpan sementara di tab ini dan terhapus saat
              tab ditutup, tidak disimpan di server EduPuan.{" "}
              <Link href="/kebijakan-privasi" onClick={() => setBuka(false)} className="underline hover:text-[#0d6e4b]">
                Kebijakan Privasi
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Tombol melayang */}
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        aria-label={buka ? "Tutup chat Puan AI" : "Tanya Puan AI"}
        title={buka ? "Tutup chat" : "Tanya Puan AI"}
        className="fixed bottom-7 right-7 z-[1000] flex items-center gap-2.5 rounded-[56px] bg-[#0d6e4b] py-2.5 pl-2 pr-5 shadow-[0_8px_28px_rgba(13,110,75,0.40),0_2px_8px_rgba(0,0,0,.12)] transition-transform hover:scale-105 max-md:bottom-4 max-md:right-4 max-md:p-1.5"
      >
        <Avatar kelas="h-[42px] w-[42px] max-md:h-[44px] max-md:w-[44px]" />
        {/* Di HP hanya avatar yang tampil supaya tombol tidak menutupi isi halaman */}
        <span className="text-sm font-bold leading-none text-white max-md:sr-only">
          {buka ? "Tutup Chat" : "Tanya Puan AI"}
        </span>
      </button>
    </>
  );
}