import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  onClick?: () => void;
  label?: string;
  ariaLabel?: string;
  className?: string;
};

const KELAS =
  "h-11 shrink-0 gap-2 rounded-full border-primary bg-card px-4 text-sm font-semibold text-primary hover:bg-accent hover:text-primary";

function Isi({ label }: { label: string }) {
  return (
    <>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      <span>{label}</span>
    </>
  );
}

export default function BackButton({ href, onClick, label = "Kembali", ariaLabel, className }: Props) {
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={cn(buttonVariants({ variant: "outline" }), KELAS, className)}>
        <Isi label={label} />
      </Link>
    );
  }
  return (
    <Button type="button" variant="outline" onClick={onClick} aria-label={ariaLabel} className={cn(KELAS, className)}>
      <Isi label={label} />
    </Button>
  );
}