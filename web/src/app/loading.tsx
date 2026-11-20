import { Skeleton } from "@/components/ui/skeleton";

// Tampil otomatis saat halaman sedang dimuat
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6" role="status" aria-label="Memuat halaman">
      <Skeleton className="mb-4 h-8 w-2/3" />
      <Skeleton className="mb-8 h-4 w-1/2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}