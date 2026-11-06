"use client";

import { useEffect, useState } from "react";
import "./hero.css";

const IcoArrowDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M12 4v15" />
    <path d="m6 13 6 6 6-6" />
  </svg>
);

const IcoPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8 5.6v12.8c0 .8.9 1.3 1.6.8l9-6.4a1 1 0 0 0 0-1.6l-9-6.4A1 1 0 0 0 8 5.6Z" />
  </svg>
);

const BADGES = [
  { label: "Gratis", icon: "coin" },
  { label: "Tanpa daftar akun", icon: "lock" },
  { label: "Tanpa menghakimi", icon: "heart" },
];

export default function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    if (!videoOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [videoOpen]);

  return (
    <section className="ep-home-hero">
      <div className="ep-hero-grid">
        <div className="ep-hero-copy">
          <h1 className="ep-hero-title">
            Mau pinjam atau sudah terjerat? <span>Kamu nggak sendirian.</span>
          </h1>

          <p className="ep-hero-description">
            Pahami hak-hakmu sebelum dan sesudah pinjam online, dengan panduan yang jelas dan
            tanpa menghakimi.
          </p>

          <div className="ep-hero-actions">
            <button
              className="ep-hero-primary"
              onClick={() =>
                document.getElementById("mulai-dari-sini")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span className="ep-hero-action-copy">
                <span>Sudah pinjam / terjerat?</span>
                <strong>Pilih Kondisimu</strong>
              </span>
              <span className="ep-hero-action-icon" aria-hidden="true">
                <IcoArrowDown />
              </span>
            </button>

            <button className="ep-hero-secondary" onClick={() => setVideoOpen(true)}>
              <span className="ep-hero-action-copy">
                <strong className="ep-hero-video-action-title">
                  Kenali EduPuan
                  <br />
                  dalam 90 detik
                </strong>
              </span>
              <span className="ep-hero-action-icon" aria-hidden="true">
                <IcoPlay />
              </span>
            </button>
          </div>

          <div className="ep-hero-badges">
            {BADGES.map(({ label, icon }) => (
              <span key={label} className="ep-hero-badge">
                <span className="ep-hero-badge-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon === "coin" && (
                      <>
                        <circle cx="12" cy="12" r="8" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                    {icon === "lock" && (
                      <>
                        <rect x="6" y="10" width="12" height="9" rx="2" />
                        <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" />
                      </>
                    )}
                    {icon === "heart" && (
                      <path d="M20.8 5.8a5 5 0 0 0-7.1 0L12 7.5l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.1a5 5 0 0 0 0-7.1Z" />
                    )}
                  </svg>
                </span>
                <span>{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {videoOpen && (
        <div
          className="ep-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Video perkenalan EduPuan"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setVideoOpen(false);
          }}
        >
          <div className="ep-video-modal-content">
            <div className="ep-video-modal-header">
              <div>
                <p>Video perkenalan</p>
                <h2>Kenalan dengan EduPuan</h2>
              </div>
              <button
                type="button"
                className="ep-video-modal-close"
                onClick={() => setVideoOpen(false)}
                aria-label="Tutup video"
                autoFocus
              >
                ×
              </button>
            </div>
            <video
              className="ep-video-modal-player"
              controls
              playsInline
              preload="metadata"
              poster="/video/edupuan-intro-poster.jpg"
            >
              <source src="/video/edupuan-intro.mp4" type="video/mp4" />
              Browser kamu belum mendukung pemutaran video.
            </video>
          </div>
        </div>
      )}
    </section>
  );
}