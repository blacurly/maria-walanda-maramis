// HALAMAN UJI SEMENTARA: membuktikan Next.js bisa membaca database Supabase.
import { supabase } from "@/lib/supabase/publik";

export const dynamic = "force-dynamic"; // selalu ambil data terbaru setiap halaman dibuka

export default async function CekDatabasePage() {
  const { data, error } = await supabase
    .from("pinjol")
    .select("nama, nama_perusahaan, status, sumber")
    .order("nama")
    .limit(5);

  const legal = await supabase.from("pinjol").select("*", { count: "exact", head: true }).eq("status", "legal");
  const ilegal = await supabase.from("pinjol").select("*", { count: "exact", head: true }).eq("status", "ilegal");

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="mb-2 text-xl font-bold text-red-600">Gagal terhubung ke database</h1>
        <p className="text-sm text-gray-600">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-2xl font-bold">✅ Terhubung ke Supabase</h1>
      <p className="mb-6 text-sm text-gray-500">Data di bawah ini dibaca langsung dari database, bukan dari file .ts</p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">Pinjol legal</p>
          <p className="text-2xl font-bold text-emerald-800">{legal.count ?? "?"}</p>
        </div>
        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-xs text-red-700">Pinjol ilegal</p>
          <p className="text-2xl font-bold text-red-800">{ilegal.count ?? "?"}</p>
        </div>
      </div>

      <p className="mb-2 text-sm font-semibold">5 data pertama (urut abjad):</p>
      <ul className="space-y-2">
        {data?.map((p) => (
          <li key={p.nama + p.status} className="rounded-lg border border-gray-100 bg-white px-4 py-2 text-sm">
            <b>{p.nama}</b> · {p.nama_perusahaan ?? "—"} ·{" "}
            <span className={p.status === "legal" ? "text-emerald-700" : "text-red-700"}>{p.status}</span>
            <span className="block text-xs text-gray-400">Sumber: {p.sumber}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}