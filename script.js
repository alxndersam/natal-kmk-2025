// Ganti URL ini dengan Web App URL kamu
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxWNEHmZ1SoRWuVkbgW0D3t4chjRKWTU5i4aA8ZkiyW1VEjFbQvkrnLJFJDXMFLGuH/exec";

// === CEK STATUS PENDAFTARAN ===
async function fetchStatus() {
  const statusEl = document.getElementById("status");
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    if (data.status === "closed") {
      statusEl.textContent = "Pendaftaran Panitia Natal KMK 2025 sudah ditutup. 💖✨";
      statusEl.classList.add("closed");
      document.querySelector("form").style.display = "none";
    } else {
      statusEl.textContent = `Pendaftaran masih dibuka! Total pendaftar: ${data.total}`;
      statusEl.classList.remove("closed");
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error memuat status. Silakan refresh halaman.";
  }
}

// === BUAT ELEMEN LOADER & NOTIF ===
const loader = document.createElement("div");
loader.id = "loader";
loader.innerHTML = `<div class="spinner"></div><p>Mengirim data...</p>`;
loader.style.display = "none";
document.body.appendChild(loader);

const notif = document.createElement("div");
notif.id = "notif";
document.body.appendChild(notif);

function showNotif(message, type = "success") {
  notif.textContent = message;
  notif.className = type;
  notif.style.opacity = "1";
  setTimeout(() => (notif.style.opacity = "0"), 3000);
}

// === SUBMIT FORM ===
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  loader.style.display = "flex";

  const data = {
    nama: document.getElementById("nama").value,
    npm: document.getElementById("npm").value,
    jurusan: document.getElementById("jurusan").value,
    angkatan: document.getElementById("angkatan").value,
    whatsapp: document.getElementById("whatsapp").value,
    divisi1: document.getElementById("divisi1").value,
    alasan1: document.getElementById("alasan1").value,
    divisi2: document.getElementById("divisi2").value,
    alasan2: document.getElementById("alasan2").value,
    bersedia: document.querySelector('input[name="bersedia"]:checked')?.value || "Tidak",
    linkKRS: document.getElementById("linkKRS").value,
  };

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    showNotif("Terima kasih! Data kamu sudah terkirim 🎄✨", "success");
    e.target.reset();
  } catch (err) {
    console.error(err);
    showNotif("Gagal mengirim data, coba lagi ya 😔", "error");
  } finally {
    loader.style.display = "none";
  }
});

// Jalankan status saat halaman dibuka
fetchStatus();
