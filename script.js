const API_URL = "https://script.google.com/macros/s/AKfycbwxWNEHmZ1SoRWuVkbgW0D3t4chjRKWTU5i4aA8ZkiyW1VEjFbQvkrnLJFJDXMFLGuH/exec";

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
  notif.className = `notif ${type}`;
  notif.classList.remove('hidden');
  setTimeout(() => notif.classList.add('hidden'), 4000);
}

regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loader.classList.remove('hidden');
  notif.classList.add('hidden');

  const file = document.getElementById('krs').files[0];
  if (!file) {
    showNotif('error', 'Harap upload KRS terlebih dahulu.');
    loader.classList.add('hidden');
    return;
  }

  // Upload file ke Google Drive
  const formDataFile = new FormData();
  formDataFile.append('file', file);

  try {
    // Langsung kirim data ke API (file di-handle di Apps Script)
    const body = {
      nama: document.getElementById('name').value,
      npm: document.getElementById('npm').value,
      jurusan: document.getElementById('jurusan').value,
      angkatan: document.getElementById('angkatan').value,
      whatsapp: document.getElementById('whatsapp').value,
      divisi1: document.getElementById('div1').value,
      alasan1: document.getElementById('alasan1').value,
      divisi2: document.getElementById('div2').value,
      alasan2: document.getElementById('alasan2').value,
      bersedia: document.getElementById('bersedia').value,
      linkKRS: file.name,
      temaNatal: "Natal KMK Gunadarma 2025"
    };

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    loader.classList.add('hidden');

    if (data.result === "success") {
      showNotif('success', 'Pendaftaran berhasil dikirim! 🎉');
      regForm.reset();
    } else {
      showNotif('error', 'Terjadi kesalahan saat mengirim data.');
    }

  } catch (err) {
    loader.classList.add('hidden');
    showNotif('error', 'Gagal mengirim formulir. Coba lagi.');
  }
});
