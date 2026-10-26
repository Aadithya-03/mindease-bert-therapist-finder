import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Brain, LogOut } from 'lucide-react';
import { PAGES } from '../pages';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const page = PAGES.find((p) => p.path === pathname) || PAGES[0];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><Brain size={22} aria-hidden /></span>MindEase</div>
        <nav aria-label="Main">
          {PAGES.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} aria-hidden /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="who" title={user?.email}>{user?.displayName || user?.email}</span>
          <button className="nav-link" onClick={logout}><LogOut size={19} aria-hidden /> <span>Sign out</span></button>
        </div>
      </aside>

      <main className="main">
        <header className="page-head">
          <h1>{page.title}</h1>
          <p>{page.subtitle}</p>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
