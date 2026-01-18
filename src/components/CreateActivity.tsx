import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ActivityFormData } from '../types';
import { formatCETDate } from '../lib/utils';
import { activitiesApi } from '../lib/api';

export function CreateActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    date: '',
    description: '',
    zone: '',
    minIP: undefined,
    minFame: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const activity = await activitiesApi.create({
        name: formData.name,
        date: formData.date,
        description: formData.description,
        zone: formData.zone || undefined,
        minIP: formData.minIP ? Number(formData.minIP) : undefined,
        minFame: formData.minFame ? Number(formData.minFame) : undefined,
      });

      navigate(`/activity/${activity.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  // Get current date/time in CET for default value
  const now = new Date();
  const defaultDateTime = formatCETDate(now).replace(' ', 'T');

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <div className="card">
        <h1 className="card-title" style={{ marginBottom: '2rem' }}>
          Create New Activity
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Activity Name <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%' }}
              placeholder="e.g., Black Zone Raid"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Date & Time (CET) <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              style={{ width: '100%' }}
              min={defaultDateTime}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Description <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={{ width: '100%', minHeight: '120px' }}
              placeholder="Describe the activity..."
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Zone <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
            </label>
            <input
              type="text"
              name="zone"
              value={formData.zone || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
              placeholder="e.g., Thetford, Martlock"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Minimum IP <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
            </label>
            <input
              type="number"
              name="minIP"
              value={formData.minIP || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
              placeholder="e.g., 1300"
              min="0"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Minimum Fame <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
            </label>
            <input
              type="number"
              name="minFame"
              value={formData.minFame || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
              placeholder="e.g., 1000000"
              min="0"
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

          <div className="flex" style={{ gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--albion-border)' }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Activity'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
