import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function Login(): JSX.Element {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name.trim()) {
        setError(t('auth.nameRequired'));
        setLoading(false);
        return;
      }
      
      if (isRegister) {
        await register(name.trim());
      } else {
        await login(name.trim());
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : t('auth.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '450px', 
      margin: '4rem auto', 
      padding: '2rem',
      minHeight: 'calc(100vh - 4rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem',
            color: 'var(--albion-gold)',
            fontWeight: 700,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, var(--albion-gold) 0%, var(--albion-gold-light) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {t('layout.appTitle')}
          </h1>
          <h2 className="text-dim" style={{ fontSize: '1.125rem', fontWeight: 500 }}>
            {isRegister ? t('auth.createAccount') : t('auth.welcomeBack')}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('auth.playerName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
              placeholder={t('auth.enterPlayerName')}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ 
              color: 'var(--albion-red)', 
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(192, 57, 43, 0.15)',
              borderRadius: '12px',
              border: '1px solid rgba(192, 57, 43, 0.3)',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? t('common.loading') : (isRegister ? t('auth.register') : t('auth.login'))}
          </button>
        </form>
      </div>
    </div>
  );
}
