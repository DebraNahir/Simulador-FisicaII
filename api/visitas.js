const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export default async function handler(req, res) {
  // CORS abierto (el browser llama a su propio dominio, no hace falta,
  // pero es buena práctica dejarlo por si se llama desde otro origen)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const headers = {
    'X-Master-Key': API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Leer el valor actual
    const getRes = await fetch(`${BIN_URL}/latest`, { headers });
    if (!getRes.ok) throw new Error(`GET failed: ${getRes.status}`);
    const getData = await getRes.json();
    const current = getData?.record?.count ?? 0;

    // 2. Incrementar y guardar
    const newCount = current + 1;
    const putRes = await fetch(BIN_URL, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ count: newCount }),
    });
    if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status}`);

    res.status(200).json({ count: newCount });
  } catch (err) {
    console.error('[visitas]', err.message);
    res.status(500).json({ error: err.message });
  }
}
