const https = require('https');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET')     return res.status(200).json({ status: 'Vera proxy running on Vercel' });
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-vera-key'];
  if (!apiKey) return res.status(400).json({ error: { message: 'Missing x-vera-key header' } });

  const body = JSON.stringify(req.body);

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        res.status(response.statusCode).json(JSON.parse(data));
        resolve();
      });
    });

    request.on('error', (err) => {
      res.status(500).json({ error: { message: err.message } });
      resolve();
    });

    request.write(body);
    request.end();
  });
}
