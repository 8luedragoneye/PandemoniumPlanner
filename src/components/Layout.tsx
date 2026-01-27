import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps): JSX.Element {
  const { user, logout } = useAuth();

  const handleLogout = (): void => {
    logout();
  };

  return (
    <div>
      <header style={{
        backgroundColor: 'var(--albion-darker)',
        borderBottom: '2px solid var(--albion-gold)',
        padding: '1.25rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(180deg, rgba(15, 15, 15, 0.98) 0%, rgba(15, 15, 15, 0.95) 100%)'
      }}>
        <div className="flex-between" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ 
              color: 'var(--albion-gold)', 
              fontSize: '1.75rem',
              margin: 0,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, var(--albion-gold) 0%, var(--albion-gold-light) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              NOX Planer
            </h1>
          </Link>
          <div className="flex" style={{ gap: '1.25rem', alignItems: 'center' }}>
            <span className="text-dim" style={{ 
              fontSize: '0.9375rem',
              fontWeight: 500
            }}>
              {user?.name || user?.email}
            </span>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
