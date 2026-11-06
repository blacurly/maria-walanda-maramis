import Link from "next/link";
import Image from "next/image";

// Ganti "#" dengan alamat akun media sosial EduPuan
const SOSMED = { instagram: "#", tiktok: "#", youtube: "#", linkedin: "#" };

const KOLOM = [
  {
    judul: "Tools",
    link: [
      { href: "/mau-pinjam/cek-penawaran", label: "Cek Penawaran" },
      { href: "/mau-pinjam/cek-legalitas", label: "Cek Legalitas Pinjol" },
      { href: "/mau-pinjam/cari-alternatif", label: "Alternatif Solusi" },
      { href: "/sudah-terjerat/rangkum-utang", label: "Rangkum Utang" },
    ],
  },
  {
    judul: "Belajar",
    link: [
      { href: "/edukasi", label: "Artikel & Tips" },
      { href: "/edukasi", label: "Risiko Pinjol" },
      { href: "/sudah-terjerat/hak-saat-ditagih", label: "Hak & Hukum" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    judul: "Tentang",
    link: [
      { href: "/tentang", label: "Tentang Kami" },
      { href: "/tentang#kontak", label: "Kontak" },
    ],
  },
];

const CSS = `
.ep-foot,.ep-foot *{box-sizing:border-box;margin:0;padding:0}
.ep-foot a{text-decoration:none}
.ep-foot{background:#04674B;color:#CFE6DC;padding:32px 0 16px;line-height:normal;-webkit-font-smoothing:antialiased}
.ep-foot .wrap{max-width:1681px;margin:0 auto;padding:0 32px}
.ep-foot .grid{display:grid;grid-template-columns:1.6fr 3fr;gap:32px;align-items:center}
.ep-foot .links{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;align-items:start}
.ep-foot .flogo{height:84px;width:auto;display:block}
.ep-foot .brand p{margin:12px 0 16px;max-width:300px;line-height:1.5;font-size:14px;color:#CFE6DC}
.ep-foot .soc{display:flex;gap:8px}
.ep-foot .soc a{width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;color:#fff;transition:.2s}
.ep-foot .soc a:hover{background:#B9A2F7;border-color:#B9A2F7;color:#04674B}
.ep-foot .soc svg{width:16px;height:16px;display:block}
.ep-foot h4{color:#fff;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}
.ep-foot ul{list-style:none}
.ep-foot li{margin-bottom:8px}
.ep-foot .lk{color:#CFE6DC;font-size:14px;transition:.2s}
.ep-foot .lk:hover{color:#B9A2F7}
.ep-foot .bottom{margin-top:22px;padding-top:14px;border-top:1px solid rgba(255,255,255,.15);display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:13px;color:#A9CFC0}
.ep-foot .bottom .lk{color:#A9CFC0;font-size:13px;margin-left:16px}
.ep-foot .bottom .lk:hover{color:#fff}
@media(max-width:860px){.ep-foot .grid{grid-template-columns:1fr}.ep-foot .links{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.ep-foot .wrap{padding:0 20px}.ep-foot .grid,.ep-foot .links{gap:24px 18px}.ep-foot{padding:36px 0 82px}.ep-foot .bottom{flex-direction:column}.ep-foot .bottom .lk{margin:0 14px 0 0}}
`;

export default function Footer() {
  return (
    <footer className="ep-foot">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="grid">
          <div className="brand">
            <Image
              className="flogo"
              src="/logo/logo-footer.png"
              alt="EduPuan - lebih paham, lebih bijak"
              width={224}
              height={84}
            />
            <p>
              Literasi keuangan dan hukum untuk perempuan Indonesia. Kenali risiko, pahami
              hakmu, ambil keputusan dengan tenang.
            </p>
            <div className="soc">
              <a href={SOSMED.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              </a>
              <a href={SOSMED.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v11a4 4 0 1 1-4-4" /><path d="M14 3c0 3 2 5 5 5" /></svg>
              </a>
              <a href={SOSMED.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></svg>
              </a>
              <a href={SOSMED.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0-4 0" /></svg>
              </a>
            </div>
          </div>

          <div className="links">
            {KOLOM.map((k) => (
              <div key={k.judul}>
                <h4>{k.judul}</h4>
                <ul>
                  {k.link.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="lk">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom">
          <span>© 2026 EduPuan. Semua hak dilindungi.</span>
          <span>
            <Link href="/kebijakan-privasi" className="lk">Kebijakan Privasi</Link>
            <Link href="/syarat-ketentuan" className="lk">Syarat &amp; Ketentuan</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}