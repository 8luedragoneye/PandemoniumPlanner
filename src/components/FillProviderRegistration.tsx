import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fillProvidersApi } from '../lib/api';

interface FillProviderRegistrationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FillProviderRegistration({ onSuccess, onCancel }: FillProviderRegistrationProps) {
  const { user } = useAuth();
  const [providesSlots, setProvidesSlots] = useState(false);
  const [providesWeight, setProvidesWeight] = useState(false);
  const [slotOrigin, setSlotOrigin] = useState('');
  const [slotTarget, setSlotTarget] = useState('');
  const [weightOrigin, setWeightOrigin] = useState('');
  const [weightTarget, setWeightTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // Validate at least one fill type selected
      if (!providesSlots && !providesWeight) {
        setError('Please select at least one fill type (slots or weight)');
        setLoading(false);
        return;
      }

      // Validate required fields
      if (providesSlots && (!slotOrigin.trim() || !slotTarget.trim())) {
        setError('Slot origin and target are required when providing slot fill');
        setLoading(false);
        return;
      }

      if (providesWeight && (!weightOrigin.trim() || !weightTarget.trim())) {
        setError('Weight origin and target are required when providing weight fill');
        setLoading(false);
        return;
      }

      await fillProvidersApi.create({
        providesSlots,
        providesWeight,
        slotOrigin: providesSlots ? slotOrigin : undefined,
        slotTarget: providesSlots ? slotTarget : undefined,
        weightOrigin: providesWeight ? weightOrigin : undefined,
        weightTarget: providesWeight ? weightTarget : undefined,
        notes: notes.trim() || undefined,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register as fill provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'var(--albion-darker)',
      borderRadius: '12px',
      border: '1px solid var(--albion-gold)'
    }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--albion-gold)' }}>
        Register as Fill Provider
      </h3>

      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        border: '1px solid var(--albion-gold)',
        borderRadius: '4px',
        fontSize: '0.875rem'
      }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--albion-gold)' }}>
          Requirements:
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--albion-text-dim)' }}>
          <li>Must have participated in at least one transport activity</li>
          <li>Must provide at least 100 slots or 20t per session</li>
          <li>Must manage your own sources and targets</li>
          <li>Slot and weight fills must be in separate sources</li>
        </ul>
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
            Fill Types <span style={{ color: 'var(--albion-red)' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: 'var(--albion-dark)',
              borderRadius: '8px',
              border: providesSlots ? '2px solid var(--albion-gold)' : '1px solid var(--albion-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={providesSlots}
                onChange={(e) => setProvidesSlots(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Provide Slot Fill</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)', marginTop: '0.25rem' }}>
                  Equipment items T6+ (including 4.2 and 5.1)
                </div>
              </div>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: 'var(--albion-dark)',
              borderRadius: '8px',
              border: providesWeight ? '2px solid var(--albion-gold)' : '1px solid var(--albion-border)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={providesWeight}
                onChange={(e) => setProvidesWeight(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Provide Weight Fill</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)', marginTop: '0.25rem' }}>
                  Items with stack size 20+
                </div>
              </div>
            </label>
          </div>
        </div>

        {providesSlots && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--albion-text)',
                fontSize: '0.9375rem'
              }}>
                Slot Fill Origin <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <textarea
                value={slotOrigin}
                onChange={(e) => setSlotOrigin(e.target.value)}
                placeholder="e.g., Gildeninsel Unchained, Tab Equipment"
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
                Slot Fill Target <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <textarea
                value={slotTarget}
                onChange={(e) => setSlotTarget(e.target.value)}
                placeholder="e.g., Insel WallyWaddles, zentrales Haus, Kisten an der NW Wand"
                style={{ width: '100%', minHeight: '80px' }}
                required
              />
            </div>
          </>
        )}

        {providesWeight && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--albion-text)',
                fontSize: '0.9375rem'
              }}>
                Weight Fill Origin <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <textarea
                value={weightOrigin}
                onChange={(e) => setWeightOrigin(e.target.value)}
                placeholder="e.g., Gildeninsel Unchained, Tab Resources"
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
                Weight Fill Target <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <textarea
                value={weightTarget}
                onChange={(e) => setWeightTarget(e.target.value)}
                placeholder="e.g., Insel WallyWaddles, zentrales Haus, Kisten an der SE Wand"
                style={{ width: '100%', minHeight: '80px' }}
                required
              />
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
            Notes <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information..."
            style={{ width: '100%', minHeight: '80px' }}
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
            {loading ? 'Registering...' : 'Register as Fill Provider'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
