"use client";

/**
 * EduPuan — Halaman "Cek Penawaran"
 * Semua perhitungan ada di @/features/cek-penawaran/hitung.ts — JANGAN menghitung di file ini.
 * Tombol "Unduh hasil (PDF)" membuat file PDF langsung di browser (jsPDF, lewat @/features/pdfEduPuan).
 * Tidak ada data yang dikirim ke server.
 */
import React, { useState } from "react";
import Link from "next/link";
import TombolTanyaPuan from "@/components/fitur/puan-chat/TombolTanyaPuan";
import {
  hitung, teksVonis, langkahHitung, simulasiTelat, simulasiGaliLubang,
  SKENARIO, inputSkenario, DEFAULT_INPUT, rp, pc, fb, num, show,
  type InputPenawaran, type Temuan, type Jenis, type Tujuan,
} from "@/features/cek-penawaran/hitung";

/* ---------------- tautan ke halaman lain di EduPuan ---------------- */
const TAUTAN = {
  pilihanSelainPinjol: "/mau-pinjam/cari-alternatif",
  cekLegalitas: "/mau-pinjam/cek-legalitas",
  caraMelaporkan: "/sudah-terjerat/dokumentasi-lapor",
  sudahTerjerat: "/sudah-terjerat",
};

/* ---------------- warna ---------------- */
const C = {
  bg: "#F4F7F5", white: "#FFFFFF", ink: "#14211B", ink2: "#33413A", muted: "#4B5A53",
  line: "#DDE5E0", line2: "#CBD6D0", soft: "#EEF2EF", green: "#12714B", greenDark: "#0D4F35",
  greenSoft: "#E8F3EC", red: "#B42318", amber: "#C98A00",
};
const FONT_HEAD = "var(--font-sora), sans-serif";
const FONT_BODY = "var(--font-jakarta), sans-serif";

/* ---------------- gaya berulang ---------------- */
const card: React.CSSProperties = { background: C.white, border: `1px solid ${C.line}`, borderRadius: 16, padding: "clamp(16px, 4vw, 24px)", display: "flex", flexDirection: "column", gap: 16 };
const resultCard: React.CSSProperties = { background: C.white, border: `1px solid ${C.line}`, borderRadius: 16, padding: "clamp(14px, 4vw, 22px)", display: "flex", flexDirection: "column", gap: 14 };
const stepTag: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: C.green };
const h2: React.CSSProperties = { margin: "4px 0 0", fontSize: 19, fontFamily: FONT_HEAD };
const h3: React.CSSProperties = { margin: 0, fontSize: 17, fontFamily: FONT_HEAD };
const lead: React.CSSProperties = { margin: "6px 0 0", fontSize: 13, color: C.muted, lineHeight: 1.5 };
const fld: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const lbl: React.CSSProperties = { fontWeight: 600, fontSize: 15 };
const hint: React.CSSProperties = { fontSize: 13, color: C.muted };
const ghostBtn: React.CSSProperties = { minHeight: 40, padding: "0 12px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.white, color: C.green, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY };
const tile: React.CSSProperties = { background: C.bg, borderRadius: 12, padding: 12, minWidth: 0 };

/* Grid kotak angka yang menyesuaikan lebar layar: di HP jumlah kolomnya berkurang, jadi angka tidak terpotong */
const gridLebar: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: 12 };
const gridKecil: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 110px), 1fr))", gap: 10 };
/* Angka besar: mengecil di layar sempit dan boleh turun baris, tidak terpotong */
const angkaBesar: React.CSSProperties = { fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 700, marginTop: 4, overflowWrap: "anywhere", lineHeight: 1.25 };
const angkaSedang: React.CSSProperties = { fontSize: "clamp(15px, 4.2vw, 17px)", fontWeight: 700, marginTop: 2, overflowWrap: "anywhere", lineHeight: 1.3 };

const pill = (on: boolean): React.CSSProperties => ({ minHeight: 44, padding: "0 16px", borderRadius: 999, fontSize: 14, fontWeight: 600, border: `1px solid ${on ? C.green : C.line2}`, background: on ? C.green : C.white, color: on ? C.white : C.ink, cursor: "pointer", fontFamily: FONT_BODY });
const seg = (on: boolean): React.CSSProperties => ({ minHeight: 46, padding: "0 18px", border: 0, fontSize: 15, fontWeight: 600, background: on ? C.green : C.white, color: on ? C.white : C.ink2, cursor: "pointer", fontFamily: FONT_BODY });

/* ---------------- CSS kecil (input & tautan) ---------------- */
const GLOBAL_CSS = `
.ep-cek a{color:#12714B}.ep-cek a:hover{color:#0D4F35}
.ep-cek .ep-in{width:100%;box-sizing:border-box;height:48px;border:1px solid #CBD6D0;border-radius:12px;padding:0 14px;font:500 16px var(--font-jakarta),sans-serif;color:#14211B;background:#fff}
.ep-cek .ep-in:focus{outline:2px solid #12714B;outline-offset:1px;border-color:#12714B}
.ep-cek button{font-family:var(--font-jakarta),sans-serif;cursor:pointer}
`;

/* ---------------- komponen kecil ---------------- */
function NumInput(props: { id: string; value: number; onChange: (n: number) => void; placeholder: string; ariaLabel?: string }) {
  return (
    <input id={props.id} aria-label={props.ariaLabel} className="ep-in" inputMode="numeric" placeholder={props.placeholder}
      value={show(props.value)} onChange={(e) => props.onChange(num(e.target.value))} />
  );
}

function Field(props: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={fld}>
      <label htmlFor={props.id} style={lbl}>{props.label}</label>
      {props.hint && <span style={hint}>{props.hint}</span>}
      {props.children}
    </div>
  );
}

const CHIP: Record<string, [string, string, string]> = { merah: ["Melebihi", "#B42318", "#FFFFFF"], kuning: ["Perhatikan", "#F2C14E", "#3D2A00"], ok: ["Lolos", "#E6F4EC", "#0E6B47"] };
const CHIP_DATA: [string, string, string] = ["Belum diisi", "#E6ECE8", "#33413A"];
const ORDER: Record<string, number> = { merah: 0, kuning: 1, ok: 2 };

function TemuanList(props: { items: Temuan[]; showAll: boolean; mode: "ojk" | "edu" | "data" }) {
  const list = props.items.filter((c) => props.showAll || c.st !== "ok").sort((a, b) => ORDER[a.st] - ORDER[b.st]);
  return (
    <>
      {list.map((c, i) => {
        let ch = props.mode === "data" ? CHIP_DATA : CHIP[c.st];
        if (props.mode === "edu" && c.st === "merah") ch = ["Berisiko", "#B42318", "#FFFFFF"];
        return (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #F3F5F4" }}>
            <span style={{ flexShrink: 0, minWidth: 78, textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, padding: "5px 8px", borderRadius: 6, textTransform: "uppercase", background: ch[1], color: ch[2] }}>{ch[0]}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <strong style={{ fontSize: 14 }}>{c.title}</strong>
              <span style={{ fontSize: 13, lineHeight: 1.55, color: C.ink2 }}>{c.detail}</span>
              {props.mode !== "data" && <span style={{ fontSize: 12, color: C.muted }}>Dasar: {c.dasar}</span>}
            </div>
          </div>
        );
      })}
      {list.length === 0 && props.mode === "ojk" && <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted }}>Tidak ada temuan. Klik &quot;Tampilkan semua pemeriksaan&quot; untuk melihat yang lolos.</p>}
      {list.length === 0 && props.mode === "edu" && <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted }}>Tidak ada temuan.</p>}
    </>
  );
}

/* ================================================================== */

/**
 * Props:
 * - modeDemo: true  -> tampilkan kotak "Coba skenario contoh" dan isi formulir dengan skenario 6.
 *             false -> (default, untuk pengguna sungguhan) kotak skenario disembunyikan, formulir kosong.
 * - skenarioAwal: angka 1-6 untuk memilih skenario yang terisi saat modeDemo aktif.
 */
export default function CekPenawaran(props: { modeDemo?: boolean; skenarioAwal?: number | null }) {
  const demo = props.modeDemo === true;
  const awal = demo ? (props.skenarioAwal ?? 6) : null;
  const [s, setS] = useState<InputPenawaran>(awal ? inputSkenario(awal) : { ...DEFAULT_INPUT });
  const [scen, setScen] = useState<number | null>(awal);
  const [showAll, setShowAll] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [lateSel, setLateSel] = useState<number | "c">(30);
  const [lateCustom, setLateCustom] = useState(0);
  const [mengunduh, setMengunduh] = useState(false);
  const [galatUnduh, setGalatUnduh] = useState<string | null>(null);

  const set = (o: Partial<InputPenawaran>) => { setS((prev) => ({ ...prev, ...o })); setScen(null); };
  const pickScen = (id: number) => { setS(inputSkenario(id)); setScen(id); setShowAll(false); setShowCalc(false); setLateSel(30); setLateCustom(0); };

  const h = hitung(s);
  const v = teksVonis(h);
  const produktif = s.jenis === "produktif";
  const bulan = s.unit === "bulan";
  const dRp = s.dUnit === "rp";
  const lateDays = lateSel === "c" ? lateCustom : lateSel;
  const late = simulasiTelat(s, h, lateDays);
  const gali = simulasiGaliLubang(s);
  const isUtang = h.ok && !produktif && s.tujuan === "utang";

  // bar biaya per hari
  const scale = Math.max(h.mePct, h.batas) * 1.15;
  const ratio = h.mePct / h.batas;
  const offerColor = ratio > 1 ? "#B42318" : ratio > 0.75 ? "#C98A00" : "#12714B";
  const rasioColor = h.rasio > 30 ? "#B42318" : h.rasio > 20 ? "#C98A00" : "#12714B";
  const cLabel = bulan ? "Estimasi cicilan per bulan (" + s.ten + " bulan)" : (h.H <= 30 ? "Dibayar sekali di hari ke-" + h.H : "Estimasi cicilan per bulan");

  // kotak cek rincian (Langkah 3)
  const rinciCheck = (() => {
    const base: React.CSSProperties = { fontSize: 14, lineHeight: 1.55, borderRadius: 12, padding: "12px 14px" };
    if (!h.rinciOn || !(s.p && s.d && s.t)) return { style: { ...base, background: "#F4F7F5", color: "#4B5A53" }, text: "Kami cocokkan rincian dengan selisih total bayar dan uang yang diterima." };
    if (h.selisih > 1000) return { style: { ...base, background: "#FFF4D6", color: "#3D2A00" }, text: "Rincian " + rp(h.rinciSum) + ", selisih sebenarnya " + rp(h.allCost) + ". Ada " + rp(h.selisih) + " yang tidak dijelaskan." };
    if (h.selisih < -1000) return { style: { ...base, background: "#FFF4D6", color: "#3D2A00" }, text: "Rincian " + rp(h.rinciSum) + " lebih besar " + rp(-h.selisih) + " dari biaya sebenarnya (" + rp(h.allCost) + "). Mungkin ada biaya yang terhitung dua kali. Hasil tetap dihitung memakai " + rp(h.allCost) + " sebagai patokan." };
    return { style: { ...base, background: "#E6F4EC", color: "#0E6B47" }, text: "Cocok: rincian " + rp(h.rinciSum) + " sama dengan selisih total bayar dan uang diterima." };
  })();

  const LV: Record<string, string> = { hijau: "#12714B", kuning: "#C98A00", merah: "#B42318" };
  const ctaHref: Record<string, string> = {
    "Lihat pilihan selain pinjol": TAUTAN.pilihanSelainPinjol,
    "Cek legalitas aplikasi": TAUTAN.cekLegalitas,
    "Pelajari cara melaporkan": TAUTAN.caraMelaporkan,
  };
  const jenisList: { k: Jenis; label: string; desc: string; ex: string }[] = [
    { k: "produktif", label: "Produktif", desc: "Untuk usaha atau kegiatan yang menghasilkan pendapatan.", ex: "Contoh: modal usaha, stok dagangan, alat kerja." },
    { k: "konsumtif", label: "Konsumtif", desc: "Untuk kebutuhan pribadi atau sehari-hari.", ex: "Contoh: rumah tangga, pendidikan, kesehatan." },
  ];
  const tujuanList: [Tujuan, string][] = [["harian", "Kebutuhan sehari-hari"], ["pendidikan", "Pendidikan"], ["kesehatan", "Kesehatan / darurat"], ["utang", "Membayar utang lain"]];

  // Angka yang dimasukkan pengguna (ikut ditulis di PDF)
  const tujuanLabel = produktif ? "Usaha" : (tujuanList.find(([k]) => k === s.tujuan)?.[1] ?? "-");
  const dataMasukan: [string, string][] = [
    ["Jumlah pinjaman tertulis", rp(s.p)],
    ["Uang yang masuk ke rekening", rp(s.d)],
    ["Total yang harus dikembalikan", rp(s.t)],
    ["Masa pinjaman", s.ten + " " + s.unit],
    ["Jenis / tujuan", (produktif ? "Produktif" : "Konsumtif") + " · " + tujuanLabel],
    ["Denda per hari di kontrak", s.dendaStr ? (dRp ? "Rp" + s.dendaStr + " per hari" : s.dendaStr + "% per hari") : "Tidak diisi"],
    ["Pinjaman aktif di aplikasi lain", s.apps === 3 ? "3 atau lebih" : s.apps === 0 ? "Tidak ada" : String(s.apps)],
  ];
  if (!s.skip) {
    dataMasukan.push(["Penghasilan bersih per bulan", rp(s.inc)]);
    dataMasukan.push(["Pengeluaran wajib per bulan", rp(s.wajib)]);
    dataMasukan.push(["Cicilan / utang lain per bulan", rp(s.lainCicil)]);
  }

  // Membuat file PDF langsung di browser (bekerja juga di HP). Semua pemeriksaan ikut dicetak, termasuk yang lolos.
  async function unduhPdf() {
    if (!h.ok || mengunduh) return;
    setMengunduh(true);
    setGalatUnduh(null);
    try {
      const { mulaiPdf, namaFilePdf } = await import("@/features/pdfEduPuan");
      const pdf = await mulaiPdf("Hasil Cek Penawaran Pinjaman");

      pdf.judul("Angka yang kamu masukkan");
      pdf.tabel(null, dataMasukan, { lebarKolom: { 1: 70 } });

      pdf.kotak(v.tag, v.title, v.text, v.bg, v.fg);
      pdf.paragraf(`${h.jumlah.merah} temuan merah · ${h.jumlah.kuning} temuan kuning · ${h.jumlah.lolos} pemeriksaan lolos`, { ukuran: 9, abu: true });

      const barisTemuan = (items: Temuan[], mode: "ojk" | "edu" | "data") =>
        items.slice().sort((a, b) => ORDER[a.st] - ORDER[b.st]).map((c) => {
          let label = mode === "data" ? CHIP_DATA[0] : CHIP[c.st][0];
          if (mode === "edu" && c.st === "merah") label = "Berisiko";
          return [label, c.title, c.detail, mode === "data" ? "-" : c.dasar];
        });
      const kolomTemuan = ["Status", "Pemeriksaan", "Penjelasan", "Dasar"];
      const lebarTemuan = { lebarKolom: { 0: 22, 1: 38, 3: 38 } };
      pdf.judul("Temuan: aturan OJK (SEOJK 19/SEOJK.06/2025)");
      pdf.tabel(kolomTemuan, barisTemuan(h.ojk, "ojk"), lebarTemuan);
      pdf.judul("Temuan: rekomendasi EduPuan (bukan batas resmi OJK)");
      pdf.tabel(kolomTemuan, barisTemuan(h.edu, "edu"), lebarTemuan);
      if (h.data.length > 0) {
        pdf.judul("Belum dapat dinilai");
        pdf.tabel(kolomTemuan, barisTemuan(h.data, "data"), lebarTemuan);
      }
      if (isUtang) {
        pdf.paragraf("Perlu dipertimbangkan kembali. Pinjaman baru dipakai untuk membayar kewajiban lama. Pastikan pinjaman baru tidak membuat total kewajibanmu semakin berat. Sebelum itu, coba ajukan keringanan ke pemberi pinjaman yang lama.", { tebal: true });
      }

      pdf.judul("Ringkasan uang");
      pdf.tabel(null, [
        ["Dana yang diterima", rp(s.d)],
        ["Total yang harus dibayar", rp(s.t)],
        ["Total biaya yang kamu tanggung", rp(h.allCost)],
        ["Manfaat ekonomi menurut OJK", rp(h.ME)],
        [cLabel, rp(h.C)],
      ], { lebarKolom: { 1: 60 } });

      pdf.judul("Biaya per hari vs batas OJK");
      pdf.tabel(null, [["Kategori", String(h.kategori)], ["Penawaran", pc(h.mePct, 3)], ["Batas OJK", fb(h.batas)]], { lebarKolom: { 1: 60 } });
      pdf.paragraf(ratio > 1 ? "Terindikasi melebihi batas maksimum manfaat ekonomi." : "Tidak melebihi batas maksimum manfaat ekonomi yang diperiksa.", { tebal: true });
      pdf.paragraf("Langkah perhitungan:", { ukuran: 9 });
      pdf.poin(langkahHitung(s, h).map((cs) => `${cs.label}: ${cs.val}`), 9);

      pdf.judul("Kemampuan bayar");
      if (h.filled) {
        pdf.tabel(null, [
          ["Penghasilan", rp(s.inc)],
          ["Semua cicilan", rp(h.allC)],
          ["Persentase cicilan", pc(h.rasio, 1)],
          ["Sisa uang per bulan setelah kebutuhan dan cicilan", rp(h.sisa)],
        ], { lebarKolom: { 1: 60 } });
        pdf.paragraf(produktif ? "Batas 30% OJK berlaku untuk pinjaman konsumtif. Untuk pinjaman produktif, angka ini dipakai sebagai rekomendasi EduPuan." : "Batas 30% untuk pinjaman konsumtif: SEOJK 19/2025 Romawi XIII angka 2. Dihitung dari semua cicilan ke semua kreditur.", { ukuran: 9, abu: true });
      } else {
        pdf.paragraf("Tidak dapat dinilai karena kondisi keuangan belum diisi (Langkah 5).", { abu: true });
      }

      pdf.judul("Bagaimana jika saya terlambat membayar?");
      pdf.paragraf("Simulasi untuk edukasi. " + late.basis, { ukuran: 9, abu: true });
      pdf.tabel(null, [["Telat", String(late.hari)], ["Denda", String(late.denda)], ["Total tagihan", String(late.total)]], { lebarKolom: { 1: 60 } });
      pdf.paragraf(String(late.catatan));
      pdf.poin([
        "Keterlambatan tercatat di SLIK OJK dan bisa menyulitkan pengajuan kredit di masa depan.",
        "Penagih hanya boleh menagih kamu sendiri, tanpa ancaman atau mempermalukan. Kontak darurat hanya untuk konfirmasi keberadaan, bukan untuk ditagih.",
      ], 9);

      if (isUtang) {
        pdf.judul("Simulasi gali lubang tutup lubang");
        pdf.tabel(["Putaran", "Pinjaman", "Utang yang harus dibayar"], gali.rows.map((g) => [g.label, g.p, g.t]));
        pdf.paragraf(gali.teks);
      }

      pdf.judul("Catatan");
      pdf.paragraf("Hasil ini perkiraan untuk membantumu mengenali risiko, berdasarkan angka yang kamu masukkan. EduPuan tidak menyarankan, menawarkan, atau bekerja sama dengan aplikasi pinjaman mana pun. Hasil ini bukan nasihat keuangan atau hukum, dan bukan pernyataan bahwa suatu aplikasi legal atau ilegal. Batas mengikuti SEOJK 19/SEOJK.06/2025 (berlaku 31 Juli 2025), Romawi IX, XI, XIII, dan XIV.", { ukuran: 9, abu: true });
      pdf.paragraf("Dokumen ini dibuat di perangkatmu dari angka yang kamu masukkan sendiri. EduPuan tidak menyimpan angka-angka ini. Simpan file ini di tempat yang aman karena berisi data keuanganmu.", { ukuran: 9, abu: true });

      pdf.simpan(namaFilePdf("Cek-Penawaran"));
    } catch {
      setGalatUnduh("PDF belum bisa dibuat di browser ini. Coba buka EduPuan di Chrome, lalu unduh lagi.");
    } finally {
      setMengunduh(false);
    }
  }

  return (
    <div className="ep-cek" style={{ minHeight: "100%", background: C.bg, fontFamily: FONT_BODY, color: C.ink }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px clamp(12px, 4vw, 24px) 64px", display: "flex", flexDirection: "column", gap: 26 }}>
        {/* Judul */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0, fontFamily: FONT_HEAD, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: -0.5 }}>Cek Penawaran Pinjaman</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 16, lineHeight: 1.6, maxWidth: 780 }}>Masukkan angka dari penawaran yang kamu terima. Kami periksa biayanya terhadap batas yang ditetapkan OJK, lalu menambahkan peringatan berdasarkan kondisi keuanganmu. Hasilnya bukan rekomendasi untuk meminjam.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: "#FDECEA", color: "#9A1B12" }}><span style={{ width: 8, height: 8, borderRadius: 99, background: "#B42318" }} />Aturan OJK = batas resmi</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: "#FFF4D6", color: "#6B4400" }}><span style={{ width: 8, height: 8, borderRadius: 99, background: "#C98A00" }} />Rekomendasi EduPuan = peringatan tambahan, bukan aturan hukum</span>
          </div>
        </div>

        {/* Skenario contoh — hanya tampil di mode demo */}
        {demo && (
          <section aria-label="Skenario contoh" style={{ background: C.white, border: `1px solid ${C.line}`, borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
              <strong style={{ fontSize: 15 }}>Coba skenario contoh</strong>
              <span style={{ fontSize: 13, color: C.muted }}>Klik untuk mengisi formulir, lalu ubah angkanya sesukamu</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
              {SKENARIO.map((sc) => {
                const on = scen === sc.id;
                return (
                  <button key={sc.id} type="button" onClick={() => pickScen(sc.id)} style={{ textAlign: "left", minHeight: 64, padding: "10px 12px", borderRadius: 12, border: `1px solid ${on ? C.green : C.line2}`, background: on ? C.greenSoft : C.white, color: C.ink, boxShadow: on ? `inset 0 0 0 1px ${C.green}` : "none" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}><span style={{ width: 10, height: 10, borderRadius: 99, flexShrink: 0, background: LV[sc.lvl] }} />{sc.label}</span>
                    <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{sc.sub}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
          {/* ======================= FORMULIR ======================= */}
          <form onSubmit={(e) => e.preventDefault()} style={{ flex: "1 1 440px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* LANGKAH 1 */}
            <section style={{ ...card, gap: 18 }}>
              <div><div style={stepTag}>LANGKAH 1</div><h2 style={h2}>Angka utama dari penawaran</h2></div>
              <Field id="f-p" label="Berapa jumlah pinjaman yang tertulis?" hint='Disebut juga "nilai pendanaan" atau "jumlah pengajuan". Ini dasar semua hitungan OJK.'>
                <NumInput id="f-p" value={s.p} onChange={(n) => set({ p: n })} placeholder="contoh: 5.000.000" />
              </Field>
              <Field id="f-d" label="Berapa uang yang masuk ke rekeningmu?" hint="Setelah dipotong biaya di awal. Kalau tidak ada potongan, isi sama dengan jumlah pinjaman.">
                <NumInput id="f-d" value={s.d} onChange={(n) => set({ d: n })} placeholder="contoh: 4.800.000" />
              </Field>
              <Field id="f-t" label="Berapa total yang harus dikembalikan?" hint='Semua yang dibayar sampai lunas, tanpa denda. Disebut juga "total tagihan".'>
                <NumInput id="f-t" value={s.t} onChange={(n) => set({ t: n })} placeholder="contoh: 5.500.000" />
              </Field>
              <div style={fld}>
                <label htmlFor="f-ten" style={lbl}>Berapa lama masa pinjaman?</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <NumInput id="f-ten" value={s.ten} onChange={(n) => set({ ten: n })} placeholder="contoh: 6" />
                  <div role="group" aria-label="Satuan" style={{ display: "flex", border: `1px solid ${C.line2}`, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    <button type="button" onClick={() => set({ unit: "hari" })} style={seg(!bulan)}>hari</button>
                    <button type="button" onClick={() => set({ unit: "bulan" })} style={seg(bulan)}>bulan</button>
                  </div>
                </div>
                <span style={hint}>Dihitung dalam hari kalender. 1 bulan = 30 hari, sama seperti contoh hitungan di SEOJK.</span>
              </div>
              <Field id="f-cmax" label="Cicilan terbesar dalam satu bulan (opsional)" hint="Lihat jadwal cicilan. Isi jika cicilannya tidak sama tiap bulan, misalnya bulan terakhir lebih besar. Kosongkan jika cicilannya rata.">
                <NumInput id="f-cmax" value={s.cmax} onChange={(n) => set({ cmax: n })} placeholder="contoh: 0" />
              </Field>
            </section>

            {/* LANGKAH 2 */}
            <section style={card}>
              <div><div style={stepTag}>LANGKAH 2</div><h2 style={h2}>Uangnya untuk apa?</h2><p style={lead}>Batas biaya OJK berbeda untuk pinjaman usaha dan pinjaman pribadi. Pilih sesuai jenis atau tujuan pinjaman yang tertulis di kontrakmu, bukan perkiraan sendiri.</p></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                {jenisList.map((j) => {
                  const on = s.jenis === j.k;
                  return (
                    <button key={j.k} type="button" aria-pressed={on} onClick={() => set({ jenis: j.k, tujuan: j.k === "produktif" ? "usaha" : "harian" })}
                      style={{ textAlign: "left", padding: 14, borderRadius: 14, color: C.ink, border: on ? `2px solid ${C.green}` : `1px solid ${C.line2}`, background: on ? C.greenSoft : C.white }}>
                      <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{j.label}</span>
                      <span style={{ display: "block", fontSize: 13, color: C.ink2, marginTop: 4, lineHeight: 1.45 }}>{j.desc}</span>
                      <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>{j.ex}</span>
                    </button>
                  );
                })}
              </div>
              {!produktif && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Lebih tepatnya?</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {tujuanList.map(([k, label]) => <button key={k} type="button" onClick={() => set({ tujuan: k })} style={pill(s.tujuan === k)}>{label}</button>)}
                  </div>
                </div>
              )}
            </section>

            {/* LANGKAH 3 */}
            <section style={card}>
              <div><div style={stepTag}>LANGKAH 3</div><h2 style={h2}>Rincian biaya di penawaran</h2><p style={lead}>Salin dari halaman rincian di aplikasi. Tidak semua biaya dihitung OJK: kami pisahkan otomatis.</p></div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: C.green }}>DIHITUNG SEBAGAI MANFAAT EKONOMI</div>
              <Field id="f-bunga" label="Bunga / margin / bagi hasil"><NumInput id="f-bunga" value={s.bunga} onChange={(n) => set({ bunga: n })} placeholder="contoh: 450.000" /></Field>
              <Field id="f-admin" label="Biaya administrasi" hint="Termasuk yang dipotong sebelum uang masuk."><NumInput id="f-admin" value={s.admin} onChange={(n) => set({ admin: n })} placeholder="contoh: 200.000" /></Field>
              <Field id="f-fee" label="Komisi / fee platform / ujrah"><NumInput id="f-fee" value={s.fee} onChange={(n) => set({ fee: n })} placeholder="contoh: 0" /></Field>
              <Field id="f-lain" label="Biaya lainnya" hint="Misalnya asuransi, verifikasi, atau biaya pencairan."><NumInput id="f-lain" value={s.lain} onChange={(n) => set({ lain: n })} placeholder="contoh: 0" /></Field>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: C.muted }}>DIKECUALIKAN DARI MANFAAT EKONOMI</div>
              <Field id="f-excl" label="Tanda tangan elektronik bersertifikat, meterai, pajak" hint="Tetap kamu bayar, tapi tidak dihitung dalam batas OJK. Bea meterai Rp10.000 per dokumen; jumlah yang jauh lebih besar akan kami tandai.">
                <NumInput id="f-excl" value={s.excl} onChange={(n) => set({ excl: n })} placeholder="contoh: 20.000" />
              </Field>
              <div style={rinciCheck.style}>{rinciCheck.text}</div>
            </section>

            {/* LANGKAH 4 */}
            <section style={card}>
              <div><div style={stepTag}>LANGKAH 4</div><h2 style={h2}>Denda keterlambatan</h2><p style={lead}>Denda diperiksa terpisah dan tidak termasuk manfaat ekonomi.</p></div>
              <div style={fld}>
                <label htmlFor="f-den" style={lbl}>Denda per hari di kontrak</label>
                <span style={hint}>Pilih sesuai yang tertulis: &quot;0,1% per hari&quot; atau &quot;Rp5.000 per hari&quot;. Pakai koma untuk desimal.</span>
                <div style={{ display: "flex", gap: 10 }}>
                  <input id="f-den" className="ep-in" inputMode="decimal" placeholder={dRp ? "contoh: 5.000" : "contoh: 0,1"} value={s.dendaStr}
                    onChange={(e) => set({ dendaStr: e.target.value.replace(/[^0-9.,]/g, "") })} />
                  <div role="group" aria-label="Satuan denda" style={{ display: "flex", border: `1px solid ${C.line2}`, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    <button type="button" onClick={() => set({ dUnit: "pct", dendaStr: "" })} style={seg(!dRp)}>% / hari</button>
                    <button type="button" onClick={() => set({ dUnit: "rp", dendaStr: "" })} style={seg(dRp)}>Rp / hari</button>
                  </div>
                </div>
                {dRp && h.dendaOn && <span style={{ fontSize: 13, color: C.green }}>= {pc(h.dendaRate, 3)} per hari dari jumlah pinjaman</span>}
              </div>
              <Field id="f-dt" label="Sudah telat? Total denda yang sudah ditagih (opsional)" hint="Isi kalau kamu sudah menerima tagihan denda. Kosongkan kalau belum.">
                <NumInput id="f-dt" value={s.dendaTagih} onChange={(n) => set({ dendaTagih: n })} placeholder="contoh: 0" />
              </Field>
            </section>

            {/* LANGKAH 5 */}
            <section style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div><div style={stepTag}>LANGKAH 5 · SANGAT DISARANKAN</div><h2 style={h2}>Kondisi keuanganmu</h2><p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>Tanpa bagian ini, kemampuan bayar tidak dapat dinilai.</p></div>
                <button type="button" onClick={() => set({ skip: !s.skip })} style={{ minHeight: 44, padding: "0 14px", borderRadius: 10, border: `1px solid ${C.line2}`, background: C.white, color: C.green, fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{s.skip ? "Isi bagian ini" : "Lewati"}</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Saat ini kamu punya pinjaman aktif di berapa aplikasi pinjol lain?</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[0, 1, 2, 3].map((n) => <button key={n} type="button" onClick={() => set({ apps: n })} style={pill(s.apps === n)}>{n === 3 ? "3 atau lebih" : n === 0 ? "Tidak ada" : String(n)}</button>)}
                </div>
              </div>
              {!s.skip && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field id="f-inc" label="Penghasilan bersih rata-rata per bulan" hint="Yang benar-benar kamu terima setelah potongan (pajak, BPJS, dll.), dari semua sumber. Kalau tidak tetap, pakai rata-rata 3 bulan terakhir.">
                    <NumInput id="f-inc" value={s.inc} onChange={(n) => set({ inc: n })} placeholder="contoh: 4.000.000" />
                  </Field>
                  <Field id="f-w" label="Kebutuhan / pengeluaran wajib per bulan" hint="Makan, kos/sewa, listrik, transport, sekolah anak.">
                    <NumInput id="f-w" value={s.wajib} onChange={(n) => set({ wajib: n })} placeholder="contoh: 2.500.000" />
                  </Field>
                  <Field id="f-l" label="Cicilan / utang lain per bulan" hint="Ke bank, leasing, paylater, pegadaian, pinjol lain. Isi 0 jika tidak ada.">
                    <NumInput id="f-l" value={s.lainCicil} onChange={(n) => set({ lainCicil: n })} placeholder="contoh: 0" />
                  </Field>
                </div>
              )}
            </section>
          </form>

          {/* ======================= HASIL ======================= */}
          <section aria-live="polite" style={{ flex: "1 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            {!h.ok && (
              <div style={{ background: C.white, border: `2px dashed ${C.line2}`, borderRadius: 16, padding: "40px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                <strong style={{ fontFamily: FONT_HEAD, fontSize: 20 }}>Hasil akan muncul di sini</strong>
                {h.missing.length > 0 && <p style={{ margin: 0, color: C.muted }}>Lengkapi dulu: {h.missing.join(", ")}.</p>}
                {h.errs.map((e, i) => <p key={i} style={{ margin: 0, color: C.red, fontWeight: 600 }}>{e}</p>)}
              </div>
            )}

            {h.ok && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Tombol unduh PDF */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 16px" }}>
                  <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, flex: "1 1 200px" }}>
                    {galatUnduh ?? "Simpan hasil ini sebagai file PDF di perangkatmu."}
                  </span>
                  <button type="button" onClick={unduhPdf} disabled={mengunduh} style={{ minHeight: 44, padding: "0 16px", borderRadius: 10, border: 0, background: C.green, color: C.white, fontWeight: 700, fontSize: 14, opacity: mengunduh ? 0.6 : 1 }}>
                    {mengunduh ? "Menyiapkan PDF..." : "📄 Unduh hasil (PDF)"}
                  </button>
                </div>

                {/* Kotak keputusan: disusun ke bawah (label → judul → deskripsi → jumlah temuan) */}
                <div style={{ background: v.bg, border: `1.5px solid ${v.bd}`, borderRadius: 18, padding: "clamp(16px, 4vw, 24px)", display: "flex", flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: v.fg, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: v.fg }}>{v.tag}</span>
                  </div>
                  <h2 style={{ margin: 0, fontFamily: FONT_HEAD, fontSize: "clamp(22px, 3vw, 28px)", lineHeight: 1.25, color: v.fg }}>{v.title}</h2>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: C.ink, maxWidth: 680 }}>{v.text}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#FFFFFF", color: "#B42318", border: "1px solid #F2B8B2" }}>{h.jumlah.merah} temuan merah</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#FFFFFF", color: "#6B4400", border: "1px solid #E9C46A" }}>{h.jumlah.kuning} temuan kuning</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#FFFFFF", color: "#0E6B47", border: "1px solid #B7DEC9" }}>{h.jumlah.lolos} pemeriksaan lolos</span>
                  </div>
                </div>

                {/* Temuan */}
                <div style={{ ...resultCard, gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h3 style={h3}>Temuan pemeriksaan</h3>
                    <button type="button" onClick={() => setShowAll(!showAll)} style={ghostBtn}>{showAll ? "Sembunyikan yang lolos" : "Tampilkan semua pemeriksaan"}</button>
                  </div>
                  <div style={{ border: "1.5px solid #F2B8B2", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ background: "#FDECEA", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}><strong style={{ fontSize: 13, letterSpacing: 0.8, color: "#9A1B12" }}>ATURAN OJK</strong><span style={{ fontSize: 12, color: "#9A1B12" }}>SEOJK 19/SEOJK.06/2025</span></div>
                    <div style={{ padding: "6px 14px 10px", display: "flex", flexDirection: "column" }}><TemuanList items={h.ojk} showAll={showAll} mode="ojk" /></div>
                  </div>
                  <div style={{ border: "1.5px solid #E9C46A", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ background: "#FFF4D6", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}><strong style={{ fontSize: 13, letterSpacing: 0.8, color: "#6B4400" }}>REKOMENDASI EDUPUAN</strong><span style={{ fontSize: 12, color: "#6B4400" }}>Bukan batas resmi OJK</span></div>
                    <div style={{ padding: "6px 14px 10px", display: "flex", flexDirection: "column" }}><TemuanList items={h.edu} showAll={showAll} mode="edu" /></div>
                  </div>
                  {h.data.length > 0 && (
                    <div style={{ border: `1.5px solid ${C.line2}`, borderRadius: 14, overflow: "hidden" }}>
                      <div style={{ background: C.soft, padding: "10px 14px" }}><strong style={{ fontSize: 13, letterSpacing: 0.8, color: C.ink2 }}>BELUM DAPAT DINILAI</strong></div>
                      <div style={{ padding: "6px 14px 10px", display: "flex", flexDirection: "column" }}><TemuanList items={h.data} showAll={showAll} mode="data" /></div>
                    </div>
                  )}
                </div>

                {/* Peringatan bayar utang */}
                {isUtang && (
                  <div style={{ background: "#FFF4D6", border: "1px solid #E9C46A", borderRadius: 14, padding: "16px 18px", fontSize: 14, lineHeight: 1.6 }}>
                    <strong>Perlu dipertimbangkan kembali.</strong> Pinjaman baru dipakai untuk membayar kewajiban lama. Pastikan pinjaman baru tidak membuat total kewajibanmu semakin berat. Sebelum itu, coba ajukan keringanan ke pemberi pinjaman yang lama. <Link href={TAUTAN.sudahTerjerat}>Ke panduan Sudah Terjerat →</Link>
                  </div>
                )}

                {/* Ringkasan uang */}
                <div style={resultCard}>
                  <h3 style={h3}>Ringkasan uang</h3>
                  <div style={gridLebar}>
                    <div style={{ ...tile, padding: 14 }}><div style={{ fontSize: 13, color: C.muted }}>Dana yang diterima</div><div style={angkaBesar}>{rp(s.d)}</div></div>
                    <div style={{ ...tile, padding: 14 }}><div style={{ fontSize: 13, color: C.muted }}>Total yang harus dibayar</div><div style={angkaBesar}>{rp(s.t)}</div></div>
                    <div style={{ ...tile, padding: 14 }}><div style={{ fontSize: 13, color: C.muted }}>Total biaya yang kamu tanggung</div><div style={angkaBesar}>{rp(h.allCost)}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Manfaat ekonomi menurut OJK: {rp(h.ME)}</div></div>
                    <div style={{ ...tile, padding: 14 }}><div style={{ fontSize: 13, color: C.muted }}>{cLabel}</div><div style={angkaBesar}>{rp(h.C)}</div></div>
                  </div>
                </div>

                {/* Biaya per hari vs batas */}
                <div style={resultCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h3 style={h3}>Biaya per hari vs batas OJK</h3>
                    <span style={{ fontSize: 13, color: C.muted }}>{h.kategori}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "clamp(76px, 22vw, 110px) minmax(0, 1fr) 64px", alignItems: "center", gap: 10 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Penawaran</span><div style={{ height: 16, background: C.soft, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: Math.min(h.mePct / scale, 1) * 100 + "%", background: offerColor, borderRadius: 99 }} /></div><span style={{ fontSize: 14, fontWeight: 700, textAlign: "right" }}>{pc(h.mePct, 3)}</span></div>
                    <div style={{ display: "grid", gridTemplateColumns: "clamp(76px, 22vw, 110px) minmax(0, 1fr) 64px", alignItems: "center", gap: 10 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Batas OJK</span><div style={{ height: 16, background: C.soft, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: h.batas / scale * 100 + "%", background: C.ink2, borderRadius: 99 }} /></div><span style={{ fontSize: 14, fontWeight: 700, textAlign: "right" }}>{fb(h.batas)}</span></div>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: offerColor }}>{ratio > 1 ? "✕ Terindikasi melebihi batas maksimum manfaat ekonomi" : "✓ Tidak melebihi batas maksimum manfaat ekonomi yang diperiksa"}</p>
                  <button type="button" onClick={() => setShowCalc(!showCalc)} style={{ ...ghostBtn, alignSelf: "flex-start" }}>{showCalc ? "Sembunyikan perhitungan" : "Lihat detail perhitungan"}</button>
                  {showCalc && (
                    <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
                      {langkahHitung(s, h).map((cs, i) => <li key={i}><strong>{cs.label}</strong><br /><span style={{ color: C.ink2 }}>{cs.val}</span></li>)}
                    </ol>
                  )}
                </div>

                {/* Kemampuan bayar */}
                <div style={{ ...resultCard, gap: 12 }}>
                  <h3 style={h3}>Kemampuan bayar</h3>
                  {h.filled ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={gridKecil}>
                        <div style={tile}><div style={{ fontSize: 12, color: C.muted }}>Penghasilan</div><div style={angkaSedang}>{rp(s.inc)}</div></div>
                        <div style={tile}><div style={{ fontSize: 12, color: C.muted }}>Semua cicilan</div><div style={angkaSedang}>{rp(h.allC)}</div></div>
                        <div style={tile}><div style={{ fontSize: 12, color: C.muted }}>Persentase cicilan</div><div style={{ ...angkaSedang, color: rasioColor }}>{pc(h.rasio, 1)}</div></div>
                      </div>
                      <div style={{ position: "relative", height: 14, background: C.soft, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: Math.min(h.rasio / 60, 1) * 100 + "%", background: rasioColor, borderRadius: 99 }} /><div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: C.ink }} /></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted }}><span>0%</span><span>garis = 30%</span><span>60%</span></div>
                      <p style={{ margin: 0, fontSize: 15 }}>Sisa uang per bulan setelah kebutuhan dan cicilan: <strong style={{ color: h.sisa < 0 ? "#B42318" : "#0E6B47" }}>{rp(h.sisa)}</strong></p>
                      <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{produktif ? "Batas 30% OJK berlaku untuk pinjaman konsumtif. Untuk pinjaman produktif, angka ini dipakai sebagai rekomendasi EduPuan." : "Batas 30% untuk pinjaman konsumtif: SEOJK 19/2025 Romawi XIII angka 2. Dihitung dari semua cicilan ke semua kreditur."}</p>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>Tidak dapat dinilai karena kondisi keuangan belum diisi (Langkah 5).</p>
                  )}
                </div>

                {/* Simulasi telat bayar */}
                <div style={{ ...resultCard, gap: 12 }}>
                  <h3 style={h3}>Bagaimana jika saya terlambat membayar?</h3>
                  <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.55 }}>Simulasi untuk edukasi. {late.basis}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {([[7, "7 hari"], [14, "14 hari"], [30, "30 hari"], ["c", "Lainnya"]] as [number | "c", string][]).map(([k, label]) => (
                      <button key={String(k)} type="button" onClick={() => setLateSel(k)} style={pill(lateSel === k)}>{label}</button>
                    ))}
                    {lateSel === "c" && <div style={{ width: 130 }}><NumInput id="f-late" ariaLabel="Jumlah hari terlambat" value={lateCustom} onChange={setLateCustom} placeholder="hari" /></div>}
                  </div>
                  <div style={gridKecil}>
                    <div style={tile}><div style={{ fontSize: 12, color: C.muted }}>Telat</div><div style={angkaSedang}>{late.hari}</div></div>
                    <div style={tile}><div style={{ fontSize: 12, color: C.muted }}>Denda</div><div style={{ ...angkaSedang, color: C.red }}>{late.denda}</div></div>
                    <div style={tile}><div style={{ fontSize: 12, color: C.muted }}>Total tagihan</div><div style={angkaSedang}>{late.total}</div></div>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{late.catatan}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: C.ink2 }}>
                    <li>Keterlambatan tercatat di SLIK OJK dan bisa menyulitkan pengajuan kredit di masa depan.</li>
                    <li>Penagih hanya boleh menagih kamu sendiri, tanpa ancaman atau mempermalukan. Kontak darurat hanya untuk konfirmasi keberadaan, bukan untuk ditagih.</li>
                  </ul>
                </div>

                {/* Gali lubang tutup lubang */}
                {isUtang && (
                  <div style={{ ...resultCard, gap: 12 }}>
                    <h3 style={h3}>Simulasi gali lubang tutup lubang</h3>
                    <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Kalau pinjaman ini nanti ditutup lagi dengan pinjaman baru berbiaya sama.</p>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: 380, borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                          <tr style={{ textAlign: "left", color: C.muted }}>
                            <th style={{ padding: "10px 8px", borderBottom: `1px solid ${C.line}`, fontWeight: 600 }}>Putaran</th>
                            <th style={{ padding: "10px 8px", borderBottom: `1px solid ${C.line}`, fontWeight: 600, textAlign: "right" }}>Pinjaman</th>
                            <th style={{ padding: "10px 8px", borderBottom: `1px solid ${C.line}`, fontWeight: 600, textAlign: "right" }}>Utang yang harus dibayar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gali.rows.map((g, i) => (
                            <tr key={i}>
                              <td style={{ padding: "10px 8px", borderBottom: `1px solid ${C.soft}` }}>{g.label}</td>
                              <td style={{ padding: "10px 8px", borderBottom: `1px solid ${C.soft}`, textAlign: "right" }}>{g.p}</td>
                              <td style={{ padding: "10px 8px", borderBottom: `1px solid ${C.soft}`, textAlign: "right", fontWeight: 700 }}>{g.t}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{gali.teks}</p>
                  </div>
                )}

                {/* Langkah berikutnya */}
                <div style={{ ...resultCard, gap: 12 }}>
                  <h3 style={h3}>Langkah berikutnya</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {v.ctas.map((label, i) => {
                      const gaya: React.CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: 46, padding: "0 18px", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none", cursor: "pointer", fontFamily: "inherit", ...(i === 0 ? { background: C.green, color: C.white, border: "none" } : { background: C.white, color: C.green, border: `1.5px solid ${C.green}` }) };
                      // "Tanya Puan AI" membuka jendela chat Puan (lewat PuanContext) dengan pertanyaan awal sesuai hasil cek
                      if (label === "Tanya Puan AI")
                        return (
                          <TombolTanyaPuan key={label} style={gaya} pertanyaan="Aku baru cek penawaran pinjol dan hasilnya disarankan untuk dipertimbangkan kembali. Apa saja yang perlu aku perhatikan sebelum memutuskan?">
                            {label}
                          </TombolTanyaPuan>
                        );
                      return (
                        <Link key={label} href={ctaHref[label] || "/"} style={gaya}>
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 12, color: C.muted, lineHeight: 1.65 }}>Hasil ini perkiraan untuk membantumu mengenali risiko, berdasarkan angka yang kamu masukkan. EduPuan tidak menyarankan, menawarkan, atau bekerja sama dengan aplikasi pinjaman mana pun. Hasil ini bukan nasihat keuangan atau hukum, dan bukan pernyataan bahwa suatu aplikasi legal atau ilegal. Batas mengikuti SEOJK 19/SEOJK.06/2025 (berlaku 31 Juli 2025), Romawi IX, XI, XIII, dan XIV.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}