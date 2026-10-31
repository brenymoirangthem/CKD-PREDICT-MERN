import jwt from 'jsonwebtoken';
export function protect(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    req.user = { id: jwt.verify(token, process.env.JWT_SECRET).id };
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
}
