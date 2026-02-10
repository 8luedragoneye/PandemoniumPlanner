import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Signup, TransportPair, TransportSignupAttributes, FillAssignment } from '../types';
import { pairsApi, fillAssignmentsApi } from '../lib/api';
import { transformPair, transformFillAssignment } from '../lib/transformers';
import { getTransportAttributes, getFighters, getTransporters } from '../lib/utils';

interface TransportPairManagerProps {
  activityId: string;
  signups: Signup[];
  onUpdate?: () => void;
}

export function TransportPairManager({ activityId, signups, onUpdate }: TransportPairManagerProps): JSX.Element {
  const { t } = useTranslation();
  const [pairs, setPairs] = useState<TransportPair[]>([]);
  const [fillAssignments, setFillAssignments] = useState<FillAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [selectedTransporter, setSelectedTransporter] = useState<string | null>(null);
  const [hasAutoPairedPreferred, setHasAutoPairedPreferred] = useState(false);

  useEffect(() => {
    loadPairs();
    loadFillAssignments();
  }, [activityId]);

  // Auto-pair preferred matches after pairs are loaded
  useEffect(() => {
    if (!loading && !hasAutoPairedPreferred && signups.length > 0) {
      autoPairPreferredMatches();
    }
  }, [loading, hasAutoPairedPreferred, signups.length]);

  const loadPairs = async () => {
    try {
      setLoading(true);
      const apiPairs = await pairsApi.getByActivity(activityId);
      setPairs(apiPairs.map(transformPair));
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('transport.failedToLoadPairs'));
    } finally {
      setLoading(false);
    }
  };

  const loadFillAssignments = async () => {
    try {
      const apiAssignments = await fillAssignmentsApi.getByActivity(activityId);
      setFillAssignments(apiAssignments.map(transformFillAssignment));
    } catch (err: unknown) {
      // Silently fail - fill assignments are optional
      console.error('Failed to load fill assignments:', err);
    }
  };

  const getPairedSignupIds = (): Set<string> => {
    const paired = new Set<string>();
    pairs.forEach(pair => {
      paired.add(pair.fighter);
      paired.add(pair.transporter);
    });
    return paired;
  };

  const fighters = getFighters(signups);
  const transporters = getTransporters(signups);

  const pairedIds = getPairedSignupIds();
  const unpairedFighters = fighters.filter(s => !pairedIds.has(s.id));
  const unpairedTransporters = transporters.filter(s => !pairedIds.has(s.id));

  const handleCreatePair = async () => {
    if (!selectedFighter || !selectedTransporter) {
      setError(t('transport.selectBoth'));
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
      await loadFillAssignments();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('transport.failedToCreatePair'));
    }
  };

  const handleDeletePair = async (pairId: string) => {
    if (!confirm(t('transport.confirmUnpair'))) return;

    try {
      setError('');
      await pairsApi.delete(pairId);
      await loadPairs();
      await loadFillAssignments();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('transport.failedToDeletePair'));
    }
  };

  const getFillAssignmentsForPair = (pairId: string): { slots?: FillAssignment; weight?: FillAssignment } => {
    const slots = fillAssignments.find(a => a.pair === pairId && a.fillType === 'slots');
    const weight = fillAssignments.find(a => a.pair === pairId && a.fillType === 'weight');
    return { slots, weight };
  };

  const getPreferredPartnerMatch = (signup: Signup, excludePaired: boolean = false): Signup | null => {
    const attrs = getTransportAttributes(signup);
    if (!attrs?.preferredPartner) return null;

    const pairedIds = excludePaired ? getPairedSignupIds() : new Set<string>();
    const otherSignups = (attrs.role === 'Fighter' ? transporters : fighters)
      .filter(s => !excludePaired || !pairedIds.has(s.id));
    
    return otherSignups.find(s => {
      const otherAttrs = getTransportAttributes(s);
      const playerName = s.expand?.player?.name || '';
      return otherAttrs?.preferredPartner?.includes(playerName) || 
             playerName.includes(attrs.preferredPartner!) ||
             attrs.preferredPartner!.includes(playerName);
    }) || null;
  };

  const autoPairPreferredMatches = async () => {
    if (hasAutoPairedPreferred) return;
    
    setHasAutoPairedPreferred(true); // Set immediately to prevent multiple runs
    
    const pairedIds = getPairedSignupIds();
    const unpairedFightersList = fighters.filter(s => !pairedIds.has(s.id));
    
    const pairsToCreate: Array<{ fighterId: string; transporterId: string }> = [];
    const usedSignups = new Set<string>();

    // Find all preferred matches (only check unpaired fighters)
    for (const fighter of unpairedFightersList) {
      if (usedSignups.has(fighter.id)) continue;
      
      const match = getPreferredPartnerMatch(fighter, true); // Exclude already paired
      if (match && !usedSignups.has(match.id) && !pairedIds.has(match.id)) {
        // Verify it's a mutual preference (check if transporter also prefers this fighter)
        const transporterAttrs = getTransportAttributes(match);
        const fighterName = fighter.expand?.player?.name || '';
        const transporterPrefers = transporterAttrs?.preferredPartner && (
          transporterAttrs.preferredPartner.includes(fighterName) ||
          fighterName.toLowerCase().includes(transporterAttrs.preferredPartner.toLowerCase()) ||
          transporterAttrs.preferredPartner.toLowerCase().includes(fighterName.toLowerCase())
        );
        
        // Also check if fighter's preferred partner matches transporter's name
        const fighterAttrs = getTransportAttributes(fighter);
        const transporterName = match.expand?.player?.name || '';
        const fighterPrefers = fighterAttrs?.preferredPartner && (
          fighterAttrs.preferredPartner.includes(transporterName) ||
          transporterName.toLowerCase().includes(fighterAttrs.preferredPartner.toLowerCase()) ||
          fighterAttrs.preferredPartner.toLowerCase().includes(transporterName.toLowerCase())
        );
        
        // Pair if either has a preference match
        if (transporterPrefers || fighterPrefers) {
          pairsToCreate.push({ fighterId: fighter.id, transporterId: match.id });
          usedSignups.add(fighter.id);
          usedSignups.add(match.id);
        }
      }
    }

    // Create pairs for preferred matches
    if (pairsToCreate.length > 0) {
      try {
        setError('');
        for (const pair of pairsToCreate) {
          await pairsApi.create({
            activityId,
            fighterId: pair.fighterId,
            transporterId: pair.transporterId,
          });
        }
        await loadPairs();
        await loadFillAssignments();
        if (onUpdate) onUpdate();
      } catch (err: unknown) {
        console.error('Failed to auto-pair preferred matches:', err);
        // Don't show error to user, just log it
      }
    }
  };

  if (loading) {
    return <div className="text-dim">{t('transport.loadingPairs')}</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
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
            {t('transport.paired', { count: pairs.length })}
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pairs.map(pair => {
              const fighter = signups.find(s => s.id === pair.fighter);
              const transporter = signups.find(s => s.id === pair.transporter);
              const fighterAttrs = fighter ? getTransportAttributes(fighter) : null;

              const fills = getFillAssignmentsForPair(pair.id);
              
              return (
                <div
                  key={pair.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--albion-darker)',
                    borderRadius: '8px',
                    border: '1px solid var(--albion-gold)'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong className="text-gold">{t('transport.fighterLabel')}</strong>
                      <div>{fighter?.expand?.player?.name || t('common.unknown')}</div>
                      {fighterAttrs?.weaponType && (
                        <div className="text-dim" style={{ fontSize: '0.875rem' }}>
                          {fighterAttrs.weaponType}
                        </div>
                      )}
                    </div>
                    <div>
                      <strong className="text-gold">{t('transport.transporterLabel')}</strong>
                      <div>{transporter?.expand?.player?.name || t('common.unknown')}</div>
                    </div>
                    <div>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeletePair(pair.id)}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        {t('transport.unpair')}
                      </button>
                    </div>
                  </div>
                  {(fills.slots || fills.weight) && (
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--albion-border)',
                      fontSize: '0.875rem'
                    }}>
                      <strong style={{ color: 'var(--albion-gold)' }}>{t('transport.fillAssignmentsLabel')}</strong>
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {fills.slots && (
                          <div style={{
                            padding: '0.5rem',
                            backgroundColor: 'var(--albion-dark)',
                            borderRadius: '4px'
                          }}>
                            <span style={{ fontWeight: 600, color: 'var(--albion-gold)' }}>{t('signups.slotsLabel')}</span>{' '}
                            {fills.slots.expand?.provider?.user?.name || t('common.unknown')}
                          </div>
                        )}
                        {fills.weight && (
                          <div style={{
                            padding: '0.5rem',
                            backgroundColor: 'var(--albion-dark)',
                            borderRadius: '4px'
                          }}>
                            <span style={{ fontWeight: 600, color: 'var(--albion-gold)' }}>{t('signups.weightLabelColon')}</span>{' '}
                            {fills.weight.expand?.provider?.user?.name || t('common.unknown')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
          {t('transport.createPair')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              {t('transport.fighter')}
            </label>
            <select
              value={selectedFighter || ''}
              onChange={(e) => setSelectedFighter(e.target.value || null)}
              style={{ width: '100%' }}
            >
              <option value="">{t('transport.selectFighter')}</option>
              {unpairedFighters.map(signup => {
                const attrs = getTransportAttributes(signup);
                const preferred = getPreferredPartnerMatch(signup);
                return (
                  <option key={signup.id} value={signup.id}>
                    {signup.expand?.player?.name || t('common.unknown')}
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
              {t('transport.transporter')}
            </label>
            <select
              value={selectedTransporter || ''}
              onChange={(e) => setSelectedTransporter(e.target.value || null)}
              style={{ width: '100%' }}
            >
              <option value="">{t('transport.selectTransporter')}</option>
              {unpairedTransporters.map(signup => {
                const preferred = getPreferredPartnerMatch(signup);
                return (
                  <option key={signup.id} value={signup.id}>
                    {signup.expand?.player?.name || t('common.unknown')}
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
          {t('transport.createPairBtn')}
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
            {t('transport.unpairedFighters', { count: unpairedFighters.length })}
          </h3>
          {unpairedFighters.length === 0 ? (
            <p className="text-dim">{t('transport.allFightersPaired')}</p>
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
                        {t('transport.prefers', { name: attrs.preferredPartner })}
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
            {t('transport.unpairedTransporters', { count: unpairedTransporters.length })}
          </h3>
          {unpairedTransporters.length === 0 ? (
            <p className="text-dim">{t('transport.allTransportersPaired')}</p>
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
                      {signup.expand?.player?.name || t('common.unknown')}
                      {preferred && ` ⭐ ${t('transport.preferredMatch')}`}
                    </div>
                    {signup.attributes && typeof signup.attributes === 'object' && (signup.attributes as unknown as TransportSignupAttributes).preferredPartner && (
                      <div className="text-dim" style={{ fontSize: '0.75rem' }}>
                        {t('transport.prefers', { name: (signup.attributes as unknown as TransportSignupAttributes).preferredPartner })}
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
