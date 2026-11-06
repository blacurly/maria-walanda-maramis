"use client"

import { useMemo, useState } from "react"
import { LEGAL_PINJOL, ILEGAL_NAMES } from "@/data/dataPinjol"

// ─── Dasar hukum (diverifikasi Oktober 2026) ─────────────────────────────────
// type "ojk" = Pasal 62 POJK 22/2023 → hanya mengikat PUJK (pinjol legal)
// type "pid" = pasal pidana → berlaku untuk pinjol legal maupun ilegal

const P = "POJK Nomor 22 Tahun 2023"

type Item = {
  id: string
  type: "ojk" | "pid"
  t: string
  note?: string
  law: string
  lawLegal?: string
  tpl: string
  safeFirst?: boolean
}

const ITEMS: Item[] = [
  {
    id: "jam",
    type: "ojk",
    t: "Menagih di luar Senin–Sabtu 08.00–20.00, atau di hari libur nasional",
    note: "Kecuali kamu sudah menyetujuinya sebelumnya.",
    law: `Pasal 62 ayat (2) huruf f ${P}`,
    tpl: `Sesuai Pasal 62 ayat (2) ${P}, penagihan hanya boleh dilakukan Senin–Sabtu di luar hari libur nasional, pukul 08.00–20.00 waktu setempat. Mohon hubungi saya hanya dalam waktu tersebut. Setiap panggilan di luar ketentuan saya catat sebagai bukti.`,
  },
  {
    id: "terus",
    type: "ojk",
    t: "Menelepon atau chat terus-menerus sampai mengganggu",
    law: `Pasal 62 ayat (2) huruf d ${P}`,
    tpl: `Saya tidak menolak membicarakan kewajiban saya. Namun penagihan tidak boleh dilakukan secara terus-menerus yang bersifat mengganggu (Pasal 62 ayat (2) huruf d ${P}). Mohon hentikan panggilan berulang ini.`,
  },
  {
    id: "kontak",
    type: "ojk",
    t: "Menagih ke keluarga, teman, kontak darurat, atau kantor",
    law: `Pasal 62 ayat (2) huruf c ${P}; SEOJK 19/SEOJK.06/2025 (akses gawai hanya kamera, lokasi, mikrofon)`,
    tpl: `Penagihan hanya boleh ditujukan kepada saya, tidak kepada pihak lain termasuk kontak darurat (Pasal 62 ayat (2) huruf c ${P}). Mohon segera hentikan menghubungi keluarga dan kenalan saya. Jika berlanjut, saya akan mengadukannya ke OJK.`,
  },
  {
    id: "tempat",
    type: "ojk",
    t: "Datang atau menagih di tempat selain alamat penagihan",
    note: "Kecuali kamu sudah menyetujuinya sebelumnya.",
    law: `Pasal 62 ayat (2) huruf e ${P}`,
    tpl: `Penagihan wajib dilakukan di alamat penagihan atau domisili saya (Pasal 62 ayat (2) huruf e ${P}). Mohon tidak mendatangi atau menghubungi tempat lain.`,
  },
  {
    id: "hina",
    type: "ojk",
    t: "Menghina, merendahkan, atau mempermalukan",
    law: `Pasal 62 ayat (2) huruf a dan b ${P}; Pasal 10 (tanggung jawab atas penagih pihak ketiga)`,
    tpl: `Penagihan dilarang menggunakan tindakan yang mempermalukan maupun tekanan verbal (Pasal 62 ayat (2) huruf a dan b ${P}). Perusahaan Anda tetap bertanggung jawab atas tindakan penagih pihak ketiga (Pasal 10). Pesan ini sudah saya simpan dan akan saya adukan ke OJK.`,
  },
  {
    id: "ancam",
    type: "pid",
    t: "Mengancam kekerasan atau menakut-nakuti",
    law: "UU 1/2024 (ITE) Pasal 29 jo. Pasal 45B",
    lawLegal: `Pasal 62 ayat (2) huruf a ${P}; UU 1/2024 (ITE) Pasal 29 jo. Pasal 45B`,
    tpl: "Ancaman kekerasan yang Anda kirim melalui pesan elektronik dapat dipidana berdasarkan Pasal 29 jo. Pasal 45B UU Nomor 1 Tahun 2024. Bukti sudah saya simpan dan akan saya laporkan.",
  },
  {
    id: "sebar",
    type: "pid",
    t: "Menyebarkan data/foto, atau mengancam akan menyebarkannya",
    law: "UU 27/2022 (PDP) Pasal 65 ayat (2) jo. Pasal 67 ayat (2); UU 1/2024 (ITE) Pasal 27B ayat (2)",
    tpl: "Mengungkapkan data pribadi saya tanpa hak dapat dipidana (Pasal 65 ayat (2) jo. Pasal 67 ayat (2) UU Nomor 27 Tahun 2022). Memaksa dengan ancaman membuka rahasia juga dilarang (Pasal 27B ayat (2) UU Nomor 1 Tahun 2024). Bukti sudah saya simpan dan akan saya laporkan ke kepolisian.",
  },
  {
    id: "seks",
    type: "pid",
    safeFirst: true,
    t: "Mengirim pesan bernada seksual (KBGO)",
    law: "UU 12/2022 (TPKS) Pasal 14 ayat (1) huruf b — delik aduan, korban yang melapor",
    tpl: "Pesan Anda bermuatan seksual dan tidak saya kehendaki. Ini termasuk kekerasan seksual berbasis elektronik menurut Pasal 14 UU Nomor 12 Tahun 2022. Bukti sudah saya simpan.",
  },
]

type Status = "legal" | "ilegal" | "unknown" | null

// Daftar saran nama tanpa duplikat (data ilegal bisa memuat nama yang sama berkali-kali)
const SARAN_NAMA = Array.from(
  new Set([...LEGAL_PINJOL.map((x) => x.nama), ...ILEGAL_NAMES]),
)

const norm = (s: string) =>
  s.trim().toLowerCase().replace(/[-\s]+/g, " ")

// ─── Style (sama persis dengan desain HTML) ──────────────────────────────────
const CSS = `
.hsd{--bg:#F3F5F4;--card:#FFFFFF;--ink:#13231B;--muted:#55615B;--soft:#7A857F;--line:#DDE3E0;--green:#1F7A55;--green-dk:#155C40;--green-bg:#E3F3EB;--red:#A32D2D;--red-bg:#FCEBEB;--amber:#854F0B;--amber-bg:#FDF1D6;--purple:#534AB7;--purple-bg:#EEEDFE;--radius:14px;
  background:var(--bg);color:var(--ink);line-height:1.55;font-family:Inter,system-ui,sans-serif;min-height:calc(100vh - 64px)}
.hsd *{box-sizing:border-box}
.hsd main{max-width:1180px;margin:0 auto;padding:40px 24px 64px}
.hsd .lead{max-width:720px;color:var(--muted);font-size:17px;margin:0 0 18px}
.hsd .pills{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:28px}
.hsd .pill{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;font-size:14px;font-weight:500}
.hsd .pill i{width:8px;height:8px;border-radius:50%;display:inline-block}
.hsd .pill.ojk{background:var(--green-bg);color:var(--green-dk)} .hsd .pill.ojk i{background:var(--green)}
.hsd .pill.pid{background:var(--purple-bg);color:var(--purple)} .hsd .pill.pid i{background:var(--purple)}
.hsd .grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start}
.hsd .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:28px 30px;margin-bottom:20px}
.hsd .step{font-size:12px;font-weight:600;letter-spacing:1.5px;color:var(--green);text-transform:uppercase}
.hsd h2{font-size:22px;font-weight:700;margin:4px 0 18px}
.hsd label.q{display:block;font-weight:600;font-size:16px;margin-bottom:4px}
.hsd .hint{font-size:14px;color:var(--muted);margin:0 0 10px}
.hsd input[type=text]{width:100%;padding:14px 16px;font:inherit;font-size:16px;border:1px solid var(--line);border-radius:10px;outline:none;background:#fff}
.hsd input[type=text]:focus{border-color:var(--green);box-shadow:0 0 0 3px var(--green-bg)}
.hsd .status{margin-top:12px;padding:10px 14px;border-radius:10px;font-size:14px}
.hsd .status.legal{background:var(--green-bg);color:var(--green-dk)}
.hsd .status.ilegal{background:var(--red-bg);color:var(--red)}
.hsd .status.unknown{background:var(--amber-bg);color:var(--amber)}
.hsd .opt{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid var(--line);border-radius:12px;margin-bottom:10px;cursor:pointer;transition:border-color .15s}
.hsd .opt:hover{border-color:#B9C4BE}
.hsd .opt.on{border:1.5px solid var(--green);background:#F7FCF9}
.hsd .opt input{margin-top:4px;width:18px;height:18px;accent-color:var(--green)}
.hsd .opt .t{font-size:15px;font-weight:500}
.hsd .opt .n{font-size:13px;color:var(--soft)}
.hsd .tag{display:inline-block;font-size:12px;font-weight:500;padding:2px 10px;border-radius:999px;margin-top:6px}
.hsd .tag.ojk{background:var(--green-bg);color:var(--green-dk)}
.hsd .tag.pid{background:var(--purple-bg);color:var(--purple)}
.hsd .empty{border:1.5px dashed #C9D2CD;border-radius:var(--radius);padding:32px;background:#fff}
.hsd .empty h3{font-size:22px;font-weight:700;margin:0 0 8px}
.hsd .empty p{color:var(--muted);margin:0}
.hsd .res{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:22px 24px;margin-bottom:14px}
.hsd .res .lbl{font-size:12px;font-weight:600;letter-spacing:1px;color:var(--red);text-transform:uppercase}
.hsd .res h4{font-size:17px;font-weight:700;margin:4px 0 10px}
.hsd .law{font-size:13px;background:var(--purple-bg);color:var(--purple);padding:8px 12px;border-radius:8px;margin-bottom:10px}
.hsd .law.ojk{background:var(--green-bg);color:var(--green-dk)}
.hsd .safe{font-size:13px;color:var(--muted);margin-bottom:8px}
.hsd .warn{font-size:14px;background:var(--amber-bg);color:var(--amber);padding:12px 14px;border-radius:10px}
.hsd .tpl{font-size:15px;background:#F7F9F8;border-radius:10px;padding:14px 16px;margin:0 0 12px}
.hsd .actions{display:flex;gap:20px}
.hsd .actions button{background:none;border:0;padding:0;font:inherit;font-size:14px;font-weight:600;color:var(--green);cursor:pointer}
.hsd .report h3{font-size:18px;font-weight:700;margin:0 0 10px}
.hsd .report p{margin:0 0 6px;font-size:14px;color:var(--muted)}
.hsd .report b{color:var(--ink);font-weight:600}
.hsd .disc{font-size:13px;color:var(--soft);margin-top:8px}
@media (max-width:860px){.hsd .grid{grid-template-columns:1fr}}
`

export default function HakSaatDitagih() {
  const [app, setApp] = useState("")
  const [checked, setChecked] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  // ── Langkah 1: deteksi status dari data Cek Legalitas ──
  const detected = useMemo(() => {
    const q = norm(app)
    if (!q) return { status: null as Status, name: "" }
    const legal = LEGAL_PINJOL.find((x) => norm(x.nama) === q)
    if (legal) return { status: "legal" as Status, name: legal.nama }
    const ilegal = ILEGAL_NAMES.find((x) => norm(x) === q)
    if (ilegal) return { status: "ilegal" as Status, name: ilegal }
    return { status: "unknown" as Status, name: app.trim() }
  }, [app])

  const status = detected.status
  const legal = status === "legal"
  const picked = ITEMS.filter((it) => checked.includes(it.id))

  const toggle = (id: string) =>
    setChecked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const copy = async (it: Item) => {
    try {
      await navigator.clipboard.writeText(it.tpl)
      setCopied(it.id)
    } catch {
      setCopied("gagal-" + it.id)
    }
    setTimeout(() => setCopied(null), 1500)
  }

  const statusText =
    status === "legal"
      ? `${detected.name} terdaftar dan berizin di OJK. Aturan penagihan OJK berlaku untuknya.`
      : status === "ilegal"
        ? `${detected.name} tidak terdaftar di OJK (pinjol ilegal). Aturan OJK tidak mengikatnya, gunakan jalur pidana.`
        : "Nama ini tidak ada di daftar kami. Perlakukan sebagai belum terverifikasi dan cek ulang di Cek Legalitas atau Kontak OJK 157."

  return (
    <div className="hsd">
      <style>{CSS}</style>
      <main>
        <p className="lead">
          Penagih punya aturan yang wajib dipatuhi. Centang yang terjadi
          kepadamu, kami tunjukkan dasar hukumnya dan template balasan. Aturan
          ini membatasi cara menagih, bukan menghapus utang.
        </p>
        <div className="pills">
          <span className="pill ojk">
            <i />
            Aturan OJK = hanya mengikat pinjol legal
          </span>
          <span className="pill pid">
            <i />
            Pidana = berlaku untuk legal dan ilegal
          </span>
        </div>

        <div className="grid">
          {/* KIRI: input */}
          <div>
            <section className="card">
              <div className="step">Langkah 1</div>
              <h2>Pinjol mana yang menagihmu?</h2>
              <label className="q" htmlFor="hsd-app">
                Nama aplikasi pinjol
              </label>
              <p className="hint">
                Status legal atau ilegal dicek otomatis dari data Cek Legalitas
                Pinjol.
              </p>
              <input
                type="text"
                id="hsd-app"
                list="hsd-apps"
                placeholder="contoh: AdaKami"
                autoComplete="off"
                value={app}
                onChange={(e) => setApp(e.target.value)}
              />
              <datalist id="hsd-apps">
                {SARAN_NAMA.map((nama) => (
                  <option key={nama} value={nama} />
                ))}
              </datalist>
              {status && <div className={`status ${status}`}>{statusText}</div>}
            </section>

            <section className="card">
              <div className="step">Langkah 2</div>
              <h2>Apa yang dilakukan penagih?</h2>
              {ITEMS.map((it) => {
                const on = checked.includes(it.id)
                return (
                  <label key={it.id} className={`opt ${on ? "on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(it.id)}
                    />
                    <div>
                      <div className="t">{it.t}</div>
                      {it.note && <div className="n">{it.note}</div>}
                      <span className={`tag ${it.type}`}>
                        {it.type === "ojk" ? "Aturan OJK" : "Pidana"}
                      </span>
                    </div>
                  </label>
                )
              })}
            </section>
          </div>

          {/* KANAN: hasil */}
          <div>
            {!status || picked.length === 0 ? (
              <div className="empty">
                <h3>Hasil akan muncul di sini</h3>
                <p>
                  Lengkapi dulu:{" "}
                  {[
                    !status && "nama aplikasi pinjol",
                    picked.length === 0 && "minimal satu tindakan penagih",
                  ]
                    .filter(Boolean)
                    .join(" dan ")}
                  .
                </p>
              </div>
            ) : (
              <>
                {picked.map((it) => {
                  if (!legal && it.type === "ojk") {
                    return (
                      <div key={it.id} className="res">
                        <div className="lbl">Tindakan tidak patut</div>
                        <h4>{it.t}</h4>
                        <div className="warn">
                          {status === "unknown"
                            ? "Status aplikasi ini belum bisa dipastikan, jadi kami belum tahu apakah aturan POJK berlaku. Cek dulu di Cek Legalitas atau tanyakan ke Kontak OJK 157. Sambil menunggu, simpan bukti (tangkapan layar, rekaman, nomor penagih)."
                            : "Aplikasi ini tidak terdaftar di OJK, jadi aturan POJK tidak mengikatnya. Jangan negosiasi. Simpan bukti (tangkapan layar, rekaman, nomor penagih), lalu laporkan."}
                        </div>
                      </div>
                    )
                  }
                  const law = legal && it.lawLegal ? it.lawLegal : it.law
                  return (
                    <div key={it.id} className="res">
                      <div className="lbl">Pelanggaran</div>
                      <h4>{it.t}</h4>
                      <div className={`law ${it.type}`}>{law}</div>
                      {(!legal || it.safeFirst) && (
                        <div className="safe">
                          Simpan bukti dulu, lalu blokir. Membalas itu
                          opsional.
                        </div>
                      )}
                      <p className="tpl">{it.tpl}</p>
                      <div className="actions">
                        <button onClick={() => copy(it)}>
                          {copied === it.id
                            ? "Tersalin"
                            : copied === "gagal-" + it.id
                              ? "Gagal menyalin"
                              : "Salin"}
                        </button>
                        <button
                          onClick={() =>
                            window.open(
                              "https://wa.me/?text=" +
                                encodeURIComponent(it.tpl),
                              "_blank",
                            )
                          }
                        >
                          Kirim WA
                        </button>
                      </div>
                    </div>
                  )
                })}

                <div className="res report">
                  <h3>Ke mana melapor</h3>
                  {legal ? (
                    <>
                      <p>
                        <b>OJK (pengaduan konsumen):</b> telepon 157, WhatsApp
                        081157157157, konsumen@ojk.go.id, kontak157.ojk.go.id
                      </p>
                      <p>
                        <b>Polisi:</b> untuk ancaman, sebar data, atau pesan
                        seksual
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <b>Polisi:</b> untuk ancaman, sebar data, atau pesan
                        seksual (patrolisiber.id)
                      </p>
                      <p>
                        <b>OJK:</b> laporkan juga aplikasinya agar ditindak
                        sebagai pinjol ilegal
                      </p>
                    </>
                  )}
                  <p className="disc">
                    Informasi edukasi, bukan nasihat hukum. Dasar hukum per
                    Oktober 2026.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
