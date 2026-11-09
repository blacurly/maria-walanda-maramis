import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi – EduPuan",
  description: "Data apa yang diproses EduPuan, untuk apa, disimpan di mana, dan apa hakmu atas datamu.",
};

// ⚠️ Ganti dengan email kontak resmi tim EduPuan sebelum demo
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

export default function KebijakanPrivasiPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#0d6e4b]">Kebijakan Privasi</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#082e27]">Datamu, hakmu.</h1>
      <p className="mt-2 text-sm text-gray-500">Berlaku sejak {BERLAKU_SEJAK}</p>

      <div className="mt-6 rounded-2xl border border-[#bee0d0] bg-[#ecfdf5] p-5 text-[15px] leading-relaxed text-[#064e35]">
        <p className="font-bold">Ringkasnya</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>EduPuan <strong>tidak memakai akun</strong>. Kamu tidak perlu mendaftar atau memberikan email.</li>
          <li>Data di fitur seperti Rangkum Utang dan Cek Penawaran diproses <strong>di perangkatmu</strong> dan tidak dikirim ke server kami.</li>
          <li>Pesan ke Puan AI dikirim ke <strong>Google Gemini</strong> untuk disusun jawabannya. Percakapanmu hanya tersimpan <strong>sementara di tab browsermu</strong> dan terhapus saat tab ditutup. EduPuan <strong>tidak menyimpan isi percakapan</strong> di server.</li>
          <li>Untuk memperbaiki layanan, kami mencatat <strong>topik pertanyaan secara anonim</strong> (misalnya &quot;penagihan&quot;) dan penilaian suka/tidak suka, <strong>tanpa isi pesan dan tanpa identitasmu</strong>.</li>
        </ul>
      </div>

      <Bagian judul="1. Siapa kami">
        <p>
          EduPuan adalah platform edukasi untuk perempuan seputar pinjaman online (pinjol), dikembangkan sebagai proyek
          pembelajaran. Dalam kebijakan ini, &quot;kami&quot; berarti tim pengembang EduPuan, dan &quot;kamu&quot; berarti pengguna.
        </p>
      </Bagian>

      <Bagian judul="2. Data yang kami proses">
        <p>
          <strong>a. Data yang kamu masukkan di fitur.</strong> Data di fitur seperti Rangkum Utang, Cek Penawaran, Analisis Pesan
          Penagih, dan Cek Legalitas diproses di browser perangkatmu dan tidak kami kirim ke server.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Rangkum Utang</strong> menyimpan daftar tagihanmu di penyimpanan browser (localStorage) di perangkat itu, supaya tidak hilang saat halaman ditutup. Kamu bisa menghapusnya kapan saja lewat tombol &quot;Hapus semua data&quot;.</li>
          <li><strong>Cek Penawaran</strong> tidak menyimpan angka yang kamu masukkan. Angka itu hilang saat halaman ditutup.</li>
          <li>Jika kamu memakai tombol <strong>Unduh PDF</strong>, file disimpan di perangkatmu sendiri. Simpan file itu di tempat yang aman karena berisi data keuanganmu.</li>
        </ul>
        <p>
          <strong>b. Percakapan dengan Puan AI.</strong> Pesanmu dan beberapa pesan sebelumnya dalam percakapan yang sama dikirim
          melalui server kami ke Google Gemini agar Puan bisa menyusun jawaban. Server EduPuan meneruskan pesan tersebut tanpa
          menyimpannya. Di perangkatmu, percakapan disimpan sementara di penyimpanan tab browser (sessionStorage) supaya tidak hilang
          saat halaman dimuat ulang. Percakapan itu <strong>terhapus otomatis saat tab ditutup</strong>, atau saat kamu menekan
          tombol hapus percakapan.
        </p>
        <p>
          <strong>c. Rekap topik anonim.</strong> Setiap kali Puan menjawab, kami mencatat satu baris ringkasan di database kami,
          berisi: <em>topik</em> dan <em>situasi</em> pertanyaan dari daftar kategori yang sudah ditentukan (misalnya
          &quot;penagihan&quot; dan &quot;penagih menghubungi orang lain&quot;), jenis jawaban (misalnya berdasarkan pasal atau
          di luar topik), apakah pesan mengandung tanda krisis (ya/tidak), lama waktu menjawab, dan waktu pencatatan.
          <strong> Isi pesanmu, nama, nomor telepon, alamat IP, dan pengenal perangkatmu tidak dicatat.</strong>
        </p>
        <p>
          <strong>d. Penilaian jawaban.</strong> Jika kamu menekan tombol suka atau tidak suka di bawah jawaban Puan, kami mencatat
          nilainya bersama topik, situasi, dan jenis jawaban yang sama seperti di atas. Isi pertanyaan dan jawaban tidak ikut dicatat.
        </p>
        <p>
          <strong>e. Data teknis.</strong> Penyedia hosting kami mencatat data teknis seperti alamat IP, jenis perangkat, dan waktu
          akses untuk menjaga keamanan dan kelancaran layanan.
        </p>
      </Bagian>

      <Bagian judul="3. Untuk apa data diproses">
        <ul className="list-disc space-y-1 pl-5">
          <li>Menjalankan fitur yang kamu pakai, termasuk menyusun jawaban Puan AI.</li>
          <li>Memahami masalah apa yang paling sering dialami pengguna dan jawaban mana yang belum membantu, melalui rekap anonim, supaya materi dan fitur EduPuan bisa diperbaiki.</li>
          <li>Menjaga keamanan layanan dan memperbaiki gangguan.</li>
        </ul>
        <p>Kami tidak menjual data dan tidak memakainya untuk iklan.</p>
      </Bagian>

      <Bagian judul="4. Dasar pemrosesan">
        <p>
          Pesan yang kamu kirim ke Puan AI diproses berdasarkan <strong>persetujuanmu</strong>, sesuai dasar pemrosesan dalam UU
          Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (Pasal 20). Persetujuan itu kamu berikan saat memilih mengirim pesan
          setelah membaca keterangan di jendela chat, dan dapat kamu hentikan kapan saja dengan berhenti memakai chat dan menghapus
          percakapan.
        </p>
        <p>
          Rekap topik dan penilaian jawaban disusun sedemikian rupa sehingga <strong>tidak dapat dipakai untuk mengenali siapa
          pun</strong>.
        </p>
      </Bagian>

      <Bagian judul="5. Pihak ketiga yang membantu kami">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Google (Gemini API):</strong> menyusun jawaban Puan AI. Saat ini EduPuan memakai layanan Gemini <strong>tanpa biaya</strong>. Menurut ketentuan Google, data yang dikirim melalui layanan tanpa biaya <strong>dapat digunakan Google untuk meningkatkan produknya</strong>. Karena itu, jangan menulis data yang sangat pribadi di chat.</li>
          <li><strong>Vercel:</strong> hosting website dan server EduPuan.</li>
          <li><strong>Supabase:</strong> database daftar pinjol, serta penyimpanan rekap topik anonim dan penilaian jawaban. Tidak ada isi percakapan atau data akun yang disimpan di sini.</li>
        </ul>
        <p>
          Server penyedia layanan tersebut dapat berada di luar wilayah Indonesia, sehingga data yang diproses dapat ditransfer ke
          luar negeri. Kami memilih penyedia yang menerapkan standar keamanan data yang diakui secara luas.
        </p>
      </Bagian>

      <Bagian judul="6. Berapa lama data disimpan">
        <ul className="list-disc space-y-1 pl-5">
          <li>Percakapan Puan AI di perangkatmu: sampai tab browser ditutup, atau sampai kamu menekan tombol hapus percakapan.</li>
          <li>Isi percakapan di server EduPuan: tidak disimpan.</li>
          <li>Data Rangkum Utang di perangkatmu: sampai kamu menghapusnya, atau menghapus data browser.</li>
          <li>Rekap topik anonim dan penilaian jawaban: disimpan untuk keperluan statistik dan perbaikan layanan.</li>
          <li>Data teknis hosting: mengikuti ketentuan penyedia hosting.</li>
        </ul>
      </Bagian>

      <Bagian judul="7. Hakmu atas datamu">
        <p>Sebagai subjek data pribadi, kamu berhak antara lain untuk:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>mengetahui data apa yang diproses dan untuk apa, seperti dijelaskan di halaman ini;</li>
          <li>menghapus data yang tersimpan di perangkatmu kapan saja: percakapan Puan lewat tombol hapus percakapan, dan data Rangkum Utang lewat tombol &quot;Hapus semua data&quot;;</li>
          <li>menarik persetujuan dengan berhenti mengirim pesan ke Puan AI.</li>
        </ul>
        <p>
          Karena rekap topik dan penilaian jawaban tidak memuat identitas, kami <strong>tidak dapat menemukan baris mana yang
          berasal darimu</strong>. Artinya, data tersebut juga tidak bisa dikaitkan kembali kepadamu.
        </p>
        <p>
          Untuk pertanyaan tentang privasi, hubungi kami di{" "}
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
          EduPuan ditujukan untuk pengguna dewasa. Jika kamu berusia di bawah 18 tahun, gunakan EduPuan bersama orang tua atau walimu.
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