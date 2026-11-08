import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi – EduPuan",
  description: "Data apa yang diproses EduPuan, untuk apa, disimpan di mana, dan apa hakmu atas datamu.",
};

// ⚠️ Ganti dengan email kontak resmi tim EduPuan sebelum di-push
const EMAIL_KONTAK = "edupuan.kontak@gmail.com";
const BERLAKU_SEJAK = "8 November 2026";

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-[#0d3b2e]">{judul}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

export default function KebijakanPrivasiPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#0d6e4b]">Kebijakan Privasi</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#082e27]">Datamu, hakmu.</h1>
      <p className="mt-2 text-sm text-gray-500">Berlaku sejak {BERLAKU_SEJAK}</p>

      <div className="mt-6 rounded-2xl border border-[#bee0d0] bg-[#ecfdf5] p-5 text-[15px] leading-relaxed text-[#064e35]">
        <p className="font-bold">Ringkasnya</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Semua fitur EduPuan bisa dipakai <strong>tanpa membuat akun</strong>.</li>
          <li>Hitungan di fitur seperti Rangkum Utang dan Cek Penawaran diproses <strong>di perangkatmu</strong> dan tidak dikirim ke server kami.</li>
          <li>Pesan ke Puan AI dikirim ke <strong>Google Gemini</strong> untuk disusun jawabannya. EduPuan <strong>tidak menyimpan</strong> isi percakapanmu, kecuali kamu sendiri memilih menyimpannya di akun.</li>
          <li>Kalau kamu membuat akun dan menyimpan riwayat, kamu bisa <strong>menghapusnya kapan saja</strong>.</li>
        </ul>
      </div>

      <Bagian judul="1. Siapa kami">
        <p>
          EduPuan adalah platform edukasi untuk perempuan seputar pinjaman online (pinjol), dikembangkan sebagai proyek
          pembelajaran. Dalam kebijakan ini, &quot;kami&quot; berarti tim pengembang EduPuan, dan &quot;kamu&quot; berarti pengguna.
        </p>
      </Bagian>

      <Bagian judul="2. Data yang kami proses">
        <p><strong>a. Saat memakai fitur tanpa akun.</strong> Data yang kamu masukkan di fitur seperti Rangkum Utang, Cek Penawaran, Analisis Pesan Penagih, dan Cek Legalitas diproses di browser perangkatmu. Data itu tidak kami kirim atau simpan di server.</p>
        <p><strong>b. Saat bertanya ke Puan AI.</strong> Pesanmu dan beberapa pesan sebelumnya dalam percakapan yang sama dikirim melalui server kami ke Google Gemini agar Puan bisa menyusun jawaban. Setelah jawaban dikirim kembali kepadamu, EduPuan tidak menyimpan isi percakapan tersebut.</p>
        <p><strong>c. Jika kamu memilih membuat akun (opsional).</strong> Kami memproses alamat email dan kata sandimu (kata sandi disimpan dalam bentuk terenkripsi oleh penyedia layanan akun, sehingga tidak bisa kami baca), serta hasil fitur atau percakapan yang <strong>kamu sendiri pilih untuk disimpan</strong>.</p>
        <p><strong>d. Data teknis.</strong> Penyedia hosting kami mencatat data teknis seperti alamat IP, jenis perangkat, dan waktu akses untuk menjaga keamanan dan kelancaran layanan.</p>
      </Bagian>

      <Bagian judul="3. Untuk apa data diproses">
        <ul className="list-disc space-y-1 pl-5">
          <li>Menjalankan fitur yang kamu pakai, termasuk menyusun jawaban Puan AI.</li>
          <li>Menyimpan riwayat yang kamu minta disimpan, jika kamu memakai akun.</li>
          <li>Menjaga keamanan layanan dan memperbaiki gangguan.</li>
        </ul>
        <p>Kami tidak menjual datamu dan tidak memakainya untuk iklan.</p>
      </Bagian>

      <Bagian judul="4. Dasar pemrosesan">
        <p>
          Kami memproses data pribadimu berdasarkan <strong>persetujuanmu</strong>, sesuai dasar pemrosesan dalam UU Nomor 27 Tahun
          2022 tentang Pelindungan Data Pribadi (Pasal 20). Persetujuan untuk menyimpan riwayat diminta secara terpisah saat kamu
          memilih menyimpan, dan dapat kamu tarik kembali dengan menghapus riwayat atau akunmu.
        </p>
      </Bagian>

      <Bagian judul="5. Pihak ketiga yang membantu kami">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Google (Gemini API):</strong> menyusun jawaban Puan AI. Saat ini EduPuan memakai layanan Gemini <strong>tanpa biaya</strong>. Menurut ketentuan Google, data yang dikirim melalui layanan tanpa biaya <strong>dapat digunakan Google untuk meningkatkan produknya</strong>. Karena itu, jangan menulis data yang sangat pribadi di chat.</li>
          <li><strong>Vercel:</strong> hosting website dan server EduPuan.</li>
          <li><strong>Supabase:</strong> database daftar pinjol dan, jika kamu membuat akun, penyimpanan akun dan riwayatmu.</li>
        </ul>
        <p>
          Server penyedia layanan tersebut dapat berada di luar wilayah Indonesia, sehingga data yang diproses dapat ditransfer ke
          luar negeri. Kami memilih penyedia yang menerapkan standar keamanan data yang diakui secara luas.
        </p>
      </Bagian>

      <Bagian judul="6. Berapa lama data disimpan">
        <ul className="list-disc space-y-1 pl-5">
          <li>Isi percakapan Puan AI tanpa akun: tidak disimpan oleh EduPuan.</li>
          <li>Riwayat yang kamu simpan di akun: disimpan sampai kamu menghapusnya.</li>
          <li>Akun: disimpan sampai kamu meminta penghapusan akun.</li>
        </ul>
      </Bagian>

      <Bagian judul="7. Hakmu atas datamu">
        <p>Sebagai subjek data pribadi, kamu berhak antara lain untuk:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>mengetahui data apa yang kami proses dan untuk apa;</li>
          <li>mengakses dan memperbaiki datamu;</li>
          <li>menghapus riwayat yang tersimpan, kapan saja, melalui halaman Riwayat Saya;</li>
          <li>menarik persetujuan dan meminta penghapusan akun.</li>
        </ul>
        <p>
          Untuk permintaan yang belum tersedia di website, hubungi kami di{" "}
          <a href={`mailto:${EMAIL_KONTAK}`} className="font-semibold text-[#0d6e4b] underline">{EMAIL_KONTAK}</a>.
        </p>
      </Bagian>

      <Bagian judul="8. Yang sebaiknya tidak kamu tulis">
        <p>
          Jangan menulis nomor KTP, nomor rekening atau kartu, kata sandi, kode OTP, maupun data pribadi orang lain di fitur mana pun,
          termasuk di chat Puan AI. Puan tidak membutuhkan data tersebut untuk membantumu.
        </p>
      </Bagian>

      <Bagian judul="9. Pengguna di bawah umur">
        <p>
          EduPuan ditujukan untuk pengguna dewasa. Jika kamu berusia di bawah 18 tahun, gunakan EduPuan bersama orang tua atau
          walimu, dan jangan membuat akun tanpa persetujuan mereka.
        </p>
      </Bagian>

      <Bagian judul="10. Perubahan kebijakan">
        <p>
          Kebijakan ini dapat kami perbarui jika ada perubahan fitur atau ketentuan. Tanggal &quot;berlaku sejak&quot; di bagian atas
          halaman akan ikut diperbarui.
        </p>
      </Bagian>

      <p className="mt-10 text-sm text-gray-500">
        Baca juga{" "}
        <Link href="/syarat-ketentuan" className="font-semibold text-[#0d6e4b] underline">Syarat &amp; Ketentuan</Link>.
      </p>
    </main>
  );
}