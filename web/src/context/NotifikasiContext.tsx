"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Notifikasi = { id: number; pesan: string } | null;

type NilaiNotifikasi = {
  tampilkan: (pesan: string) => void;
  tutup: () => void;
};

const NotifikasiContext = createContext<NilaiNotifikasi | null>(null);

// Provider: menyimpan satu pesan singkat (toast) yang bisa dipanggil dari komponen mana pun
export function NotifikasiProvider({ children }: { children: ReactNode }) {
  const [notif, setNotif] = useState<Notifikasi>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tutup = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setNotif(null);
  }, []);

  const tampilkan = useCallback((pesan: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNotif({ id: Date.now(), pesan });
    timer.current = setTimeout(() => setNotif(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const nilai = useMemo(() => ({ tampilkan, tutup }), [tampilkan, tutup]);

  return (
    <NotifikasiContext.Provider value={nilai}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
      >
        {notif && (
          <div
            key={notif.id}
            className="pointer-events-auto rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            {notif.pesan}
          </div>
        )}
      </div>
    </NotifikasiContext.Provider>
  );
}

// Custom hook: dipakai komponen untuk memanggil notifikasi
export function useNotifikasi() {
  const ctx = useContext(NotifikasiContext);
  if (!ctx) throw new Error("useNotifikasi harus dipakai di dalam NotifikasiProvider");
  return ctx;
}