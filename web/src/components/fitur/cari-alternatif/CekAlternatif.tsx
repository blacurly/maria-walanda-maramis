"use client";

/*
 * EduPuan — Cek Alternatif Lain
 * Halaman fitur lengkap: pembuka → pertanyaan (satu halaman) → hasil rekomendasi → direktori.
 * Styling dari ./cek-alternatif.css (class "ea-").
 */
import { useEffect, useState, type ReactNode } from "react";
import { ACTIONS, DIRECTORY, STATUS_LABEL, TEMPLATES, VERIFIED, type DirCategory, type DirectoryItem } from "@/features/cari-alternatif/data";
import { CATEGORIES, page, recommend, type Answers, type CategoryKey, type RecommendResult } from "@/features/cari-alternatif/rules";
import "./cek-alternatif.css";

type Screen = "home" | "q" | "result" | "dir";

const TIMING = {
  segera: ["ea-t-segera", "Bisa hari ini"],
  proses: ["ea-t-proses", "Butuh proses"],
  seleksi: ["ea-t-seleksi", "Lewat seleksi"],
} as const;

export interface CekAlternatifProps {
  /** Dipanggil saat pengguna menekan tombol kembali di halaman pembuka (keluar dari fitur). */
  onExit?: () => void;
  /** Logo EduPuan yang sudah ada di proyek. Jika kosong, dipakai logo teks. */
  logo?: ReactNode;
  /** Sembunyikan header jika halaman sudah dibungkus header/navbar proyek. */
  hideHeader?: boolean;
}

export default function CekAlternatif({ onExit, logo, hideHeader }: CekAlternatifProps) {
  const [screen, setScreen] = useState<Screen>("home");
  const [cat, setCat] = useState<CategoryKey | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [round, setRound] = useState(0);
  const [followupOk, setFollowupOk] = useState(false);
  const [dirFilter, setDirFilter] = useState<"semua" | DirCategory>("semua");
  const [dirFrom, setDirFrom] = useState<"home" | "result">("home");
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const [shownTpl, setShownTpl] = useState<Record<string, boolean>>({});
  const [copyMsg, setCopyMsg] = useState<Record<string, string>>({});
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  function go(next: Screen) {
    setScreen(next);
    setOpenSteps({});
    setShownTpl({});
    setCopyMsg({});
    scrollTop();
  }

  useEffect(() => {
  if (!scrollTarget) return;
  document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const t = setTimeout(() => setScrollTarget(null), 0);
  return () => clearTimeout(t);
}, [scrollTarget]);

  function back() {
    if (screen === "home") return onExit?.();
    if (screen === "q") return go("home");
    if (screen === "result") {
      if (round > 0) { setRound(round - 1); setFollowupOk(false); return go("result"); }
      return go("q");
    }
    if (screen === "dir") return go(dirFrom === "result" ? "result" : "home");
  }

  function startCategory(k: CategoryKey) {
    setCat(k); setAnswers({}); setRound(0); setFollowupOk(false);
    go("q");
  }

  /* ---------- PEMBUKA ---------- */
  const renderHome = () => (
    <>
      <div className="ea-eyebrow">Tanpa pinjaman</div>
      <h1 className="ea-h1">Cari Solusi Tanpa Menambah Utang</h1>
      <p className="ea-lead">Sedang kesulitan memenuhi kebutuhan atau membayar tagihan? Temukan alternatif yang bisa kamu coba sesuai kondisimu.</p>
      <div className="ea-cats">
        {(Object.keys(CATEGORIES) as CategoryKey[]).map(k => {
          const c = CATEGORIES[k];
          return (
            <button key={k} type="button" className="ea-cat" data-tone={k} onClick={() => startCategory(k)}>
              <div className="ea-cat-ico" aria-hidden="true">{c.icon}</div>
              <div><h3>{c.title}</h3><p>{c.desc}</p></div>
              <div className="ea-cat-go">Cari Solusi <span aria-hidden="true">→</span></div>
            </button>
          );
        })}
      </div>
      <div className="ea-home-foot">
        <span>Hanya 2–4 pertanyaan. Kami tidak meminta NIK atau data rekening.</span>
        <button type="button" className="ea-linkbtn" onClick={() => { setDirFrom("home"); go("dir"); }}>Lihat direktori bantuan resmi</button>
      </div>
    </>
  );

  /* ---------- PERTANYAAN (SATU HALAMAN) ---------- */
  const renderQuestions = () => {
    const c = CATEGORIES[cat!];
    const qs = c.questions;
    const done = qs.filter(q => answers[q.key]).length;
    const all = done === qs.length;
    const submit = () => {
      const missing = qs.find(q => !answers[q.key]);
      if (missing) { setScrollTarget("ea-g-" + missing.key); return; }
      setRound(0); setFollowupOk(false); go("result");
    };
    return (
      <>
        <div className="ea-qtop">
          <button type="button" className="ea-ghost" onClick={back}>← Kembali</button>
          <span className="ea-stepnum">{done} dari {qs.length} terjawab</span>
        </div>
        <div className="ea-progress" aria-hidden="true"><div style={{ width: `${(done / qs.length) * 100}%` }} /></div>
        <div className="ea-eyebrow">{c.title}</div>
        <h1 className="ea-h1 ea-sm">Ceritakan kondisimu</h1>
        <p className="ea-lead">Pilih satu jawaban di setiap pertanyaan, lalu lihat rekomendasinya.</p>
        <div className="ea-qform">
          {qs.map((q, i) => (
            <div key={q.key} id={"ea-g-" + q.key} className={"ea-qgroup" + (answers[q.key] ? " ea-answered" : "")}>
              <div className="ea-qlegend" id={"ea-l-" + q.key}><span className="ea-qn">{i + 1}</span>{q.text}</div>
              <div className="ea-opts" role="radiogroup" aria-labelledby={"ea-l-" + q.key}>
                {q.options.map(o => (
                  <button key={o.v} type="button" role="radio" className="ea-opt"
                    aria-checked={answers[q.key] === o.v}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.key]: o.v }))}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="ea-submitbar">
            <button type="button" className="ea-btn ea-solid ea-big" disabled={!all} onClick={submit}>Lihat rekomendasi →</button>
            {!all && <span className="ea-hint">Jawab semua pertanyaan dulu.</span>}
          </div>
        </div>
      </>
    );
  };

  /* ---------- KARTU REKOMENDASI ---------- */
  function copyTemplate(id: string) {
    const key = ACTIONS[id].template!;
    setShownTpl(p => ({ ...p, [id]: true }));
    const done = (msg: string) => {
      setCopyMsg(p => ({ ...p, [id]: msg }));
      setTimeout(() => setCopyMsg(p => { const n = { ...p }; delete n[id]; return n; }), 2500);
    };
    const fallback = () => {
      setTimeout(() => {
        const el = document.getElementById("ea-tpl-" + id);
        if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); }
      }, 0);
      done("Pilih teks di atas lalu salin");
    };
    try { navigator.clipboard.writeText(TEMPLATES[key]).then(() => done("Tersalin ✓"), fallback); }
    catch { fallback(); }
  }

  function renderCard(id: string, res: RecommendResult, i: number, compact: boolean) {
    const a = ACTIONS[id];
    const [tc, tl] = TIMING[a.timing];
    const why = res.reasons[id] || a.why;
    const open = !!openSteps[id];
    return (
      <article key={id} id={"ea-card-" + id} className={"ea-card" + (compact ? " ea-compact" : "") + (i === 0 && !compact ? " ea-lead-card" : "")}>
        <div className="ea-card-top">
          <h3>{!compact && <span className="ea-rank">{i + 1}</span>}{a.title}</h3>
          <span className={"ea-pill " + tc}>{tl}</span>
        </div>
        <div className="ea-kv"><b>Mengapa ini relevan</b>{why}</div>
        {!compact && (
          <>
            <div className="ea-kv ea-first"><b>Langkah pertama</b>{a.steps[0]}</div>
            <div className="ea-kv"><b>Dokumen yang mungkin diperlukan</b>{a.docs}</div>
            <div className="ea-kv"><b>Waktu</b>{a.timingText}</div>
            <div className="ea-kv"><b>Keterbatasan</b>{a.limit}</div>
          </>
        )}
        {open && <ol className="ea-steps">{a.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>}
        {a.template && shownTpl[id] && <div className="ea-tpl" id={"ea-tpl-" + id}>{TEMPLATES[a.template]}</div>}
        <div className="ea-actions">
          <button type="button" className="ea-btn" aria-expanded={open}
            onClick={() => setOpenSteps(p => ({ ...p, [id]: !p[id] }))}>
            {open ? "Sembunyikan langkah" : "Lihat langkah lengkap"}
          </button>
          {a.template && (
            <button type="button" className="ea-btn ea-solid" onClick={() => copyTemplate(id)}>
              {copyMsg[id] || "Salin template pesan"}
            </button>
          )}
        </div>
      </article>
    );
  }

  /* ---------- DIREKTORI ITEM ---------- */
  const renderDirItem = (d: DirectoryItem) => (
    <div key={d.id} className="ea-dir">
      <div className="ea-dir-top"><h4>{d.name}</h4><span className={"ea-pill ea-s-" + d.status}>{STATUS_LABEL[d.status]}</span></div>
      <dl>
        <dt>Sasaran</dt><dd>{d.target}</dd>
        <dt>Jadwal</dt><dd>{d.schedule}</dd>
        <dt>Syarat utama</dt><dd>{d.requirements}</dd>
        <dt>Dokumen</dt><dd>{d.docs}</dd>
        <dt>Cara mengajukan</dt><dd>{d.how}</dd>
      </dl>
      {d.url && (
        <div>
          <a href={d.url} target="_blank" rel="noopener noreferrer">{d.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
          {d.url2 && <> · <a href={d.url2[1]} target="_blank" rel="noopener noreferrer">{d.url2[0]}</a></>}
        </div>
      )}
      <span className="ea-meta">Terakhir diverifikasi: {d.verified}</span>
    </div>
  );

  /* ---------- HASIL ---------- */
  const renderResult = () => {
    const res = recommend(cat!, answers);
    const pg = page(res, round);
    const first = pg.main[0] ? ACTIONS[pg.main[0]] : null;
    const srcs = res.sources.map(id => DIRECTORY.find(d => d.id === id)).filter((d): d is DirectoryItem => !!d);
    const finished = pg.exhausted || pg.main.length === 0;

    const onFollowup = (v: "ok" | "no" | "guide") => {
      if (v === "ok") setFollowupOk(true);
      if (v === "no") { setRound(round + 1); setFollowupOk(false); go("result"); }
      if (v === "guide") { const id = pg.main[0]; setOpenSteps(p => ({ ...p, [id]: true })); setScrollTarget("ea-card-" + id); }
    };

    return (
      <>
        <div className="ea-qtop">
          <button type="button" className="ea-ghost" onClick={() => go("q")}>← Ubah jawaban</button>
          <button type="button" className="ea-linkbtn" onClick={() => { setCat(null); setAnswers({}); go("home"); }}>Mulai dari awal</button>
        </div>
        <p className="ea-summary">{res.summary}</p>

        {first && (
          <div className="ea-firststep">
            <span className="ea-lbl">{round === 0 ? "Lakukan ini dulu" : "Coba langkah berikutnya"}</span>
            <strong>{first.title}</strong>
            <p>{first.steps[0]}</p>
          </div>
        )}

        {res.emergency && (
          <div className="ea-emergency" role="alert">
            <strong>Kalau ini gawat darurat, utamakan keselamatan.</strong>
            <span>Rumah sakit dilarang menolak pasien gawat darurat atau meminta uang muka (UU No. 17/2023 Pasal 174 ayat 2). Layanan gawat darurat:</span>
            <span className="ea-callnum">119</span>
          </div>
        )}

        {res.crossLink && (
          <div className="ea-note ea-cross">
            Kamu siswa atau mahasiswa? Jalur pendidikan punya panduan lebih lengkap, termasuk PIP dan KIP Kuliah.{" "}
            <button type="button" className="ea-linkbtn" onClick={() => startCategory("pendidikan")}>Buka jalur pendidikan</button>
          </div>
        )}

        {finished ? (
          <div className="ea-section">
            <div className="ea-note">
              Kamu sudah melihat semua langkah untuk kondisi ini. Kalau belum ada yang berhasil, datangi Dinas Sosial atau kantor desa/kelurahan dan sampaikan kondisimu secara langsung. Kalau kondisimu berubah, tekan <b>Ubah jawaban</b> untuk melihat rekomendasi baru.
              {cat === "pendidikan" && answers.level === "smp_sma" && <> Untuk pertanyaan atau pengaduan PIP, hubungi ULT Kemendikdasmen di nomor <b>177</b>.</>}
            </div>
          </div>
        ) : (
          <>
            <section className="ea-section">
              <div className="ea-section-head"><h2 className="ea-h2">Rekomendasi utama</h2><small>Urut dari yang paling cocok</small></div>
              {pg.main.map((id, i) => renderCard(id, res, i, false))}
            </section>
            {pg.next.length > 0 && (
              <section className="ea-section">
                <div className="ea-section-head"><h2 className="ea-h2">Kalau belum berhasil</h2></div>
                {pg.next.map((id, i) => renderCard(id, res, i, true))}
              </section>
            )}
          </>
        )}

        {srcs.length > 0 && (
          <section className="ea-section">
            <div className="ea-section-head">
              <h2 className="ea-h2">Sumber bantuan resmi</h2>
              <button type="button" className="ea-linkbtn" onClick={() => { setDirFrom("result"); go("dir"); }}>Lihat semua</button>
            </div>
            {srcs.map(renderDirItem)}
          </section>
        )}

        {!finished && (
          <div className="ea-followup">
            <h2 className="ea-h2">Apakah kamu sudah mencoba langkah ini?</h2>
            {followupOk ? (
              <div className="ea-msg-ok">Senang mendengarnya. Simpan bukti pembayaran dan kesepakatan tertulis supaya tidak ada salah paham nanti.</div>
            ) : (
              <div className="ea-opts" role="group">
                <button type="button" className="ea-opt" onClick={() => onFollowup("ok")}>Sudah, berhasil mendapatkan solusi</button>
                <button type="button" className="ea-opt" onClick={() => onFollowup("no")}>Sudah, tetapi belum berhasil</button>
                <button type="button" className="ea-opt" onClick={() => onFollowup("guide")}>Belum, saya ingin melihat panduannya</button>
              </div>
            )}
            <span className="ea-foot" style={{ margin: 0 }}>Langkah ini tidak dijamin berhasil, tetapi semuanya bisa dicoba tanpa menambah utang.</span>
          </div>
        )}
        <p className="ea-foot">Data bantuan diperiksa manual pada {VERIFIED} dan tidak diperbarui otomatis. Selalu cek pengumuman di situs resmi.</p>
      </>
    );
  };

  /* ---------- DIREKTORI ---------- */
  const renderDirectory = () => {
    const F: ["semua" | DirCategory, string][] = [["semua", "Semua"], ["pendidikan", "Pendidikan"], ["kesehatan", "Kesehatan"], ["sosial", "Sosial"]];
    const list = DIRECTORY.filter(d => dirFilter === "semua" || d.category === dirFilter);
    return (
      <>
        <div className="ea-qtop"><button type="button" className="ea-ghost" onClick={back}>← Kembali</button></div>
        <div className="ea-eyebrow">Direktori</div>
        <h1 className="ea-h1">Sumber bantuan resmi</h1>
        <p className="ea-lead">Status pendaftaran hanya ditulis &quot;dibuka&quot; jika jadwalnya terverifikasi dari situs resmi.</p>
        <div className="ea-filters">
          {F.map(([k, l]) => (
            <button key={k} type="button" className="ea-chip" aria-pressed={dirFilter === k} onClick={() => setDirFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="ea-section" style={{ marginTop: 16 }}>{list.map(renderDirItem)}</div>
        <p className="ea-foot">Data statis, diperiksa manual pada {VERIFIED}. Tidak diperbarui otomatis.</p>
      </>
    );
  };

  return (
    <div className="ea">
      {!hideHeader && (
        <header className="ea-topbar">
          <div className="ea-topbar-in">
            <button type="button" className="ea-back" aria-label="Kembali" onClick={back}>←</button>
            {logo ?? <span className="ea-logo"><b>Edu</b><i>Puan</i></span>}
            <span className="ea-sep" aria-hidden="true" />
            <span className="ea-crumb">Cek Alternatif Lain</span>
          </div>
        </header>
      )}
      <main className="ea-wrap" aria-live="polite">
        {screen === "home" && renderHome()}
        {screen === "q" && cat && renderQuestions()}
        {screen === "result" && cat && renderResult()}
        {screen === "dir" && renderDirectory()}
      </main>
    </div>
  );
}
