import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();
const prod = process.env.NODE_ENV === 'production';
const cookieOpts = { httpOnly: true, secure: prod, sameSite: prod ? 'none' : 'lax', maxAge: 7 * 24 * 3600 * 1000 };
const pub = (u) => ({ id: u._id, name: u.name, email: u.email });
const issue = (res, u) => res.cookie('token', jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' }), cookieOpts);

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6)
    return res.status(400).json({ message: 'Enter a name, a valid email and a password of 6+ characters' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  issue(res, user);
  res.status(201).json(pub(user));
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
  issue(res, user);
  res.json(pub(user));
});

router.post('/logout', (_req, res) => { res.clearCookie('token', { ...cookieOpts, maxAge: undefined }); res.json({ ok: true }); });

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: 'User not found' });
  res.json(pub(user));
});

export default router;
