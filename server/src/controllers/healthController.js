import mongoose from 'mongoose';

export async function database(req, res) {
  const expectedToken = String(process.env.HEALTHCHECK_TOKEN || '');
  const providedToken = String(req.get('x-healthcheck-token') || '');
  if (!expectedToken || !providedToken || expectedToken !== providedToken) {
    return res.status(404).end();
  }

  try {
    const state = mongoose.connection.readyState;
    if (state !== 1) {
      return res.status(503).json({ status: 'Database connection: FAILED' });
    }
    await mongoose.connection.db.admin().ping();
    return res.json({ status: 'Database connection: OK' });
  } catch (error) {
    console.error('Database health check failed:', error);
    return res.status(503).json({ status: 'Database connection: FAILED' });
  }
}
