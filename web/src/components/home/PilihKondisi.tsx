import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import "./pilih-kondisi.css";

const KARTU = [
  {
    no: "01",
    href: "/mau-pinjam",
    gambar: "/ilustrasi/kartu-mau-pinjam.png",
    alt: "Mau pinjam",
    judul: "Mau pinjam",
    deskripsi: "Cek biaya nyata, pahami risikonya, dan lihat alternatif sebelum tanda tangan.",
    aksi: "Mulai sekarang →",
    warna: { aksen: "#2563a9", latar: "#f2f7ff", garis: "#c7dafa", bayang: "rgba(0,0,0,.10)" },
  },
  {
    no: "02",
    href: "/sudah-terjerat",
    gambar: "/ilustrasi/kartu-sudah-terjerat.png",
    alt: "Sudah terjerat",
    judul: "Sudah terjerat",
    deskripsi: "Pahami kondisi, cari solusi, dan dapatkan langkah yang bisa kamu lakukan.",
    aksi: "Lihat panduan →",
    warna: { aksen: "#dc2626", latar: "#fff5f5", garis: "#fecaca", bayang: "rgba(239,68,68,.12)" },
  },
  {
    no: "03",
    href: "/bingung-mulai",
    gambar: "/ilustrasi/kartu-bingung-mulai.png",
    alt: "Bingung mulai dari mana",
    judul: "Bingung mulai\ndari mana?",
    deskripsi: "Ceritakan situasimu, Kami akan membantumu mengarahkan ke langkah selanjutnya.",
    aksi: "Ceritakan sekarang →",
    warna: { aksen: "#7c3aed", latar: "#faf5ff", garis: "#e9d5ff", bayang: "rgba(124,58,237,.10)" },
  },
];

export default function PilihKondisi() {
  return (
    <section id="mulai-dari-sini" className="ep-kondisi">
      <div className="wrap">
        <div className="head">
          <p className="eyebrow">Mulai dari sini</p>
          <h2>Apa yang paling sesuai dengan kondisimu sekarang?</h2>
          <p className="sub">Pilih situasimu, dan kami akan memberikan panduan yang tepat untukmu.</p>
        </div>

        <div className="grid">
          {KARTU.map((k) => (
            <Link
              key={k.no}
              href={k.href}
              className="ep-kartu"
              style={
                {
                  "--aksen": k.warna.aksen,
                  "--latar": k.warna.latar,
                  "--garis": k.warna.garis,
                  "--bayang": k.warna.bayang,
                } as CSSProperties
              }
            >
              <div className="ilus">
                <Image src={k.gambar} alt={k.alt} width={110} height={110} />
              </div>
              <div className="isi">
                <div className="no">{k.no}</div>
                <div className="judul">{k.judul}</div>
                <div className="desk">{k.deskripsi}</div>
                <div className="aksi">
                  <span className="aksi-teks">{k.aksi}</span>
                  <span className="panah" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}