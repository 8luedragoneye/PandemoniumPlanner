import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ActivityFormData } from '../types';
import { formatCETDate } from '../lib/utils';
import { transformActivity } from '../lib/transformers';
import { activitiesApi } from '../lib/api';

export function EditActivity() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    date: '',
    description: '',
    zone: '',
    minIP: undefined,
    minFame: undefined,
  });

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      try {
        const record = await activitiesApi.getOne(id);
        const activity = transformActivity(record);
        
        if (activity.creator !== user?.id) {
          navigate('/');
          return;
        }

        setActivity(activity);
        setFormData({
          name: activity.name,
          date: formatCETDate(activity.date).replace(' ', 'T'),
          description: activity.description,
          zone: activity.zone || '',
          minIP: activity.minIP,
          minFame: activity.minFame,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activity:', error);
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !user) return;

    setError('');
    setSaving(true);

    try {
      await activitiesApi.update(activity.id, {
        name: formData.name,
        date: formData.date,
        description: formData.description,
        zone: formData.zone || undefined,
        minIP: formData.minIP ? Number(formData.minIP) : undefined,
        minFame: formData.minFame ? Number(formData.minFame) : undefined,
      });
      navigate(`/activity/${activity.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update activity');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  const handleStatusChange = async (newStatus: 'recruiting' | 'full' | 'running') => {
    if (!activity) return;
    try {
      await activitiesApi.update(activity.id, { status: newStatus });
      setActivity({ ...activity, status: newStatus });
    } catch (error) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '4rem 2rem', 
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner" style={{ 
          width: '2rem', 
          height: '2rem',
          borderWidth: '3px',
          color: 'var(--albion-gold)'
        }}></div>
        <p className="text-dim" style={{ fontSize: '1.125rem' }}>Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return <div style={{ padding: '2rem' }}>Activity not found</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <div className="card">
        <h1 className="card-title" style={{ marginBottom: '1.5rem' }}>
          Edit Activity
        </h1>

        <div style={{ 
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--albion-darker)',
          borderRadius: '12px',
          border: '1px solid var(--albion-border)'
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '1rem',
            fontWeight: 600,
            color: 'var(--albion-text)',
            fontSize: '0.9375rem'
          }}>
            Activity Status
          </label>
          <div className="flex" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={activity.status === 'recruiting' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('recruiting')}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
            >
              Recruiting
            </button>
            <button
              type="button"
              className={activity.status === 'full' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('full')}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
            >
              Full
            </button>
            <button
              type="button"
              className={activity.status === 'running' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('running')}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
            >
              Running
            </button>
          </div>
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
              Activity Name <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%' }}
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
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/activity/${activity.id}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
