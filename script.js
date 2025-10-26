
// Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwhyIQJnKQp7nX_HDIRv7ntGSWrlQXHPBD-HT-TktdMbcuk_Qtf-_PA79tOfQ7Pm3BN/exec";
const MAX_PER_DIV = 10;

// DOM refs
const startBtn = document.getElementById('startBtn');
const regForm = document.getElementById('regForm');
const openStatus = document.getElementById('openStatus');
const quotaGrid = document.getElementById('quotaGrid');
const closedMsg = document.getElementById('closedMsg');

startBtn.addEventListener('click', ()=>{ regForm.classList.remove('hidden'); window.scrollTo({top:document.body.scrollHeight, behavior:'smooth'}); });

// Fetch status (GET ?action=status)
async function fetchStatus(){ 
  try{ 
    const res = await fetch(API_URL + '?action=status');
    const data = await res.json();
    updateStatusUI(data);
  }catch(err){ console.error(err); openStatus.innerText='Error memuat status'; }
}

function updateStatusUI(data){
  const counts = data.counts || {ACARA:0,HPDD:0,MDK:0,TKP:0};
  const isOpen = data.isOpen;
  openStatus.innerText = isOpen ? 'Terbuka' : 'Tutup (kuota penuh)';
  quotaGrid.innerHTML = '';
  ['ACARA','HPDD','MDK','TKP'].forEach(k=>{ const used = counts[k] || 0; const card = document.createElement('div'); card.className='quota-card'; card.innerHTML = `<div style="font-weight:700">${k}</div><div class="small">${used} / ${MAX_PER_DIV}</div>`; quotaGrid.appendChild(card); });
  if(!isOpen){ regForm.classList.add('hidden'); closedMsg.classList.remove('hidden'); } else { closedMsg.classList.add('hidden'); }
}

// Form submit
document.getElementById('regForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fileInput = document.getElementById('krs');
  const file = fileInput.files[0];
  if(!file){ alert('Silakan unggah KRS.'); return; }
  if(file.size > 5*1024*1024){ alert('Ukuran file maksimal 5 MB.'); return; }

  const payload = new FormData();
  payload.append('action','submit');
  payload.append('name', document.getElementById('name').value.trim());
  payload.append('npm', document.getElementById('npm').value.trim());
  payload.append('jurusan', document.getElementById('jurusan').value.trim());
  payload.append('angkatan', document.getElementById('angkatan').value.trim());
  payload.append('whatsapp', document.getElementById('whatsapp').value.trim());
  payload.append('div1', document.getElementById('div1').value);
  payload.append('alasan1', document.getElementById('alasan1').value.trim());
  payload.append('div2', document.getElementById('div2').value);
  payload.append('alasan2', document.getElementById('alasan2').value.trim());
  payload.append('bersedia', document.getElementById('bersedia').value);
  payload.append('tema', document.getElementById('tema').value.trim());
  payload.append('krs', file, file.name);

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true; submitBtn.innerText = 'Mengirim...';

  try{
    const res = await fetch(API_URL, { method: 'POST', body: payload });
    const result = await res.json();
    if(result.success || result.result==='success'){ alert('Pendaftaran berhasil! Terima kasih.'); fetchStatus(); regForm.reset(); }
    else { alert('Gagal: ' + (result.message || JSON.stringify(result))); }
  }catch(err){ console.error(err); alert('Terjadi error saat mengirim. Coba lagi.'); }
  finally{ submitBtn.disabled = false; submitBtn.innerText = 'Kirim Pendaftaran'; }
});

// Cancel
document.getElementById('cancelBtn').addEventListener('click', ()=>{ regForm.classList.add('hidden'); window.scrollTo({top:0,behavior:'smooth'}); });

// initial status + polling
fetchStatus();
setInterval(fetchStatus, 20000);
