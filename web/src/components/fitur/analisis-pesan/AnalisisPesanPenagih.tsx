"use client";

import { useState } from "react";

/* =========================================================
   Analisis Pesan Penagih — EduPuan
   Cara kerja: aturan kata (tanpa AI), dibaca per kalimat,
   memperhitungkan penyangkalan ("tidak") dan ancaman bersyarat.
   ========================================================= */

// ---------- 1. Normalisasi bahasa chat ----------
const SLANG: [RegExp, string][] = [
  [/\b(lu|lo|loe|elu|elo|km|kmu|kamuu|anda)\b/g, "kamu"],
  [/\b(klo|kalo|kl)\b/g, "kalau"],
  [/\b(sy|aq|gw|gue|gua)\b/g, "saya"],
  [/\b(tlp|telp|tlpn|telpon|nelpon)\b/g, "telepon"],
  [/\b(kluarga|klg|keluarg)\b/g, "keluarga"],
  [/\b(org)\b/g, "orang"],
  [/\b(yg)\b/g, "yang"],
  [/\b(skrg|skrng)\b/g, "sekarang"],
  [/\b(sebarin)\b/g, "sebarkan"],
  [/\b(disebarin)\b/g, "disebarkan"],
  [/\b(nyebarin|nyebar)\b/g, "menyebarkan"],
];
// semua variasi tulisan "tidak": gk, ga, gak, nggak, nggk, ngga, enggak, kagak, tdk, ndak, ...
const NEG_SLANG = /^(?:e?n?g+a*k+|e?n?g+a+|ka+ga+k*|tdk|tdak|tidk|tidaq|ndak|ndk|nda|gx|tak)$/;
const WORD_MAP: Record<string, string> = {
  jg: "juga", jga: "juga", akn: "akan", bkn: "bukan", blm: "belum", sdh: "sudah", udh: "sudah",
  udah: "sudah", dah: "sudah", mo: "mau", mw: "mau", dgn: "dengan", sm: "sama", krn: "karena",
  utk: "untuk", tp: "tapi", tpi: "tapi", dr: "dari", kmrn: "kemarin", bsk: "besok",
  lgsg: "langsung", aja: "saja", aj: "saja",
};
function normalize(s: string): string {
  let t = s.toLowerCase();
  SLANG.forEach(([re, to]) => { t = t.replace(re, to); });
  return t.replace(/[a-z0-9]+/g, (w) => (NEG_SLANG.test(w) ? "tidak" : WORD_MAP[w] ?? w));
}

// ---------- 2. Kata penanda ----------
// tanda krisis (dipertahankan dari versi lama): jika muncul, arahkan ke Halaman Darurat
const DARURAT = /bunuh diri|ingin mati|tidak mau hidup|akhiri hidup|lompat|gantung|overdosis/i;
const NEG = ["tidak", "bukan", "tanpa", "tak"];
const COND = ["asal", "asalkan", "kalau", "jika", "jikalau", "bila", "apabila", "kecuali", "selama"];

// ---------- 3. Aturan + dasar hukum ----------
// strong : frasa yang sendirinya sudah pelanggaran
// a + b  : harus ada aksi (a) DAN sasaran (b) dalam satu kalimat
type Rule = {
  id: string; rank: number; name: string; desc: string; law: string; tpl: string;
  strong?: string[]; a?: string[]; b?: string[]; serious?: boolean;
};

const RULES: Rule[] = [
  { id: "seks", rank: 1, name: "Pelecehan seksual", serious: true,
    desc: "Ucapan bernuansa seksual yang merendahkan, termasuk meminta 'dilayani' sebagai ganti bayar.",
    law: "UU No. 12 Tahun 2022 (TPKS) Pasal 5; Pasal 14 bila ada penyebaran konten seksual",
    strong: ["jual diri", "jual badan", "layani saya", "layani aku", "layani kami", "temani saya", "temani aku", "tidur dengan", "tidur sama", "open bo", "bugil", "telanjang", "tubuh", "badan kamu", "sange", "ngewe", "kontol", "memek"],
    tpl: "Pesan Anda mengandung pelecehan seksual yang dapat dipidana berdasarkan UU No. 12 Tahun 2022 tentang Tindak Pidana Kekerasan Seksual. Percakapan ini saya simpan sebagai bukti untuk dilaporkan." },
  { id: "ancam", rank: 2, name: "Ancaman kekerasan / intimidasi", serious: true,
    desc: "Ancaman melukai, membawa paksa, atau mengintimidasi peminjam.",
    law: "POJK 22/2023 Pasal 62 (larangan ancaman dan kekerasan); UU ITE Pasal 29 jo. 45B",
    strong: ["bunuh", "membunuh", "habisi", "menghabisi", "hajar", "menghajar", "celakai", "mencelakai", "bacok", "membacok", "gebuk", "pukul", "memukul", "tusuk", "menusuk", "awas kamu", "lihat saja nanti", "hati-hati di jalan", "tahu kamu pulang", "tahu alamat"],
    a: ["geruduk", "menggeruduk", "ramai-ramai", "jemput paksa", "bawa paksa", "sita", "menyita", "obrak-abrik", "seret", "menyeret"],
    b: ["rumah", "kantor", "alamat", "barang", "motor", "mobil", "kamu", "tempat kerja"],
    tpl: "Ancaman yang Anda sampaikan melanggar POJK No. 22 Tahun 2023 dan dapat dipidana berdasarkan UU ITE. Percakapan ini saya simpan sebagai bukti dan akan saya laporkan ke OJK (157) serta kepolisian bila berlanjut." },
  { id: "sebar", rank: 3, name: "Menyebar data pribadi",
    desc: "Ancaman atau tindakan menyebarkan foto, KTP, atau data ke orang lain atau media sosial.",
    law: "UU No. 27 Tahun 2022 (PDP) Pasal 65 ayat (2) jo. 67 ayat (2); POJK 22/2023 Pasal 62",
    a: ["sebar", "menyebar", "menyebarkan", "viral", "viralkan", "memviralkan", "posting", "memposting", "upload", "unggah", "mengunggah", "umumkan", "mengumumkan", "blast", "bagikan", "membagikan", "pajang", "memajang", "pasang", "memasang"],
    b: ["data", "foto", "ktp", "wajah", "identitas", "selfie", "kontak", "grup", "medsos", "media sosial", "facebook", "fb", "instagram", "ig", "tiktok", "status"],
    tpl: "Menyebarkan data pribadi saya tanpa hak melanggar UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi dan POJK No. 22 Tahun 2023. Percakapan ini saya simpan sebagai bukti untuk dilaporkan." },
  { id: "malu", rank: 4, name: "Mempermalukan",
    desc: "Memberi cap buruk (penipu, maling, DPO) atau sengaja membuat peminjam malu.",
    law: "POJK 22/2023 Pasal 62 (larangan tindakan yang mempermalukan konsumen)",
    strong: ["dpo", "buronan", "biar malu", "permalukan", "mempermalukan", "dipermalukan"],
    a: ["penipu", "maling", "pencuri", "pengemplang", "tukang ngutang", "tidak tahu malu", "sampah"],
    b: ["kamu", "dasar", "si"],
    tpl: "Penagihan yang mempermalukan saya melanggar POJK No. 22 Tahun 2023. Mohon hentikan. Percakapan ini saya simpan sebagai bukti." },
  { id: "pihak", rank: 5, name: "Menagih ke orang lain",
    desc: "Menghubungi atau memberi tahu keluarga, kantor, teman, atau kontak darurat soal utang.",
    law: "POJK 22/2023 Pasal 62 (tidak kepada pihak selain konsumen); SEOJK 19/2023",
    a: ["hubungi", "menghubungi", "telepon", "menelepon", "chat", "wa", "sms", "kabari", "mengabari", "beritahu", "memberitahu", "kasih tahu", "tagih", "menagih", "datangi", "mendatangi", "ikut tahu", "tahu semua"],
    b: ["keluarga", "suami", "istri", "orang tua", "ortu", "ibu kamu", "ayah kamu", "ibumu", "ayahmu", "bapakmu", "mamamu", "papamu", "anak kamu", "anakmu", "saudara", "atasan", "bos", "kantor", "hrd", "rekan kerja", "teman", "tetangga", "kontak darurat", "mertua", "pacar"],
    tpl: "Penagihan hanya boleh ditujukan kepada saya, tidak kepada keluarga, teman, atau kantor saya, sesuai POJK No. 22 Tahun 2023. Mohon hentikan menghubungi pihak lain." },
  { id: "pidana", rank: 6, name: "Menakut-nakuti dengan pidana",
    desc: "Mengancam penjara atau polisi karena telat bayar. Gagal bayar adalah wanprestasi (perdata).",
    law: "POJK 22/2023 Pasal 62 (tekanan verbal); UU ITE Pasal 29 (menakut-nakuti)",
    a: ["penjara", "dipenjara", "pidana", "pidanakan", "dipidanakan", "polisi", "polisikan", "dipolisikan", "ditangkap", "tangkap", "penggelapan", "pasal 378"],
    b: ["kamu"],
    tpl: "Keterlambatan pembayaran adalah urusan perdata, bukan pidana. Menakut-nakuti dengan ancaman pidana termasuk tekanan verbal yang dilarang POJK No. 22 Tahun 2023. Saya akan menyelesaikan kewajiban sesuai perjanjian." },
  { id: "sara", rank: 7, name: "Merendahkan SARA",
    desc: "Hinaan yang menyangkut suku, agama, ras, atau golongan.",
    law: "SEOJK 19/2023 (larangan intimidasi dan merendahkan SARA)",
    a: ["dasar", "pantas", "pantesan", "memang", "kaum", "semua orang", "tukang"],
    b: ["cina", "china", "aseng", "kafir", "pribumi", "batak", "jawa", "padang", "ambon", "papua", "bugis", "makassar", "madura", "sunda", "islam", "kristen", "katolik", "hindu", "buddha", "agamamu", "sukumu"],
    tpl: "Penagihan yang merendahkan suku, agama, ras, atau golongan dilarang oleh OJK. Mohon berkomunikasi dengan sopan. Percakapan ini saya simpan sebagai bukti." },
  { id: "kasar", rank: 8, name: "Kata kasar / tekanan verbal",
    desc: "Makian atau hinaan langsung kepada peminjam.",
    law: "POJK 22/2023 Pasal 62 (larangan tekanan fisik maupun verbal)",
    strong: ["anjing", "babi", "bangsat", "goblok", "goblog", "tolol", "bego", "idiot", "kampret", "brengsek", "bajingan", "keparat", "monyet", "sialan", "tai", "otak udang"],
    tpl: "Saya bersedia membahas penyelesaian, tetapi saya tidak menerima kata-kata kasar. Tekanan verbal dalam penagihan melanggar POJK No. 22 Tahun 2023." },
];

// ---------- 4. Pencocokan kata ----------
type Found = { word: string; index: number; targets?: Found[] };
type Item = { sentence: string; marks: string[]; conditional: boolean };
type Hit = { rule: Rule; items: Item[] };
type Result = { tooShort: boolean; hits: Hit[] };

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function kwRegex(k: string) {
  const body = escRe(k).replace(/\s+/g, "\\s+");
  return new RegExp("(^|[^a-z])((?:di|ter)?" + body + "(?:kan|in|nya|mu|ku|lah)?)(?=[^a-z]|$)", "g");
}
function findAll(sentence: string, list?: string[]): Found[] {
  const out: Found[] = [];
  (list || []).forEach((k) => {
    const re = kwRegex(k);
    let m: RegExpExecArray | null;
    while ((m = re.exec(sentence))) out.push({ word: m[2], index: m.index + m[1].length });
  });
  return out;
}
function negated(sentence: string, idx: number) {
  // 3 kata sebelum kata pemicu, dalam anak kalimat yang sama (tidak melewati koma)
  const clause = sentence.slice(0, idx).split(/[,;:]/).pop() || "";
  const before = clause.split(/[^a-z]+/).filter(Boolean).slice(-3);
  return before.some((w) => NEG.includes(w));
}
const hasCond = (s: string) => s.split(/[^a-z]+/).some((w) => COND.includes(w));
const splitSentences = (text: string) =>
  text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

// ---------- 5. Mesin analisis ----------
export function analyzeText(text: string): Result {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 4) return { tooShort: true, hits: [] };

  const hits: Record<string, Hit> = {};
  splitSentences(text).forEach((orig) => {
    const s = normalize(orig);
    RULES.forEach((r) => {
      let triggers = findAll(s, r.strong);
      if (r.a) {
        const targets = findAll(s, r.b);
        if (targets.length) triggers = triggers.concat(findAll(s, r.a).map((x) => ({ ...x, targets })));
      }
      if (!triggers.length) return;
      const live = triggers.filter((t) => !negated(s, t.index));
      let conditional = false;
      if (!live.length) {
        if (hasCond(s)) conditional = true;
        else return;
      }
      const used = live.length ? live : triggers;
      const marks = used.map((t) => t.word).concat(used.flatMap((t) => (t.targets || []).map((x) => x.word)));
      (hits[r.id] = hits[r.id] || { rule: r, items: [] }).items.push({ sentence: orig, marks, conditional });
    });
  });
  return { tooShort: false, hits: Object.values(hits).sort((x, y) => x.rule.rank - y.rule.rank) };
}

// ---------- 6. Sorot kata yang melanggar ----------
function Highlight({ sentence, marks }: { sentence: string; marks: string[] }) {
  const uniq = [...new Set(marks)].sort((a, b) => b.length - a.length);
  if (!uniq.length) return <>{sentence}</>;
  const re = new RegExp("(" + uniq.map((w) => escRe(w).replace(/\s+/g, "\\s+")).join("|") + ")", "gi");
  const parts = sentence.split(re);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
    </>
  );
}

// ---------- 7. Ikon ----------
const IcoBack = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);
const IcoBad = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
);
const IcoInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
);
const IcoCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
);
const IcoClip = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM8.5 11h7M8.5 14.5h7M8.5 18h4" /></svg>
);

// ---------- 8. Komponen halaman ----------
type Props = {
  onBack?: () => void;         // kembali ke halaman sebelumnya
  onSemuaHak?: () => void;     // buka halaman "Hak Saat Ditagih"
  onDokumentasi?: () => void;  // buka halaman "Dokumentasi"
  onDarurat?: () => void;      // buka "Halaman Darurat"
};

export default function AnalisisPesanPenagih({ onBack, onSemuaHak, onDokumentasi, onDarurat }: Props) {
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [showDoc, setShowDoc] = useState(false);
  const [copied, setCopied] = useState(false);

  const onChange = (v: string) => {
    setMsg(v);
    if (!v.trim()) { setResult(null); setShowDoc(false); } // kosong → kembali ke tampilan awal
  };
  const analyze = () => { setResult(analyzeText(msg.trim())); setShowDoc(false); setCopied(false); };
  const reset = () => { setMsg(""); setResult(null); setShowDoc(false); };

  const top = result && result.hits.length ? result.hits[0].rule : null;
  const darurat = !!result && DARURAT.test(msg);
  const anySerious = !!result?.hits.some((h) => h.rule.serious);

  const copyTpl = async () => {
    if (!top) return;
    try { await navigator.clipboard.writeText(top.tpl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* jika gagal, pengguna bisa memblok teks manual */ }
  };

  return (
    <div className="app-wrap">
      <style>{CSS}</style>

      <header>
        <div className="app-top">
          <button className="app-back" type="button" aria-label="Kembali ke halaman sebelumnya" onClick={onBack}><IcoBack /></button>
          <h1>Analisis Pesan Penagih</h1>
        </div>
        <p className="app-sub">Tempel pesan dari penagih. Kami bantu kenali pelanggarannya dan siapkan template balasan.</p>
      </header>

      <div className="app-grid">
        {/* Kolom kiri */}
        <div className="app-col">
          <div className="app-info"><strong>Tutup info pribadi dulu.</strong> Sebaiknya hapus nama dan nomor HP sebelum menempel. Data tidak disimpan.</div>
          <label className="app-lbl" htmlFor="app-msg">Tempel teks pesan penagih</label>
          <textarea
            id="app-msg"
            value={msg}
            onChange={(e) => onChange(e.target.value)}
            placeholder={'Contoh: "Kalau tidak bayar hari ini akan saya sebarkan ke semua kontak kamu dan keluarga kamu!"'}
          />
          <button className="app-btn" type="button" disabled={!msg.trim()} onClick={analyze}>Analisis Pesan →</button>
          <details className="app-rules">
            <summary>Lihat aturan yang dipakai</summary>
            <ol>
              {RULES.map((r) => (
                <li key={r.id}><b>{r.name}</b><span>{r.desc}</span><span>Dasar: {r.law}</span></li>
              ))}
            </ol>
          </details>
        </div>

        {/* Kolom kanan */}
        <div className="app-col" aria-live="polite">
          {!result && (
            <div className="app-empty"><IcoClip />Hasil analisis akan muncul di sini</div>
          )}

          {result?.tooShort && (
            <div className="app-box">
              <div className="app-head"><span className="app-dot warn"><IcoInfo /></span>Pesan terlalu pendek</div>
              <p className="app-muted">Tempel pesan lengkap dari penagih (minimal satu kalimat utuh) supaya hasilnya akurat.</p>
            </div>
          )}

          {darurat && (
            <div className="app-crisis">
              <div className="app-crisis-title">🆘 Kamu tidak sendirian.</div>
              <p>Kami melihat tanda yang mengkhawatirkan. Hubungi bantuan dulu, analisis pesan bisa menunggu.</p>
              <button type="button" className="app-crisis-btn" onClick={onDarurat}>Buka Halaman Darurat →</button>
              <a className="app-crisis-tel" href="tel:119">📞 Healing119: 119 ext 8</a>
            </div>
          )}

          {result && !result.tooShort && (
            <>
              <div className="app-box">
                {result.hits.length ? (
                  <>
                    <div className="app-head"><span className="app-dot bad"><IcoBad /></span>{result.hits.length} pelanggaran terdeteksi</div>
                    {result.hits.map((h) => {
                      const cond = h.items.some((i) => i.conditional);
                      return (
                        <div className="app-viol" key={h.rule.id}>
                          <div className="app-viol-top">
                            <strong>{h.rule.name}</strong>
                            {cond && <span className="app-tag">Ancaman bersyarat</span>}
                          </div>
                          {cond && <p>Kalimatnya memakai kata "tidak", tapi disertai syarat. Ini tetap bentuk ancaman.</p>}
                          {h.items.map((i, k) => (
                            <div className="app-quote" key={k}>“<Highlight sentence={i.sentence} marks={i.marks} />”</div>
                          ))}
                          <div className="app-law"><b>Dasar hukum:</b> {h.rule.law}</div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <div className="app-head"><span className="app-dot ok"><IcoInfo /></span>Tidak ditemukan pelanggaran yang jelas</div>
                    <p className="app-muted">Bukan berarti pesan ini pasti wajar. Tetap simpan tangkapan layarnya. Kalau kamu merasa terancam, hubungi OJK (157).</p>
                    <button className="app-a2 app-self" type="button" onClick={onSemuaHak}>Cocokkan dengan hak saat ditagih →</button>
                  </>
                )}
              </div>

              {top && (
                <>
                  <h2>Template balasan:</h2>
                  {anySerious && (
                    <div className="app-alert"><strong>Kamu tidak wajib membalas.</strong> Untuk ancaman atau pelecehan, simpan bukti lalu langsung lapor.</div>
                  )}
                  <div className="app-tpl">
                    <span className="app-lbl">{top.name}</span>
                    <p>{top.tpl}</p>
                    <button className="app-copy" type="button" onClick={copyTpl}><IcoCopy /><span>{copied ? "Tersalin ✓" : "Salin"}</span></button>
                  </div>
                </>
              )}

              <div className="app-acts">
                <button className="app-a1" type="button" aria-expanded={showDoc} onClick={() => (onDokumentasi ? onDokumentasi() : setShowDoc((v) => !v))}>Dokumentasikan</button>
                <button className="app-a2" type="button" onClick={onSemuaHak}>Semua hak →</button>
              </div>
              {showDoc && (
                <div className="app-doc">
                  <strong>Simpan bukti ini sebelum menghapus apa pun:</strong>
                  <ul>
                    <li>Tangkapan layar pesan, terlihat nomor pengirim, tanggal, dan jam</li>
                    <li>Riwayat panggilan masuk dari nomor penagih</li>
                    <li>Nama aplikasi pinjol dan nomor perjanjian pinjaman</li>
                  </ul>
                </div>
              )}
              <button className="app-reset" type="button" onClick={reset}>Analisis pesan lain</button>
              <div className="app-note">Ini bantuan awal, bukan pendapat hukum. Ancaman yang sangat terselubung bisa saja tidak terdeteksi. Konsultasikan kasus serius ke OJK (157).</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- 9. Gaya (khusus halaman ini, semua kelas berawalan app-) ----------
const CSS = `
.app-wrap{
  --bg:#f6f8f9; --surface:#ffffff; --fg:#141a24; --muted:#6b7480; --line:#e3e8ec;
  --brand:#0d6e4f; --brand-soft:#e3f2ec; --brand-off:#9cc3b5;
  --info:#0b5a7a; --info-bg:#eef8fd; --info-line:#bfe6f5;
  --bad:#c0262d; --bad-bg:#fff0f0; --bad-line:#f8cfd1;
  --warn:#9a5b00; --warn-bg:#fff8e6; --warn-line:#f6df9e;
  --accent-bg:#f0ebfc; --mark:#ffe28a;
  max-width:1120px; margin:0 auto; padding:36px 16px 56px; display:grid; gap:28px;
  background:var(--bg); color:var(--fg); font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif; font-size:15px; line-height:1.6;
}
.app-wrap *{box-sizing:border-box}
.app-top{display:flex;gap:14px;align-items:center}
.app-back{width:44px;height:44px;flex:none;display:grid;place-items:center;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--fg);cursor:pointer}
.app-back:hover{border-color:var(--brand);color:var(--brand)}
.app-wrap h1{font-family:"Poppins",system-ui,sans-serif;font-weight:800;font-size:clamp(24px,4vw,34px);line-height:1.2;margin:0;letter-spacing:-.01em}
.app-sub{margin:10px 0 0;color:var(--muted);font-size:16px}
.app-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start}
.app-col{display:grid;gap:16px;min-width:0}
@media (max-width:820px){.app-grid{grid-template-columns:1fr;gap:28px}}
.app-info{background:var(--info-bg);border:1px solid var(--info-line);color:var(--info);border-radius:16px;padding:16px 20px}
.app-lbl{font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.app-wrap textarea{width:100%;min-height:200px;resize:vertical;font:inherit;font-size:16px;color:var(--fg);background:var(--surface);border:1.5px solid var(--line);border-radius:16px;padding:16px 20px}
.app-wrap textarea:focus{outline:none;border-color:var(--brand)}
.app-btn{font:inherit;font-weight:700;font-size:16px;border:0;border-radius:14px;padding:15px 20px;cursor:pointer;background:var(--brand);color:#fff;width:100%}
.app-btn:disabled{background:var(--brand-off);cursor:not-allowed}
.app-btn:not(:disabled):hover{filter:brightness(1.08)}
.app-wrap :focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.app-rules{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px 20px}
.app-rules summary{cursor:pointer;font-weight:600;font-size:14px}
.app-rules ol{margin:12px 0 4px;padding-left:20px;display:grid;gap:8px;font-size:13.5px}
.app-rules li span{display:block;color:var(--muted);font-size:12.5px}
.app-empty{border:2px dashed var(--line);border-radius:18px;min-height:440px;display:grid;place-content:center;justify-items:center;gap:12px;color:var(--muted);text-align:center;padding:24px}
.app-box{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:22px;display:grid;gap:12px;box-shadow:0 1px 3px rgba(20,26,36,.05)}
.app-head{display:flex;align-items:center;gap:12px;font-size:18px;font-weight:600}
.app-dot{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:none}
.app-dot.bad{background:var(--bad-bg);color:var(--bad)}
.app-dot.ok{background:var(--brand-soft);color:var(--brand)}
.app-dot.warn{background:var(--warn-bg);color:var(--warn)}
.app-muted{margin:0;color:var(--muted)}
.app-viol{background:var(--bad-bg);border:1px solid var(--bad-line);border-radius:14px;padding:14px 16px;display:grid;gap:6px}
.app-viol-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.app-viol strong{color:var(--bad);font-size:16px}
.app-viol p{margin:0;font-size:14px}
.app-tag{font-size:11.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:var(--surface);color:var(--bad);border:1px solid var(--bad-line)}
.app-quote{font-size:14px;background:var(--surface);border-radius:10px;padding:8px 12px;word-break:break-word}
.app-quote mark{background:var(--mark);color:inherit;border-radius:3px;padding:0 2px}
.app-law{font-size:12.5px;color:var(--muted)}
.app-law b{color:var(--fg);font-weight:600}
.app-wrap h2{font-size:16px;margin:4px 0 0;font-weight:700}
.app-alert{background:var(--accent-bg);border-radius:14px;padding:12px 16px;font-size:14px}
.app-tpl{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px 20px;display:grid;gap:8px;box-shadow:0 1px 3px rgba(20,26,36,.05)}
.app-tpl p{margin:0}
.app-copy{font:inherit;font-size:14px;font-weight:600;color:var(--brand);background:none;border:0;cursor:pointer;display:inline-flex;gap:6px;align-items:center;padding:4px 0;justify-self:start}
.app-acts{display:flex;flex-wrap:wrap;gap:10px}
.app-a1,.app-a2{font:inherit;font-weight:700;font-size:15px;border-radius:14px;padding:13px 20px;cursor:pointer}
.app-a1{background:var(--brand);color:#fff;border:0}
.app-a2{background:var(--surface);color:var(--brand);border:1.5px solid var(--brand)}
.app-doc{background:var(--brand-soft);border-radius:14px;padding:14px 18px}
.app-doc ul{margin:6px 0 0;padding-left:20px;display:grid;gap:4px}
.app-reset{font:inherit;font-size:13px;color:var(--muted);background:none;border:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;justify-self:start;padding:0}
.app-self{justify-self:start}
.app-crisis{background:#dc2626;color:#fff;border-radius:18px;padding:20px;display:grid;gap:10px}
.app-crisis-title{font-weight:700;font-size:18px}
.app-crisis p{margin:0;font-size:14px;color:#fee2e2}
.app-crisis-btn{font:inherit;font-weight:700;font-size:14px;background:#fff;color:#b91c1c;border:0;border-radius:12px;padding:12px;cursor:pointer}
.app-crisis-tel{display:block;text-align:center;font-weight:600;font-size:14px;background:rgba(255,255,255,.2);color:#fff;border-radius:12px;padding:10px;text-decoration:none}
.app-note{background:var(--warn-bg);border:1px solid var(--warn-line);color:var(--warn);border-radius:14px;padding:14px 18px;font-size:14px}
`;