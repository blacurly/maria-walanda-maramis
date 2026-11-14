import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Poppins } from "next/font/google";
import { labelTopik } from "@/data/artikel";
import { ambilArtikel, semuaArtikel } from "@/lib/artikel/layanan";

const poppins = Poppins({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-poppins" });
const POPPINS = { fontFamily: "var(--font-poppins), sans-serif" };

type Props = { params: Promise<{ slug: string }> };

// Ambil ulang dari database paling lama setiap 1 jam (dan langsung, setelah admin mengubah artikel lewat API)
export const revalidate = 3600;

// Siapkan halaman artikel yang sudah terbit sejak awal. Artikel baru tetap bisa dibuka (dibuat saat pertama diminta).
export async function generateStaticParams() {
  const { artikel } = await semuaArtikel();
  return artikel.map((a) => ({ slug: a.slug }));
}

// Judul tab dan deskripsi mengikuti artikelnya
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await ambilArtikel(slug);
  if (!a) return { title: "Artikel tidak ditemukan – EduPuan" };
  return { title: `${a.judul} – EduPuan`, description: a.ringkasan };
}

export default async function ArtikelPage({ params }: Props) {
  const { slug } = await params;
  const a = await ambilArtikel(slug);
  if (!a) notFound();

  // 3 artikel lain: utamakan yang topiknya sama
  const { artikel: semua } = await semuaArtikel();
  const lainnya = [
    ...semua.filter((x) => x.slug !== a.slug && x.topik === a.topik),
    ...semua.filter((x) => x.slug !== a.slug && x.topik !== a.topik),
  ].slice(0, 3);

  return (
    <main className={`${poppins.variable} mx-auto max-w-2xl px-5 pb-20 pt-8`}>
      <Link href="/edukasi" className="mb-6 inline-block text-sm font-semibold text-[#0d6e4b] hover:underline">
        ← Semua artikel
      </Link>

      {/* ── Kepala artikel ── */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-[#0d6e4b]">{a.kategori}</span>
        <span className="text-gray-400">
          {a.topikLabel ?? labelTopik(a.topik)} · {a.menit} menit baca · Diperbarui {a.diperbarui}
        </span>
      </div>
      <h1 className="mb-3 text-3xl font-extrabold leading-tight text-gray-900" style={POPPINS}>
        {a.judul}
      </h1>
      <p className="mb-6 text-gray-500">{a.ringkasan}</p>

      <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
        <Image src={a.gambar} alt="" fill priority sizes="(min-width: 672px) 672px, 100vw" className="object-cover" />
      </div>

      {/* ── Isi ── */}
      <article className="space-y-8">
        {a.bagian.map((b) => (
          <section key={b.judul}>
            <h2 className="mb-3 text-xl font-bold text-gray-900" style={POPPINS}>
              {b.judul}
            </h2>
            {b.paragraf?.map((p) => (
              <p key={p} className="mb-3 leading-relaxed text-gray-700">
                {p}
              </p>
            ))}
            {b.daftar && (
              <ul className="list-disc space-y-2 pl-5 leading-relaxed text-gray-700 marker:text-[#0d6e4b]">
                {b.daftar.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      {a.catatan && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          <strong>Penting:</strong> {a.catatan}
        </div>
      )}

      {/* ── Ajakan ke fitur terkait ── */}
      {a.fitur && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-900">Coba fitur terkait</p>
          <Link href={a.fitur.href} className="rounded-xl bg-[#0d6e4b] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
            {a.fitur.label} →
          </Link>
        </div>
      )}

      {/* ── Dasar hukum & sumber ── */}
      {a.dasarHukum.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-bold text-gray-900">Dasar hukum</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-600">
            {a.dasarHukum.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {a.sumber.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-gray-900">Sumber</h2>
          <ul className="space-y-1.5 text-sm">
            {a.sumber.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#0d6e4b] hover:underline">
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-400">
        Artikel ini bersifat edukasi, bukan nasihat hukum. Untuk kasusmu, konsultasikan dengan lembaga bantuan hukum.
      </p>

      {/* ── Artikel lainnya ── */}
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-bold text-gray-900" style={POPPINS}>
          Baca juga
        </h2>
        <div className="grid gap-3">
          {lainnya.map((x) => (
            <Link
              key={x.slug}
              href={`/edukasi/${x.slug}`}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-emerald-200"
            >
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image src={x.gambar} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-gray-900">{x.judul}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {x.topikLabel ?? labelTopik(x.topik)} · {x.menit} menit baca
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}