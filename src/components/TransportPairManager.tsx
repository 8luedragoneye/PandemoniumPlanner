import { useState, useEffect } from 'react';
import { Signup, TransportPair, TransportSignupAttributes } from '../types';
import { pairsApi } from '../lib/api';
import { transformPair } from '../lib/transformers';

interface TransportPairManagerProps {
  activityId: string;
  signups: Signup[];
  onUpdate?: () => void;
}

export function TransportPairManager({ activityId, signups, onUpdate }: TransportPairManagerProps) {
  const [pairs, setPairs] = useState<TransportPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [selectedTransporter, setSelectedTransporter] = useState<string | null>(null);

  useEffect(() => {
    loadPairs();
  }, [activityId]);

  const loadPairs = async () => {
    try {
      setLoading(true);
      const apiPairs = await pairsApi.getByActivity(activityId);
      setPairs(apiPairs.map(transformPair));
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load pairs');
    } finally {
      setLoading(false);
    }
  };

  const getTransportAttributes = (signup: Signup): TransportSignupAttributes | null => {
    if (signup.attributes && typeof signup.attributes === 'object') {
      const attrs = signup.attributes as any;
      if (attrs.role === 'Fighter' || attrs.role === 'Transporter') {
        return attrs as TransportSignupAttributes;
      }
    }
    return null;
  };

  const getPairedSignupIds = (): Set<string> => {
    const paired = new Set<string>();
    pairs.forEach(pair => {
      paired.add(pair.fighter);
      paired.add(pair.transporter);
    });
    return paired;
  };

  const fighters = signups.filter(s => {
    const attrs = getTransportAttributes(s);
    return attrs?.role === 'Fighter';
  });

  const transporters = signups.filter(s => {
    const attrs = getTransportAttributes(s);
    return attrs?.role === 'Transporter';
  });

  const pairedIds = getPairedSignupIds();
  const unpairedFighters = fighters.filter(s => !pairedIds.has(s.id));
  const unpairedTransporters = transporters.filter(s => !pairedIds.has(s.id));

  const handleCreatePair = async () => {
    if (!selectedFighter || !selectedTransporter) {
      setError('Please select both a fighter and a transporter');
      return;
    }

    try {
      setError('');
      await pairsApi.create({
        activityId,
        fighterId: selectedFighter,
        transporterId: selectedTransporter,
      });
      setSelectedFighter(null);
      setSelectedTransporter(null);
      await loadPairs();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create pair');
    }
  };

  const handleDeletePair = async (pairId: string) => {
    if (!confirm('Unpair these participants?')) return;

    try {
      setError('');
      await pairsApi.delete(pairId);
      await loadPairs();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete pair');
    }
  };

  const getSignupPair = (signupId: string): TransportPair | null => {
    return pairs.find(p => p.fighter === signupId || p.transporter === signupId) || null;
  };

  const getPreferredPartnerMatch = (signup: Signup): Signup | null => {
    const attrs = getTransportAttributes(signup);
    if (!attrs?.preferredPartner) return null;

    const otherSignups = attrs.role === 'Fighter' ? transporters : fighters;
    return otherSignups.find(s => {
      const otherAttrs = getTransportAttributes(s);
      const playerName = s.expand?.player?.name || '';
      return otherAttrs?.preferredPartner?.includes(playerName) || 
             playerName.includes(attrs.preferredPartner) ||
             attrs.preferredPartner.includes(playerName);
    }) || null;
  };

  if (loading) {
    return <div className="text-dim">Loading pairs...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ 
        marginBottom: '1.5rem', 
        color: 'var(--albion-gold)',
        fontSize: '1.5rem',
        fontWeight: 600
      }}>
        Transport Pairs
      </h2>

      {error && (
        <div style={{ 
          color: 'var(--albion-red)', 
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(192, 57, 43, 0.15)',
          borderRadius: '12px',
          border: '1px solid rgba(192, 57, 43, 0.3)',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {/* Existing Pairs */}
      {pairs.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            marginBottom: '1rem',
            color: 'var(--albion-gold)',
            fontSize: '1.125rem'
          }}>
            Paired ({pairs.length})
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pairs.map(pair => {
              const fighter = signups.find(s => s.id === pair.fighter);
              const transporter = signups.find(s => s.id === pair.transporter);
              const fighterAttrs = fighter ? getTransportAttributes(fighter) : null;
              const transporterAttrs = transporter ? getTransportAttributes(transporter) : null;

              return (
                <div
                  key={pair.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--albion-darker)',
                    borderRadius: '8px',
                    border: '1px solid var(--albion-gold)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong className="text-gold">Fighter:</strong>
                    <div>{fighter?.expand?.player?.name || 'Unknown'}</div>
                    {fighterAttrs?.weaponType && (
                      <div className="text-dim" style={{ fontSize: '0.875rem' }}>
                        {fighterAttrs.weaponType}
                      </div>
                    )}
                  </div>
                  <div>
                    <strong className="text-gold">Transporter:</strong>
                    <div>{transporter?.expand?.player?.name || 'Unknown'}</div>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeletePair(pair.id)}
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Unpair
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create New Pair */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          marginBottom: '1rem',
          color: 'var(--albion-gold)',
          fontSize: '1.125rem'
        }}>
          Create Pair
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              Fighter
            </label>
            <select
              value={selectedFighter || ''}
              onChange={(e) => setSelectedFighter(e.target.value || null)}
              style={{ width: '100%' }}
            >
              <option value="">Select Fighter...</option>
              {unpairedFighters.map(signup => {
                const attrs = getTransportAttributes(signup);
                const preferred = getPreferredPartnerMatch(signup);
                return (
                  <option key={signup.id} value={signup.id}>
                    {signup.expand?.player?.name || 'Unknown'}
                    {attrs?.weaponType && ` (${attrs.weaponType})`}
                    {preferred && ' ⭐'}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              Transporter
            </label>
            <select
              value={selectedTransporter || ''}
              onChange={(e) => setSelectedTransporter(e.target.value || null)}
              style={{ width: '100%' }}
            >
              <option value="">Select Transporter...</option>
              {unpairedTransporters.map(signup => {
                const preferred = getPreferredPartnerMatch(signup);
                return (
                  <option key={signup.id} value={signup.id}>
                    {signup.expand?.player?.name || 'Unknown'}
                    {preferred && ' ⭐'}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleCreatePair}
          disabled={!selectedFighter || !selectedTransporter}
        >
          Create Pair
        </button>
      </div>

      {/* Unpaired Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ 
            marginBottom: '1rem',
            color: 'var(--albion-gold)',
            fontSize: '1.125rem'
          }}>
            Unpaired Fighters ({unpairedFighters.length})
          </h3>
          {unpairedFighters.length === 0 ? (
            <p className="text-dim">All fighters are paired</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {unpairedFighters.map(signup => {
                const attrs = getTransportAttributes(signup);
                const preferred = getPreferredPartnerMatch(signup);
                const isSelected = selectedFighter === signup.id;
                return (
                  <div
                    key={signup.id}
                    onClick={() => setSelectedFighter(isSelected ? null : signup.id)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: isSelected ? 'var(--albion-gold)' : 'var(--albion-darker)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: preferred ? '1px solid var(--albion-gold)' : '1px solid var(--albion-border)'
                    }}
                  >
                    <div style={{ fontWeight: isSelected ? 600 : 400 }}>
                      {signup.expand?.player?.name || 'Unknown'}
                      {preferred && ' ⭐ Preferred match'}
                    </div>
                    {attrs?.weaponType && (
                      <div className="text-dim" style={{ fontSize: '0.875rem' }}>
                        {attrs.weaponType}
                      </div>
                    )}
                    {attrs?.preferredPartner && (
                      <div className="text-dim" style={{ fontSize: '0.75rem' }}>
                        Prefers: {attrs.preferredPartner}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ 
            marginBottom: '1rem',
            color: 'var(--albion-gold)',
            fontSize: '1.125rem'
          }}>
            Unpaired Transporters ({unpairedTransporters.length})
          </h3>
          {unpairedTransporters.length === 0 ? (
            <p className="text-dim">All transporters are paired</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {unpairedTransporters.map(signup => {
                const preferred = getPreferredPartnerMatch(signup);
                const isSelected = selectedTransporter === signup.id;
                return (
                  <div
                    key={signup.id}
                    onClick={() => setSelectedTransporter(isSelected ? null : signup.id)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: isSelected ? 'var(--albion-gold)' : 'var(--albion-darker)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: preferred ? '1px solid var(--albion-gold)' : '1px solid var(--albion-border)'
                    }}
                  >
                    <div style={{ fontWeight: isSelected ? 600 : 400 }}>
                      {signup.expand?.player?.name || 'Unknown'}
                      {preferred && ' ⭐ Preferred match'}
                    </div>
                    {signup.attributes && typeof signup.attributes === 'object' && (signup.attributes as any).preferredPartner && (
                      <div className="text-dim" style={{ fontSize: '0.75rem' }}>
                        Prefers: {(signup.attributes as any).preferredPartner}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
