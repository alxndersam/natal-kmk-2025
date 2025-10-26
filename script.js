const API_URL = "https://script.google.com/macros/s/AKfycbwV2EYxj0-pl6IE4LzhQYFuFLq8NOQqASgB1WLX1TQbhCZrkdGzjcL5daGydCsy6u--/exec";

const startBtn = document.getElementById('startBtn');
const regForm = document.getElementById('regForm');
const cancelBtn = document.getElementById('cancelBtn');
const loader = document.getElementById('loader');
const notif = document.getElementById('notif');

startBtn.addEventListener('click', () => {
  regForm.classList.remove('hidden');
  startBtn.parentElement.parentElement.classList.add('hidden');
});

cancelBtn.addEventListener('click', () => {
  regForm.reset();
  regForm.classList.add('hidden');
  document.querySelector('.intro').classList.remove('hidden');
});

function showNotif(type, message) {
  notif.textContent = message;
  // Jaga kelas dasar 'notif' tetap ada, dan kelola kelas status lewat classList
  notif.classList.remove('success', 'error', 'info');
  notif.classList.add(type);
  notif.classList.remove('hidden');
  setTimeout(() => notif.classList.add('hidden'), 4000);
}

regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loader.classList.remove('hidden');
  notif.classList.add('hidden');

  const fileInput = document.getElementById('krs');
  const file = fileInput.files[0];
  if (!file) {
    showNotif('error', 'Harap upload KRS terlebih dahulu.');
    loader.classList.add('hidden');
    return;
  }

  // Validasi file (tipe dan ukuran)
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (!allowedTypes.includes(file.type)) {
    showNotif('error', 'Tipe file tidak didukung. Gunakan PDF atau JPG/PNG.');
    loader.classList.add('hidden');
    return;
  }
  if (file.size > maxSize) {
    showNotif('error', 'Ukuran file terlalu besar. Maks 5 MB.');
    loader.classList.add('hidden');
    return;
  }

  // Bangun FormData agar file dikirim bersama field lain
  const formData = new FormData();
  formData.append('file', file); // nama field "file" — sesuaikan dengan Apps Script backend
  formData.append('nama', document.getElementById('name').value.trim());
  formData.append('npm', document.getElementById('npm').value.trim());
  formData.append('jurusan', document.getElementById('jurusan').value.trim());
  formData.append('angkatan', document.getElementById('angkatan').value.trim());
  formData.append('whatsapp', document.getElementById('whatsapp').value.trim());
  formData.append('divisi1', document.getElementById('div1').value);
  formData.append('alasan1', document.getElementById('alasan1').value.trim());
  formData.append('divisi2', document.getElementById('div2').value);
  formData.append('alasan2', document.getElementById('alasan2').value.trim());
  formData.append('bersedia', document.getElementById('bersedia').value);
  formData.append('temaNatal', 'Natal KMK Gunadarma 2025');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: formData // Jangan set Content-Type, browser akan atur boundary
    });

    // Tangani status HTTP non-2xx
    if (!res.ok) {
      let errText = await res.text().catch(() => '');
      console.error('Server error:', res.status, errText);
      showNotif('error', `Terjadi kesalahan server (${res.status}). Coba lagi nanti.`);
      loader.classList.add('hidden');
      return;
    }

    // Coba parse JSON, tapi tahan jika bukan JSON
    let data = null;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.warn('Response bukan JSON:', parseErr);
    }

    loader.classList.add('hidden');

    if (data && data.result === 'success') {
      showNotif('success', 'Pendaftaran berhasil dikirim! 🎉');
      regForm.reset();
    } else {
      // Jika backend mengembalikan pesan kesalahan, tampilkan (jika tersedia)
      const msg = (data && data.message) ? data.message : 'Terjadi kesalahan saat mengirim data.';
      showNotif('error', msg);
    }

  } catch (err) {
    console.error('Network / fetch error:', err);
    loader.classList.add('hidden');
    showNotif('error', 'Gagal mengirim formulir. Periksa koneksi dan coba lagi.');
  }
});
