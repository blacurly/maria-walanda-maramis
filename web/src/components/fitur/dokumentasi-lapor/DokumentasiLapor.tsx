"use client";

import { useEffect, useMemo, useRef, useState } from "react"
import { LEGAL_PINJOL, ILEGAL_NAMES } from "@/data/dataPinjol"

/* =============================================================================
   DOKUMENTASI & LAPOR — EduPuan
   Alur 3 langkah: 1) Tulis kronologi → 2) Hasil laporan → 3) Panduan melapor
   Status legalitas dideteksi otomatis dari data fitur Cek Legalitas
   (LEGAL_PINJOL & ILEGAL_NAMES di src/lib/dataPinjol).
   ============================================================================= */

// Samakan dengan tanggal update data di fitur Cek Legalitas setiap kali datanya diperbarui.
const OJK_DATA_ASOF = "Oktober 2026"

type Status = "legal" | "ilegal" | "tidak-tahu"
type Entry = {
  id: number
  tgl: string
  jam: string
  isi: string
  jenis: string[]
  bukti: string[]
  contoh?: boolean
}
type Detect =
  | { state: "empty" }
  | { state: "legal"; nama: string; pt: string }
  | { state: "maybe"; nama: string }
  | { state: "ilegal-list"; nama: string }
  | { state: "notfound" }

const JENIS: [string, string][] = [
  ["teror", "Telepon/chat berulang"],
  ["kasar", "Kata kasar / hinaan"],
  ["ancam", "Ancaman"],
  ["peras", "Pemerasan / minta uang di luar tagihan"],
  ["kontak", "Menghubungi kontak saya"],
  ["data", "Menyebar data pribadi"],
  ["kbgo", "Menyebar / mengancam sebar foto (KBGO)"],
  ["fisik", "Ancaman kekerasan fisik / datang ke rumah"],
]
const BUKTI: [string, string][] = [
  ["ss", "Screenshot chat"],
  ["rek", "Rekaman telepon"],
  ["log", "Riwayat panggilan"],
  ["tf", "Bukti transfer"],
  ["perj", "Perjanjian pinjaman"],
  ["saksi", "Saksi"],
]
const L: Record<string, string> = Object.fromEntries([...JENIS, ...BUKTI])

const FRASA: Record<string, string> = {
  teror: "menelepon/mengirim chat berulang kali",
  kasar: "berkata kasar dan menghina saya",
  ancam: "mengancam saya",
  peras: "meminta uang di luar jumlah tagihan",
  kontak: "menghubungi kontak/keluarga saya",
  data: "menyebarkan data pribadi saya",
  kbgo: "menyebarkan atau mengancam menyebar foto/konten pribadi saya",
  fisik: "mengancam kekerasan fisik atau datang ke rumah",
}

const CONTOH: Entry[] = [
  {
    id: 1,
    tgl: "2026-10-03",
    jam: "08:40",
    isi: "Penagih menelepon 12 kali dalam 2 jam dan menyebut saya penipu.",
    jenis: ["teror", "kasar"],
    bukti: ["log", "ss"],
    contoh: true,
  },
  {
    id: 2,
    tgl: "2026-10-05",
    jam: "19:15",
    isi: "Penagih mengirim pesan ke kakak saya dan mengancam menyebar foto KTP saya ke grup kantor jika tidak membayar hari itu.",
    jenis: ["kontak", "ancam", "data"],
    bukti: ["ss"],
    contoh: true,
  },
]

type Route = {
  t: string
  why: string
  steps: string[]
  links: [string, string][]
  contacts: [string, string][]
}
const ROUTES: Record<string, Route> = {
  penyelenggara: {
    t: "Adukan dulu ke penyelenggara pinjol",
    why: "Pinjol terdaftar wajib punya layanan pengaduan. OJK biasanya meminta bukti bahwa kamu sudah mengadu ke penyelenggara.",
    steps: [
      "Buka menu Pengaduan / Bantuan di aplikasi, atau email resmi penyelenggara.",
      "Tempel laporan dari langkah 2 dan lampirkan bukti.",
      "Simpan nomor tiket dan tunggu jawaban (umumnya maks. 10 hari kerja). Jika tidak ditanggapi atau tidak selesai, lanjut ke OJK.",
    ],
    links: [],
    contacts: [],
  },
  ojk: {
    t: "OJK — Kontak 157",
    why: "Untuk pelanggaran penagihan oleh pinjol terdaftar, atau jika aduan ke penyelenggara tidak selesai.",
    steps: [
      "Buka portal pengaduan konsumen OJK dan buat akun.",
      "Pilih jenis aduan, tempel kronologi, unggah bukti dan bukti aduan ke penyelenggara.",
      "Catat nomor laporan untuk memantau.",
    ],
    links: [["Buka portal Kontak 157", "https://kontak157.ojk.go.id"]],
    contacts: [
      ["Telepon", "157"],
      ["WhatsApp", "081157157157"],
      ["Email", "konsumen@ojk.go.id"],
    ],
  },
  pasti: {
    t: "Satgas PASTI (OJK) — laporkan pinjol ilegal",
    why: "Satgas PASTI menindak dan memblokir pinjol ilegal. Laporanmu membantu menghentikan aplikasinya.",
    steps: [
      "Buka situs Satgas PASTI dan pilih buat laporan pengaduan.",
      "Isi nama aplikasi, nomor penagih, dan tempel kronologi.",
      "Kamu akan menerima email tanda terima laporan.",
    ],
    links: [["Lapor ke Satgas PASTI", "https://sipasti.ojk.go.id"]],
    contacts: [
      ["WhatsApp OJK", "081157157157"],
      ["Email", "konsumen@ojk.go.id"],
    ],
  },
  polisi: {
    t: "Polisi — ancaman, pemerasan, penyebaran data",
    why: "Ancaman, pemerasan, dan menyebar data pribadi adalah tindak pidana, baik pelakunya pinjol legal maupun ilegal.",
    steps: [
      "Buat aduan online di Patroli Siber Bareskrim, atau datang ke SPKT Polres terdekat.",
      "Bawa laporan dari langkah 2 dalam bentuk cetak, KTP, dan HP berisi bukti asli.",
      "Minta tanda bukti lapor (STPL).",
    ],
    links: [["Buka Patroli Siber", "https://patrolisiber.id"]],
    contacts: [["Darurat (bahaya saat ini)", "110"]],
  },
  kbgo: {
    t: "Komnas Perempuan & SAPA 129 — kekerasan berbasis gender online",
    why: "Untuk ancaman sebar foto, pelecehan, atau penyebaran konten pribadi. Kamu bisa mendapat pendampingan dan rujukan layanan di daerahmu.",
    steps: [
      "Hubungi SAPA 129 untuk pendampingan dan rujukan ke UPTD PPA terdekat.",
      "Kirim laporan ke Komnas Perempuan lewat email pengaduan.",
      "Jangan membalas atau bernegosiasi dengan pelaku soal konten.",
    ],
    links: [["Situs Komnas Perempuan", "https://komnasperempuan.go.id"]],
    contacts: [
      ["SAPA 129 (telepon)", "129"],
      ["SAPA 129 (WhatsApp)", "08111129129"],
      ["Komnas Perempuan", "pengaduan@komnasperempuan.go.id"],
    ],
  },
  konten: {
    t: "Komdigi — blokir konten dan aplikasi",
    why: "Minta penurunan konten yang disebar, atau pemblokiran situs/aplikasi pinjol ilegal.",
    steps: [
      "Buka situs Aduan Konten.",
      "Sertakan tautan atau tangkapan layar konten dan nama aplikasi.",
      "Simpan nomor tiket aduan.",
    ],
    links: [["Buka Aduan Konten", "https://aduankonten.id"]],
    contacts: [],
  },
}

// ─── helpers ────────────────────────────────────────────────────────────────
const norm = (s: string) =>
  s.toLowerCase().replace(/^pt\.?\s+/, "").replace(/[^a-z0-9]/g, "")
const fmtTgl = (d: string) =>
  new Date(d + "T00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
const fmtShort = (d: string) =>
  new Date(d + "T00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
const sortEntries = (e: Entry[]) =>
  [...e].sort((a, b) => (a.tgl + a.jam).localeCompare(b.tgl + b.jam))

function detectApp(input: string): Detect {
  const q = norm(input)
  if (q.length < 3) return { state: "empty" }
  const exact = LEGAL_PINJOL.find(
    (x) => norm(x.nama) === q || (x.pt && norm(x.pt) === q),
  )
  if (exact) return { state: "legal", nama: exact.nama, pt: exact.pt }
  const ilegal = ILEGAL_NAMES.find((x) => norm(x) === q)
  if (ilegal) return { state: "ilegal-list", nama: ilegal }
  const near = LEGAL_PINJOL.find(
    (x) =>
      norm(x.nama).includes(q) ||
      q.includes(norm(x.nama)) ||
      (x.pt && norm(x.pt).includes(q)),
  )
  if (near) return { state: "maybe", nama: near.nama }
  return { state: "notfound" }
}

function autoSentence(jenis: string[]) {
  const sel = JENIS.map((j) => j[0])
    .filter((v) => jenis.includes(v))
    .map((v) => FRASA[v])
  if (!sel.length) return ""
  const list =
    sel.length === 1
      ? sel[0]
      : sel.slice(0, -1).join(", ") + " dan " + sel[sel.length - 1]
  return "Penagih " + list + "."
}

// ─── component ──────────────────────────────────────────────────────────────
export default function DokumentasiLapor({
  onBack,
  onCekLegalitas,
  demo = false,
}: {
  onBack: () => void
  onCekLegalitas?: () => void
  demo?: boolean
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [app, setApp] = useState("")
  const [nomor, setNomor] = useState("")
  const [entries, setEntries] = useState<Entry[]>(demo ? CONTOH : [])
  const [tgl, setTgl] = useState("")
  const [jam, setJam] = useState("")
  const [isi, setIsi] = useState("")
  const [jenis, setJenis] = useState<string[]>([])
  const [bukti, setBukti] = useState<string[]>([])
  const [toastMsg, setToastMsg] = useState("")
  const [confirmExit, setConfirmExit] = useState(false)
  const lastAuto = useRef("")
  const nextId = useRef(3)
  const docRef = useRef<HTMLDivElement>(null)

  const det = useMemo(() => detectApp(app), [app])
  const status: Status =
    det.state === "legal"
      ? "legal"
      : det.state === "ilegal-list" || det.state === "notfound"
        ? "ilegal"
        : "tidak-tahu"

  const sorted = sortEntries(entries)
  const allTags = new Set(entries.flatMap((e) => e.jenis))
  const allBukti = [...new Set(entries.flatMap((e) => e.bukti))]
  const hasRealData = entries.some((e) => !e.contoh)

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(""), 2200)
    return () => clearTimeout(t)
  }, [toastMsg])

  function goStep(n: 1 | 2 | 3) {
    setStep(n)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleBack() {
    if (step > 1) return goStep((step - 1) as 1 | 2)
    if (hasRealData && !confirmExit) return setConfirmExit(true)
    onBack()
  }

  // Sinkron pilihan bentuk perlakuan → kotak "Apa yang terjadi"
  function toggleJenis(v: string) {
    const nextJenis = jenis.includes(v)
      ? jenis.filter((x) => x !== v)
      : [...jenis, v]
    setJenis(nextJenis)
    const next = autoSentence(nextJenis)
    let val = isi
    if (lastAuto.current && val.includes(lastAuto.current))
      val = val.replace(lastAuto.current, next)
    else if (next) val = next + (val.trim() ? " " + val.trimStart() : " ")
    setIsi(val.replace(/^\s+/, ""))
    lastAuto.current = next
  }
  const toggleBukti = (v: string) =>
    setBukti((b) => (b.includes(v) ? b.filter((x) => x !== v) : [...b, v]))

  function addEntry() {
    if (!tgl || !isi.trim()) {
      setToastMsg(!tgl ? "Isi tanggal kejadian dulu." : "Tulis apa yang terjadi dulu.")
      return
    }
    setEntries((e) => [
      ...e,
      { id: nextId.current++, tgl, jam, isi: isi.trim(), jenis, bukti },
    ])
    setIsi("")
    setJam("")
    setJenis([])
    setBukti([])
    lastAuto.current = ""
    setToastMsg("Kejadian ditambahkan.")
  }

  function buildReport() {
    const s = sorted
    const appName = app.trim() || "[nama aplikasi]"
    const no = nomor.trim()
    const st = {
      legal: `terdaftar/berizin OJK${det.state === "legal" ? " (" + det.pt + ")" : ""}`,
      ilegal:
        det.state === "ilegal-list"
          ? "tercatat sebagai pinjol ilegal"
          : `tidak ditemukan dalam daftar pinjol berizin OJK per ${OJK_DATA_ASOF}`,
      "tidak-tahu": "belum dipastikan",
    }[status]
    const tags = [...allTags].map((t) => L[t].toLowerCase())
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    let t = `LAPORAN KRONOLOGI KEJADIAN\n\n`
    t += `Pelapor      : [Nama lengkap]\nKontak       : [Nomor HP / email]\n\n`
    t +=
      `Pihak yang dilaporkan\nAplikasi     : ${appName}\nStatus       : ${st}\n` +
      (no ? `Nomor penagih: ${no}\n` : "") +
      `\n`
    t +=
      `RINGKASAN\nTerjadi ${s.length} kejadian antara ${fmtTgl(s[0].tgl)} dan ${fmtTgl(s[s.length - 1].tgl)}.` +
      (tags.length ? ` Bentuk perlakuan: ${tags.join(", ")}.` : "") +
      `\n\n`
    t += `URUTAN KEJADIAN\n`
    s.forEach((e, i) => {
      t += `${i + 1}. ${fmtTgl(e.tgl)}${e.jam ? ", pukul " + e.jam.replace(":", ".") + " WIB" : ""}\n   ${e.isi}\n`
      if (e.jenis.length) t += `   Bentuk: ${e.jenis.map((j) => L[j]).join(", ")}\n`
      if (e.bukti.length) t += `   Bukti : ${e.bukti.map((b) => L[b]).join(", ")}\n`
      t += `\n`
    })
    t +=
      `BUKTI TERLAMPIR\n` +
      (allBukti.length
        ? allBukti.map((x) => `- ${L[x]}`).join("\n")
        : "- [sebutkan bukti yang dilampirkan]") +
      `\n\n`
    t += `PERMOHONAN\nSaya memohon agar laporan ini ditindaklanjuti sesuai kewenangan, termasuk penghentian penagihan yang melanggar aturan dan perlindungan atas data pribadi saya.\n\n`
    t += `[Kota], ${today}\n\n\n[Nama lengkap]`
    return t
  }

  function copyText(text: string, msg: string, selectDoc = false) {
    const fallback = () => {
      if (selectDoc && docRef.current) {
        const r = document.createRange()
        r.selectNodeContents(docRef.current)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)
      }
      setToastMsg("Teks dipilih. Tekan Ctrl+C untuk menyalin.")
    }
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(text).then(() => setToastMsg(msg)).catch(fallback)
    else fallback()
  }

  const routes = (() => {
    const r: string[] = []
    if (status === "legal") r.push("penyelenggara", "ojk")
    else r.push("pasti")
    if (["ancam", "peras", "data", "kbgo", "fisik", "kontak"].some((x) => allTags.has(x)))
      r.push("polisi")
    if (allTags.has("kbgo")) r.push("kbgo")
    if (status !== "legal" || allTags.has("kbgo") || allTags.has("data")) r.push("konten")
    return r
  })()

  // ─── detection box content ───
  const detView = (() => {
    switch (det.state) {
      case "empty":
        return {
          cls: "",
          title: "Status legalitas akan terdeteksi otomatis",
          body: (
            <>
              Ketik nama aplikasi. Kami cocokkan dengan daftar pinjol berizin OJK
              di fitur{" "}
              {onCekLegalitas ? (
                <button className="dl-sug" onClick={onCekLegalitas}>
                  Cek Legalitas
                </button>
              ) : (
                "Cek Legalitas"
              )}{" "}
              (data per {OJK_DATA_ASOF}).
            </>
          ),
        }
      case "legal":
        return {
          cls: "ok",
          title: "Terdaftar dan diawasi OJK",
          body: (
            <>
              {det.nama} ({det.pt}). Laporanmu akan diarahkan ke penyelenggara dan
              OJK.
            </>
          ),
        }
      case "maybe":
        return {
          cls: "",
          title: "Belum cocok persis",
          body: (
            <>
              Mungkin maksudmu{" "}
              <button className="dl-sug" onClick={() => setApp(det.nama)}>
                {det.nama}
              </button>
              ? Pastikan ejaan sesuai nama di aplikasi.
            </>
          ),
        }
      case "ilegal-list":
        return {
          cls: "bad",
          title: "Tercatat sebagai pinjol ilegal",
          body: (
            <>
              {det.nama} ada di daftar pinjol ilegal. Laporanmu akan diarahkan ke
              Satgas PASTI.
            </>
          ),
        }
      default:
        return {
          cls: "bad",
          title: "Tidak ditemukan di daftar pinjol berizin OJK",
          body: (
            <>
              Kemungkinan besar ilegal. Laporanmu akan diarahkan ke Satgas PASTI.
              Jika ragu, konfirmasi lewat WhatsApp OJK 081157157157.
            </>
          ),
        }
    }
  })()

  const report = step === 2 ? buildReport() : ""

  return (
    <div className="dl-root">
      <style>{CSS}</style>

      <header className="dl-topbar">
        <button
          className="dl-backbtn"
          onClick={handleBack}
          aria-label="Kembali ke halaman sebelumnya"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1>Dokumentasi &amp; Lapor</h1>
      </header>

      {confirmExit && (
        <div className="dl-exit">
          <span>
            <b>Kronologimu belum disalin.</b> Jika keluar sekarang, isinya akan
            hilang.
          </span>
          <div className="dl-row">
            <button className="dl-btn ghost sm" onClick={() => setConfirmExit(false)}>
              Tetap di sini
            </button>
            <button className="dl-btn danger sm" onClick={onBack}>
              Keluar
            </button>
          </div>
        </div>
      )}

      <div className="dl-wrap">
        <p className="dl-sub" style={{ margin: 0, fontSize: 15 }}>
          Catat apa yang terjadi, dapatkan laporan siap kirim, lalu kami arahkan
          ke pihak berwenang yang tepat.
        </p>

        <div className="dl-banner">
          <b>Data hanya tersimpan di perangkatmu.</b> EduPuan tidak menyimpan
          kronologimu di server. Salin atau unduh laporan sebelum menutup halaman.
        </div>

        <ol className="dl-steps">
          {(["Tulis kronologi", "Hasil laporan", "Panduan melapor"] as const).map(
            (t, i) => {
              const s = i + 1
              return (
                <li key={t} className={s === step ? "on" : s < step ? "done" : ""}>
                  <span className="n">{s}</span>
                  <span className="t">{t}</span>
                </li>
              )
            },
          )}
        </ol>

        {/* STEP 1 */}
        {step === 1 && (
          <section className="dl-panel">
            <div>
              <h2>Siapa yang kamu laporkan?</h2>
              <p className="dl-hint">
                Cukup isi yang kamu tahu. Ini menentukan ke mana laporanmu
                diarahkan.
              </p>
            </div>
            <div className="dl-grid2">
              <div>
                <label className="dl-label" htmlFor="dl-app">
                  Nama aplikasi / pemberi pinjaman
                </label>
                <input
                  type="text"
                  id="dl-app"
                  list="dl-ojk-list"
                  autoComplete="off"
                  placeholder="Ketik nama aplikasi, contoh: Danamas"
                  value={app}
                  onChange={(e) => setApp(e.target.value)}
                />
                <datalist id="dl-ojk-list">
                  {LEGAL_PINJOL.map((x) => (
                    <option key={x.nama} value={x.nama}>
                      {x.pt}
                    </option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="dl-label" htmlFor="dl-nomor">
                  Nomor / akun penagih (opsional)
                </label>
                <input
                  type="text"
                  id="dl-nomor"
                  placeholder="Contoh: 0812-xxxx-xxxx"
                  value={nomor}
                  onChange={(e) => setNomor(e.target.value)}
                />
              </div>
            </div>
            <div className={`dl-detect ${detView.cls}`} aria-live="polite">
              <span className="dot" />
              <div>
                <b>{detView.title}</b>
                <p>{detView.body}</p>
              </div>
            </div>

            <hr className="dl-hr" />

            <div>
              <h2>Tambah kejadian</h2>
              <p className="dl-hint">
                Satu kejadian per entri. Makin rinci tanggal, jam, dan isi
                ancamannya, makin kuat laporanmu.
              </p>
            </div>
            <div className="dl-grid2">
              <div>
                <label className="dl-label" htmlFor="dl-tgl">Tanggal</label>
                <input type="date" id="dl-tgl" value={tgl} onChange={(e) => setTgl(e.target.value)} />
              </div>
              <div>
                <label className="dl-label" htmlFor="dl-jam">Jam (perkiraan)</label>
                <input type="time" id="dl-jam" value={jam} onChange={(e) => setJam(e.target.value)} />
              </div>
            </div>
            <div>
              <span className="dl-label">Bentuk perlakuan (pilih yang sesuai)</span>
              <div className="dl-chips">
                {JENIS.map(([v, t]) => (
                  <label key={v} className={`dl-chip ${jenis.includes(v) ? "on" : ""}`}>
                    <input type="checkbox" checked={jenis.includes(v)} onChange={() => toggleJenis(v)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="dl-label" htmlFor="dl-isi">Apa yang terjadi</label>
              <textarea
                id="dl-isi"
                placeholder="Contoh: Penagih menelepon 15 kali sejak pagi dan mengancam menyebar foto KTP saya ke grup WhatsApp keluarga."
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
              />
              <p className="dl-hint">
                Kalimat pertama terisi otomatis dari pilihanmu di atas. Lanjutkan
                dengan detailnya: berapa kali, siapa yang dihubungi, apa isi
                ancamannya.
              </p>
            </div>
            <div>
              <span className="dl-label">Bukti yang kamu punya (opsional)</span>
              <div className="dl-chips">
                {BUKTI.map(([v, t]) => (
                  <label key={v} className={`dl-chip ${bukti.includes(v) ? "on" : ""}`}>
                    <input type="checkbox" checked={bukti.includes(v)} onChange={() => toggleBukti(v)} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="dl-row end">
              <button className="dl-btn primary" onClick={addEntry}>
                Tambah ke kronologi
              </button>
            </div>

            <div className="dl-sec-title">
              <h2>Kronologimu</h2>
              <span className="dl-count">
                {entries.length ? `${entries.length} kejadian` : ""}
              </span>
            </div>
            <div>
              {!entries.length ? (
                <div className="dl-empty">
                  Belum ada kejadian. Tambahkan kejadian pertama di atas, mulai dari
                  yang paling awal kamu ingat.
                </div>
              ) : (
                <>
                  {entries.some((e) => e.contoh) && (
                    <div className="dl-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="dl-hint" style={{ margin: 0 }}>
                        Dua entri di bawah adalah contoh pengisian.
                      </span>
                      <button
                        className="dl-btn ghost sm"
                        onClick={() => setEntries((e) => e.filter((x) => !x.contoh))}
                      >
                        Hapus contoh
                      </button>
                    </div>
                  )}
                  <ul className="dl-tl">
                    {sorted.map((e) => (
                      <li key={e.id}>
                        <div className="when">
                          <b>{fmtShort(e.tgl)}</b>
                          {e.jam ? e.jam.replace(":", ".") + " WIB" : ""}
                        </div>
                        <div className="what">
                          <p>{e.isi}</p>
                          <div className="dl-tags">
                            {e.contoh && <span className="dl-tag ex">Contoh</span>}
                            {e.jenis.map((j) => (
                              <span key={j} className="dl-tag">{L[j]}</span>
                            ))}
                            {e.bukti.map((b) => (
                              <span key={b} className="dl-tag">Bukti: {L[b]}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          className="dl-del"
                          aria-label="Hapus kejadian"
                          onClick={() => setEntries((x) => x.filter((y) => y.id !== e.id))}
                        >
                          Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="dl-row end">
              <button className="dl-btn primary" disabled={!entries.length} onClick={() => goStep(2)}>
                Susun laporan →
              </button>
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <section className="dl-panel">
            <div className="dl-sec-title">
              <div>
                <h2>Laporan kronologimu</h2>
                <p className="dl-hint">
                  Periksa dulu. Ganti bagian dalam [kurung siku] dengan datamu
                  sebelum dikirim.
                </p>
              </div>
            </div>
            <div className="dl-doc" ref={docRef} tabIndex={0}>
              {report}
            </div>
            <div className="dl-row">
              <button className="dl-btn ghost" onClick={() => goStep(1)}>← Ubah kronologi</button>
              <button className="dl-btn ghost" onClick={() => copyText(report, "Laporan disalin.", true)}>
                Salin laporan
              </button>
              <span style={{ flex: 1 }} />
              <button className="dl-btn primary" onClick={() => goStep(3)}>
                Lihat ke mana harus melapor →
              </button>
            </div>
          </section>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <section className="dl-panel">
            <div>
              <h2>Panduan melapor</h2>
              <p className="dl-hint">
                Berdasarkan kronologimu (
                {status === "legal"
                  ? "pinjol terdaftar"
                  : status === "ilegal"
                    ? "pinjol ilegal"
                    : "status pinjol belum pasti"}
                ), ini urutan yang kami sarankan.
                {status === "tidak-tahu" &&
                  " Nama aplikasi belum diisi atau belum cocok, jadi kami arahkan seperti pinjol ilegal. Lengkapi nama aplikasi di langkah 1 agar arahannya tepat."}
              </p>
            </div>
            {allTags.has("fisik") && (
              <div className="dl-alert">
                <b>Jika kamu merasa tidak aman sekarang, hubungi 110.</b> Ancaman
                kekerasan fisik atau penagih datang ke rumah perlu ditangani polisi
                lebih dulu, sebelum laporan lain.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {routes.map((k, i) => {
                const o = ROUTES[k]
                return (
                  <article key={k} className="dl-route">
                    <div className="head">
                      <span className="ord">{i + 1}</span>
                      <div>
                        <h3>{o.t}</h3>
                        <p className="why">{o.why}</p>
                      </div>
                    </div>
                    <ol>
                      {o.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                    {o.contacts.length > 0 && (
                      <div className="dl-contacts">
                        {o.contacts.map(([l, v]) => (
                          <div key={l} className="dl-contact">
                            <span>
                              {l}: <code>{v}</code>
                            </span>
                            <button className="dl-btn ghost sm" onClick={() => copyText(v, "Disalin.")}>
                              Salin
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {o.links.length > 0 && (
                      <div className="dl-row">
                        {o.links.map(([l, u]) => (
                          <a key={u} className="dl-btn link" href={u} target="_blank" rel="noopener noreferrer">
                            {l} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
            <p className="dl-foot">
              Kontak resmi diperbarui per {OJK_DATA_ASOF}. Selalu lampirkan laporan
              dari langkah 2 dan tangkapan layar asli. Jangan hapus chat atau
              rekaman meski sudah dilaporkan.
            </p>
            <div className="dl-row">
              <button className="dl-btn ghost" onClick={() => goStep(2)}>← Kembali ke laporan</button>
            </div>
          </section>
        )}
      </div>

      {toastMsg && <div className="dl-toast">{toastMsg}</div>}
    </div>
  )
}

// ─── styles (sama dengan prototipe) ─────────────────────────────────────────
const CSS = `
.dl-root{
  --bg:#F6F8F7; --surface:#FFFFFF; --line:#E1E8E5; --fg:#13201B; --muted:#5B6B65;
  --green:#0F6E4E; --green-ink:#FFFFFF; --mint:#DDF3EA; --mint-ink:#0B5A40;
  --purple:#6B4FD8; --purple-soft:#EEEAFD;
  --warn-bg:#FFF8DB; --warn-line:#F1DD8A; --warn-ink:#7A4B00;
  --danger-bg:#FDECEC; --danger-line:#F3B8B8; --danger-ink:#9B1C1C;
  --paper:#FCFDFC;
  --f-display:"Poppins",system-ui,sans-serif; --f-body:"Inter",system-ui,sans-serif; --f-mono:"JetBrains Mono",ui-monospace,monospace;
  --r:14px;
  min-height:100vh;background:var(--bg);color:var(--fg);font:15px/1.55 var(--f-body);
}
.dl-root *{box-sizing:border-box}
.dl-root h1,.dl-root h2,.dl-root h3,.dl-root p{margin:0}
.dl-topbar{display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:40;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 20px}
.dl-topbar h1{font:600 20px/1.3 var(--f-display)}
.dl-backbtn{flex:none;width:38px;height:38px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--fg);display:grid;place-items:center;cursor:pointer;padding:0}
.dl-backbtn:hover{border-color:var(--green);color:var(--green)}
.dl-exit{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--warn-bg);border-bottom:1px solid var(--warn-line);color:var(--warn-ink);font-size:14px}
.dl-exit b{font-weight:600}
.dl-wrap{max-width:880px;margin:0 auto;padding:28px 20px 64px;display:flex;flex-direction:column;gap:22px}
.dl-root h2{font:600 20px/1.3 var(--f-display);text-wrap:balance}
.dl-root h3{font:600 16px/1.35 var(--f-body)}
.dl-sub{color:var(--muted)}
.dl-banner{background:var(--warn-bg);border:1px solid var(--warn-line);color:var(--warn-ink);border-radius:var(--r);padding:12px 16px;font-size:14px}
.dl-banner b{font-weight:600}
.dl-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;list-style:none;margin:0;padding:0}
.dl-steps li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--muted);font-size:13px;min-width:0}
.dl-steps .n{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:600 13px var(--f-body);background:var(--bg);border:1px solid var(--line)}
.dl-steps li.on{border-color:var(--green);color:var(--fg)}
.dl-steps li.on .n{background:var(--green);color:var(--green-ink);border-color:var(--green)}
.dl-steps li.done .n{background:var(--mint);color:var(--mint-ink);border-color:transparent}
.dl-steps .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (max-width:560px){.dl-steps .t{white-space:normal;line-height:1.25}}
.dl-panel{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:22px;display:flex;flex-direction:column;gap:18px}
.dl-label{display:block;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.dl-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media (max-width:600px){.dl-grid2{grid-template-columns:1fr}}
.dl-root input[type=text],.dl-root input[type=date],.dl-root input[type=time],.dl-root textarea{width:100%;font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:11px 14px}
.dl-root textarea{min-height:96px;resize:vertical}
.dl-root input:focus-visible,.dl-root textarea:focus-visible,.dl-root button:focus-visible,.dl-root a:focus-visible,.dl-chip:focus-within{outline:2px solid var(--purple);outline-offset:2px}
.dl-hint{font-size:13px;color:var(--muted);margin-top:6px !important}
.dl-hr{border:0;border-top:1px solid var(--line);margin:0}
.dl-chips{display:flex;flex-wrap:wrap;gap:8px}
.dl-chip{position:relative;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid var(--line);border-radius:999px;font-size:13.5px;cursor:pointer;background:var(--surface);user-select:none}
.dl-chip input{position:absolute;opacity:0;pointer-events:none}
.dl-chip.on{background:var(--mint);border-color:var(--green);color:var(--mint-ink);font-weight:500}
.dl-btn{font:600 15px var(--f-body);border-radius:12px;padding:12px 18px;border:1px solid transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
.dl-btn.primary{background:var(--green);color:var(--green-ink)}
.dl-btn.primary:disabled{opacity:.45;cursor:not-allowed}
.dl-btn.ghost{background:var(--surface);border-color:var(--line);color:var(--fg)}
.dl-btn.danger{background:var(--danger-ink);color:#fff}
.dl-btn.link{background:var(--purple);color:#fff}
.dl-btn.sm{padding:7px 12px;font-size:13px;border-radius:10px}
.dl-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.dl-row.end{justify-content:flex-end}
.dl-sec-title{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.dl-count{font-size:13px;color:var(--muted)}
.dl-tl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.dl-tl li{display:grid;grid-template-columns:96px 1fr auto;gap:14px;padding:14px 0;border-top:1px solid var(--line)}
.dl-tl li:first-child{border-top:0}
.dl-tl .when{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.dl-tl .when b{display:block;color:var(--fg);font-weight:600}
.dl-tl .what{min-width:0}
.dl-tl .what p{margin:0 0 6px}
.dl-tags{display:flex;flex-wrap:wrap;gap:6px}
.dl-tag{font-size:12px;padding:2px 8px;border-radius:6px;background:var(--bg);border:1px solid var(--line);color:var(--muted)}
.dl-tag.ex{background:var(--purple-soft);border-color:transparent;color:var(--purple);font-weight:600}
.dl-del{background:none;border:0;color:var(--muted);cursor:pointer;font-size:13px;padding:4px}
.dl-del:hover{color:var(--danger-ink)}
@media (max-width:520px){.dl-tl li{grid-template-columns:1fr auto}.dl-tl .when{grid-column:1/-1}}
.dl-empty{border:1px dashed var(--line);border-radius:12px;padding:18px;color:var(--muted);text-align:center;font-size:14px}
.dl-doc{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:22px;font:13.5px/1.65 var(--f-mono);white-space:pre-wrap;overflow-wrap:anywhere;max-height:520px;overflow:auto}
.dl-alert{background:var(--danger-bg);border:1px solid var(--danger-line);color:var(--danger-ink);border-radius:var(--r);padding:14px 16px;font-size:14.5px}
.dl-alert b{font-weight:700}
.dl-route{border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:12px;background:var(--surface)}
.dl-route .head{display:flex;gap:12px;align-items:flex-start}
.dl-route .ord{flex:none;width:32px;height:32px;border-radius:10px;background:var(--mint);color:var(--mint-ink);display:grid;place-items:center;font:700 15px var(--f-display)}
.dl-route .why{font-size:13.5px;color:var(--muted);margin-top:3px}
.dl-route ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px;font-size:14.5px;list-style:decimal}
.dl-contacts{display:flex;flex-direction:column;gap:6px;font-size:14px}
.dl-contact{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 12px;border-radius:10px;background:var(--bg);flex-wrap:wrap}
.dl-contact span{min-width:0;overflow-wrap:anywhere}
.dl-contact code{font-family:var(--f-mono);font-size:13px}
.dl-foot{font-size:13px;color:var(--muted)}
.dl-detect{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);font-size:14px}
.dl-detect .dot{flex:none;width:10px;height:10px;border-radius:50%;margin-top:6px;background:var(--muted)}
.dl-detect b{display:block;font-weight:600}
.dl-detect p{margin-top:2px;color:var(--muted);font-size:13px}
.dl-detect.ok{background:var(--mint);border-color:var(--green)}.dl-detect.ok .dot{background:var(--green)}.dl-detect.ok b{color:var(--mint-ink)}
.dl-detect.bad{background:var(--danger-bg);border-color:var(--danger-line)}.dl-detect.bad .dot{background:var(--danger-ink)}.dl-detect.bad b{color:var(--danger-ink)}
.dl-sug{background:none;border:0;padding:0;color:var(--purple);font:inherit;font-weight:600;cursor:pointer;text-decoration:underline}
.dl-toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--fg);color:var(--bg);padding:10px 16px;border-radius:10px;font-size:14px;z-index:50}
@media (prefers-reduced-motion:no-preference){.dl-panel{animation:dl-in .25s ease-out}@keyframes dl-in{from{transform:translateY(6px)}to{transform:none}}}
`