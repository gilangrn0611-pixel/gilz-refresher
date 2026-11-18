const $ = (s) => document.querySelector(s);
const cookie = $('#cookie'), refresh = $('#refresh'), paste = $('#paste'),
      result = $('#result'), icon = $('#icon');

function show(type, html){
  result.className = 'result ' + type;
  result.innerHTML = html;
  result.classList.remove('hidden');
}

paste.addEventListener('click', async () => {
  try{
    const t = await navigator.clipboard.readText();
    if(t){ cookie.value = t.trim(); }
  }catch{ show('err','❌ Clipboard ditolak. Paste manual.'); }
});

function valid(v){ return v.length > 50 && v.includes('_|WARNING'); }

async function handle(){
  const v = cookie.value.trim();
  if(!v) return show('err','❌ Cookie kosong.');
  if(!valid(v)) return show('err','❌ Format tidak valid.');
  
  refresh.disabled = true;
  icon.classList.add('spin');
  result.classList.add('hidden');

  try{
    const res = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie: v })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal');

    const a = data.account;
    show('ok', `<div style="font-weight:700;margin-bottom:8px;">✅ Akun Asli Terhubung</div>
      <div style="font-family:monospace;font-size:12px;background:#0c0e15;padding:10px;border-radius:8px;margin-bottom:10px;word-break:break-all;">${data.newCookie}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:13px;">
        <div>👤 Username</div><div><b>${a.username}</b></div>
        <div>🏷️ Display Name</div><div>${a.displayName}</div>
        <div>💰 Robux</div><div>${a.robux}</div>
      </div>`);
  }catch(e){ 
    show('err','❌ ' + e.message); 
  } finally { 
    refresh.disabled = false; 
    icon.classList.remove('spin'); 
  }
}

refresh.addEventListener('click', handle);
