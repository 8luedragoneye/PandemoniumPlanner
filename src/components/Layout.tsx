import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    console.log('Logout button clicked');
    logout();
    // App component will automatically show Login when isAuthenticated becomes false
  };

  return (
    <div>
      <header style={{
        backgroundColor: 'var(--albion-darker)',
        borderBottom: '2px solid var(--albion-gold)',
        padding: '1rem 2rem',
        marginBottom: '2rem'
      }}>
        <div className="flex-between">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ 
              color: 'var(--albion-gold)', 
              fontSize: '1.5rem',
              margin: 0
            }}>
              Pandemonium Planner
            </h1>
          </Link>
          <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
            <span className="text-dim">{user?.name || user?.email}</span>
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
