import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
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
        setError('Name is required');
        setLoading(false);
        return;
      }
      
      if (isRegister) {
        const result = await register(name.trim());
        console.log('Register result:', result);
      } else {
        const result = await login(name.trim());
        console.log('Login result:', result);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>
          {isRegister ? 'Register' : 'Login'} - Pandemonium Planner
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Player Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
              placeholder="Enter your player name"
              autoFocus
            />
          </div>

          {error && (
            <div style={{ 
              color: 'var(--albion-red)', 
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(192, 57, 43, 0.1)',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
