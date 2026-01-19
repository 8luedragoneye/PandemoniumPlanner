import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Role, TransportSignupAttributes } from '../types';
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
  const isTransport = activity.type === 'transport';
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Transport-specific state
  const [origin, setOrigin] = useState('');
  const [goal, setGoal] = useState('');
  const [slots, setSlots] = useState('');
  const [gewicht, setGewicht] = useState('');
  const [preferredPartner, setPreferredPartner] = useState('');
  
  // Carleon transport state (second set of fields)
  const [transportFromCarleon, setTransportFromCarleon] = useState(false);
  const [carleonOrigin, setCarleonOrigin] = useState('');
  const [carleonGoal, setCarleonGoal] = useState('');
  const [carleonSlots, setCarleonSlots] = useState('');
  const [carleonGewicht, setCarleonGewicht] = useState('');

  // Determine role type from the role name
  const transportRole = isTransport ? (role.name === 'Fighter' ? 'Fighter' : 'Transporter') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      let finalAttributes = { ...attributes };
      
      if (isTransport) {
        // Validate required fields
        if (!origin.trim()) {
          setError('Origin is required');
          setLoading(false);
          return;
        }
        if (!goal.trim()) {
          setError('Goal is required');
          setLoading(false);
          return;
        }

        // Validate Carleon transport fields if checked
        if (transportFromCarleon) {
          if (!carleonOrigin.trim()) {
            setError('Carleon Origin is required');
            setLoading(false);
            return;
          }
          if (!carleonGoal.trim()) {
            setError('Carleon Goal is required');
            setLoading(false);
            return;
          }
        }

        // Build transport attributes - role is determined by the role name
        finalAttributes = {
          role: transportRole!,
          source: origin,
          target: goal,
          ...(slots && { slots: parseInt(slots) || 0 }),
          ...(gewicht && { gewicht: parseInt(gewicht) || 0 }),
          ...(preferredPartner && { preferredPartner }),
          ...(transportFromCarleon && {
            carleonTransport: {
              source: carleonOrigin,
              target: carleonGoal,
              ...(carleonSlots && { slots: parseInt(carleonSlots) || 0 }),
              ...(carleonGewicht && { gewicht: parseInt(carleonGewicht) || 0 }),
            },
          }),
        };
      }

      await signupsApi.create({
        activityId: activity.id,
        roleId: role.id,
        attributes: finalAttributes,
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
        {isTransport ? (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--albion-text)',
                fontSize: '0.9375rem'
              }}>
                Origin <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <textarea
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g., Gildeninsel Unchained, Tab Blackmarket"
                style={{ width: '100%', minHeight: '80px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--albion-text)',
                fontSize: '0.9375rem'
              }}>
                Goal <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Insel WallyWaddles, zentrales Haus, Kisten an der NW Wand"
                style={{ width: '100%', minHeight: '80px' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: 'var(--albion-text)',
                  fontSize: '0.9375rem'
                }}>
                  Slots
                </label>
                <input
                  type="number"
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%' }}
                  min="0"
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: 'var(--albion-text)',
                  fontSize: '0.9375rem'
                }}>
                  Gewicht (t)
                </label>
                <input
                  type="number"
                  value={gewicht}
                  onChange={(e) => setGewicht(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%' }}
                  min="0"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                color: 'var(--albion-text)',
                fontSize: '0.9375rem',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={transportFromCarleon}
                  onChange={(e) => setTransportFromCarleon(e.target.checked)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                />
                Transport from Carleon
              </label>
            </div>

            {transportFromCarleon && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    color: 'var(--albion-text)',
                    fontSize: '0.9375rem'
                  }}>
                    Origin <span style={{ color: 'var(--albion-red)' }}>*</span>
                  </label>
                  <textarea
                    value={carleonOrigin}
                    onChange={(e) => setCarleonOrigin(e.target.value)}
                    placeholder="e.g., Gildeninsel Unchained, Tab Blackmarket"
                    style={{ width: '100%', minHeight: '80px' }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    color: 'var(--albion-text)',
                    fontSize: '0.9375rem'
                  }}>
                    Goal <span style={{ color: 'var(--albion-red)' }}>*</span>
                  </label>
                  <textarea
                    value={carleonGoal}
                    onChange={(e) => setCarleonGoal(e.target.value)}
                    placeholder="e.g., Insel WallyWaddles, zentrales Haus, Kisten an der NW Wand"
                    style={{ width: '100%', minHeight: '80px' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: 'var(--albion-text)',
                      fontSize: '0.9375rem'
                    }}>
                      Slots
                    </label>
                    <input
                      type="number"
                      value={carleonSlots}
                      onChange={(e) => setCarleonSlots(e.target.value)}
                      placeholder="0"
                      style={{ width: '100%' }}
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: 'var(--albion-text)',
                      fontSize: '0.9375rem'
                    }}>
                      Gewicht (t)
                    </label>
                    <input
                      type="number"
                      value={carleonGewicht}
                      onChange={(e) => setCarleonGewicht(e.target.value)}
                      placeholder="0"
                      style={{ width: '100%' }}
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--albion-text)',
                fontSize: '0.9375rem'
              }}>
                Preferred Partner <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={preferredPartner}
                onChange={(e) => setPreferredPartner(e.target.value)}
                placeholder="Ingame Name"
                style={{ width: '100%' }}
              />
            </div>
          </>
        ) : (
          Object.keys(role.attributes).length > 0 && (
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
          )
        )}

        {!isTransport && (
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
        )}

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
