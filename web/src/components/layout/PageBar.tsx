"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PETA_HALAMAN, jalurHalaman } from "@/data/petaHalaman";

export default function PageBar() {
  const alamat = usePathname();
  const info = PETA_HALAMAN[alamat];

  // Beranda dan halaman yang tidak terdaftar tidak memakai baris ini
  if (!info || !info.induk) return null;

  const induk = info.induk;
  const jalur = jalurHalaman(alamat);

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 lg:px-10">
        <Link
          href={induk}
          className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-full border border-primary bg-card px-4 text-sm font-semibold text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5"
          aria-label={`Kembali ke ${PETA_HALAMAN[induk].judul}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Kembali</span>
        </Link>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-2 text-sm sm:text-base">
            {jalur.map((a, i) => {
              const terakhir = i === jalur.length - 1;
              return (
                <li key={a} className="flex items-center gap-2 min-w-0">
                  {i > 0 && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                  {terakhir ? (
                    <span aria-current="page" className="max-w-44 truncate font-semibold text-foreground sm:max-w-none">
                      {PETA_HALAMAN[a].judul}
                    </span>
                  ) : (
                    <Link href={a} className="whitespace-nowrap text-muted-foreground transition-colors hover:text-primary">
                      {PETA_HALAMAN[a].judul}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}