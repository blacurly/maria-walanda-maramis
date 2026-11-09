/**
 * EduPuan: pembuat file PDF sungguhan di browser (jsPDF), dipakai oleh fitur Cek Penawaran dan Rangkum Utang.
 *
 * Kenapa bukan window.print()? Di banyak HP (terutama Android dan browser bawaan HP), jendela cetak
 * tampil hitam/kosong dan pilihan "Simpan sebagai PDF" tidak muncul. jsPDF membuat file .pdf langsung
 * lalu mengunduhnya, jadi hasilnya sama di laptop dan HP.
 *
 * Semua proses terjadi di perangkat pengguna. Tidak ada data yang dikirim ke server.
 * Font bawaan PDF (Helvetica) hanya mengenal huruf Latin dasar, jadi teks dibersihkan dulu lewat teksPdf().
 */

type RGB = [number, number, number];

const HIJAU: RGB = [13, 110, 75];
const TINTA: RGB = [20, 33, 27];
const ABU: RGB = [75, 90, 83];
const GARIS: RGB = [221, 229, 224];
const MARGIN = 15; // mm

/** Mengganti karakter yang tidak dikenal font PDF (≤, →, emoji, spasi khusus, dll.). */
export function teksPdf(nilai: unknown): string {
  return String(nilai ?? "")
    .replace(/[   ]/g, " ")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/[→⟶]/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/[•▪]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

function hexKeRgb(hex: string, cadangan: RGB): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return cadangan;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export type OpsiTabel = { lebarKolom?: Record<number, number>; tanpaKepala?: boolean };

/** Membuat dokumen PDF berkop EduPuan. Mengembalikan alat-alat kecil untuk mengisi isinya. */
export async function mulaiPdf(judul: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const lebar = doc.internal.pageSize.getWidth() - MARGIN * 2;
  const tinggi = doc.internal.pageSize.getHeight();
  const dibuat = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  let y = MARGIN;

  const cekRuang = (butuh: number) => {
    if (y + butuh > tinggi - MARGIN - 6) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Kop dokumen
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...HIJAU);
  doc.text("EduPuan", MARGIN, y + 5);
  y += 9;
  doc.setFontSize(13);
  doc.setTextColor(...TINTA);
  doc.text(teksPdf(judul), MARGIN, y + 4);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...ABU);
  doc.text(teksPdf("Dibuat " + dibuat), MARGIN, y + 3);
  y += 6;
  doc.setDrawColor(...HIJAU);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, MARGIN + lebar, y);
  y += 7;

  const tulisBaris = (teks: string, ukuran: number, tebal: boolean, warna: RGB, indent = 0) => {
    doc.setFont("helvetica", tebal ? "bold" : "normal");
    doc.setFontSize(ukuran);
    doc.setTextColor(...warna);
    const tinggiBaris = ukuran * 0.45;
    const baris: string[] = doc.splitTextToSize(teksPdf(teks), lebar - indent);
    for (const b of baris) {
      cekRuang(tinggiBaris);
      doc.text(b, MARGIN + indent, y + tinggiBaris * 0.8);
      y += tinggiBaris;
    }
  };

  return {
    /** Judul bagian, misalnya "Ringkasan uang". */
    judul(teks: string) {
      cekRuang(14);
      y += 2;
      tulisBaris(teks, 12, true, TINTA);
      y += 2;
    },
    /** Paragraf biasa. */
    paragraf(teks: string, opsi: { ukuran?: number; tebal?: boolean; abu?: boolean } = {}) {
      if (!teksPdf(teks)) return;
      tulisBaris(teks, opsi.ukuran ?? 10, !!opsi.tebal, opsi.abu ? ABU : TINTA);
      y += 2;
    },
    /** Daftar berbutir. */
    poin(daftar: string[], ukuran = 10) {
      for (const p of daftar) {
        if (!teksPdf(p)) continue;
        cekRuang(ukuran * 0.45);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(ukuran);
        doc.setTextColor(...TINTA);
        doc.text("-", MARGIN + 1, y + ukuran * 0.45 * 0.8);
        tulisBaris(p, ukuran, false, TINTA, 5);
        y += 1;
      }
      y += 1;
    },
    /** Kotak berwarna, misalnya kotak keputusan. Warna dalam format hex (#RRGGBB). */
    kotak(label: string, judulKotak: string, isi: string, latarHex: string, teksHex: string) {
      const latar = hexKeRgb(latarHex, [238, 242, 239]);
      const warna = hexKeRgb(teksHex, TINTA);
      const dalam = lebar - 10;
      doc.setFontSize(13);
      const barisJudul: string[] = doc.splitTextToSize(teksPdf(judulKotak), dalam);
      doc.setFontSize(10);
      const barisIsi: string[] = doc.splitTextToSize(teksPdf(isi), dalam);
      const tinggiKotak = 8 + 5 + barisJudul.length * 6 + barisIsi.length * 4.5 + 4;
      cekRuang(tinggiKotak);
      doc.setFillColor(...latar);
      doc.roundedRect(MARGIN, y, lebar, tinggiKotak, 2, 2, "F");
      let yy = y + 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...warna);
      doc.text(teksPdf(label).toUpperCase(), MARGIN + 5, yy);
      yy += 6;
      doc.setFontSize(13);
      for (const b of barisJudul) {
        doc.text(b, MARGIN + 5, yy);
        yy += 6;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...TINTA);
      for (const b of barisIsi) {
        doc.text(b, MARGIN + 5, yy);
        yy += 4.5;
      }
      y += tinggiKotak + 5;
    },
    /** Tabel. Baris pertama "kepala" boleh null jika tidak perlu judul kolom. */
    tabel(kepala: string[] | null, isi: (string | number)[][], opsi: OpsiTabel = {}) {
      const columnStyles: Record<number, { cellWidth: number }> = {};
      for (const [k, v] of Object.entries(opsi.lebarKolom ?? {})) columnStyles[Number(k)] = { cellWidth: v };
      autoTable(doc, {
        startY: y,
        head: kepala ? [kepala.map(teksPdf)] : undefined,
        body: isi.map((r) => r.map(teksPdf)),
        margin: { left: MARGIN, right: MARGIN, bottom: MARGIN + 6 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 9, cellPadding: 1.8, textColor: TINTA, lineColor: GARIS, lineWidth: 0.1, overflow: "linebreak" },
        headStyles: { fillColor: [232, 243, 236], textColor: [13, 79, 53], fontStyle: "bold" },
        columnStyles,
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
    },
    /** Memberi nomor halaman lalu mengunduh file. */
    simpan(namaFile: string) {
      const jumlah = doc.getNumberOfPages();
      for (let i = 1; i <= jumlah; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...ABU);
        doc.text(teksPdf(`EduPuan - halaman ${i} dari ${jumlah}`), MARGIN, tinggi - 8);
      }
      doc.save(namaFile);
    },
    /** Untuk pengujian: hasil PDF dalam bentuk ArrayBuffer. */
    _hasil(): ArrayBuffer {
      return doc.output("arraybuffer");
    },
  };
}

/** Nama file yang aman, contoh: EduPuan-Cek-Penawaran-2026-11-09.pdf */
export function namaFilePdf(fitur: string): string {
  const d = new Date();
  const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `EduPuan-${fitur}-${tgl}.pdf`;
}