import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return req.cookies?.reusecircle_token;
}

export function authRequired(secret) {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) return res.status(401).json({ success: false, message: 'Please log in to continue' });
      const payload = jwt.verify(token, secret);
      const user = await User.findById(payload.sub).select('name email phone role');
      if (!user) return res.status(401).json({ success: false, message: 'Your session is no longer valid' });
      req.user = user; next();
    } catch { return res.status(401).json({ success: false, message: 'Your session is invalid or expired' }); }
  };
}
export function authOptional(secret) {
  return async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return next();
    try {
      const payload = jwt.verify(token, secret);
      req.user = await User.findById(payload.sub).select('name email phone role');
    } catch { /* Public listing details remain available to signed-out visitors. */ }
    next();
  };
}
export function moderatorOnly(req, res, next) {
  if (req.user?.role !== 'moderator') return res.status(403).json({ success: false, message: 'Moderator access required' });
  next();
}
