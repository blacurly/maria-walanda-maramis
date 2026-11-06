"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const MENU = [
  { key: "beranda", label: "Beranda", href: "/" },
  { key: "edukasi", label: "Edukasi", href: "/edukasi" },
  { key: "faq", label: "FAQ", href: "/#faq" },
  { key: "tentang", label: "Tentang", href: "/tentang" },
];

const CSS = `
.ep-nav,.ep-nav *{box-sizing:border-box;margin:0;padding:0}
.ep-nav a{text-decoration:none}
.ep-nav{display:block;width:100%;position:sticky;top:0;z-index:50;height:92px;background:#fff;border-bottom:1px solid #E3EDE9;-webkit-font-smoothing:antialiased}
.ep-nav .in{width:100%;max-width:1681px;margin:0 auto;height:92px;padding:0 32px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:28px}
.ep-nav .logo{display:flex;justify-self:start}
.ep-nav .logo img{height:84px;width:auto;display:block}
.ep-nav .menu{display:flex;justify-self:center;gap:6px;list-style:none}
.ep-nav .menu a{display:block;padding:9px 16px;border-radius:999px;color:#1F2E28;font-weight:500;font-size:15px;transition:.2s}
.ep-nav .menu a:hover{background:#F2F7F5;color:#04674B}
.ep-nav .menu a.on{background:#E6F3EE;color:#04674B;font-weight:600}
.ep-nav .right{display:flex;align-items:center;gap:10px;justify-self:end}
.ep-nav .sos{display:flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:999px;font-weight:600;font-size:14px;background:#FDECEC;color:#C62828;border:1.5px solid #F6C9C9;white-space:nowrap;transition:.2s}
.ep-nav .sos:hover{background:#C62828;color:#fff}
.ep-nav .dot{width:8px;height:8px;border-radius:50%;background:#E53935;box-shadow:0 0 0 3px rgba(229,57,53,.2)}
.ep-nav .ss,.ep-nav .burger,.ep-nav .drop{display:none}
.ep-nav .burger{width:42px;height:42px;border-radius:11px;border:1.5px solid #CFE3DB;background:#fff;color:#04674B;align-items:center;justify-content:center;cursor:pointer}
.ep-nav .burger svg{width:20px;height:20px}
.ep-nav .drop a{display:block;width:100%;padding:12px 18px;font-weight:500;font-size:15px;color:#1F2E28}
.ep-nav .drop a.on{color:#04674B;font-weight:600;background:#E6F3EE}
@media(max-width:960px){.ep-nav{height:auto;min-height:92px}.ep-nav .in{grid-template-columns:1fr auto}.ep-nav .menu{display:none}.ep-nav .burger{display:flex}.ep-nav .drop.open{display:block;border-top:1px solid #E3EDE9;padding:7px 0}}
@media(max-width:560px){.ep-nav{min-height:76px}.ep-nav .in{height:76px;padding:0 20px;gap:10px}.ep-nav .logo img{height:62px}.ep-nav .sl{display:none}.ep-nav .ss{display:inline}.ep-nav .sos{padding:0 12px;height:38px}.ep-nav .burger{width:38px;height:38px}}
`;

function cariMenuAktif(pathname: string) {
  if (pathname === "/") return "beranda";
  if (pathname.startsWith("/edukasi")) return "edukasi";
  if (pathname.startsWith("/tentang")) return "tentang";
  return "";
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const aktif = cariMenuAktif(usePathname());
  const tutup = () => setOpen(false);

  return (
    <nav className="ep-nav">
      <style>{CSS}</style>
      <div className="in">
        <Link href="/" className="logo" onClick={tutup} aria-label="Beranda EduPuan">
          <Image
            src="/logo/logo-navbar.png"
            alt="EduPuan - lebih paham, lebih bijak"
            width={224}
            height={84}
            priority
          />
        </Link>

        <ul className="menu">
          {MENU.map((m) => (
            <li key={m.key}>
              <Link href={m.href} className={aktif === m.key ? "on" : ""}>
                {m.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="right">
          <Link href="/darurat" className="sos" onClick={tutup}>
            <span className="dot" />
            <span className="sl">Bantuan Darurat</span>
            <span className="ss">Darurat</span>
          </Link>
          <button
            className="burger"
            aria-label="Buka menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className={"drop" + (open ? " open" : "")}>
        {MENU.map((m) => (
          <Link key={m.key} href={m.href} className={aktif === m.key ? "on" : ""} onClick={tutup}>
            {m.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}