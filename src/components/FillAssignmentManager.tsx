import { useState, useEffect } from 'react';
import { FillProvider, FillAssignment, TransportPair } from '../types';
import { fillProvidersApi, fillAssignmentsApi } from '../lib/api';
import { transformFillProvider, transformFillAssignment } from '../lib/transformers';
import { MAX_FILL_ASSIGNMENTS_PER_PROVIDER } from '../lib/constants';

interface FillAssignmentManagerProps {
  activityId: string;
  pairs: TransportPair[];
  onUpdate?: () => void;
}

export function FillAssignmentManager({ activityId, pairs, onUpdate }: FillAssignmentManagerProps): JSX.Element {
  const [providers, setProviders] = useState<FillProvider[]>([]);
  const [assignments, setAssignments] = useState<FillAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoAssigning, setAutoAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [activityId]);

  useEffect(() => {
    // Reload assignments when pairs change
    if (pairs.length > 0) {
      loadData();
    }
  }, [pairs.length]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apiProviders, apiAssignments] = await Promise.all([
        fillProvidersApi.getAll(),
        fillAssignmentsApi.getByActivity(activityId)
      ]);
      setProviders(apiProviders.map(transformFillProvider));
      setAssignments(apiAssignments.map(transformFillAssignment));
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load fill data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!confirm('Auto-assign fill to all pairs? This will assign providers based on priority.')) {
      return;
    }

    try {
      setAutoAssigning(true);
      setError('');
      await fillAssignmentsApi.autoAssign(activityId);
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to auto-assign fill');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleManualAssign = async (pairId: string, providerId: string, fillType: 'slots' | 'weight') => {
    if (!providerId) return;
    
    try {
      setError('');
      await fillAssignmentsApi.create({
        activityId,
        pairId,
        providerId,
        fillType
      });
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign fill');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this fill assignment?')) {
      return;
    }

    try {
      setError('');
      await fillAssignmentsApi.delete(assignmentId);
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove assignment');
    }
  };

  const getAssignmentForPair = (pairId: string, fillType: 'slots' | 'weight'): FillAssignment | undefined => {
    return assignments.find(a => a.pair === pairId && a.fillType === fillType);
  };

  const getSlotProviders = () => {
    return providers.filter(p => p.isActive && p.providesSlots).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  };

  const getWeightProviders = () => {
    return providers.filter(p => p.isActive && p.providesWeight).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  };

  const getProviderAssignmentCount = (providerId: string, fillType: 'slots' | 'weight'): number => {
    return assignments.filter(a => a.provider === providerId && a.fillType === fillType).length;
  };

  if (loading) {
    return <div className="text-dim">Loading fill assignments...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ color: 'var(--albion-gold)' }}>
          Fill Assignments
        </h3>
        <button
          className="btn-primary"
          onClick={handleAutoAssign}
          disabled={autoAssigning || pairs.length === 0}
          style={{ padding: '0.5rem 1rem' }}
        >
          {autoAssigning ? 'Auto-Assigning...' : 'Auto-Assign Fill'}
        </button>
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

      {pairs.length === 0 ? (
        <p className="text-dim">No pairs found. Create pairs first before assigning fill.</p>
      ) : (
        <div>
          {pairs.map(pair => {
            const slotAssignment = getAssignmentForPair(pair.id, 'slots');
            const weightAssignment = getAssignmentForPair(pair.id, 'weight');
            const fighterName = pair.expand?.fighter?.expand?.player?.name || 'Unknown';
            const transporterName = pair.expand?.transporter?.expand?.player?.name || 'Unknown';

            return (
              <div
                key={pair.id}
                style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: 'var(--albion-darker)',
                  borderRadius: '8px',
                  border: '1px solid var(--albion-border)'
                }}
              >
                <div style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--albion-gold)' }}>
                  Pair: {fighterName} + {transporterName}
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--albion-text)'
                  }}>
                    Fill Provider
                  </label>
                  {slotAssignment ? (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--albion-dark)',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {slotAssignment.expand?.provider?.user?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)' }}>
                          Priority: {slotAssignment.expand?.provider?.priority ?? 0}
                        </div>
                      </div>
                      <button
                        className="btn-danger"
                        onClick={() => handleRemoveAssignment(slotAssignment.id)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleManualAssign(pair.id, e.target.value, 'slots');
                        }
                      }}
                      value=""
                      style={{ width: '100%' }}
                    >
                      <option value="">Select provider...</option>
                      {getSlotProviders().map(provider => {
                        const count = getProviderAssignmentCount(provider.id, 'slots');
                        return (
                          <option 
                            key={provider.id} 
                            value={provider.id}
                            disabled={count >= MAX_FILL_ASSIGNMENTS_PER_PROVIDER}
                          >
                            {provider.user?.name || 'Unknown'} (Priority: {provider.priority ?? 0}){count >= MAX_FILL_ASSIGNMENTS_PER_PROVIDER ? ' - Max assignments' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
