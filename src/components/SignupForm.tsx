import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Role } from '../types';
import { signupsApi } from '../lib/api';

interface SignupFormProps {
  activity: Activity;
  role: Role;
  onSuccess: () => void;
  onCancel: () => void;
  overlapWarning: string;
}

export function SignupForm({ activity, role, onSuccess, onCancel, overlapWarning }: SignupFormProps) {
  const { user } = useAuth();
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (overlapWarning && !confirmed) {
      setError('Please confirm that you understand the overlap warning');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signupsApi.create({
        activityId: activity.id,
        roleId: role.id,
        attributes,
        comment: comment || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = (key: string, value: string) => {
    setAttributes(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div style={{
      marginTop: '2rem',
      padding: '1.5rem',
      backgroundColor: 'var(--albion-darker)',
      borderRadius: '8px',
      border: '1px solid var(--albion-gold)'
    }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--albion-gold)' }}>
        Sign up for {role.name}
      </h3>

      {overlapWarning && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(212, 175, 55, 0.2)',
          border: '1px solid var(--albion-gold)',
          borderRadius: '4px'
        }}>
          <p style={{ color: 'var(--albion-gold)', marginBottom: '0.5rem' }}>
            {overlapWarning}
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>I understand and confirm</span>
          </label>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {Object.keys(role.attributes).length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Requirements:</strong>
            </p>
            {Object.entries(role.attributes).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                  {key}: {String(value)} (confirm you meet this)
                </label>
                <input
                  type="text"
                  value={attributes[key] || ''}
                  onChange={(e) => handleAttributeChange(key, e.target.value)}
                  placeholder={`Your ${key.toLowerCase()}`}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', minHeight: '80px' }}
            placeholder="Any additional information..."
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
            disabled={loading || (overlapWarning && !confirmed)}
          >
            {loading ? 'Signing up...' : 'Confirm Sign-up'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
