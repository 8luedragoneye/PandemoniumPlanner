import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FillProvider } from '../types';
import { fillProvidersApi } from '../lib/api';
import { transformFillProvider } from '../lib/transformers';
import { MIN_FILL_SLOTS } from '../lib/constants';

interface FillProviderManagerProps {
  onUpdate?: () => void;
}

export function FillProviderManager({ onUpdate }: FillProviderManagerProps): JSX.Element {
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('fill.failedToLoadProviders'));
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
      setError(err instanceof Error ? err.message : t('fill.failedToAddPoints'));
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
      setError(err instanceof Error ? err.message : t('fill.failedToUpdateProvider'));
    }
  };

  if (loading) {
    return <div className="text-dim">{t('fill.loadingProviders')}</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--albion-gold)' }}>
        {t('fill.fillProviders')}
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
          {t('fill.minRequirements')}
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--albion-text-dim)' }}>
          <li>{t('fill.slotFillMin', { count: MIN_FILL_SLOTS })}</li>
          <li>{t('fill.weightFillMin')}</li>
        </ul>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--albion-text-dim)' }}>
          {t('fill.priorityCalcExplanation')}
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
            {t('fill.priorityOverview')}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>{t('fill.totalProviders')}</strong>{' '}
              <span style={{ fontWeight: 600 }}>{providers.length}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>{t('fill.activeProviders')}</strong>{' '}
              <span style={{ fontWeight: 600, color: 'var(--albion-green)' }}>
                {providers.filter(p => p.isActive).length}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>{t('fill.highestPriority')}</strong>{' '}
              <span style={{ fontWeight: 600, color: 'var(--albion-gold)' }}>
                {Math.max(...providers.map(p => p.priority ?? 0))}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--albion-text-dim)' }}>{t('fill.lowestPriority')}</strong>{' '}
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
        <p className="text-dim">{t('fill.noProviders')}</p>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--albion-text-dim)' }}>
            <strong>{t('fill.sortedByPriority')}</strong>
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
                      {provider.user?.name || t('common.unknown')}
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
                        {t('common.inactive').toUpperCase()}
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
                      {t('fill.priorityLabel', { priority: provider.priority ?? 0 })}
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
                    {t('fill.addPoints')}
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
                    {provider.isActive ? t('fill.deactivate') : t('fill.activate')}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--albion-text-dim)' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>{t('fill.providesLabel')}</strong>{' '}
                  {provider.providesSlots && <span style={{ marginRight: '0.5rem' }}>{t('common.slots')}</span>}
                  {provider.providesWeight && <span>{t('common.weight')}</span>}
                  {!provider.providesSlots && !provider.providesWeight && <span>{t('common.none')}</span>}
                </div>

                {provider.providesSlots && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>{t('fill.slotFillLabel')}</strong>{' '}
                    <span className="text-gold">{provider.slotOrigin}</span> → <span className="text-gold">{provider.slotTarget}</span>
                  </div>
                )}

                {provider.providesWeight && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>{t('fill.weightFillLabel')}</strong>{' '}
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
            {t('fill.addPointsFor', { name: selectedProvider.user?.name })}
          </h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              {t('common.points')}
            </label>
            <input
              type="number"
              value={pointsData.points}
              onChange={(e) => setPointsData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)', marginTop: '0.25rem' }}>
              {t('fill.pointsHint')}
            </p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              {t('common.reason')}
            </label>
            <select
              value={pointsData.reason}
              onChange={(e) => setPointsData(prev => ({ ...prev, reason: e.target.value }))}
              style={{ width: '100%' }}
            >
              <option value="problem">{t('fill.reasonProblem')}</option>
              <option value="manual">{t('fill.reasonManual')}</option>
              <option value="other">{t('fill.reasonOther')}</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9375rem'
            }}>
              {t('common.notesOptional')}
            </label>
            <textarea
              value={pointsData.notes}
              onChange={(e) => setPointsData(prev => ({ ...prev, notes: e.target.value }))}
              style={{ width: '100%', minHeight: '60px' }}
              placeholder={t('fill.notesPlaceholder')}
            />
          </div>
          <div className="flex" style={{ gap: '1rem' }}>
            <button
              className="btn-primary"
              onClick={() => handleAddPoints(selectedProvider.id)}
            >
              {t('fill.addPoints')}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowAddPoints(false);
                setSelectedProvider(null);
                setPointsData({ points: -1, reason: 'problem', notes: '' });
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
