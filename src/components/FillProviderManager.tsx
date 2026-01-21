import { useState, useEffect } from 'react';
import { FillProvider } from '../types';
import { fillProvidersApi } from '../lib/api';
import { transformFillProvider } from '../lib/transformers';

interface FillProviderManagerProps {
  onUpdate?: () => void;
}

export function FillProviderManager({ onUpdate }: FillProviderManagerProps) {
  const [providers, setProviders] = useState<FillProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<FillProvider | null>(null);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [pointsData, setPointsData] = useState({
    points: -1,
    reason: 'problem',
    notes: ''
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const apiProviders = await fillProvidersApi.getAll();
      setProviders(apiProviders.map(transformFillProvider));
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load fill providers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async (providerId: string) => {
    try {
      setError('');
      await fillProvidersApi.addPoints(providerId, {
        points: pointsData.points,
        reason: pointsData.reason,
        notes: pointsData.notes || undefined
      });
      setShowAddPoints(false);
      setSelectedProvider(null);
      setPointsData({ points: -1, reason: 'problem', notes: '' });
      await loadProviders();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add points');
    }
  };

  const handleToggleActive = async (provider: FillProvider) => {
    try {
      setError('');
      await fillProvidersApi.update(provider.id, {
        isActive: !provider.isActive
      });
      await loadProviders();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
    }
  };

  if (loading) {
    return <div className="text-dim">Loading fill providers...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--albion-gold)' }}>
        Fill Providers
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
          Minimum Requirements:
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--albion-text-dim)' }}>
          <li>Slot Fill: Minimum 100 slots per session</li>
          <li>Weight Fill: Minimum 20t per session</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--albion-text-dim)' }}>
          Priority is calculated from points: +1 for participation, -1 for assignment, -1 for problems. Higher priority = assigned first.
        </p>
      </div>

      {/* Priority Summary */}
      {providers.length > 0 && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--albion-darker)',
          borderRadius: '8px',
          border: '1px solid var(--albion-border)'
        }}>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--albion-gold)', fontSize: '1rem' }}>
            Priority Overview
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>Total Providers:</strong>{' '}
              <span style={{ fontWeight: 600 }}>{providers.length}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>Active Providers:</strong>{' '}
              <span style={{ fontWeight: 600, color: 'var(--albion-green)' }}>
                {providers.filter(p => p.isActive).length}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>Highest Priority:</strong>{' '}
              <span style={{ fontWeight: 600, color: 'var(--albion-gold)' }}>
                {Math.max(...providers.map(p => p.priority ?? 0))}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>Lowest Priority:</strong>{' '}
              <span style={{ fontWeight: 600, color: 'var(--albion-red)' }}>
                {Math.min(...providers.map(p => p.priority ?? 0))}
              </span>
            </div>
          </div>
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

      {providers.length === 0 ? (
        <p className="text-dim">No fill providers registered yet.</p>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--albion-text-dim)' }}>
            <strong>Sorted by Priority (Highest First)</strong>
          </div>
          {providers.map(provider => (
            <div 
              key={provider.id}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: 'var(--albion-darker)',
                borderRadius: '8px',
                border: `1px solid ${provider.isActive ? 'var(--albion-border)' : 'rgba(192, 57, 43, 0.5)'}`
              }}
            >
              <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <strong style={{ fontSize: '1rem' }}>
                      {provider.user?.name || 'Unknown'}
                    </strong>
                    {!provider.isActive && (
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: 'rgba(192, 57, 43, 0.2)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--albion-red)'
                      }}>
                        INACTIVE
                      </span>
                    )}
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: provider.priority && provider.priority > 0 
                        ? 'rgba(46, 204, 113, 0.2)' 
                        : provider.priority === 0
                        ? 'rgba(212, 175, 55, 0.2)'
                        : 'rgba(192, 57, 43, 0.2)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      Priority: {provider.priority ?? 0}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedProvider(provider);
                      setShowAddPoints(true);
                    }}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    Add Points
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleToggleActive(provider)}
                    style={{ 
                      padding: '0.375rem 0.75rem', 
                      fontSize: '0.875rem',
                      backgroundColor: provider.isActive ? 'rgba(192, 57, 43, 0.2)' : 'rgba(46, 204, 113, 0.2)'
                    }}
                  >
                    {provider.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--albion-text-dim)' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Provides:</strong>{' '}
                  {provider.providesSlots && <span style={{ marginRight: '0.5rem' }}>Slots</span>}
                  {provider.providesWeight && <span>Weight</span>}
                  {!provider.providesSlots && !provider.providesWeight && <span>None</span>}
                </div>

                {provider.providesSlots && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Slot Fill:</strong>{' '}
                    <span className="text-gold">{provider.slotOrigin}</span> → <span className="text-gold">{provider.slotTarget}</span>
                  </div>
                )}

                {provider.providesWeight && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Weight Fill:</strong>{' '}
                    <span className="text-gold">{provider.weightOrigin}</span> → <span className="text-gold">{provider.weightTarget}</span>
                  </div>
                )}

                {provider.notes && (
                  <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {provider.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddPoints && selectedProvider && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--albion-darker)',
          borderRadius: '12px',
          border: '1px solid var(--albion-gold)'
        }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--albion-gold)' }}>
            Add Points for {selectedProvider.user?.name}
          </h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              Points
            </label>
            <input
              type="number"
              value={pointsData.points}
              onChange={(e) => setPointsData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)', marginTop: '0.25rem' }}>
              Typically -1 for problems, but can be adjusted as needed
            </p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              Reason
            </label>
            <select
              value={pointsData.reason}
              onChange={(e) => setPointsData(prev => ({ ...prev, reason: e.target.value }))}
              style={{ width: '100%' }}
            >
              <option value="problem">Problem (source/target issues)</option>
              <option value="manual">Manual adjustment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              Notes (optional)
            </label>
            <textarea
              value={pointsData.notes}
              onChange={(e) => setPointsData(prev => ({ ...prev, notes: e.target.value }))}
              style={{ width: '100%', minHeight: '60px' }}
              placeholder="Describe the issue or reason for points adjustment..."
            />
          </div>
          <div className="flex" style={{ gap: '1rem' }}>
            <button
              className="btn-primary"
              onClick={() => handleAddPoints(selectedProvider.id)}
            >
              Add Points
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowAddPoints(false);
                setSelectedProvider(null);
                setPointsData({ points: -1, reason: 'problem', notes: '' });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
