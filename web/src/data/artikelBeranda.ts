export type TopikEdukasi = "Semua" | "Pinjaman" | "Hak & Hukum" | "Penagihan";

export type ArtikelRingkas = {
  img: string;
  tag: string;
  title: string;
  meta: string;
};

export const TOPIK_EDUKASI: TopikEdukasi[] = ["Semua", "Pinjaman", "Hak & Hukum", "Penagihan"];

export const ARTIKEL_BERANDA: Record<
  TopikEdukasi,
  { featured: ArtikelRingkas; side: ArtikelRingkas[] }
> = {
  Semua: {
    featured: {
      img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&h=400&fit=crop&auto=format&q=80",
      tag: "Artikel",
      title: "Cara membaca kontrak pinjol: apa yang harus kamu periksa sebelum tanda tangan",
      meta: "5 menit baca · Literasi keuangan",
    },
    side: [
      {
        img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "Apa itu POJK dan bagaimana melindungimu dari penagih ilegal?",
        meta: "4 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "Perbedaan pinjol legal dan ilegal: 7 tanda yang sering diabaikan",
        meta: "6 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "POJK 22/2023: aturan penagihan yang wajib kamu ketahui",
        meta: "9 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "Pesan penagih mana yang melanggar hukum? Ini ciri-cirinya",
        meta: "8 menit baca",
      },
    ],
  },
  Pinjaman: {
    featured: {
      img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&h=400&fit=crop&auto=format&q=80",
      tag: "Artikel",
      title: "Cara membaca kontrak pinjol: apa yang harus kamu periksa sebelum tanda tangan",
      meta: "5 menit baca · Pinjaman",
    },
    side: [
      {
        img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "Apa itu POJK dan bagaimana melindungimu dari penagih ilegal?",
        meta: "4 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "Bunga pinjol: cara menghitung biaya sebenarnya sebelum meminjam",
        meta: "5 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "Perbedaan pinjol legal dan ilegal: 7 tanda yang sering diabaikan",
        meta: "6 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "Checklist sebelum tanda tangan: 10 pertanyaan wajib ke pinjol",
        meta: "7 menit baca",
      },
    ],
  },
  "Hak & Hukum": {
    featured: {
      img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&h=400&fit=crop&auto=format&q=80",
      tag: "Panduan",
      title: "POJK 22/2023: aturan penagihan yang wajib kamu ketahui sebagai debitur",
      meta: "9 menit baca · Hak & Hukum",
    },
    side: [
      {
        img: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "Lapor ke OJK 157: panduan lengkap untuk korban pinjol ilegal",
        meta: "6 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "Hak debitur yang sering dilanggar dan cara mempertahankannya",
        meta: "7 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "UU ITE dan perlindungan data pribadi korban pinjol",
        meta: "10 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "Cara membuat laporan ke Komnas Perempuan tentang pinjol",
        meta: "5 menit baca",
      },
    ],
  },
  Penagihan: {
    featured: {
      img: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=900&h=400&fit=crop&auto=format&q=80",
      tag: "Artikel",
      title: "Pesan penagih mana yang melanggar hukum? Kenali ciri-cirinya dan cara meresponnya",
      meta: "8 menit baca · Penagihan",
    },
    side: [
      {
        img: "https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "Template balasan penagih yang aman, tegas, dan legal",
        meta: "4 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Panduan",
        title: "Cara mendokumentasikan bukti pelanggaran penagihan",
        meta: "6 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "Ancaman sebar data oleh penagih: ini langkah hukumnya",
        meta: "7 menit baca",
      },
      {
        img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&h=180&fit=crop&auto=format&q=80",
        tag: "Artikel",
        title: "Psikologi penagihan agresif dan cara menghadapinya dengan tenang",
        meta: "9 menit baca",
      },
    ],
  },
};

export const VIDEO_BERANDA = [
  {
    thumb: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=225&fit=crop&auto=format&q=80",
    title: "Kenali pinjol ilegal dalam 3 menit",
    dur: "3:24",
  },
  {
    thumb: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop&auto=format&q=80",
    title: "Apa yang harus dilakukan jika diancam penagih?",
    dur: "5:10",
  },
  {
    thumb: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400&h=225&fit=crop&auto=format&q=80",
    title: "Cara lapor ke OJK langkah demi langkah",
    dur: "4:47",
  },
  {
    thumb: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=225&fit=crop&auto=format&q=80",
    title: "Hak perempuan dalam hukum pinjaman online",
    dur: "7:02",
  },
];