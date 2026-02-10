import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Signup, TransportPair } from '../types';
import { pairsApi } from '../lib/api';
import { transformPair } from '../lib/transformers';
import { getFighters, getTransporters } from '../lib/utils';

interface AutoPairButtonProps {
  activityId: string;
  signups: Signup[];
  onUpdate?: () => void;
  compact?: boolean;
}

export function AutoPairButton({ activityId, signups, onUpdate, compact = false }: AutoPairButtonProps): JSX.Element | null {
  const { t } = useTranslation();
  const [pairs, setPairs] = useState<TransportPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPairing, setAutoPairing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPairs();
  }, [activityId, signups.length]);

  const loadPairs = async () => {
    try {
      setLoading(true);
      const apiPairs = await pairsApi.getByActivity(activityId);
      setPairs(apiPairs.map(transformPair));
      setError('');
    } catch (err: unknown) {
      console.error('Failed to load pairs:', err);
    } finally {
      setLoading(false);
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

  const handleAutoPair = async () => {
    if (!confirm(t('autoPair.confirmAutoPair'))) {
      return;
    }

    try {
      setAutoPairing(true);
      setError('');
      
      const minCount = Math.min(unpairedFighters.length, unpairedTransporters.length);
      
      if (minCount === 0) {
        setError(t('autoPair.noUnpaired'));
        setAutoPairing(false);
        return;
      }

      // Pair them in order
      for (let i = 0; i < minCount; i++) {
        await pairsApi.create({
          activityId,
          fighterId: unpairedFighters[i].id,
          transporterId: unpairedTransporters[i].id,
        });
      }

      await loadPairs();
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('autoPair.failedToAutoPair'));
    } finally {
      setAutoPairing(false);
    }
  };

  if (loading) {
    return null;
  }

  // Only show button if there are unpaired participants
  if (unpairedFighters.length === 0 || unpairedTransporters.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
        {error && (
          <div style={{ 
            color: 'var(--albion-red)', 
            padding: '0.25rem 0.5rem',
            backgroundColor: 'rgba(192, 57, 43, 0.15)',
            borderRadius: '4px',
            border: '1px solid rgba(192, 57, 43, 0.3)',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap'
          }}>
            {error}
          </div>
        )}
        <button
          className="btn-primary"
          onClick={handleAutoPair}
          disabled={autoPairing}
          style={{ 
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          {autoPairing ? t('autoPair.pairing') : t('autoPair.autoPair')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      {error && (
        <div style={{ 
          color: 'var(--albion-red)', 
          marginBottom: '0.5rem',
          padding: '0.5rem',
          backgroundColor: 'rgba(192, 57, 43, 0.15)',
          borderRadius: '8px',
          border: '1px solid rgba(192, 57, 43, 0.3)',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}
      <button
        className="btn-primary"
        onClick={handleAutoPair}
        disabled={autoPairing}
        style={{ 
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          width: '100%'
        }}
      >
        {autoPairing ? t('autoPair.autoPairingFull') : t('autoPair.autoPairFull')}
      </button>
    </div>
  );
}
