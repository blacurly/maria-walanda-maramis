import type { Metadata } from "next";
import Faq from "@/components/home/Faq";

export const metadata: Metadata = {
  title: "FAQ – EduPuan",
  description:
    "Jawaban untuk pertanyaan yang paling sering muncul seputar pinjaman online, hak peminjam, dan cara melindungi diri.",
};

export default function FaqPage() {
  return <Faq />;
}