export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { secretKey } = req.body || {};
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'vsbadmin2025';

  if (!secretKey) {
    return res.status(400).json({ error: 'Admin secret key is required' });
  }

  if (secretKey === ADMIN_SECRET) {
    return res.status(200).json({
      success: true,
      token: ADMIN_SECRET,
      role: 'administrator',
      message: 'Access granted to VSB College Knowledge Management',
    });
  }

  return res.status(401).json({ error: 'Invalid administrator secret key' });
}
