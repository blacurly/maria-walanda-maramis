// Nomor dicek ulang: SAPA 129 (KemenPPPA), Healing119 (Kemenkes), Polisi 110, Darurat 112.
// WA SAPA 129 = 08-111-129-129 → format internasional 628111129129
const WA_SAPA = "https://wa.me/628111129129";

export type Kontak = {
  label: string;
  nomor: string;
  href: string;
  warna: string;
};

export type IdSituasi = "ancaman" | "kbgo" | "kdrt" | "tekanan";

export const KONTAK_BAHAYA = [
  {
    label: "📞 Telepon Polisi — 110",
    href: "tel:110",
    gaya: "bg-white border-2 border-red-300 text-red-700 hover:bg-red-50",
  },
  {
    label: "🆘 Darurat Nasional — 112",
    href: "tel:112",
    gaya: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  },
  {
    label: "💬 WhatsApp SAPA 129",
    href: WA_SAPA,
    gaya: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
  },
];

export const SITUASI: {
  id: IdSituasi;
  ikon: string;
  pilihan: string;
  judul: string;
  kontak: Kontak[];
  info: string;
}[] = [
  {
    id: "ancaman",
    ikon: "⚠️",
    pilihan: "Ancaman atau kekerasan dari penagih",
    judul: "Ancaman atau kekerasan dari penagih",
    kontak: [
      { label: "Polisi 110", nomor: "110", href: "tel:110", warna: "bg-red-600" },
      { label: "SAPA 129 — WA", nomor: "08111-129-129", href: WA_SAPA, warna: "bg-green-600" },
    ],
    info: "Simpan semua bukti ancaman sebelum memblokir nomor penagih. Screenshot pesan + catat tanggal & waktu.",
  },
  {
    id: "kbgo",
    ikon: "📵",
    pilihan: "Ancaman sebar foto atau pelecehan online (KBGO)",
    judul: "Ancaman sebar foto / pelecehan online",
    kontak: [
      { label: "SAPA 129 — Telepon", nomor: "129", href: "tel:129", warna: "bg-purple-600" },
      { label: "SAPA 129 — WA", nomor: "08111-129-129", href: WA_SAPA, warna: "bg-green-600" },
      { label: "Polisi Unit Siber", nomor: "110", href: "tel:110", warna: "bg-red-600" },
    ],
    info: "Jangan hapus pesan atau foto sebagai bukti. Minta pendampingan sebelum membuat laporan.",
  },
  {
    id: "kdrt",
    ikon: "🏠",
    pilihan: "Kekerasan dalam rumah tangga",
    judul: "Kekerasan dalam rumah tangga",
    kontak: [
      { label: "SAPA 129 — Telepon", nomor: "129", href: "tel:129", warna: "bg-purple-600" },
      { label: "SAPA 129 — WA", nomor: "08111-129-129", href: WA_SAPA, warna: "bg-green-600" },
      { label: "Polisi 110", nomor: "110", href: "tel:110", warna: "bg-red-600" },
    ],
    info: "Kalau belum aman untuk bicara, kirim pesan WA ke SAPA 129 — tidak harus berbicara.",
  },
  {
    id: "tekanan",
    ikon: "💙",
    pilihan: "Tekanan berat, merasa tidak sanggup lagi",
    judul: "Tekanan berat atau keinginan menyakiti diri",
    kontak: [
      { label: "Healing119 — 119 ext 8", nomor: "119", href: "tel:119", warna: "bg-blue-600" },
      { label: "Healing119.id — Chat", nomor: "healing119.id", href: "https://healing119.id", warna: "bg-sky-600" },
      { label: "Darurat 112", nomor: "112", href: "tel:112", warna: "bg-orange-600" },
    ],
    info: 'Kamu tidak harus menjelaskan semua sekaligus. Cukup mulai dengan "saya butuh bantuan".',
  },
];