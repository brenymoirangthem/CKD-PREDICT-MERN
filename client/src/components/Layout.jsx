import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Activity, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
['/', 'Dashboard'],
['/predict', 'New screening'],
['/history', 'Patients'],
['/model', 'Model']
];

export default function Layout() {
const { user, logout } = useAuth();
const [menuOpen, setMenuOpen] = useState(false);

const navClass = ({ isActive }) =>
`block rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? 'bg-teal-500/15 text-teal-300'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;

return ( <div className="min-h-screen"> <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">


    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">

      {/* Logo */}
      <Link
        to="/"
        onClick={() => setMenuOpen(false)}
        className="flex items-center gap-2 text-lg font-bold"
      >
        <Activity className="text-teal-400" />
        <span>CKD-PREDICT</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-1 md:flex">
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={navClass}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Desktop User Actions */}
      <div className="hidden items-center gap-3 text-sm md:flex">
        <span className="text-slate-400">{user?.name}</span>

        <button className="btn-ghost" onClick={logout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 md:hidden"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

    </div>

    {/* Mobile Navigation */}
    {menuOpen && (
      <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">

        <nav className="flex flex-col gap-2">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={navClass}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4">

          <p className="mb-3 text-sm text-slate-400">
            {user?.name}
          </p>

          <button
            className="btn-ghost w-full justify-center"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
          >
            <LogOut size={16} />
            Logout
          </button>

        </div>
      </div>
    )}

  </header>

  {/* Main Content */}
  <main className="mx-auto min-h-[calc(100vh-150px)] w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
    <Outlet />
  </main>

  {/* Footer */}
  <footer className="px-4 pb-8 text-center text-xs text-slate-500">
    Decision-support tool only. Not a medical diagnosis.
  </footer>

</div>

);
}
