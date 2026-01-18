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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
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
      borderRadius: '12px',
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
          <p style={{ color: 'var(--albion-gold)' }}>
            {overlapWarning}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {Object.keys(role.attributes).length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ 
              marginBottom: '1rem',
              fontWeight: 600,
              color: 'var(--albion-gold)',
              fontSize: '0.9375rem'
            }}>
              Requirements:
            </p>
            {Object.entries(role.attributes).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  fontSize: '0.9375rem'
                }}>
                  {key}: <span className="text-gold">{String(value)}</span> <span className="text-dim">(confirm you meet this)</span>
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.75rem',
            fontWeight: 600,
            color: 'var(--albion-text)',
            fontSize: '0.9375rem'
          }}>
            Comment <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', minHeight: '100px' }}
            placeholder="Any additional information..."
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

        <div className="flex" style={{ gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--albion-border)' }}>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
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
