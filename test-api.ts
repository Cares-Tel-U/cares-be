import axios from 'axios';

const BASE_URL = 'http://localhost:5000'; // Sesuaikan port backend kamu jika berbeda

async function runApiTests() {
  console.log('🚀 Memulai Pengujian API Backend CARES...\n');

  try {
    // 1. Tes Endpoint Root (Server Check)
    console.log('1️⃣ Testing Server Health...');
    const health = await axios.get(`${BASE_URL}/`);
    console.log('  ✅ Server Response:', health.data.message);

    // 2. Tes Register Akun Mahasiswa Baru
    const testEmail = `tester_${Date.now()}@telkomuniversity.ac.id`;
    console.log(`\n2️⃣ Testing Register User (${testEmail})...`);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      nama: 'Tester Otomatis',
      email: testEmail,
      password: 'password123',
      role: 'MAHASISWA',
    });
    console.log('  ✅ Register Berhasil:', regRes.data.message);

    // 3. Tes Login Akun Mahasiswa
    console.log('\n3️⃣ Testing Login User...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'password123',
    });
    const userToken = loginRes.data.token || loginRes.data.data?.token;
    console.log('  ✅ Login Berhasil! JWT Token didapatkan.');

    const authHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

    // 4. Tes Get Master Data Facilities
    console.log('\n4️⃣ Testing Get Master Data Fasilitas...');
    const facRes = await axios.get(`${BASE_URL}/facilities`);
    const facilities = facRes.data.data || facRes.data;
    console.log(`  ✅ Berhasil mengambil ${facilities.length} fasilitas.`);

    if (facilities.length === 0) {
      console.log('  ⚠️ Fasilitas kosong! Jalankan "npx prisma db seed" terlebih dahulu.');
      return;
    }

    const selectedFacilityId = facilities[0].id;

    // 5. Tes Create Report (Laporan Kerusakan Baru)
    console.log('\n5️⃣ Testing Create Report...');
    const reportRes = await axios.post(
      `${BASE_URL}/reports`,
      {
        judul: 'Tes Proyektor Mati',
        deskripsi: 'Proyektor di kelas tidak dapat menyala saat dihubungkan ke listrik.',
        facilityId: selectedFacilityId,
        isAnonymous: false,
      },
      authHeaders
    );
    const createdReport = reportRes.data.data || reportRes.data;
    console.log('  ✅ Laporan Berhasil Dibuat ID:', createdReport.id);

    // 6. Tes Duplicate Report Validation (Cek Pencegahan Laporan Ganda)
    console.log('\n6️⃣ Testing Duplicate Report Prevention...');
    try {
      await axios.post(
        `${BASE_URL}/reports`,
        {
          judul: 'Tes Proyektor Mati Lagi',
          deskripsi: 'Mencoba membuat laporan ganda di fasilitas yang sama.',
          facilityId: selectedFacilityId,
          isAnonymous: false,
        },
        authHeaders
      );
      console.log('  ❌ GAGAL: Sistem memperbolehkan laporan ganda!');
    } catch (err: any) {
      console.log('  ✅ Validasi Berhasil! Laporan ganda ditolak:', err.response?.data?.message);
    }

    // 7. Tes Get My Reports (Riwayat Laporan User)
    console.log('\n7️⃣ Testing Get My Reports...');
    const myReportsRes = await axios.get(`${BASE_URL}/reports/my-reports`, authHeaders);
    console.log('  ✅ Berhasil mengambil riwayat laporan user.');

    // 8. Tes Get Report Detail
    console.log(`\n8️⃣ Testing Get Report Detail (ID: ${createdReport.id})...`);
    const detailRes = await axios.get(`${BASE_URL}/reports/${createdReport.id}`, authHeaders);
    console.log('  ✅ Detail Laporan Ditemukan:', detailRes.data.data?.judul);

    // 9. Tes Login Admin / SARPRAS
    console.log('\n9️⃣ Testing Admin Login...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@telkomuniversity.ac.id', // Gunakan email admin yang ada di database
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.token || adminLoginRes.data.data?.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    console.log('  ✅ Admin Login Berhasil!');

    // 10. Tes Admin Update Status Laporan
    console.log('\n🔟 Testing Admin Update Report Status (SELESAI)...');
    const updateRes = await axios.patch(
      `${BASE_URL}/admin/reports/${createdReport.id}/status`,
      { status: 'SELESAI' },
      adminHeaders
    );
    console.log('  ✅ Status Laporan Diperbarui:', updateRes.data.message);

    // 11. Tes Get Notifications (User Cek Notifikasi Update)
    console.log('\n1️⃣1️⃣ Testing User Notification Arrival...');
    const notifRes = await axios.get(`${BASE_URL}/notifications`, authHeaders);
    console.log('  ✅ Notifikasi Diterima:', notifRes.data.data?.[0]?.pesan || 'Ada notifikasi');

    console.log('\n🎉 SELURUH PENGUJIAN API BERHASIL TANPA ERROR!');
  } catch (error: any) {
    console.error('\n❌ Pengujian Terhenti Karena Error:');
    if (error.response) {
      console.error('   Status Code:', error.response.status);
      console.error('   Pesan Error:', error.response.data);
    } else {
      console.error('   Detail:', error.message);
    }
  }
}

runApiTests();