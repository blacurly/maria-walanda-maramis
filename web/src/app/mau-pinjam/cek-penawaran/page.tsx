import type { Metadata } from "next";
import CekPenawaran from "@/components/fitur/cek-penawaran/CekPenawaran";


export const metadata: Metadata = {
  title: "Cek Penawaran – EduPuan",
  description:
    "Periksa biaya penawaran pinjaman terhadap batas OJK dan kemampuan bayarmu sebelum memutuskan meminjam.",
};

export default async function CekPenawaranPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;

  return (
    <div>
      <CekPenawaran modeDemo={demo === "1"} />
    </div>
  );
}