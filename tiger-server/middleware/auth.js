const jwt = require('jsonwebtoken');

const getTokenFromReq = (req) => {
  let token = null;
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) token = auth.slice(7);
  if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
  return token;
};

const requireAuth = (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    next();
  } catch (err) {
    console.warn('[auth] token verify failed:', err.message);
    return res.status(401).json({ error: 'invalid_token' });
  }
};

module.exports = { requireAuth, getTokenFromReq };