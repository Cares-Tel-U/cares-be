import { PrismaClient, KategoriFasilitas, Role, StatusPelaporan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Memulai proses pembersihan dan seeding data database CARES...');

  // 0. Reset & Bersihkan Seluruh Data Lama di Database
  console.log('1. Membersihkan data lama...');
  await prisma.notification.deleteMany({});
  await prisma.reportPhoto.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Semua tabel berhasil dibersihkan.');

  // 1. Data Dummy Pengguna (Hanya Pengguna Satu - Tiga & Admin Satu - Tiga)
  console.log('2. Menyiapkan akun pengguna dan admin sesuai standar validasi...');
  const passwordMahasiswa = await hashPassword('Password123');
  const passwordAdmin = await hashPassword('Admin123');

  // Akun Mahasiswa / Pelapor
  const userPengguna1 = await prisma.user.create({
    data: {
      email: 'pengguna1@telkomuniversity.ac.id',
      nama: 'Pengguna Satu',
      nim: '1301210001',
      password: passwordMahasiswa,
      role: Role.MAHASISWA,
    },
  });

  const userPengguna2 = await prisma.user.create({
    data: {
      email: 'pengguna2@telkomuniversity.ac.id',
      nama: 'Pengguna Dua',
      nim: '1301210002',
      password: passwordMahasiswa,
      role: Role.MAHASISWA,
    },
  });

  const userPengguna3 = await prisma.user.create({
    data: {
      email: 'pengguna3@telkomuniversity.ac.id',
      nama: 'Pengguna Tiga',
      nim: '1301210003',
      password: passwordMahasiswa,
      role: Role.MAHASISWA,
    },
  });

  // Akun Petugas Sarpras / Admin
  const userAdmin1 = await prisma.user.create({
    data: {
      email: 'admin1@telkomuniversity.ac.id',
      nama: 'Admin Satu',
      password: passwordAdmin,
      role: Role.SARPRAS,
    },
  });

  const userAdmin2 = await prisma.user.create({
    data: {
      email: 'admin2@telkomuniversity.ac.id',
      nama: 'Admin Dua',
      password: passwordAdmin,
      role: Role.SARPRAS,
    },
  });

  const userAdmin3 = await prisma.user.create({
    data: {
      email: 'admin3@telkomuniversity.ac.id',
      nama: 'Admin Tiga',
      password: passwordAdmin,
      role: Role.SARPRAS,
    },
  });

  console.log('Akun Berhasil Dibuat: 3 Mahasiswa (Pengguna Satu - Tiga) & 3 Admin (Admin Satu - Tiga)');

  // 2. Data Master Fasilitas Kampus Telkom University Resmi
  console.log('3. Menambahkan master data fasilitas kampus...');
  const facilitiesData = [
    // Fasilitas Gedung & Ruangan
    { nama: 'TULT-08-01 (Ruang Kelas Terintegrasi)', lokasi: 'TULT', kategori: KategoriFasilitas.KELAS },
    { nama: 'KU3.02.12 (Ruang Audio Visual)', lokasi: 'Gedung Tokong Nanas', kategori: KategoriFasilitas.KELAS },
    { nama: 'IF2.01.01 (Computing Laboratory)', lokasi: 'Gedung Kultubai Utara', kategori: KategoriFasilitas.LABORATORIUM },
    { nama: 'Lab Rekayasa Perangkat Lunak (RPL)', lokasi: 'Gedung Kultubai Selatan', kategori: KategoriFasilitas.LABORATORIUM },
    { nama: 'Auditorium Cacuk Sudarijanto', lokasi: 'Grha Wiyata Cacuk Sudarijanto', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Toilet Pria Lt. 1', lokasi: 'Gedung Panambulai', kategori: KategoriFasilitas.TOILET },
    { nama: 'Toilet Wanita Lt. 5', lokasi: 'TULT', kategori: KategoriFasilitas.TOILET },
    { nama: 'Area Baca Tenang Lt. 3', lokasi: 'Open Library', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Ruang Utama Sholat Lt. 1', lokasi: 'Masjid Syamsul Ulum', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Lapangan Futsal Indoor', lokasi: 'Sport Center', kategori: KategoriFasilitas.LAINNYA },

    // Fasilitas Area Luar (Outdoor Area) Telkom University
    { nama: 'Parkir Motor TULT (Landmark Tower)', lokasi: 'Area Parkir', kategori: KategoriFasilitas.PARKIRAN },
    { nama: 'Parkir Mobil TULT (Landmark Tower)', lokasi: 'Area Parkir', kategori: KategoriFasilitas.PARKIRAN },
    { nama: 'Parkir Gedung Tokong Nanas (GKU)', lokasi: 'Area Parkir', kategori: KategoriFasilitas.PARKIRAN },
    { nama: 'Parkir Motor Timur (Dekat Gerbang Timur)', lokasi: 'Area Parkir', kategori: KategoriFasilitas.PARKIRAN },
    { nama: 'Parkir Gedung Bangkit (Rektorat)', lokasi: 'Area Parkir', kategori: KategoriFasilitas.PARKIRAN },
    { nama: 'Lapangan Merah (Stadion Sepakbola Utama)', lokasi: 'Sarana Olahraga Terbuka', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Lapangan Basket Outdoor Sport Center', lokasi: 'Sarana Olahraga Terbuka', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Lapangan Basket 3x3 Outdoor (Dekat Student Center)', lokasi: 'Sarana Olahraga Terbuka', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Lapangan Tenis Outdoor (Dekat Student Center & THC)', lokasi: 'Sarana Olahraga Terbuka', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Lapangan Voli Outdoor (Antara Asrama Putra & Putri)', lokasi: 'Sarana Olahraga Terbuka', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Jogging Track Lingkar Danau Situ Techno', lokasi: 'Sarana Olahraga Terbuka', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Situ Techno (Danau Utama / Danau Galau)', lokasi: 'Danau dan Landmark Kampus', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Dermaga dan Jembatan Situ Techno', lokasi: 'Danau dan Landmark Kampus', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Helipad Utama Telkom University (Dekat GKU)', lokasi: 'Danau dan Landmark Kampus', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Tugu Monumen Telkom University', lokasi: 'Danau dan Landmark Kampus', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Gerbang Utama Kampus (Bojongsoang)', lokasi: 'Danau dan Landmark Kampus', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Taman Segitiga Tel-U (Pusat Orientasi Hijau)', lokasi: 'Taman dan Ruang Terbuka Hijau', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Taman Canopy Telkom University', lokasi: 'Taman dan Ruang Terbuka Hijau', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Plaza Terbuka Gedung Damar (Auditorium)', lokasi: 'Taman dan Ruang Terbuka Hijau', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Jalur Pedestrian Boulevard Utama', lokasi: 'Jalan dan Jalur Pedestrian', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Halte Shuttle Bus Kampus Depan TULT', lokasi: 'Jalan dan Jalur Pedestrian', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Koridor Pejalan Kaki Terintegrasi TULT - GKU', lokasi: 'Jalan dan Jalur Pedestrian', kategori: KategoriFasilitas.LAINNYA },
    { nama: 'Plaza Terbuka Kantin Asrama Pusat', lokasi: 'Area Komersial dan Kantin Terbuka', kategori: KategoriFasilitas.KANTIN },
    { nama: 'Kantin Terbuka Lapangan Merah', lokasi: 'Area Komersial dan Kantin Terbuka', kategori: KategoriFasilitas.KANTIN },
  ];

  const createdFacilities = [];
  for (const f of facilitiesData) {
    const created = await prisma.facility.create({ data: f });
    createdFacilities.push(created);
  }

  console.log(`${createdFacilities.length} Master fasilitas kampus berhasil ditambahkan.`);

  // 3. Data Laporan Kerusakan
  console.log('4. Menambahkan data laporan kerusakan sarpras...');
  const facLab = createdFacilities.find((f) => f.kategori === KategoriFasilitas.LABORATORIUM) || createdFacilities[0]!;
  const facKelas = createdFacilities.find((f) => f.kategori === KategoriFasilitas.KELAS) || createdFacilities[1]!;
  const facToilet = createdFacilities.find((f) => f.kategori === KategoriFasilitas.TOILET) || createdFacilities[2]!;
  const facParkir = createdFacilities.find((f) => f.kategori === KategoriFasilitas.PARKIRAN) || createdFacilities[3]!;

  // Laporan 1: Status PENDING (Pengguna Satu)
  const report1 = await prisma.report.create({
    data: {
      judul: 'AC Bocor dan Mengeluarkan Suara Bising',
      deskripsi: 'AC di ruangan IF2.01.01 (Computing Laboratory) meneteskan air ke meja komputer dan suhu ruangan terasa panas.',
      status: StatusPelaporan.PENDING,
      facilityId: facLab.id,
      userId: userPengguna1.id,
      isAnonymous: false,
      photos: {
        create: [{ url: '/uploads/ac_bocor_dummy.jpg' }],
      },
    },
  });

  // Laporan 2: Status DIPROSES (Pengguna Dua)
  const report2 = await prisma.report.create({
    data: {
      judul: 'Proyektor Mati Total dan Kabel HDMI Rusak',
      deskripsi: 'Proyektor di ruang TULT-08-01 (Ruang Kelas Terintegrasi) tidak menyala sama sekali saat dihubungkan ke sumber daya listrik.',
      status: StatusPelaporan.DIPROSES,
      catatan: 'Teknisi perlengkapan audio-visual telah ditugaskan ke lokasi untuk penggantian kabel.',
      facilityId: facKelas.id,
      userId: userPengguna2.id,
      isAnonymous: false,
      photos: {
        create: [
          { url: '/uploads/proyektor_rusak_1.jpg' },
          { url: '/uploads/proyektor_rusak_2.jpg' },
        ],
      },
    },
  });

  // Laporan 3: Status SELESAI (Pengguna Satu)
  const report3 = await prisma.report.create({
    data: {
      judul: 'Kran Wastafel Toilet Patah dan Bocor',
      deskripsi: 'Kran air pada wastafel nomor 2 patah sehingga air menyembur ke lantai toilet.',
      status: StatusPelaporan.SELESAI,
      catatan: 'Penggantian unit kran wastafel baru telah selesai dikerjakan oleh tim sarpras.',
      facilityId: facToilet.id,
      userId: userPengguna1.id,
      isAnonymous: false,
      photos: {
        create: [
          { url: '/uploads/kran_patah.jpg' },
          { url: '/uploads/bukti_selesai_kran.jpg' },
        ],
      },
    },
  });

  // Laporan 4: Status DITOLAK (Pengguna Tiga - Mode Anonim)
  const report4 = await prisma.report.create({
    data: {
      judul: 'Lampu Penerangan Parkiran Mati Sebagian',
      deskripsi: 'Beberapa lampu sorot di area parkir bagian timur padam saat malam hari.',
      status: StatusPelaporan.DITOLAK,
      rejectionReason: 'Laporan duplikat dengan tiket penanganan sarpras nomor LAP-2026-004 yang sedang dikerjakan PLN kampus.',
      facilityId: facParkir.id,
      userId: userPengguna3.id,
      isAnonymous: true,
      photos: {
        create: [{ url: '/uploads/lampu_parkir.jpg' }],
      },
    },
  });

  // 4. Data Notifikasi Pengguna
  console.log('5. Menambahkan notifikasi...');
  await prisma.notification.createMany({
    data: [
      {
        userId: userPengguna1.id,
        reportId: report1.id,
        pesan: `Laporan kerusakan untuk ${facLab.nama} berhasil dikirim dan menunggu verifikasi admin.`,
        isRead: false,
      },
      {
        userId: userPengguna2.id,
        reportId: report2.id,
        pesan: `Status laporan Anda (#${report2.id.substring(0, 8)}) telah diperbarui menjadi DIPROSES.`,
        isRead: true,
      },
      {
        userId: userPengguna1.id,
        reportId: report3.id,
        pesan: `Status laporan Anda (#${report3.id.substring(0, 8)}) telah diperbarui menjadi SELESAI.`,
        isRead: false,
      },
      {
        userId: userPengguna3.id,
        reportId: report4.id,
        pesan: `Status laporan Anda (#${report4.id.substring(0, 8)}) telah diperbarui menjadi DITOLAK.`,
        isRead: false,
      },
    ],
  });

  console.log('Seluruh proses seeding data CARES berhasil diselesaikan.');
  console.log('Akun Tersedia:');
  console.log('- Pelapor: pengguna1@telkomuniversity.ac.id / Password123 (NIM: 1301210001)');
  console.log('- Pelapor: pengguna2@telkomuniversity.ac.id / Password123 (NIM: 1301210002)');
  console.log('- Pelapor: pengguna3@telkomuniversity.ac.id / Password123 (NIM: 1301210003)');
  console.log('- Admin:   admin1@telkomuniversity.ac.id / Admin123');
  console.log('- Admin:   admin2@telkomuniversity.ac.id / Admin123');
  console.log('- Admin:   admin3@telkomuniversity.ac.id / Admin123');
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });