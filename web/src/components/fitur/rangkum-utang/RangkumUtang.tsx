/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/*
 * Fitur EduPuan: Rangkum Semua Utang
 * File ini lengkap dan berdiri sendiri: aturan, tampilan, dan gaya.
 * JANGAN diubah lewat prompt AI. Aturan di dalamnya sudah diuji sesuai spesifikasi.
 * Tambahan: tombol "Unduh rangkuman (PDF)" membuat file PDF langsung dengan jsPDF (unduhPdf),
 * karena jendela cetak (window.print) sering hitam/kosong di HP. printReport tetap ada sebagai cadangan.
 * Tambahan: daftar diurutkan menurut pilihan pengguna (jatuh tempo / nominal), BUKAN urutan bayar.
 * Label tenggat tampil netral (LABEL_TAMPIL). Bagian DebtLogic TIDAK diubah.
 */
"use client";

import { useEffect, useRef } from "react";
import { LEGAL_PINJOL, ILEGAL_NAMES } from "@/data/dataPinjol";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

const CSS = `.ru-root {
  --bg: #F8FCFA;
  --surface: #FFFFFF;
  --surface-2: #EEF7F2;
  --ink: #0F2A20;
  --ink-2: #4A6358;
  --line: #D9E9E0;
  --brand: #1E6B50;
  --brand-ink: #FFFFFF;
  --mint: #3FB98A;
  --mint-soft: #D5F1E4;
  --violet: #6B4FD8;
  --violet-soft: #ECE7FD;
  --handle: #B4372B; --handle-soft: #FBE7E4;
  --prepare: #A35B00; --prepare-soft: #FDF0DA;
  --plan: #1F6E8C; --plan-soft: #DFF0F6;
  --monitor: #4A6358; --monitor-soft: #E7EEEA;
  --focus: #6B4FD8;
  --font: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --r: 14px;
  --hdr: 76px; 
}
.ru-root, .ru-root * { box-sizing: border-box; }
.ru-root { background: var(--bg); color: var(--ink); font-family: var(--font); font-size: 15px; line-height: 1.55; }
.ru-root .wrap { max-width: 1140px; margin: 0 auto; padding-inline: 16px; padding-block: 0 64px; }
.ru-root .two { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: start; }
.ru-root .two > * { min-width: 0; }
@media (max-width: 899px) {.ru-root .sum-two { display: flex; flex-direction: column; gap: 0; }
.ru-root .sum-two > .side, .ru-root .sum-two > .main { display: contents; }
.ru-root .sum-two .stats { order: 1; }
.ru-root .sum-two .flags { order: 2; }
.ru-root .sum-two .main-sec { order: 3; }
.ru-root .sum-two .side-sec { order: 4; }

}
@media (min-width: 900px) {.ru-root .two { grid-template-columns: minmax(300px, 360px) minmax(0, 1fr); gap: 28px; margin-top: 20px; }
.ru-root .two > .side { position: sticky; top: calc(var(--hdr) + 12px + env(safe-area-inset-top, 0px)); max-height: calc(100vh - var(--hdr) - 24px); overflow-y: auto; scrollbar-width: thin; padding-bottom: 4px; }
.ru-root .two .stats { margin-top: 0; grid-template-columns: 1fr !important; }
.ru-root .two .main-sec { margin-top: 0; }
.ru-root .two .side-sec { margin-top: 16px; }
.ru-root .form-two { grid-template-columns: 1fr 1fr; margin-top: 0; }
.ru-root .home-two { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); align-items: center; min-height: 60vh; }
.ru-root .home-two .how { margin-top: 0; }
.ru-root .wrap-narrow { max-width: 720px; }

}
@media (min-width: 900px) and (max-width: 1099px) {.ru-root .two .stat .split div { font-size: 13.5px; }
 }
.ru-root .mini-total { display: none; }
.ru-root .list-count { margin: 0; }
@media (min-width: 900px) {.ru-root .sum-two > .main { position: sticky; top: calc(var(--hdr) + 12px + env(safe-area-inset-top, 0px)); height: calc(100vh - var(--hdr) - 24px); display: flex; flex-direction: column; }
.ru-root .sum-two .main-sec { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; }
.ru-root .list-scroll { flex: 1; min-height: 240px; overflow-y: auto; overscroll-behavior: contain; padding: 2px 8px 12px 2px; margin-right: -8px; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
.ru-root .list-scroll.more { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 56px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 56px), transparent); }
.ru-root .list-scroll::-webkit-scrollbar { width: 8px; }
.ru-root .list-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }

}
@media (max-width: 899px) {.ru-root .mini-total { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; position: sticky; top: calc(var(--hdr) + 8px + env(safe-area-inset-top, 0px)); z-index: 5; background: var(--brand); color: var(--brand-ink); padding: 10px 14px; border-radius: 12px; font-size: 14px; box-shadow: 0 6px 16px -10px var(--ink); }
.ru-root .mini-total .muted { color: inherit; opacity: 0.82; }

}
.ru-root h1, .ru-root h2, .ru-root h3 { text-wrap: balance; margin: 0; line-height: 1.2; }
.ru-root h1 { font-size: clamp(1.7rem, 5vw, 2.25rem); font-weight: 700; letter-spacing: -0.015em; }
.ru-root h2 { font-size: 1.15rem; font-weight: 700; }
.ru-root h3 { font-size: 1rem; font-weight: 700; }
.ru-root p { margin: 0; }
.ru-root .num { font-variant-numeric: tabular-nums; }
.ru-root .muted { color: var(--ink-2); }
.ru-root .small { font-size: 13px; }
.ru-root .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
.ru-root .topbar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; background: var(--surface); border-bottom: 1px solid var(--line); }
.ru-root .top { max-width: 1140px; margin: 0 auto; padding-inline: 16px; height: var(--hdr); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
@media (max-width: 899px) {.ru-root { --hdr: 64px; }
 }
.ru-root .backbar { display: flex; align-items: center; gap: 12px; min-width: 0; }
.ru-root .back { flex: none; width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); display: grid; place-items: center; padding: 0; }
.ru-root .back:hover { background: var(--surface-2); border-color: var(--brand); }
.ru-root .feat-title { font-weight: 700; font-size: 18px; letter-spacing: -0.01em; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ru-root .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--ink); }
.ru-root .logo { width: 30px; height: 30px; border-radius: 9px; background: var(--brand); color: var(--brand-ink); display: grid; place-items: center; font-size: 15px; font-weight: 700; }
.ru-root .brand small { display: block; font-weight: 500; font-size: 12px; color: var(--ink-2); }
.ru-root .crumb { display: flex; gap: 8px; align-items: center; }
.ru-root button, .ru-root .btn { font: inherit; cursor: pointer; }
.ru-root .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 18px; border-radius: 12px; border: 1.5px solid transparent; font-weight: 700; font-size: 15px; text-decoration: none; }
.ru-root .btn-primary { background: var(--brand); color: var(--brand-ink); }
.ru-root .btn-primary:hover { filter: brightness(1.08); }
.ru-root .btn-ghost { background: transparent; color: var(--ink); border-color: var(--line); }
.ru-root .btn-ghost:hover { background: var(--surface-2); }
.ru-root .btn-danger { background: transparent; color: var(--handle); border-color: var(--handle); }
.ru-root .btn-danger-solid { background: var(--handle); color: var(--surface); }
.ru-root .btn-link { background: none; border: 0; color: var(--brand); font-weight: 700; padding: 4px 0; min-height: 0; text-decoration: underline; text-underline-offset: 3px; }
.ru-root .btn-sm { min-height: 36px; padding: 6px 12px; font-size: 14px; border-radius: 10px; }
.ru-root :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
.ru-root .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.ru-root .hero { padding-block: 24px 8px; display: grid; gap: 14px; }
.ru-root .hero p.lead { font-size: 17px; color: var(--ink-2); max-width: 58ch; }
.ru-root .note { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; background: var(--mint-soft); color: var(--ink); font-size: 14px; }
.ru-root .note.violet { background: var(--violet-soft); }
.ru-root .note .ic { flex: none; width: 20px; height: 20px; border-radius: 50%; background: var(--brand); color: var(--brand-ink); display: grid; place-items: center; font-size: 12px; font-weight: 700; margin-top: 1px; }
.ru-root .note.violet .ic { background: var(--violet); color: var(--surface); }
.ru-root .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 18px; }
.ru-root .stack { display: grid; gap: 16px; }
.ru-root .section { display: grid; gap: 12px; margin-top: 28px; }
.ru-root .stats { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 20px; }
@media (min-width: 640px) {.ru-root .stats { grid-template-columns: 1fr 1fr; }
.ru-root .stat-total { grid-column: 1 / -1; }
 }
.ru-root .stat { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 16px 18px; display: grid; gap: 6px; align-content: start; }
.ru-root .stat-total { background: var(--brand); color: var(--brand-ink); border-color: var(--brand); }
.ru-root .stat-total .eyebrow, .ru-root .stat-total .muted { color: inherit; opacity: 0.82; }
.ru-root .big { font-size: clamp(1.8rem, 6vw, 2.4rem); font-weight: 700; letter-spacing: -0.015em; line-height: 1.1; }
.ru-root .mid { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.01em; }
.ru-root .split { display: grid; gap: 6px; margin-top: 4px; }
.ru-root .split div { display: flex; justify-content: space-between; gap: 10px; padding-block: 6px; border-top: 1px dashed var(--line); font-size: 14px; }
.ru-root .split div:first-child { border-top: 0; }
.ru-root .split b { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ru-root .flags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.ru-root .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.ru-root .chip::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.ru-root .chip.handle { background: var(--handle-soft); color: var(--handle); }
.ru-root .chip.prepare { background: var(--prepare-soft); color: var(--prepare); }
.ru-root .chip.plan { background: var(--plan-soft); color: var(--plan); }
.ru-root .chip.monitor { background: var(--monitor-soft); color: var(--monitor); }
.ru-root .chip.unknown { background: var(--surface-2); color: var(--ink-2); }
.ru-root .chip.verify { background: var(--violet-soft); color: var(--violet); }
.ru-root .chip.verify::before { border-radius: 2px; transform: rotate(45deg); }
.ru-root .chip.demo { background: var(--surface-2); color: var(--ink-2); }
.ru-root .chip.demo::before { display: none; }
.ru-root .filters { display: flex; flex-wrap: wrap; gap: 8px; }
.ru-root .filter { border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 999px; padding: 6px 14px; font-size: 14px; font-weight: 600; min-height: 36px; }
.ru-root .filter[aria-pressed="true"] { background: var(--brand); color: var(--brand-ink); border-color: var(--brand); }
.ru-root .list { display: grid; gap: 12px; }
.ru-root .debt { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 16px 18px 16px 22px; display: grid; gap: 10px; position: relative; overflow: hidden; }
.ru-root .debt::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 5px; background: var(--stripe, var(--line)); }
.ru-root .debt.handle { --stripe: var(--handle); }
.ru-root .debt.prepare { --stripe: var(--prepare); }
.ru-root .debt.plan { --stripe: var(--plan); }
.ru-root .debt.monitor { --stripe: var(--monitor); }
.ru-root .debt.unknown { --stripe: var(--line); }
.ru-root .debt-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.ru-root .debt-head > div { min-width: 0; }
.ru-root .debt-name { font-weight: 700; font-size: 16px; overflow-wrap: anywhere; }
.ru-root .debt-amt { font-weight: 700; font-size: 18px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ru-root .debt-reason { font-size: 14px; color: var(--ink-2); }
.ru-root .debt-foot { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
.ru-root .rank { font-size: 12px; font-weight: 700; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.ru-root .empty { text-align: left; padding: 22px; border: 1.5px dashed var(--line); border-radius: var(--r); background: var(--surface); display: grid; gap: 12px; justify-items: start; }
.ru-root form { display: grid; gap: 18px; }
.ru-root .field { display: grid; gap: 6px; }
.ru-root .field > label, .ru-root .legend { font-weight: 700; font-size: 14px; }
.ru-root .hint { font-size: 13px; color: var(--ink-2); }
.ru-root input[type=text], .ru-root input[type=date], .ru-root textarea, .ru-root select { font: inherit; width: 100%; min-height: 46px; padding: 10px 12px; border-radius: 10px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); }
.ru-root textarea { min-height: 84px; resize: vertical; }
.ru-root input:focus, .ru-root textarea:focus, .ru-root select:focus { outline: 3px solid var(--focus); outline-offset: 1px; border-color: transparent; }
.ru-root .prefix { position: relative; }
.ru-root .prefix span { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-weight: 700; color: var(--ink-2); pointer-events: none; }
.ru-root .prefix input { padding-left: 40px; font-variant-numeric: tabular-nums; }
.ru-root .opts { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.ru-root .opt { position: relative; }
.ru-root .opt input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.ru-root .opt span { display: block; padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 10px; background: var(--surface); font-size: 14px; font-weight: 600; min-height: 44px; }
.ru-root .opt span small { display: block; font-weight: 400; color: var(--ink-2); font-size: 12.5px; }
.ru-root .opt input:checked + span { border-color: var(--brand); background: var(--mint-soft); }
.ru-root .opt input:focus-visible + span { outline: 3px solid var(--focus); outline-offset: 2px; }
.ru-root .check { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; cursor: pointer; }
.ru-root .check input { width: 20px; height: 20px; margin-top: 2px; accent-color: var(--brand); flex: none; }
.ru-root .err { color: var(--handle); font-size: 13px; font-weight: 600; }
.ru-root .field.invalid input, .ru-root .field.invalid select { border-color: var(--handle); }
.ru-root .auto { font-size: 13px; padding: 8px 12px; border-radius: 10px; background: var(--surface-2); }
.ru-root .provider-field { position: relative; }
.ru-root .provider-wrap { position: relative; }
.ru-root .provider-suggestions { position: absolute; z-index: 18; top: calc(100% + 4px); left: 0; right: 0; max-height: 320px; overflow-y: auto; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); box-shadow: 0 14px 32px rgba(15, 42, 32, 0.14); }
.ru-root .provider-suggestion { width: 100%; min-height: 56px; padding: 9px 12px; border: 0; border-bottom: 1px solid var(--line); background: var(--surface); color: var(--ink); display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; }
.ru-root .provider-suggestion:last-child { border-bottom: 0; }
.ru-root .provider-suggestion:hover, .ru-root .provider-suggestion[aria-selected="true"] { background: var(--surface-2); }
.ru-root .provider-suggestion-main { min-width: 0; display: grid; gap: 1px; }
.ru-root .provider-suggestion-name { font-size: 14px; font-weight: 700; overflow-wrap: anywhere; }
.ru-root .provider-suggestion-pt { color: var(--ink-2); font-size: 12px; }
.ru-root .legal-badge { flex: none; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.ru-root .legal-badge.legal { background: var(--mint-soft); color: var(--brand); }
.ru-root .legal-badge.illegal { background: var(--handle-soft); color: var(--handle); }
.ru-root .legal-status { display: flex; align-items: flex-start; gap: 7px; font-size: 13px; font-weight: 700; line-height: 1.4; }
.ru-root .legal-status span { font-weight: 500; }
.ru-root .legal-status.legal { color: var(--brand); }
.ru-root .legal-status.illegal { color: var(--handle); }
.ru-root .legal-status.unknown { color: var(--ink-2); }
.ru-root .provider-live-status { display: grid; gap: 2px; margin-top: 2px; }
.ru-root .provider-live-status span { line-height: 1.55; }
.ru-root .rank .legal-status { display: inline-flex; font-size: 12px; }
.ru-root details.more { border-top: 1px solid var(--line); padding-top: 14px; }
.ru-root details.more summary { cursor: pointer; font-weight: 700; font-size: 14px; }
.ru-root details.more[open] summary { margin-bottom: 14px; }
.ru-root .sticky-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ru-root dl.facts { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0; margin: 0; }
.ru-root dl.facts div { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 12px; padding-block: 10px; border-top: 1px solid var(--line); }
.ru-root dl.facts div:first-child { border-top: 0; }
.ru-root dl.facts dt { color: var(--ink-2); font-size: 14px; }
.ru-root dl.facts dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
@media (max-width: 460px) {.ru-root dl.facts div { grid-template-columns: 1fr; gap: 2px; }
 }
.ru-root .steps { display: grid; gap: 12px; counter-reset: s; }
.ru-root .step { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; }
.ru-root .step::before { counter-increment: s; content: counter(s); width: 28px; height: 28px; border-radius: 50%; background: var(--mint-soft); color: var(--ink); display: grid; place-items: center; font-weight: 700; font-size: 13px; }
.ru-root .step p { font-size: 14.5px; color: var(--ink-2); margin-top: 2px; }
.ru-root .confirm { border: 1.5px solid var(--handle); background: var(--handle-soft); border-radius: 12px; padding: 14px; display: grid; gap: 10px; }
.ru-root details.guide { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r); padding: 14px 18px; }
.ru-root details.guide summary { cursor: pointer; font-weight: 700; }
.ru-root details.guide[open] summary { margin-bottom: 10px; }
.ru-root details.guide ol, .ru-root details.guide ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 14.5px; color: var(--ink-2); }
.ru-root .banner { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; border-radius: 12px; background: var(--violet-soft); color: var(--ink); font-size: 14px; margin-top: 8px; }
.ru-root .toast { position: fixed; left: 50%; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); background: var(--ink); color: var(--bg); padding: 10px 16px; border-radius: 10px; font-weight: 600; font-size: 14px; max-width: calc(100% - 32px); z-index: 10; }
.ru-root .foot { margin-top: 36px; font-size: 13px; color: var(--ink-2); display: grid; gap: 8px; }
@media (prefers-reduced-motion: no-preference) {.ru-root .view { animation: ru-in .18s ease-out; }
@keyframes ru-in { from { opacity: .4; transform: translateY(4px); } to { opacity: 1; transform: none; } }
 }

.ru-root ol { list-style: decimal; } .ru-root ul { list-style: disc; } .ru-root [hidden] { display: none !important; } .ru-root svg { display: inline-block; } .ru-root button { background: none; } .ru-root .btn-primary { background: var(--brand); } .ru-root .btn-danger-solid { background: var(--handle); } .ru-root .filter { background: var(--surface); } .ru-root .filter[aria-pressed="true"] { background: var(--brand); } .ru-root .back { background: var(--surface); } .ru-root .back:hover { background: var(--surface-2); } .ru-root .btn-ghost:hover { background: var(--surface-2); }
.ru-root { min-height: 100vh; margin: 0; -webkit-font-smoothing: antialiased; text-align: left; }

/* ===== Laporan cetak / PDF (hanya muncul saat dicetak) ===== */
.ru-root .ru-print { display: none; }
.ru-root .print-hint { margin-top: 2px; }
@media print {
  @page { size: A4; margin: 14mm; }
  body > *:not(:has(.ru-root)) { display: none !important; }
  body { background: #fff !important; }
  .ru-root { background: #fff; min-height: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .ru-root .topbar, .ru-root .wrap, .ru-root .toast { display: none !important; }
  .ru-root .ru-print { display: block !important; font-size: 12px; line-height: 1.5; color: var(--ink); }
  .ru-print .p-head { border-bottom: 2px solid var(--brand); padding-bottom: 8px; margin-bottom: 14px; }
  .ru-print .p-brand { font-size: 20px; font-weight: 700; color: var(--brand); }
  .ru-print h1 { font-size: 20px; margin-top: 2px; }
  .ru-print h2 { font-size: 14px; margin: 18px 0 8px; }
  .ru-print .p-demo { background: var(--violet-soft); padding: 8px 10px; border-radius: 8px; margin-bottom: 10px; }
  .ru-print table { width: 100%; border-collapse: collapse; }
  .ru-print th, .ru-print td { text-align: left; padding: 6px 6px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .ru-print th { color: var(--ink-2); font-weight: 600; font-size: 11px; }
  .ru-print td.r, .ru-print th.r { text-align: right; white-space: nowrap; }
  .ru-print .p-debt { break-inside: avoid; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; }
  .ru-print .p-debt h3 { font-size: 13px; }
  .ru-print .p-debt ol { margin: 6px 0 0; padding-left: 18px; }
  .ru-print .p-debt li { margin-bottom: 4px; }
  .ru-print .chip { font-size: 10.5px; padding: 1px 8px; }
  .ru-print .p-foot { margin-top: 16px; font-size: 10.5px; color: var(--ink-2); display: grid; gap: 4px; }
}
`;

const MARKUP = `<header class="topbar"><div class="top">
    <div class="backbar">
      <button class="back" id="backBtn" data-act="back" type="button" aria-label="Kembali">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="feat-title">Rangkum Semua Utang</span>
    </div>
  </div></header>
<div class="wrap">
  <div id="demoBanner" hidden class="banner"><span><b>Kamu sedang melihat data contoh.</b> Angka ini bukan milikmu.</span><button class="btn btn-ghost btn-sm" id="clearDemo" type="button">Hapus data contoh</button></div>
  <main id="app"></main>
  <footer class="foot">
    <p>Data tagihanmu hanya tersimpan di browser ini. Data tidak dikirim ke server atau layanan AI, tidak ikut pindah ke perangkat lain, dan bisa hilang jika riwayat browser dibersihkan. EduPuan tidak pernah meminta NIK, kata sandi, PIN, OTP, atau akses ke akun pinjamanmu.</p>
  </footer>
</div>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<div id="printReport" class="ru-print" aria-hidden="true"></div>`;

/* ===== Aturan (sama persis dengan logic.js yang lulus 33 uji) ===== */
/* ===== Logika Rangkum Semua Utang (berbasis aturan, tanpa AI) =====
   Semua fungsi murni: tidak menyentuh DOM atau penyimpanan, supaya mudah diuji
   dan dipindahkan ke framework apa pun. */
var DebtLogic = (function () {
  var TYPES = { pinjol: 'Pinjol', paylater: 'Paylater', digital: 'Pinjaman digital lainnya', lainnya: 'Lainnya' };
  var STATUS = { checked: 'Sudah diperiksa', unverified: 'Belum diverifikasi', disputed: 'Sedang disengketakan' };
  var MAX_AMOUNT = 100000000000; // Rp100 miliar, batas wajar untuk menolak salah ketik

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Tanggal lokal pengguna dalam format YYYY-MM-DD
  function todayKey(now) {
    var d = now || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function isValidDateKey(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = s.split('-').map(Number);
    if (p[0] < 2000 || p[0] > 2100) return false;
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return d.getUTCFullYear() === p[0] && d.getUTCMonth() === p[1] - 1 && d.getUTCDate() === p[2];
  }

  function dayNumber(key) {
    var p = key.split('-').map(Number);
    return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000);
  }

  // Selisih hari dari hari ini ke tanggal jatuh tempo (negatif = sudah lewat)
  function daysUntil(dueKey, today) { return dayNumber(dueKey) - dayNumber(today); }

  // Menerima "1500000", "1.500.000", "Rp 1.500.000". Tidak menerima desimal atau negatif.
  function parseAmount(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (s === '') return { ok: false, error: 'Isi nominal tagihan.' };
    s = s.replace(/^rp\.?\s*/i, '').replace(/\s/g, '');
    if (/^-/.test(s)) return { ok: false, error: 'Nominal tidak boleh negatif.' };
    if (!/^\d{1,3}(\.\d{3})*$/.test(s) && !/^\d+$/.test(s)) {
      return { ok: false, error: 'Tulis nominal dengan angka saja, misalnya 1500000 atau 1.500.000.' };
    }
    var n = Number(s.replace(/\./g, ''));
    if (!isFinite(n)) return { ok: false, error: 'Nominal tidak valid.' };
    if (n > MAX_AMOUNT) return { ok: false, error: 'Nominal terlalu besar. Periksa lagi jumlah angkanya.' };
    return { ok: true, value: n };
  }

  // Validasi satu entri dari formulir. Mengembalikan { ok, errors, debt }
  function validateDebt(input) {
    var errors = {};
    var provider = String(input.provider || '').trim();
    if (!provider) errors.provider = 'Isi nama penyedia atau layanan.';
    else if (provider.length > 60) errors.provider = 'Nama penyedia maksimal 60 karakter.';

    var amount = parseAmount(input.amount);
    if (!amount.ok) errors.amount = amount.error;

    var due = null;
    if (!input.dueUnknown) {
      if (!input.dueDate) errors.dueDate = 'Pilih tanggal jatuh tempo, atau centang "Belum tahu".';
      else if (!isValidDateKey(input.dueDate)) errors.dueDate = 'Tanggal tidak valid.';
      else due = input.dueDate;
    }

    if (!STATUS[input.status]) errors.status = 'Pilih status informasi tagihan.';

    var paid = null;
    if (String(input.paid || '').trim() !== '') {
      var p = parseAmount(input.paid);
      if (!p.ok) errors.paid = p.error.replace('nominal tagihan', 'jumlah yang sudah dibayar');
      else paid = p.value;
    }

    var note = String(input.note || '').trim();
    if (note.length > 500) errors.note = 'Catatan maksimal 500 karakter.';

    var ok = Object.keys(errors).length === 0;
    return {
      ok: ok,
      errors: errors,
      debt: ok ? {
        id: input.id || null,
        provider: provider,
        type: input.type,
        amount: amount.value,
        dueDate: due,
        status: input.status,
        paid: paid,
        note: note,
        collectionIssue: !!input.collectionIssue
      } : null
    };
  }

  // Kelompok waktu
  function timeBucket(debt, today) {
    if (!debt.dueDate) return 'unknown';
    var d = daysUntil(debt.dueDate, today);
    if (d < 0) return 'overdue';
    if (d === 0) return 'today';
    if (d <= 3) return 'd1_3';
    if (d <= 7) return 'd4_7';
    return 'later';
  }

  var LABELS = {
    overdue: { key: 'handle', text: 'Segera tangani' },
    today: { key: 'handle', text: 'Segera tangani' },
    d1_3: { key: 'prepare', text: 'Segera persiapkan' },
    d4_7: { key: 'plan', text: 'Rencanakan pembayaran' },
    later: { key: 'monitor', text: 'Pantau dan rencanakan' },
    unknown: { key: 'unknown', text: 'Tanggal belum diketahui' }
  };

  function needsVerification(debt) { return debt.status !== 'checked'; }

  function dueText(debt, today) {
    if (!debt.dueDate) return 'Tanggal jatuh tempo belum diketahui';
    var d = daysUntil(debt.dueDate, today);
    if (d < 0) return 'Sudah lewat ' + (-d) + ' hari';
    if (d === 0) return 'Jatuh tempo hari ini';
    return 'Jatuh tempo ' + d + ' hari lagi';
  }

  // Label + alasan + tindakan berikutnya untuk satu tagihan
  function assess(debt, today) {
    var bucket = timeBucket(debt, today);
    var label = LABELS[bucket];
    var verify = needsVerification(debt);
    var reason;
    switch (bucket) {
      case 'overdue': reason = 'Tanggal jatuh tempo sudah lewat ' + (-daysUntil(debt.dueDate, today)) + ' hari, jadi kewajiban dan konsekuensi keterlambatannya perlu segera diperiksa.'; break;
      case 'today': reason = 'Tagihan ini jatuh tempo hari ini, jadi perlu segera diperiksa.'; break;
      case 'd1_3': reason = 'Tagihan ini jatuh tempo dalam ' + daysUntil(debt.dueDate, today) + ' hari. Masih ada waktu singkat untuk bersiap.'; break;
      case 'd4_7': reason = 'Tagihan ini jatuh tempo dalam ' + daysUntil(debt.dueDate, today) + ' hari. Ada waktu untuk menyusun rencana.'; break;
      case 'later': reason = 'Tagihan ini jatuh tempo lebih dari 7 hari lagi. Cukup dipantau dan dicatat tenggatnya.'; break;
      default: reason = 'Informasi belum cukup untuk menentukan langkah pembayaran karena tanggal jatuh tempo belum diketahui.';
    }
    if (verify) {
      reason += debt.status === 'disputed'
        ? ' Nominalnya sedang kamu sengketakan, jadi perlu diverifikasi sebelum keputusan pembayaran dibuat.'
        : ' Nominalnya belum diverifikasi, jadi perlu dipastikan dulu sebelum keputusan pembayaran dibuat.';
    }

    var actions = [];
    if (verify) actions.push({ title: 'Verifikasi tagihan', text: 'Periksa rincian tagihan melalui kanal resmi penyedia. Pastikan jumlah yang diminta, rincian biaya, pembayaran yang sudah diterima, dan tanggal jatuh tempo. Minta rincian tertulis dan simpan bukti komunikasi.' });
    if (bucket === 'overdue' || bucket === 'today') actions.push({ title: 'Tagihan sudah jatuh tempo', text: 'Periksa jumlah kewajiban yang masih tercatat dan konsekuensi keterlambatan. Hubungi penyedia melalui kanal resmi untuk menanyakan pilihan penyelesaian yang tersedia.' });
    if (bucket === 'd1_3' || bucket === 'd4_7') actions.push({ title: 'Tagihan segera jatuh tempo', text: 'Pastikan nominal dan tenggat. Periksa kemampuan membayar dan hubungi penyedia lebih awal jika kamu memperkirakan tidak dapat memenuhi pembayaran.' });
    if (bucket === 'later') actions.push({ title: 'Pantau tagihan', text: 'Pantau perubahan tagihan, catat tenggatnya, dan rencanakan kebutuhan pembayaran tanpa mengabaikan kebutuhan pokok.' });
    if (bucket === 'unknown') actions.push({ title: 'Cari tahu tanggal jatuh tempo', text: 'Informasi belum cukup untuk menentukan langkah pembayaran. Periksa tanggal jatuh tempo di aplikasi atau melalui kanal resmi penyedia, lalu perbarui entri ini.' });
    if (debt.collectionIssue) actions.push({ title: 'Dugaan penagihan bermasalah', text: 'Simpan bukti komunikasi. Jika terdapat ancaman, intimidasi, atau penyebaran data pribadi, cari bantuan melalui kanal pengaduan resmi yang relevan.' });

    return { bucket: bucket, label: label, verify: verify, reason: reason, actions: actions };
  }

  // Ringkasan dari semua entri aktif. "paid" hanya catatan dan tidak dikurangkan:
  // nominal tagihan saat ini sudah memperhitungkan pembayaran.
  function summarize(debts, today) {
    var s = {
      count: debts.length, total: 0,
      overdue: { count: 0, sum: 0 }, today: { count: 0, sum: 0 },
      d1_3: { count: 0, sum: 0 }, d4_7: { count: 0, sum: 0 },
      later: { count: 0, sum: 0 }, unknown: { count: 0, sum: 0 },
      verifyCount: 0, disputedCount: 0
    };
    debts.forEach(function (d) {
      s.total += d.amount;
      var b = timeBucket(d, today);
      s[b].count++; s[b].sum += d.amount;
      if (needsVerification(d)) s.verifyCount++;
      if (d.status === 'disputed') s.disputedCount++;
    });
    s.soon = { count: s.today.count + s.d1_3.count + s.d4_7.count, sum: s.today.sum + s.d1_3.sum + s.d4_7.sum };
    return s;
  }

  // Urutan daftar: urgensi waktu dulu; dalam kelompok yang sama, tagihan yang perlu
  // diverifikasi naik karena butuh tindak lanjut lebih dulu (bukan karena harus dibayar lebih dulu).
  var RANK = { overdue: 0, today: 0, d1_3: 1, d4_7: 2, later: 3, unknown: 4 };
  function sortDebts(debts, today) {
    return debts.slice().sort(function (a, b) {
      var ra = RANK[timeBucket(a, today)], rb = RANK[timeBucket(b, today)];
      if (ra !== rb) return ra - rb;
      var va = needsVerification(a) ? 0 : 1, vb = needsVerification(b) ? 0 : 1;
      if (va !== vb) return va - vb;
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      return a.provider.localeCompare(b.provider, 'id');
    });
  }

  function formatRp(n) {
    return 'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatDate(key) {
    if (!key) return 'Belum tahu';
    var b = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var p = key.split('-').map(Number);
    return p[2] + ' ' + b[p[1] - 1] + ' ' + p[0];
  }

  return {
    TYPES: TYPES, STATUS: STATUS, todayKey: todayKey, isValidDateKey: isValidDateKey,
    daysUntil: daysUntil, parseAmount: parseAmount, validateDebt: validateDebt,
    timeBucket: timeBucket, needsVerification: needsVerification, assess: assess,
    summarize: summarize, sortDebts: sortDebts, formatRp: formatRp, formatDate: formatDate,
    dueText: dueText
  };
})();

/* ===== Tampilan & interaksi ===== */
function mountRangkumUtang(root, onExit) {
  var L = DebtLogic;
  var $ = function (id) { return root.querySelector('#' + id); };
  var cleanups = [];
  function on(t, ev, fn) { t.addEventListener(ev, fn); cleanups.push(function () { t.removeEventListener(ev, fn); }); }
  var KEY = 'edupuan.rangkumUtang.v1';
  // Label status yang tampil ke pengguna (lebih sederhana dari L.STATUS)
  var STATUS_TAMPIL = { checked: 'Ya, sudah pasti', unverified: 'Belum yakin', disputed: 'Aku tidak setuju' };
  var state = { debts: [], demo: false, view: 'home', id: null, filter: 'all', sort: 'due', confirmDelete: false, today: L.todayKey() };
  var app = $('app');

  /* ---------- Penyimpanan lokal ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var d = JSON.parse(raw); state.debts = Array.isArray(d.debts) ? d.debts : []; state.demo = !!d.demo; }
    } catch (e) { /* penyimpanan tidak tersedia: tetap jalan di memori */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ debts: state.debts, demo: state.demo })); } catch (e) {}
  }
  function uid() { return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rp(n) { return L.formatRp(n); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return L.todayKey(d); }

  var toastTimer;
  var providerDropOpen = false;
  var providerSuggestionIndex = -1;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  function go(view, id) {
    state.view = view; state.id = id || null; state.confirmDelete = false;
    render(); window.scrollTo(0, 0);
    var h = app.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- Komponen ---------- */
  // Label tenggat yang tampil ke pengguna: hanya menjelaskan waktu, tidak menyuruh membayar.
  // Warna (key) tetap dari DebtLogic.
  var LABEL_TAMPIL = {
    overdue: 'Lewat jatuh tempo', today: 'Jatuh tempo hari ini', d1_3: 'Jatuh tempo 1–3 hari',
    d4_7: 'Jatuh tempo 4–7 hari', later: 'Jatuh tempo > 7 hari', unknown: 'Tanggal belum diketahui'
  };
  var URUTAN = {
    due: 'Jatuh tempo terdekat',
    besar: 'Nominal terbesar',
    kecil: 'Nominal terkecil'
  };
  // Mengurutkan daftar HANYA berdasarkan pilihan pengguna. Ini bukan saran urutan pembayaran.
  function urutkan(debts) {
    return debts.slice().sort(function (a, b) {
      if (state.sort === 'besar' && a.amount !== b.amount) return b.amount - a.amount;
      if (state.sort === 'kecil' && a.amount !== b.amount) return a.amount - b.amount;
      if (a.dueDate !== b.dueDate) {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate < b.dueDate ? -1 : 1;
      }
      return a.provider.localeCompare(b.provider, 'id');
    });
  }

  function chips(a) {
    var h = '<span class="chip ' + a.label.key + '">' + esc(LABEL_TAMPIL[a.bucket]) + '</span>';
    if (a.verify) h += '<span class="chip verify">Perlu verifikasi</span>';
    return h;
  }

  function normalizeProviderName(value) {
    return String(value || '').trim().toLowerCase().replace(/[-\s]+/g, ' ');
  }

  function providerLegalStatus(value) {
    var q = normalizeProviderName(value);
    if (!q) return { key: 'unknown', label: 'Tidak ditemukan', pt: '' };
    var legal = LEGAL_PINJOL.find(function (x) {
      var n = x.nama.toLowerCase();
      return n.includes(q) || q.includes(n);
    });
    if (legal) return { key: 'legal', label: 'Terdaftar OJK', pt: legal.pt };
    var illegal = ILEGAL_NAMES.find(function (x) {
      var n = x.toLowerCase().replace(/[-\s]+/g, ' ');
      return n.includes(q) || q.includes(n);
    });
    if (illegal) return { key: 'illegal', label: 'Terindikasi ilegal', pt: '' };
    return { key: 'unknown', label: 'Tidak ditemukan', pt: '' };
  }

  function providerSuggestions(value) {
    var q = String(value || '').trim().toLowerCase();
    if (q.length < 2) return [];
    return LEGAL_PINJOL.filter(function (x) { return x.nama.toLowerCase().includes(q); }).slice(0, 5)
      .map(function (x) { return { name: x.nama, pt: x.pt, key: 'legal' }; })
      .concat(ILEGAL_NAMES.filter(function (x) { return x.toLowerCase().includes(q); }).slice(0, 3)
        .map(function (x) { return { name: x, pt: '', key: 'illegal' }; }))
      .slice(0, 8);
  }

  function legalStatusHtml(status, fullLabel, showPt) {
    var label = status.label;
    if (fullLabel && status.key === 'legal') label = 'Terdaftar di OJK';
    if (fullLabel && status.key === 'unknown') label = 'Tidak ditemukan di data EduPuan. Cek langsung di ojk.go.id atau WA OJK 081-157-157-157.';
    return '<span class="legal-status ' + status.key + '"><b>' + esc(label) + '</b>' +
      (status.pt && showPt ? '<span>· ' + esc(status.pt) + '</span>' : '') + '</span>';
  }

  function liveProviderStatusHtml(status, value) {
    if (status.key === 'legal') {
      return '<span class="legal-status legal provider-live-status"><b>Berizin OJK</b>' +
        (status.pt ? '<span>' + esc(status.pt) + ' · Berizin dan diawasi OJK</span>' : '') + '</span>';
    }
    if (status.key === 'illegal') {
      return '<span class="legal-status illegal provider-live-status"><b>Tercatat sebagai pinjol ilegal</b></span>';
    }
    return '<span class="legal-status unknown provider-live-status"><b>&quot;' + esc(String(value).trim()) + '&quot; tidak ditemukan</b>' +
      '<span>Nama ini tidak ditemukan di database EduPuan. Status legalitasnya belum dapat dipastikan. Cek langsung di ojk.go.id atau WhatsApp OJK 081-157-157-157.</span></span>';
  }

  function updateProviderAssistance() {
    var input = $('f-provider'), list = $('providerSuggestions'), statusBox = $('providerLegalStatus');
    if (!input || !list || !statusBox) return;
    var value = input.value;
    var suggestions = providerSuggestions(value);
    if (providerSuggestionIndex >= suggestions.length) providerSuggestionIndex = suggestions.length - 1;
    if (!providerDropOpen || !suggestions.length) {
      list.hidden = true;
      list.innerHTML = '';
      input.setAttribute('aria-expanded', 'false');
    } else {
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      list.innerHTML = suggestions.map(function (item, i) {
        return '<button type="button" class="provider-suggestion" data-act="pick-provider" data-name="' + esc(item.name) + '" aria-selected="' + (i === providerSuggestionIndex) + '">' +
          '<span class="provider-suggestion-main"><span class="provider-suggestion-name">' + esc(item.name) + '</span>' +
          (item.pt ? '<span class="provider-suggestion-pt">' + esc(item.pt) + '</span>' : '') + '</span>' +
          '<span class="legal-badge ' + item.key + '">' + (item.key === 'legal' ? 'Berizin' : 'Ilegal') + '</span></button>';
      }).join('');
    }
    statusBox.innerHTML = String(value).trim().length >= 3
      ? liveProviderStatusHtml(providerLegalStatus(value), value)
      : '';
  }

  function pickProvider(name) {
    var input = $('f-provider');
    if (!input) return;
    input.value = name;
    providerDropOpen = false;
    providerSuggestionIndex = -1;
    updateProviderAssistance();
    input.focus();
  }

  function debtCard(d) {
    var a = L.assess(d, state.today);
    var legal = providerLegalStatus(d.provider);
    return '<article class="debt ' + a.label.key + '">' +
      '<div class="debt-head"><div><div class="rank">' + legalStatusHtml(legal, false, false) + '</div><div class="debt-name">' + esc(d.provider) + '</div></div>' +
      '<div class="debt-amt">' + rp(d.amount) + '</div></div>' +
      '<div class="row">' + chips(a) + '</div>' +
      '<p class="small"><b>' + esc(L.formatDate(d.dueDate)) + '</b> <span class="muted">· ' + esc(L.dueText(d, state.today)) + '</span></p>' +
      '<p class="debt-reason">' + esc(a.reason) + '</p>' +
      '<div class="debt-foot"><span></span><div class="row">' +
      '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + d.id + '" type="button">Edit</button>' +
      '<button class="btn btn-primary btn-sm" data-act="detail" data-id="' + d.id + '" type="button">Lihat Detail</button></div></div>' +
      '</article>';
  }

  /* ---------- Halaman awal ---------- */
  function viewHome() {
    var has = state.debts.length > 0;
    return '<div class="two home-two"><section class="view hero">' +
      '<span class="eyebrow">Untuk yang sudah punya tagihan</span>' +
      '<h1>Rangkum Semua Utangmu</h1>' +
      '<p class="lead">Catat semua tagihanmu agar kamu bisa memahami jumlah kewajiban, tenggat pembayaran, dan langkah berikutnya dengan lebih jelas.</p>' +
      '<div class="row"><button class="btn btn-primary" data-act="add" type="button">Tambah Utang</button>' +
      (has ? '<button class="btn btn-ghost" data-act="summary" type="button">Lihat Rangkuman (' + state.debts.length + ')</button>' : '') + '</div>' +
      '<div class="note"><span class="ic" aria-hidden="true">i</span><span>Masukkan nominal berdasarkan informasi tagihan terakhir yang kamu miliki. Jika jumlahnya belum pasti, tandai sebagai perlu diverifikasi.</span></div>' +
      '</section>' +
      '<section class="section panel how"><h2>Cara kerjanya</h2>' +
      '<div class="steps">' +
      '<div class="step"><div><h3>Tambahkan satu utang dulu</h3><p>Cukup nama penyedia, nominal tagihan saat ini, tanggal jatuh tempo, dan status tagihannya. Utang lain bisa ditambah kapan saja.</p></div></div>' +
      '<div class="step"><div><h3>Lihat rangkuman</h3><p>Total tagihan, yang sudah jatuh tempo, dan yang segera jatuh tempo dalam 7 hari.</p></div></div>' +
      '<div class="step"><div><h3>Cek tenggat dan langkah berikutnya</h3><p>Setiap tagihan diberi keterangan tenggat dan langkah yang bisa kamu lakukan. EduPuan tidak menentukan tagihan mana yang harus dibayar lebih dulu.</p></div></div>' +
      '</div>' +
      (has ? '' : '<p class="small muted">Ingin melihat contohnya dulu? <button class="btn-link btn" data-act="demo" type="button">Coba dengan data contoh</button></p>') +
      '</section></div>';
  }

  /* ---------- Rangkuman ---------- */
  function viewSummary() {
    if (!state.debts.length) {
      return '<section class="view hero"><h1>Rangkuman Utang</h1>' +
        '<div class="empty"><h2>Belum ada tagihan yang dicatat</h2><p class="muted">Tambahkan tagihan pertamamu untuk melihat total dan tenggat semua tagihanmu.</p>' +
        '<button class="btn btn-primary" data-act="add" type="button">Tambah Utang</button></div></section>';
    }
    var s = L.summarize(state.debts, state.today);
    var sorted = urutkan(state.debts);
    var shown = sorted.filter(function (d) {
      var b = L.timeBucket(d, state.today);
      if (state.filter === 'overdue') return b === 'overdue';
      if (state.filter === 'soon') return b === 'today' || b === 'd1_3' || b === 'd4_7';
      if (state.filter === 'verify') return L.needsVerification(d);
      return true;
    });

    var h = '<section class="view">' +
      '<div class="hero" style="padding-bottom:0"><span class="eyebrow">Per ' + esc(L.formatDate(state.today)) + '</span>' +
      '<div class="row" style="justify-content:space-between"><h1>Rangkuman Utangmu</h1>' +
      '<button class="btn btn-ghost btn-sm" data-act="print" type="button">📄 Unduh rangkuman (PDF)</button></div>' +
      '<p class="small muted print-hint">File PDF akan langsung terunduh ke perangkatmu. Simpan di tempat yang aman karena berisi data keuanganmu.</p></div>' +
      '<div class="two sum-two"><aside class="side">' +
      '<div class="stats">' +
      '<div class="stat stat-total"><span class="eyebrow">Total tagihan tercatat</span><div class="big num">' + rp(s.total) + '</div>' +
      '<p class="small muted">' + s.count + ' tagihan. Total berdasarkan data yang kamu masukkan. Periksa kembali rincian dari setiap penyedia.</p></div>' +

      '<div class="stat"><span class="eyebrow">Sudah jatuh tempo</span><div class="mid num">' + rp(s.overdue.sum) + '</div>' +
      '<p class="small muted">' + (s.overdue.count ? s.overdue.count + ' tagihan melewati tanggal jatuh tempo.' : 'Tidak ada tagihan yang lewat jatuh tempo.') + '</p>' +
      (s.overdue.count ? '<div><button class="btn btn-ghost btn-sm" data-act="filter" data-f="overdue" type="button">Lihat daftar</button></div>' : '') + '</div>' +

      '<div class="stat"><span class="eyebrow">Segera jatuh tempo (≤ 7 hari)</span><div class="mid num">' + rp(s.soon.sum) + '</div>' +
      '<div class="split">' +
      '<div><span>Hari ini (' + s.today.count + ')</span><b>' + rp(s.today.sum) + '</b></div>' +
      '<div><span>1–3 hari (' + s.d1_3.count + ')</span><b>' + rp(s.d1_3.sum) + '</b></div>' +
      '<div><span>4–7 hari (' + s.d4_7.count + ')</span><b>' + rp(s.d4_7.sum) + '</b></div></div>' +
      (s.soon.count ? '<div><button class="btn btn-ghost btn-sm" data-act="filter" data-f="soon" type="button">Lihat daftar</button></div>' : '') + '</div>' +
      '</div>';

    var flags = [];
    if (s.verifyCount) flags.push('<span class="chip verify">' + s.verifyCount + ' perlu verifikasi' + (s.disputedCount ? ' (' + s.disputedCount + ' disengketakan)' : '') + '</span>');
    if (s.unknown.count) flags.push('<span class="chip unknown">' + s.unknown.count + ' tanggal belum diketahui</span>');
    if (flags.length) h += '<div class="flags">' + flags.join('') + '</div>';

    var listHtml = '<section class="section main-sec">' +
      '<div class="mini-total" aria-hidden="true"><span>Total tercatat <b class="num">' + rp(s.total) + '</b></span><span class="muted">' + s.count + ' tagihan' + (s.overdue.count ? ' · ' + s.overdue.count + ' lewat tempo' : '') + '</span></div>' +
      '<div class="row" style="justify-content:space-between"><h2>Daftar tagihan</h2>' +
      '<button class="btn btn-primary btn-sm" data-act="add" type="button">+ Tambah Utang</button></div>' +
      '<div class="row small"><label for="f-sort" class="muted">Urutkan berdasarkan</label>' +
      '<select id="f-sort" style="width:auto;min-height:36px;padding:4px 10px">' +
      Object.keys(URUTAN).map(function (k) { return '<option value="' + k + '"' + (state.sort === k ? ' selected' : '') + '>' + URUTAN[k] + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="filters" role="group" aria-label="Saring daftar">' +
      [['all', 'Semua (' + s.count + ')'], ['overdue', 'Sudah jatuh tempo (' + s.overdue.count + ')'], ['soon', '≤ 7 hari (' + s.soon.count + ')'], ['verify', 'Perlu verifikasi (' + s.verifyCount + ')']]
        .map(function (f) { return '<button class="filter" type="button" data-act="filter" data-f="' + f[0] + '" aria-pressed="' + (state.filter === f[0]) + '">' + f[1] + '</button>'; }).join('') +
      '</div>' +
      '<details class="guide"><summary>Tentang urutan daftar ini</summary><ul>' +
      '<li>Daftar hanya diurutkan sesuai pilihanmu: jatuh tempo terdekat, nominal terbesar, atau nominal terkecil.</li>' +
      '<li><b>Urutan ini bukan saran tagihan mana yang harus dibayar lebih dulu.</b> Tagihan di posisi teratas tidak berarti lebih penting untuk dibayar.</li>' +
      '<li>Keputusan pembayaran bergantung pada dana yang kamu punya, isi perjanjian, dan hasil komunikasimu dengan tiap penyedia melalui kanal resminya.</li>' +
      '</ul></details>' +
      '<div class="list-scroll" id="listScroll" tabindex="0" role="region" aria-label="Daftar tagihan, ' + shown.length + ' item"><div class="list">' + (shown.length ? shown.map(function (d) { return debtCard(d); }).join('') : '<div class="empty"><p class="muted">Tidak ada tagihan di kelompok ini.</p><button class="btn btn-ghost btn-sm" data-act="filter" data-f="all" type="button">Tampilkan semua</button></div>') + '</div></div>' +
      '<p class="list-count small muted" id="listCount">Menampilkan ' + shown.length + ' dari ' + s.count + ' tagihan</p>' +
      '</section>';

    h += '<section class="section side-sec"><details class="guide"><summary>Danaku tidak cukup untuk semua tagihan</summary>' +
      '<div class="stack"><p class="muted small">Ini kondisi yang dialami banyak orang. Tidak semua tagihan mungkin bisa dibayar sekaligus, dan itu bukan alasan untuk panik.</p><ol>' +
      '<li>Amankan dulu kebutuhan pokok: makanan, tempat tinggal, dan obat-obatan.</li>' +
      '<li>Tinjau tenggat dan konsekuensi keterlambatan yang bisa kamu buktikan dari ketentuan resmi setiap penyedia.</li>' +
      '<li>Hubungi penyedia melalui kanal resmi untuk membahas opsi penyelesaian. Tidak ada jaminan permintaan disetujui, tapi menghubungi lebih awal memberi kamu informasi yang lebih jelas.</li>' +
      '<li>Simpan semua bukti komunikasi dan pembayaran.</li>' +
      '<li><b>Jangan mengambil pinjaman baru untuk menutup pinjaman lama.</b> Cara ini biasanya menambah beban, bukan menguranginya.</li>' +
      '</ol><p class="small muted">EduPuan tidak menentukan tagihan mana yang harus dibayar lebih dulu. Keputusan tetap ada di tanganmu.</p></div></details>' +
      '<div class="row"><button class="btn btn-ghost btn-sm" data-act="wipe" type="button">Hapus semua data</button></div>' +
      (state.view === 'summary' && state.confirmDelete === 'all' ? '<div class="confirm"><p><b>Hapus semua ' + s.count + ' tagihan dari browser ini?</b> Tindakan ini tidak bisa dibatalkan.</p><div class="row"><button class="btn btn-danger-solid btn-sm" data-act="wipe-yes" type="button">Ya, hapus semua</button><button class="btn btn-ghost btn-sm" data-act="cancel-del" type="button">Batal</button></div></div>' : '') +
      '</section></aside><div class="main">' + listHtml + '</div></div></section>';
    return h;
  }

  /* ---------- Formulir ---------- */
  function viewForm(errors, values) {
    var d = values || (state.id ? state.debts.filter(function (x) { return x.id === state.id; })[0] : null) || {};
    var editing = !!state.id;
    var e = errors || {};
    function err(k) { return e[k] ? '<p class="err" id="err-' + k + '">' + esc(e[k]) + '</p>' : ''; }
    function inv(k) { return e[k] ? ' invalid' : ''; }
    function amt(v) { return v === null || v === undefined || v === '' ? '' : (typeof v === 'number' ? v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : v); }
    var dueUnknown = values ? !!values.dueUnknown : (editing && !d.dueDate);
    var statusVal = d.status || '';

    // Teks tampilan saja. Nilai yang disimpan tetap checked / unverified / disputed sesuai DebtLogic.
    if (e.status) e = Object.assign({}, e, { status: 'Pilih salah satu jawaban.' });
    var statusDesc = { checked: 'Sama dengan rincian resmi di aplikasi', unverified: 'Belum dicek, atau angkanya berbeda-beda', disputed: 'Menurutku jumlahnya tidak sesuai' };
    var statusOpts = Object.keys(L.STATUS).map(function (k) {
      return '<label class="opt"><input type="radio" name="status" value="' + k + '"' + (statusVal === k ? ' checked' : '') + '><span>' + STATUS_TAMPIL[k] + '<small>' + statusDesc[k] + '</small></span></label>';
    }).join('');

    return '<section class="view stack" style="padding-top:16px">' +
      '<div><span class="eyebrow">' + (editing ? 'Edit tagihan' : 'Tagihan baru') + '</span><h1>' + (editing ? 'Ubah ' + esc(d.provider || 'utang') : 'Tambah Utang') + '</h1></div>' +
      '<form id="debtForm" class="panel" novalidate>' +
      (Object.keys(e).length ? '<div class="note" style="background:var(--handle-soft)" role="alert"><span class="ic" style="background:var(--handle);color:var(--surface)">!</span><span>Ada ' + Object.keys(e).length + ' isian yang perlu diperbaiki.</span></div>' : '') +
      '<div class="two form-two"><div class="stack">' +
      '<div class="field provider-field' + inv('provider') + '"><label for="f-provider">Nama penyedia atau layanan</label><div class="provider-wrap"><input type="text" id="f-provider" name="provider" maxlength="60" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="providerSuggestions" aria-expanded="false" placeholder="Nama aplikasi atau layanan" value="' + esc(d.provider) + '"' + (e.provider ? ' aria-invalid="true" aria-describedby="err-provider"' : '') + '><div class="provider-suggestions" id="providerSuggestions" role="listbox" hidden></div></div><div id="providerLegalStatus" aria-live="polite"></div>' + err('provider') + '</div>' +
      '<div class="field' + inv('amount') + '"><label for="f-amount">Nominal tagihan saat ini</label><div class="prefix"><span>Rp</span><input type="text" inputmode="numeric" id="f-amount" name="amount" autocomplete="off" placeholder="0" value="' + esc(amt(d.amount)) + '"' + (e.amount ? ' aria-invalid="true" aria-describedby="err-amount"' : '') + '></div>' +
      '<p class="hint">Jumlah yang ditagihkan sekarang menurut tagihan terakhirmu, bukan jumlah pinjaman awal.</p>' + err('amount') + '</div>' +
      '<div class="field' + inv('dueDate') + '"><label for="f-due">Tanggal jatuh tempo</label><input type="date" id="f-due" name="dueDate" value="' + esc(d.dueDate || '') + '"' + (dueUnknown ? ' disabled' : '') + (e.dueDate ? ' aria-invalid="true" aria-describedby="err-dueDate"' : '') + '>' +
      '<label class="check"><input type="checkbox" id="f-dueUnknown" name="dueUnknown"' + (dueUnknown ? ' checked' : '') + '> Belum tahu tanggalnya</label>' +
      '<p class="auto" id="autoStatus" aria-live="polite"></p>' + err('dueDate') + '</div>' +
      '</div><div class="stack">' +
      '<fieldset class="field' + inv('status') + '" style="border:0;padding:0;margin:0"><legend class="legend">Apakah nominal tagihannya sudah pasti?</legend><div class="opts">' + statusOpts + '</div>' + err('status') + '</fieldset>' +
      '<details class="more"' + (d.note || d.collectionIssue || e.note ? ' open' : '') + '><summary>Catatan tambahan (opsional)</summary><div class="stack">' +
      '<div class="field' + inv('note') + '"><label for="f-note">Catatanmu</label><textarea id="f-note" name="note" maxlength="500" placeholder="Misalnya: sudah bayar Rp500.000 tanggal 1 Nov, nominal berbeda dengan aplikasi, sudah minta rincian tagihan">' + esc(d.note) + '</textarea>' + err('note') + '</div>' +
      '<label class="check"><input type="checkbox" id="f-issue" name="collectionIssue"' + (d.collectionIssue ? ' checked' : '') + '> Ada penagihan bermasalah, misalnya ancaman, intimidasi, atau penyebaran data pribadi</label>' +
      '</div></details>' +
      '</div></div>' +
      '<div class="sticky-actions"><button class="btn btn-primary" type="submit">Simpan Utang</button><button class="btn btn-ghost" type="button" data-act="cancel-form">Batal</button></div>' +
      '</form></section>';
  }

  function updateAutoStatus() {
    var box = $('autoStatus'); if (!box) return;
    var unk = $('f-dueUnknown').checked;
    var due = $('f-due');
    due.disabled = unk;
    var txt;
    if (unk) txt = 'Status waktu: <b>Belum diketahui</b>. Tagihan ini tidak akan dihitung sebagai jatuh tempo.';
    else if (due.value && L.isValidDateKey(due.value)) {
      var n = L.daysUntil(due.value, state.today);
      txt = 'Status waktu: <b>' + (n < 0 ? 'Sudah jatuh tempo' : 'Belum jatuh tempo') + '</b> · ' + esc(L.dueText({ dueDate: due.value }, state.today)) + '.';
    } else txt = 'Status waktu dihitung otomatis dari tanggal.';
    box.innerHTML = txt;
  }

  function readForm(form) {
    var fd = new FormData(form);
    return {
      id: state.id, provider: fd.get('provider'), type: 'pinjol', amount: fd.get('amount'),
      dueDate: form.elements.dueDate.value, dueUnknown: form.elements.dueUnknown.checked,
      status: fd.get('status') || '', paid: fd.get('paid'), note: fd.get('note'),
      collectionIssue: form.elements.collectionIssue.checked
    };
  }

  /* ---------- Detail ---------- */
  function viewDetail() {
    var d = state.debts.filter(function (x) { return x.id === state.id; })[0];
    if (!d) return '<section class="view hero"><h1>Tagihan tidak ditemukan</h1><p class="muted">Tagihan ini mungkin sudah dihapus.</p><div><button class="btn btn-primary" data-act="summary" type="button">Kembali ke rangkuman</button></div></section>';
    var a = L.assess(d, state.today);
    var legal = providerLegalStatus(d.provider);
    var legalActions = [];
    if (legal.key === 'illegal') legalActions.push({ title: 'Pinjaman terindikasi ilegal', text: 'Jangan transfer ke rekening pribadi penagih. Simpan semua bukti tagihan dan pesan, lalu laporkan melalui kanal resmi seperti Satgas PASTI atau OJK 157.' });
    if (legal.key === 'unknown') legalActions.push({ title: 'Pastikan status legalitasnya', text: 'Nama ini tidak ada di data EduPuan. Cek langsung di ojk.go.id atau tanyakan ke WA OJK 081-157-157-157.' });
    return '<section class="view stack" style="padding-top:16px">' +
      '<div class="stack" style="gap:8px">' + legalStatusHtml(legal, false, true) + '<h1>' + esc(d.provider) + '</h1><div class="row">' + chips(a) + '</div></div>' +
      '<div class="two"><aside class="side stack">' +
      '<div class="panel"><dl class="facts">' +
      '<div><dt>Status legalitas</dt><dd>' + legalStatusHtml(legal, false, true) + '</dd></div>' +
      '<div><dt>Nominal tagihan</dt><dd class="num">' + rp(d.amount) + '</dd></div>' +
      '<div><dt>Jatuh tempo</dt><dd>' + esc(L.formatDate(d.dueDate)) + ' <span class="muted" style="font-weight:500">· ' + esc(L.dueText(d, state.today)) + '</span></dd></div>' +
      '<div><dt>Nominal sudah pasti?</dt><dd>' + esc(STATUS_TAMPIL[d.status]) + '</dd></div>' +
      '<div><dt>Catatanmu</dt><dd style="font-weight:500">' + (d.note ? esc(d.note) : '<span class="muted">Tidak ada catatan</span>') + '</dd></div>' +
      '</dl></div>' +
      '<div class="row"><button class="btn btn-primary" data-act="edit" data-id="' + d.id + '" type="button">Edit</button><button class="btn btn-danger" data-act="del" type="button">Hapus</button><button class="btn btn-ghost" data-act="summary" type="button">Kembali ke rangkuman</button></div>' +
      (state.confirmDelete === true ? '<div class="confirm" role="alertdialog" aria-label="Konfirmasi hapus"><p><b>Hapus tagihan ' + esc(d.provider) + '?</b> Rangkuman akan langsung diperbarui. Tindakan ini tidak bisa dibatalkan.</p><div class="row"><button class="btn btn-danger-solid btn-sm" data-act="del-yes" type="button">Ya, hapus</button><button class="btn btn-ghost btn-sm" data-act="cancel-del" type="button">Batal</button></div></div>' : '') +
      '</aside><div class="main stack" style="gap:24px">' +
      '<div class="stack panel" style="gap:8px"><h2>Kenapa label ini?</h2><p>' + esc(a.reason) + '</p>' +
      '<p class="small muted">Keterangan ini hanya menjelaskan tenggat waktu. Ini bukan perintah atau saran untuk membayar tagihan ini lebih dulu.</p>' + '</div>' +
      '<div class="stack" style="gap:12px"><h2>Langkah berikutnya</h2><div class="steps">' +
      legalActions.concat(a.actions).map(function (x) { return '<div class="step"><div><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></div></div>'; }).join('') +
      '</div><p class="small muted">Penyedia tidak selalu menyetujui perpanjangan, restrukturisasi, atau penghapusan denda. Tanyakan pilihan yang tersedia melalui kanal resmi mereka.</p></div>' +
      '</div></div></section>';
  }

  /* ---------- Laporan untuk dicetak / disimpan sebagai PDF ---------- */
  // Memakai DebtLogic yang sama dengan tampilan layar, jadi isinya selalu cocok dengan rangkuman.
  function viewReport() {
    var s = L.summarize(state.debts, state.today);
    var sorted = urutkan(state.debts);
    var dibuat = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    var h = '<div class="p-head"><div class="p-brand">EduPuan</div><h1>Rangkuman Utang</h1>' +
      '<p class="muted">Per ' + esc(L.formatDate(state.today)) + ' · Dibuat ' + esc(dibuat) + '</p></div>';
    if (state.demo) h += '<p class="p-demo"><b>Ini data contoh.</b> Angkanya bukan milikmu.</p>';

    h += '<h2>Ringkasan</h2><table><tbody>' +
      '<tr><td>Total tagihan tercatat (' + s.count + ' tagihan)</td><td class="r"><b>' + rp(s.total) + '</b></td></tr>' +
      '<tr><td>Sudah jatuh tempo (' + s.overdue.count + ')</td><td class="r">' + rp(s.overdue.sum) + '</td></tr>' +
      '<tr><td>Jatuh tempo hari ini (' + s.today.count + ')</td><td class="r">' + rp(s.today.sum) + '</td></tr>' +
      '<tr><td>Jatuh tempo 1–3 hari (' + s.d1_3.count + ')</td><td class="r">' + rp(s.d1_3.sum) + '</td></tr>' +
      '<tr><td>Jatuh tempo 4–7 hari (' + s.d4_7.count + ')</td><td class="r">' + rp(s.d4_7.sum) + '</td></tr>' +
      '<tr><td>Lebih dari 7 hari (' + s.later.count + ')</td><td class="r">' + rp(s.later.sum) + '</td></tr>' +
      '<tr><td>Tanggal belum diketahui (' + s.unknown.count + ')</td><td class="r">' + rp(s.unknown.sum) + '</td></tr>' +
      '<tr><td>Perlu verifikasi</td><td class="r">' + s.verifyCount + ' tagihan' + (s.disputedCount ? ' (' + s.disputedCount + ' disengketakan)' : '') + '</td></tr>' +
      '</tbody></table>';

    h += '<h2>Daftar tagihan</h2><p class="small muted">Diurutkan berdasarkan: ' + esc(URUTAN[state.sort]).toLowerCase() + '. Urutan ini bukan saran urutan pembayaran.</p><table><thead><tr><th>No.</th><th>Penyedia</th><th>Jatuh tempo</th><th>Label</th><th class="r">Nominal</th></tr></thead><tbody>' +
      sorted.map(function (d, i) {
        var a = L.assess(d, state.today);
        return '<tr><td>' + (i + 1) + '</td><td>' + esc(d.provider) + '</td><td>' + esc(L.formatDate(d.dueDate)) + '<br><span class="muted">' + esc(L.dueText(d, state.today)) + '</span></td>' +
          '<td>' + chips(a) + '</td><td class="r">' + rp(d.amount) + '</td></tr>';
      }).join('') + '</tbody></table>';

    h += '<h2>Rincian dan langkah berikutnya</h2>' + sorted.map(function (d, i) {
      var a = L.assess(d, state.today);
      var legal = providerLegalStatus(d.provider);
      var steps = [];
      if (legal.key === 'illegal') steps.push({ title: 'Pinjaman terindikasi ilegal', text: 'Jangan transfer ke rekening pribadi penagih. Simpan semua bukti tagihan dan pesan, lalu laporkan melalui kanal resmi seperti Satgas PASTI atau OJK 157.' });
      if (legal.key === 'unknown') steps.push({ title: 'Pastikan status legalitasnya', text: 'Nama ini tidak ada di data EduPuan. Cek langsung di ojk.go.id atau tanyakan ke WA OJK 081-157-157-157.' });
      steps = steps.concat(a.actions);
      return '<div class="p-debt"><div class="row" style="justify-content:space-between"><h3>' + esc(d.provider) + '</h3><b>' + rp(d.amount) + '</b></div>' +
        '<div class="row small" style="gap:6px"><span class="muted">Status legalitas:</span>' + legalStatusHtml(legal, false, true) + '</div>' +
        '<p class="small">Nominal sudah pasti? ' + esc(STATUS_TAMPIL[d.status]) + '</p>' +
        '<p class="small" style="margin-top:4px">' + esc(a.reason) + '</p>' +
        (d.note ? '<p class="small muted" style="margin-top:4px">Catatanmu: ' + esc(d.note) + '</p>' : '') +
        '<ol>' + steps.map(function (x) { return '<li><b>' + esc(x.title) + '.</b> ' + esc(x.text) + '</li>'; }).join('') + '</ol></div>';
    }).join('');

    h += '<div class="p-foot">' +
      '<p>Urutan daftar hanya mengikuti pilihan pengurutan (jatuh tempo atau nominal). EduPuan tidak menentukan tagihan mana yang harus dibayar lebih dulu. Keputusan bayar bergantung pada dana yang kamu punya dan ketentuan tiap penyedia.</p>' +
      '<p>Jangan mengambil pinjaman baru untuk menutup pinjaman lama. Butuh bantuan? Kontak OJK 157 atau WhatsApp 081-157-157-157.</p>' +
      '<p>Dokumen ini dibuat di perangkatmu dari data yang kamu masukkan sendiri. EduPuan tidak menyimpan data ini di server. Simpan file ini di tempat yang aman karena berisi data keuanganmu. Ini bukan nasihat hukum atau keuangan.</p>' +
      '</div>';
    return h;
  }

  /* ---------- Unduh PDF sungguhan (jsPDF), bekerja juga di HP ---------- */
  var sedangMengunduh = false;
  function unduhPdf() {
    if (!state.debts.length) { toast('Belum ada tagihan untuk diunduh.'); return; }
    if (sedangMengunduh) return;
    sedangMengunduh = true;
    toast('Menyiapkan PDF...');
    import('@/features/pdfEduPuan').then(function (m) {
      return m.mulaiPdf('Rangkuman Utang').then(function (p) {
        var s = L.summarize(state.debts, state.today);
        var sorted = urutkan(state.debts);
        if (state.demo) p.paragraf('Ini data contoh. Angkanya bukan milikmu.', { tebal: true });
        p.paragraf('Per ' + L.formatDate(state.today), { abu: true });

        p.judul('Ringkasan');
        p.tabel(null, [
          ['Total tagihan tercatat (' + s.count + ' tagihan)', rp(s.total)],
          ['Sudah jatuh tempo (' + s.overdue.count + ')', rp(s.overdue.sum)],
          ['Jatuh tempo hari ini (' + s.today.count + ')', rp(s.today.sum)],
          ['Jatuh tempo 1-3 hari (' + s.d1_3.count + ')', rp(s.d1_3.sum)],
          ['Jatuh tempo 4-7 hari (' + s.d4_7.count + ')', rp(s.d4_7.sum)],
          ['Lebih dari 7 hari (' + s.later.count + ')', rp(s.later.sum)],
          ['Tanggal belum diketahui (' + s.unknown.count + ')', rp(s.unknown.sum)],
          ['Perlu verifikasi', s.verifyCount + ' tagihan' + (s.disputedCount ? ' (' + s.disputedCount + ' tidak disetujui)' : '')]
        ], { lebarKolom: { 1: 45 } });

        p.judul('Daftar tagihan');
        p.paragraf('Diurutkan berdasarkan: ' + URUTAN[state.sort].toLowerCase() + '. Urutan ini bukan saran urutan pembayaran.', { ukuran: 9, abu: true });
        p.tabel(['No.', 'Penyedia', 'Jatuh tempo', 'Keterangan', 'Nominal'], sorted.map(function (d, i) {
          var a = L.assess(d, state.today);
          return [String(i + 1), d.provider, L.formatDate(d.dueDate) + '\n' + L.dueText(d, state.today),
            LABEL_TAMPIL[a.bucket] + (a.verify ? '\nPerlu verifikasi' : ''), rp(d.amount)];
        }), { lebarKolom: { 0: 10, 4: 30 } });

        p.judul('Rincian dan langkah berikutnya');
        sorted.forEach(function (d) {
          var a = L.assess(d, state.today);
          var legal = providerLegalStatus(d.provider);
          var steps = [];
          if (legal.key === 'illegal') steps.push({ title: 'Pinjaman terindikasi ilegal', text: 'Jangan transfer ke rekening pribadi penagih. Simpan semua bukti tagihan dan pesan, lalu laporkan melalui kanal resmi seperti Satgas PASTI atau OJK 157.' });
          if (legal.key === 'unknown') steps.push({ title: 'Pastikan status legalitasnya', text: 'Nama ini tidak ada di data EduPuan. Cek langsung di ojk.go.id atau tanyakan ke WA OJK 081-157-157-157.' });
          steps = steps.concat(a.actions);
          p.paragraf(d.provider + '  -  ' + rp(d.amount), { tebal: true });
          p.paragraf('Status legalitas: ' + legal.label + (legal.pt ? ' (' + legal.pt + ')' : '') +
            '   |   Nominal sudah pasti? ' + STATUS_TAMPIL[d.status], { ukuran: 9, abu: true });
          p.paragraf(a.reason, { ukuran: 9 });
          if (d.note) p.paragraf('Catatanmu: ' + d.note, { ukuran: 9, abu: true });
          p.poin(steps.map(function (x) { return x.title + '. ' + x.text; }), 9);
        });

        p.judul('Catatan');
        p.poin([
          'Urutan daftar hanya mengikuti pilihan pengurutan (jatuh tempo atau nominal). EduPuan tidak menentukan tagihan mana yang harus dibayar lebih dulu.',
          'Jangan mengambil pinjaman baru untuk menutup pinjaman lama. Butuh bantuan? Kontak OJK 157 atau WhatsApp 081-157-157-157.',
          'Dokumen ini dibuat di perangkatmu dari data yang kamu masukkan sendiri. EduPuan tidak menyimpan data ini di server. Simpan file ini di tempat yang aman. Ini bukan nasihat hukum atau keuangan.'
        ], 9);
        p.simpan(m.namaFilePdf('Rangkuman-Utang'));
        toast('PDF terunduh. Cek folder Unduhan (Download).');
      });
    }).catch(function () {
      // Cadangan: pakai jendela cetak browser
      toast('PDF belum bisa dibuat di browser ini. Mencoba jendela cetak...');
      printReport();
    }).then(function () { sedangMengunduh = false; });
  }

  var titleBeforePrint = null;
  function printReport() {
    if (!state.debts.length) { toast('Belum ada tagihan untuk diunduh.'); return; }
    $('printReport').innerHTML = viewReport();
    if (titleBeforePrint === null) titleBeforePrint = document.title;
    document.title = 'EduPuan - Rangkuman Utang - ' + state.today;
    setTimeout(function () { window.print(); }, 50);
  }
  on(window, 'afterprint', function () {
    if (titleBeforePrint !== null) { document.title = titleBeforePrint; titleBeforePrint = null; }
  });

  // Tanda "masih ada tagihan di bawah" pada area gulir daftar
  function wireList() {
    var box = $('listScroll'), cnt = $('listCount');
    if (!box) return;
    var base = cnt ? cnt.textContent : '';
    function upd() {
      var scrollable = box.scrollHeight > box.clientHeight + 2;
      var more = scrollable && box.scrollTop + box.clientHeight < box.scrollHeight - 8;
      box.classList.toggle('more', more);
      if (cnt) cnt.textContent = base + (more ? ' · gulir daftar untuk melihat lainnya' : '');
    }
    box.addEventListener('scroll', upd, { passive: true });
    upd();
  }
  on(window, 'resize', function () { if (state.view === 'summary') { var b = $('listScroll'); if (b) b.dispatchEvent(new Event('scroll')); } });

  /* ---------- Render ---------- */
  function render(formErrors, formValues) {
    $('demoBanner').hidden = !(state.demo && state.debts.length);
    var backLabel = { home: 'Kembali ke beranda EduPuan', summary: 'Kembali ke halaman awal fitur', form: state.id ? 'Kembali ke detail tagihan' : 'Kembali', detail: 'Kembali ke rangkuman' }[state.view];
    var bb = $('backBtn'); bb.setAttribute('aria-label', backLabel); bb.title = backLabel;
    if (state.view === 'home') app.innerHTML = viewHome();
    else if (state.view === 'summary') { app.innerHTML = viewSummary(); wireList(); }
    else if (state.view === 'form') { app.innerHTML = viewForm(formErrors, formValues); providerDropOpen = false; providerSuggestionIndex = -1; updateAutoStatus(); updateProviderAssistance(); }
    else if (state.view === 'detail') app.innerHTML = viewDetail();
  }

  function demoData() {
    return [
      { id: uid(), provider: 'Pinjaman A (contoh)', type: 'pinjol', amount: 1500000, dueDate: addDays(-4), status: 'checked', paid: null, note: '', collectionIssue: false },
      { id: uid(), provider: 'Paylater B (contoh)', type: 'paylater', amount: 750000, dueDate: addDays(2), status: 'checked', paid: null, note: '', collectionIssue: false },
      { id: uid(), provider: 'Pinjaman C (contoh)', type: 'pinjol', amount: 2000000, dueDate: addDays(0), status: 'disputed', paid: null, note: 'Sudah bayar Rp500.000. Nominal di aplikasi berbeda dengan pesan penagih. Sudah minta rincian tertulis.', collectionIssue: true }
    ];
  }

  /* ---------- Event ---------- */
  on(root, 'click', function (ev) {
    var b = ev.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    if (act === 'back') {
      if (state.view === 'form') go(state.id ? 'detail' : (state.debts.length ? 'summary' : 'home'), state.id);
      else if (state.view === 'detail') go('summary');
      else if (state.view === 'summary') go('home');
      else if (onExit) onExit(); else toast('Di aplikasi EduPuan, tombol ini kembali ke beranda.');
    }
    else if (act === 'home') go('home');
    else if (act === 'summary') go('summary');
    else if (act === 'add') go('form');
    else if (act === 'edit') go('form', id);
    else if (act === 'detail') go('detail', id);
    else if (act === 'cancel-form') go(state.id ? 'detail' : (state.debts.length ? 'summary' : 'home'), state.id);
    else if (act === 'filter') { state.filter = b.getAttribute('data-f'); state.view = 'summary'; render(); if (window.innerWidth < 900) { var l = app.querySelector('.filters'); if (l) l.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }
    else if (act === 'del') { state.confirmDelete = true; render(); }
    else if (act === 'wipe') { state.confirmDelete = 'all'; render(); }
    else if (act === 'cancel-del') { state.confirmDelete = false; render(); }
    else if (act === 'del-yes') {
      state.debts = state.debts.filter(function (x) { return x.id !== state.id; });
      if (!state.debts.length) state.demo = false;
      save(); toast('Tagihan dihapus. Rangkuman sudah diperbarui.'); go(state.debts.length ? 'summary' : 'home');
    }
    else if (act === 'wipe-yes') { state.debts = []; state.demo = false; save(); toast('Semua data dihapus dari browser ini.'); go('home'); }
    else if (act === 'demo') { state.debts = demoData(); state.demo = true; save(); go('summary'); }
    else if (act === 'pick-provider') { pickProvider(b.getAttribute('data-name')); }
    else if (act === 'print') { unduhPdf(); }
  });
  on($('clearDemo'), 'click', function () { state.debts = []; state.demo = false; save(); toast('Data contoh dihapus.'); go('home'); });

  on(root, 'change', function (ev) {
    if (ev.target.id === 'f-dueUnknown' || ev.target.id === 'f-due') updateAutoStatus();
    if (ev.target.id === 'f-sort') { state.sort = ev.target.value; render(); var sel = $('f-sort'); if (sel) sel.focus(); }
  });
  // Titik pemisah ribuan otomatis saat mengetik nominal (5000000 -> 5.000.000).
  // Posisi kursor dijaga supaya tidak meloncat ke akhir saat mengedit di tengah angka.
  function formatRibuan(el) {
    var pos = el.selectionStart == null ? el.value.length : el.selectionStart;
    var angkaSebelumKursor = el.value.slice(0, pos).replace(/\D/g, '').length;
    var angka = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    var hasil = angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    el.value = hasil;
    var i = 0, terlewati = 0;
    while (i < hasil.length && terlewati < angkaSebelumKursor) { if (hasil[i] !== '.') terlewati++; i++; }
    try { el.setSelectionRange(i, i); } catch (e) {}
  }

  on(root, 'input', function (ev) {
    if (ev.target.id === 'f-amount') formatRibuan(ev.target);
    if (ev.target.id === 'f-due') updateAutoStatus();
    if (ev.target.id === 'f-provider') {
      providerDropOpen = true;
      providerSuggestionIndex = -1;
      updateProviderAssistance();
    }
  });
  on(root, 'focusin', function (ev) {
    if (ev.target.id === 'f-provider') {
      providerDropOpen = true;
      updateProviderAssistance();
    }
  });
  on(root, 'keydown', function (ev) {
    if (ev.target.id !== 'f-provider') return;
    var items = providerSuggestions(ev.target.value);
    if (ev.key === 'Escape') {
      providerDropOpen = false;
      providerSuggestionIndex = -1;
      updateProviderAssistance();
      return;
    }
    if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && items.length) {
      ev.preventDefault();
      providerDropOpen = true;
      providerSuggestionIndex = ev.key === 'ArrowDown'
        ? (providerSuggestionIndex + 1 + items.length) % items.length
        : (providerSuggestionIndex - 1 + items.length) % items.length;
      updateProviderAssistance();
      return;
    }
    if (ev.key === 'Enter' && providerDropOpen && providerSuggestionIndex >= 0 && items[providerSuggestionIndex]) {
      ev.preventDefault();
      pickProvider(items[providerSuggestionIndex].name);
    }
  });
  on(document, 'click', function (ev) {
    if (!root.contains(ev.target) || !ev.target.closest('.provider-field')) {
      providerDropOpen = false;
      providerSuggestionIndex = -1;
      updateProviderAssistance();
    }
  });

  on(root, 'submit', function (ev) {
    if (ev.target.id !== 'debtForm') return;
    ev.preventDefault();
    var input = readForm(ev.target);
    var r = L.validateDebt(input);
    if (!r.ok) {
      render(r.errors, input);
      var first = app.querySelector('[aria-invalid="true"], .field.invalid input');
      if (first) first.focus();
      return;
    }
    if (state.id) {
      r.debt.id = state.id;
      state.debts = state.debts.map(function (x) { return x.id === state.id ? r.debt : x; });
      save(); toast('Perubahan disimpan. Rangkuman sudah diperbarui.'); go('detail', state.id);
    } else {
      r.debt.id = uid();
      if (state.demo) { state.debts = []; state.demo = false; } // data asli menggantikan data contoh
      state.debts.push(r.debt);
      save(); toast('Utang disimpan.'); state.filter = 'all'; go('summary');
    }
  });

  // Perbarui label saat tanggal berganti (lewat tengah malam atau kembali ke tab)
  function refreshDay() { var k = L.todayKey(); if (k !== state.today) { state.today = k; if (state.view !== 'form') render(); else updateAutoStatus(); } }
  var timer = setInterval(refreshDay, 60000); cleanups.push(function () { clearInterval(timer); clearTimeout(toastTimer); });
  on(document, 'visibilitychange', function () { if (!document.hidden) refreshDay(); });

  load();
  state.view = state.debts.length ? 'summary' : 'home';
  render();

  return function () { cleanups.forEach(function (f) { f(); }); };
}

export default function RangkumUtang({ onBack }: { onBack?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    if (!document.querySelector('link[data-ru-font]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = FONT_HREF; l.setAttribute("data-ru-font", "");
      document.head.appendChild(l);
    }
    const el = ref.current;
    if (!el) return;
    el.innerHTML = MARKUP;
    const unmount = mountRangkumUtang(el, backRef.current ? () => backRef.current && backRef.current() : null);
    return () => { unmount(); el.innerHTML = ""; };
  }, []); // [] = pasang sekali saja saat halaman dibuka, supaya isian formulir tidak ter-reset

  return (
    <>
      <style>{CSS}</style>
      <div className="ru-root" ref={ref} />
    </>
  );
}