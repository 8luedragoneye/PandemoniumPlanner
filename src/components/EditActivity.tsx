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
    } catch (err: any) {
      setError(err.message || 'Failed to update activity');
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
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Status
          </label>
          <div className="flex" style={{ gap: '0.5rem' }}>
            <button
              type="button"
              className={activity.status === 'recruiting' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('recruiting')}
            >
              Recruiting
            </button>
            <button
              type="button"
              className={activity.status === 'full' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('full')}
            >
              Full
            </button>
            <button
              type="button"
              className={activity.status === 'running' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('running')}
            >
              Running
            </button>
          </div>
        </div>

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
