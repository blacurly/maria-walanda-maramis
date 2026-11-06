import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Fraunces } from "next/font/google";
import "./tentang.css";

const fraunces = Fraunces({ subsets: ["latin"], weight: "600", variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Tentang – EduPuan",
  description: "Kenapa EduPuan dibuat, misi kami, dan prinsip yang kami pegang.",
};

function Ikon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const Panah = () => (
  <Ikon>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Ikon>
);

const FAKTA = [
  "Informasinya ada, tapi tersebar dan sulit dipahami oleh orang yang sedang terdesak.",
  "Banyak yang malu bertanya ke keluarga atau tetangga karena takut dihakimi.",
  "Saat sudah terjerat, sering tidak tahu harus mulai dari mana dan melapor ke siapa.",
];

const MISI = [
  { k: "SEBELUM", judul: "Pahami dulu", isi: "Kenali risiko, hitung kemampuan bayar, dan pastikan pemberi pinjaman terdaftar resmi." },
  { k: "MENIMBANG", judul: "Lihat pilihan lain", isi: "Pinjol bukan satu-satunya jalan. Ada alternatif yang mungkin lebih aman untuk kondisimu." },
  { k: "SESUDAH", judul: "Tidak sendirian", isi: "Rangkum utang, kenali hakmu saat ditagih, dan tahu ke mana harus melapor." },
];

const ALAT = [
  {
    judul: "Cek Penawaran",
    href: "/mau-pinjam/cek-penawaran",
    isi: "Tempel tawaran pinjaman yang kamu terima. Kami bantu nilai apakah angkanya wajar, dan apakah kondisimu sanggup menanggungnya.",
    ikon: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M8 11h6M11 8v6" /></>),
  },
  {
    judul: "Cek Legalitas",
    href: "/mau-pinjam/cek-legalitas",
    isi: "Ketik nama aplikasi pinjol, lihat statusnya. Data dicocokkan berkala dengan daftar resmi OJK.",
    ikon: (<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>),
  },
  {
    judul: "Alternatif Solusi",
    href: "/mau-pinjam/cari-alternatif",
    isi: "Pilihan selain pinjol yang mungkin belum kamu pertimbangkan, sesuai kebutuhanmu.",
    ikon: (<><path d="M4 7h11M4 12h8M4 17h5" /><path d="M17 10l3 3-3 3" /></>),
  },
  {
    judul: "Rangkum Utang",
    href: "/sudah-terjerat/rangkum-utang",
    isi: "Sudah punya beberapa pinjaman? Catat semuanya di satu tempat dan lihat gambaran totalnya.",
    ikon: (<><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></>),
  },
  {
    judul: "Halaman Darurat",
    href: "/darurat",
    isi: "Panduan saat menghadapi penagihan yang kasar atau mengancam, beserta kontak resmi untuk melapor.",
    ikon: (<><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.01" /></>),
  },
  {
    judul: "Edukasi",
    href: "/edukasi",
    isi: "Artikel singkat tentang bunga, denda, hak peminjam, dan cara membaca perjanjian pinjaman.",
    ikon: (<><path d="M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0z" /><path d="M20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0z" /></>),
  },
];

const PRINSIP = [
  {
    judul: "Tanpa menghakimi",
    isi: "Siapa pun bisa terjerat utang. Di sini kamu belajar dan mencari jalan keluar tanpa disalahkan.",
    ikon: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  },
  {
    judul: "Data yang dicek ulang",
    isi: "Status legalitas dicocokkan berkala dengan daftar OJK, dan tanggal pembaruannya selalu kami tampilkan.",
    ikon: (<><path d="M20 11a8 8 0 0 0-14.6-4.5M4 13a8 8 0 0 0 14.6 4.5" /><path d="M5 3v4h4M19 21v-4h-4" /></>),
  },
  {
    judul: "Gratis, tanpa daftar",
    isi: "Semua fitur bisa dipakai langsung. Kami tidak meminta data pribadi untuk sekadar belajar.",
    ikon: (<><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M12 9v11M4 13h16M12 9c-2-4-6-3-5 0M12 9c2-4 6-3 5 0" /></>),
  },
  {
    judul: "AI sebagai pendamping",
    isi: "Puan AI membantu menjelaskan dan mengarahkan. Keputusan tetap ada di tanganmu.",
    ikon: <path d="M7 11V6a2 2 0 0 1 4 0v4M11 10V4a2 2 0 0 1 4 0v6M15 10V6a2 2 0 0 1 4 0v7a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-3-5a2 2 0 0 1 3-2l2 2" />,
  },
];

const MAKNA_LOGO = [
  {
    judul: "Kaca pembesar",
    isi: "Ajakan untuk memeriksa dulu sebelum memutuskan: cek penawaran dan cek legalitasnya.",
    ikon: (<><circle cx="10" cy="10" r="6" /><path d="M14.5 14.5L20 20" /></>),
  },
  {
    judul: "Perempuan",
    isi: "Kamu sebagai pusat cerita, digambarkan tenang dan percaya diri, bukan cemas.",
    ikon: (<><circle cx="12" cy="8" r="4" /><path d="M5 21c1-4 4-6 7-6s6 2 7 6" /></>),
  },
  {
    judul: "Daun yang tumbuh",
    isi: "Setelah paham, kamu bisa tumbuh dan pulih, termasuk keluar dari jeratan utang.",
    ikon: (<><path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14z" /><path d="M5 19l7-7" /></>),
  },
  {
    judul: "Kilau",
    isi: "Momen \"oh, ternyata begitu\" saat informasi yang rumit jadi jelas.",
    ikon: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18" />,
  },
];

export default function TentangPage() {
  return (
    <div className={`ep-tentang ${fraunces.variable}`}>
      {/* Hero */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">TENTANG EDUPUAN</span>
            <h1>
              Supaya keputusan soal uang tidak diambil <em>dalam keadaan panik.</em>
            </h1>
            <p className="lead">
              EduPuan hadir untuk meningkatkan pemahaman perempuan Indonesia tentang keuangan dan hukum,
              agar lebih siap mengambil keputusan finansial serta mengetahui hak dan perlindungan ketika
              menghadapi permasalahan pinjaman online.
            </p>
          </div>
          <div className="quote">
            <p>&ldquo;Kebutuhan mendesak itu nyata. Tapi kamu tetap berhak tahu apa yang kamu tanda tangani.&rdquo;</p>
            <small>Prinsip yang kami pegang saat membangun EduPuan</small>
          </div>
        </div>
      </header>

      {/* Kenapa kami ada */}
      <section>
        <div className="wrap why">
          <div>
            <span className="eyebrow">KENAPA KAMI ADA</span>
            <h2>Pinjaman bisa cair dalam hitungan menit. Penyesalannya bisa bertahun-tahun.</h2>
          </div>
          <div>
            <p>
              Banyak perempuan memegang keuangan rumah tangga, dan sering jadi orang pertama yang mencari dana
              saat ada kebutuhan mendadak: biaya sekolah anak, berobat, atau modal usaha.
            </p>
            <p>
              Di saat seperti itu, tawaran pinjaman yang <b>cepat dan tanpa syarat</b> terasa seperti
              pertolongan. Padahal di baliknya bisa ada bunga dan denda yang membengkak, akses ke kontak di HP,
              sampai penagihan yang mempermalukan.
            </p>
            <div className="facts">
              {FAKTA.map((f, i) => (
                <div key={i} className="fact">
                  <span className="n">{i + 1}</span>
                  <p>{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Misi */}
      <section className="tanpa-atas">
        <div className="wrap">
          <div className="mission">
            <span className="eyebrow">MISI KAMI</span>
            <h2>
              Membantu perempuan mengambil keputusan finansial yang lebih bijak dan memahami haknya ketika
              menghadapi masalah utang.
            </h2>
            <div className="mgrid">
              {MISI.map((m) => (
                <div key={m.k} className="m-card">
                  <div className="k">{m.k}</div>
                  <h4>{m.judul}</h4>
                  <p>{m.isi}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Alat */}
      <section className="tanpa-atas">
        <div className="wrap">
          <div className="head">
            <div>
              <span className="eyebrow">APA YANG BISA KAMU LAKUKAN</span>
              <h2>Alat sederhana untuk keputusan yang lebih tenang</h2>
            </div>
            <p className="lead" style={{ maxWidth: 380 }}>
              Semua bisa dipakai langsung dari browser, tanpa perlu memasang aplikasi.
            </p>
          </div>
          <div className="tgrid">
            {ALAT.map((a) => (
              <Link key={a.judul} href={a.href} className="tool">
                <span className="ti">
                  <Ikon>{a.ikon}</Ikon>
                </span>
                <h4>{a.judul}</h4>
                <p>{a.isi}</p>
              </Link>
            ))}
          </div>
          <div className="ai">
            <Image src="/ilustrasi/puan-avatar.png" width={56} height={56} alt="Puan AI" />
            <div>
              <h4>Puan AI, teman tanya yang tidak menghakimi</h4>
              <p>
                Bingung harus mulai dari mana? Ceritakan kondisimu, Puan AI akan menjelaskan dengan bahasa
                sederhana dan mengarahkan ke alat yang tepat.
              </p>
            </div>
            <Link href="/bingung-mulai" className="btn b3">
              Tanya Puan AI <Panah />
            </Link>
          </div>
        </div>
      </section>

      {/* Prinsip */}
      <section className="prinsip">
        <div className="wrap">
          <div className="head">
            <div>
              <span className="eyebrow">YANG KAMI PEGANG</span>
              <h2>Prinsip kami</h2>
            </div>
          </div>
          <div className="vgrid">
            {PRINSIP.map((p) => (
              <div key={p.judul} className="val">
                <span className="vi">
                  <Ikon>{p.ikon}</Ikon>
                </span>
                <div>
                  <h4>{p.judul}</h4>
                  <p>{p.isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nama & logo */}
      <section>
        <div className="wrap name">
          <div className="word">
            <Image
              className="lsym"
              src="/logo/logo-simbol-gelap.png"
              alt="Simbol EduPuan"
              width={0}
              height={0}
              sizes="210px"
              style={{ width: 210, height: "auto" }}
            />
            <Image
              className="lwm"
              src="/logo/logo-tulisan-gelap.png"
              alt="edupuan, lebih paham, lebih bijak"
              width={0}
              height={0}
              sizes="300px"
              style={{ width: 300, height: "auto" }}
            />
            <ol>
              <li>
                <b>Edu</b>, dari edukasi: belajar memahami sebelum memutuskan.
              </li>
              <li>
                <b>Puan</b>, sapaan hormat untuk perempuan, akar kata dari &ldquo;perempuan&rdquo;.
              </li>
            </ol>
          </div>
          <div>
            <span className="eyebrow">CERITA DI BALIK NAMA DAN LOGO</span>
            <h2 style={{ marginBottom: 20 }}>Belajar, sebagai perempuan yang dihormati</h2>
            <p>
              Kami memilih kata <b>puan</b> karena ia membawa rasa hormat. Perempuan yang sedang kesulitan
              keuangan tetap layak diperlakukan dengan hormat, bukan dihakimi atau ditakut-takuti.
            </p>
            <p>Setiap bagian logo kami punya makna:</p>
            <div className="meaning">
              {MAKNA_LOGO.map((m) => (
                <div key={m.judul} className="mi">
                  <span className="ic">
                    <Ikon>{m.ikon}</Ikon>
                  </span>
                  <div>
                    <h4>{m.judul}</h4>
                    <p>{m.isi}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Catatan & ajakan */}
      <section className="tanpa-atas">
        <div className="wrap">
          <div className="note" id="kontak">
            <span className="ni">
              <Ikon>
                <path d="M12 3l9 16H3z" />
                <path d="M12 10v4M12 17v.01" />
              </Ikon>
            </span>
            <div>
              <h4>Penting untuk diketahui</h4>
              <p>
                EduPuan adalah platform edukasi. Kami <b>tidak menyalurkan pinjaman</b>, tidak bekerja sama
                dengan penyedia pinjaman mana pun, dan informasi di sini bukan pengganti nasihat hukum atau
                keuangan profesional. Untuk pengaduan resmi, hubungi lembaga berwenang:
              </p>
              <div className="contacts">
                <span>OJK: 157</span>
                <span>Komnas Perempuan</span>
                <span>patrolisiber.id</span>
              </div>
            </div>
          </div>
          <div className="cta">
            <div>
              <h2>Mulai dari kondisimu sekarang</h2>
              <p>Belum meminjam, sedang menimbang, atau sudah terlanjur. Semua ada jalannya.</p>
            </div>
            <div className="btns">
              <Link href="/#mulai-dari-sini" className="btn b1">
                Pilih Kondisimu <Panah />
              </Link>
              <Link href="#kontak" className="btn b2">
                Kontak Kami
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}