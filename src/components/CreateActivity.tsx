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
    } catch (err: any) {
      setError(err.message || 'Failed to create activity');
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
        <h1 className="card-title" style={{ marginBottom: '1.5rem' }}>
          Create New Activity
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Activity Name *
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Date & Time (CET) *
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={{ width: '100%', minHeight: '100px' }}
              placeholder="Describe the activity..."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Zone (optional)
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Minimum IP (optional)
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Minimum Fame (optional)
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
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(192, 57, 43, 0.1)',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <div className="flex" style={{ gap: '1rem' }}>
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
