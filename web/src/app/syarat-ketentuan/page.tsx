import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan – EduPuan",
  description: "Aturan memakai EduPuan: sifat layanan, batasan Puan AI, tanpa akun, dan penggunaan yang dilarang.",
};

// ⚠️ Samakan dengan email di halaman Kebijakan Privasi sebelum demo
const EMAIL_KONTAK = "edupuan.kontak@gmail.com";
const BERLAKU_SEJAK = "9 November 2026";

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-[#0d3b2e]">{judul}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

export default function SyaratKetentuanPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#0d6e4b]">Syarat &amp; Ketentuan</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#082e27]">Aturan main memakai EduPuan</h1>
      <p className="mt-2 text-sm text-gray-500">Berlaku sejak {BERLAKU_SEJAK}</p>

      <div className="mt-6 rounded-2xl border border-[#bee0d0] bg-[#ecfdf5] p-5 text-[15px] leading-relaxed text-[#064e35]">
        <p className="font-bold">Ringkasnya</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>EduPuan memberi <strong>edukasi</strong>, bukan nasihat hukum atau keuangan yang mengikat.</li>
          <li>EduPuan <strong>tidak merekomendasikan pinjaman</strong> apa pun.</li>
          <li>Puan AI bisa keliru. Untuk keputusan penting, pastikan ke lembaga resmi.</li>
          <li>EduPuan <strong>tidak memerlukan akun</strong>. Semua fitur bisa langsung dipakai.</li>
          <li>Dalam keadaan darurat, hubungi <strong>112</strong> atau <strong>Healing119 (119 ekstensi 8)</strong>.</li>
        </ul>
      </div>

      <Bagian judul="1. Persetujuan">
        <p>
          Dengan memakai EduPuan, kamu menyetujui Syarat &amp; Ketentuan ini dan{" "}
          <Link href="/kebijakan-privasi" className="font-semibold text-[#0d6e4b] underline">Kebijakan Privasi</Link>. Jika tidak setuju,
          kamu dapat berhenti memakai EduPuan kapan saja.
        </p>
      </Bagian>

      <Bagian judul="2. Sifat layanan">
        <p>
          EduPuan adalah platform edukasi tentang pinjaman online, hak konsumen, dan pelindungan data pribadi, dikembangkan sebagai
          proyek pembelajaran. Informasi di EduPuan bersifat umum dan <strong>bukan nasihat hukum, keuangan, atau psikologis</strong>
          {" "}untuk kasus tertentu.
        </p>
        <p>
          EduPuan <strong>tidak merekomendasikan, menawarkan, atau menyalurkan pinjaman</strong> dalam bentuk apa pun, dan tidak
          berafiliasi dengan penyelenggara pinjaman online mana pun.
        </p>
      </Bagian>

      <Bagian judul="3. Tentang Puan AI">
        <ul className="list-disc space-y-1 pl-5">
          <li>Puan AI menyusun jawaban dengan kecerdasan buatan berdasarkan sejumlah peraturan yang tersedia di sistemnya (antara lain POJK, SEOJK, dan UU Pelindungan Data Pribadi).</li>
          <li>Jawaban Puan <strong>bisa keliru, tidak lengkap, atau tidak sesuai dengan kondisimu</strong>. Puan juga tidak mengetahui semua peraturan yang berlaku.</li>
          <li>Untuk keputusan penting atau sengketa, hubungi lembaga berwenang seperti Kontak OJK 157, Lembaga Bantuan Hukum (LBH), atau advokat.</li>
          <li>Jika kamu sedang butuh uang, Puan akan mengarahkan ke pilihan tanpa utang dan cara memeriksa penawaran. Puan <strong>tidak menyarankan aplikasi, bank, atau pemberi pinjaman tertentu</strong>.</li>
          <li>Percakapan hanya tersimpan sementara di tab browsermu dan terhapus saat tab ditutup. Lihat{" "}<Link href="/kebijakan-privasi" className="font-semibold text-[#0d6e4b] underline">Kebijakan Privasi</Link>.</li>
          <li>Tombol &quot;Apakah jawaban ini membantu?&quot; bersifat <strong>sukarela</strong>. Penilaianmu dicatat secara anonim untuk memperbaiki Puan.</li>
          <li>Puan bukan layanan darurat dan bukan pengganti tenaga profesional kesehatan jiwa.</li>
        </ul>
      </Bagian>

      <Bagian judul="4. Data daftar pinjol">
        <p>
          Fitur Cek Legalitas memakai data dari Otoritas Jasa Keuangan (direktori penyelenggara berizin) dan Satgas PASTI (daftar
          entitas ilegal) <strong>per tanggal yang tertera di halaman fitur</strong>. Daftar resmi dapat berubah sewaktu-waktu, jadi
          selalu periksa daftar terbaru di situs resmi OJK sebelum mengambil keputusan.
        </p>
      </Bagian>

      <Bagian judul="5. Keadaan darurat">
        <p>
          Jika kamu atau orang lain dalam bahaya, atau kamu memiliki pikiran untuk menyakiti diri sendiri, segera hubungi{" "}
          <strong>112</strong>, <strong>Healing119 (telepon 119, ekstensi 8)</strong>, atau datang ke fasilitas kesehatan terdekat.
          Jangan hanya mengandalkan EduPuan dalam situasi darurat.
        </p>
      </Bagian>

      <Bagian judul="6. Tanpa akun dan data di perangkatmu">
        <ul className="list-disc space-y-1 pl-5">
          <li>EduPuan tidak memakai akun. Kamu tidak perlu mendaftar atau memberikan email untuk memakai fitur apa pun.</li>
          <li>Sebagian fitur, seperti Rangkum Utang, menyimpan data di browser perangkatmu. Jika perangkat dipakai bersama, hapus data tersebut setelah selesai, misalnya lewat tombol &quot;Hapus semua data&quot;.</li>
          <li>File yang kamu unduh (misalnya PDF hasil Cek Penawaran atau Rangkum Utang) tersimpan di perangkatmu dan menjadi tanggung jawabmu untuk disimpan dengan aman.</li>
        </ul>
      </Bagian>

      <Bagian judul="7. Penggunaan yang dilarang">
        <p>Saat memakai EduPuan, kamu tidak boleh:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>mencoba merusak, membobol, atau membebani sistem EduPuan secara berlebihan (misalnya mengirim pesan otomatis dalam jumlah besar);</li>
          <li>memasukkan data pribadi orang lain tanpa hak;</li>
          <li>memakai EduPuan untuk mengancam, menipu, atau merugikan orang lain;</li>
          <li>menyalin isi EduPuan untuk tujuan komersial tanpa izin.</li>
        </ul>
      </Bagian>

      <Bagian judul="8. Tautan ke pihak lain">
        <p>
          EduPuan memuat tautan ke situs atau layanan pihak lain, seperti situs OJK dan video YouTube. Isi dan kebijakan situs tersebut
          menjadi tanggung jawab masing-masing pemiliknya.
        </p>
      </Bagian>

      <Bagian judul="9. Batasan tanggung jawab">
        <p>
          EduPuan disediakan sebagaimana adanya untuk tujuan edukasi. Sejauh diizinkan oleh hukum yang berlaku, kami tidak bertanggung
          jawab atas kerugian yang timbul dari keputusan yang diambil semata-mata berdasarkan informasi di EduPuan tanpa memastikannya
          ke lembaga atau tenaga profesional yang berwenang.
        </p>
      </Bagian>

      <Bagian judul="10. Perubahan dan hukum yang berlaku">
        <p>
          Syarat &amp; Ketentuan ini dapat kami perbarui sewaktu-waktu, dan tanggal &quot;berlaku sejak&quot; akan ikut diperbarui.
          Syarat &amp; Ketentuan ini tunduk pada hukum Negara Republik Indonesia.
        </p>
      </Bagian>

      <Bagian judul="11. Kontak">
        <p>
          Pertanyaan tentang Syarat &amp; Ketentuan ini dapat dikirim ke{" "}
          <a href={`mailto:${EMAIL_KONTAK}`} className="font-semibold text-[#0d6e4b] underline">{EMAIL_KONTAK}</a>.
        </p>
      </Bagian>
    </main>
  );
}