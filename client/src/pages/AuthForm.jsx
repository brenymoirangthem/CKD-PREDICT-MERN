import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await (isSignup ? signup(f) : login(f)); nav('/'); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Activity className="mx-auto mb-2 h-10 w-10 text-teal-400" />
          <h1 className="text-3xl font-bold">CKD-PREDICT</h1>
          <p className="mt-1 text-sm text-slate-400">AI-powered early kidney disease risk screening</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="text-xl font-semibold">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          {isSignup && <div><label className="label">Name</label><input className="input" value={f.name} onChange={set('name')} required /></div>}
          <div><label className="label">Email</label><input type="email" className="input" value={f.email} onChange={set('email')} required /></div>
          <div><label className="label">Password</label><input type="password" minLength={6} className="input" value={f.password} onChange={set('password')} required /></div>
          <button className="btn w-full" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}</button>
          <p className="text-center text-sm text-slate-400">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <Link className="text-teal-400 hover:underline" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
