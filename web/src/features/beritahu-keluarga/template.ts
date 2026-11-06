// Template pesan untuk memberi tahu orang terdekat soal penagihan utang

export type Situasi = "akan" | "sudah" | "sebar";
export type Gaya = "singkat" | "lengkap";

export const PILIHAN_SITUASI: { id: Situasi; label: string }[] = [
  { id: "akan", label: "Kontakku mungkin akan dihubungi penagih" },
  { id: "sudah", label: "Penagih sudah menghubungi kontakku" },
  { id: "sebar", label: "Data atau fotoku sudah disebarkan" },
];

export function buatPesan(situasi: Situasi, gaya: Gaya, nama: string): string {
  const n = nama.trim() || "[namamu]";

  const TEMPLATE: Record<Situasi, Record<Gaya, string>> = {
    akan: {
      singkat: `Halo, ini ${n}. Mungkin ada yang menghubungimu atas namaku soal utang. Tolong abaikan saja, aku sedang mengurus ini. Terima kasih.`,
      lengkap: `Halo, ini ${n}. Aku ingin memberitahumu sebelum ada yang menghubungimu. Aku sedang menghadapi masalah utang pinjaman online dan ada kemungkinan penagih menghubungimu. Kamu tidak perlu menjawab, membayar, atau berjanji apa pun. Mereka tidak berhak melibatkanmu. Aku sedang mencari jalan terbaik. Terima kasih.`,
    },
    sudah: {
      singkat: `Halo, ini ${n}. Maaf kamu sudah diganggu. Tolong abaikan saja, kamu tidak perlu membalas atau membayar apa pun. Aku sedang mengurusnya.`,
      lengkap: `Halo, ini ${n}. Aku minta maaf kamu sudah dihubungi. Yang menghubungimu adalah penagih utang pinjaman online atas namaku. Kamu tidak punya kewajiban apa pun: tidak perlu membayar, berjanji, atau merespons lagi. Menghubungi orang lain selain peminjam untuk menagih itu melanggar aturan. Terima kasih atas pengertianmu.`,
    },
    sebar: {
      singkat: `Halo, ini ${n}. Konten tentang aku yang mungkin kamu lihat disebarkan oleh oknum penagih pinjaman online untuk menekanku. Aku sedang melaporkannya. Tolong jangan disebarkan lagi.`,
      lengkap: `Halo, ini ${n}. Ada konten tentang diriku yang mungkin sudah kamu lihat. Konten itu disebarkan tanpa izinku oleh oknum penagih pinjaman online untuk mengintimidasiku. Ini pelanggaran hukum dan sedang aku laporkan. Tolong jangan menyebarkannya lagi, karena itu memperparah kerugianku. Aku sangat menghargai dukunganmu.`,
    },
  };

  return TEMPLATE[situasi][gaya];
}