import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { useLogoutMutation } from '../../features/auth/authApi';
import { clearAuth } from '../../features/auth/authSlice';
import styles from './AppLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  ownerOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Beranda' },
  { to: '/transactions/new', label: 'Jual' },
  { to: '/products', label: 'Produk' },
  { to: '/reports', label: 'Laporan', ownerOnly: true },
  { to: '/stock-opname', label: 'Opname', ownerOnly: true },
];

export function AppLayout() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();

  const items = NAV.filter((i) => !i.ownerOnly || user?.role === 'owner');

  async function handleLogout() {
    await logout();
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.brandName}>Utama POS</span>
        </div>
        <div className={styles.userBox}>
          <span className={styles.userEmail}>{user?.email}</span>
          <span className={styles.roleBadge}>{user?.role === 'owner' ? 'Owner' : 'Kasir'}</span>
          <button className={styles.logout} onClick={handleLogout} disabled={isLoading}>
            Keluar
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav} aria-label="Navigasi utama">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navActive : ''].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
