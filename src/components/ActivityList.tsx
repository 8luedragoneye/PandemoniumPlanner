import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../contexts/AuthContext';
import { isPast, isUpcoming } from '../lib/utils';
import { ActivityCard } from './ActivityCard';
import { FilterButtons } from './FilterButtons';
import { ACTIVITY_TYPE_CATEGORIES, META_TAGS } from '../lib/constants';

type FilterType = 'all' | 'my-activities' | 'signed-up' | 'upcoming' | 'past';

const FILTER_OPTIONS = [
  { value: 'all', label: 'filters.all' },
  { value: 'my-activities', label: 'filters.myActivities' },
  { value: 'signed-up', label: 'filters.signedUp' },
  { value: 'upcoming', label: 'filters.upcoming' },
  { value: 'past', label: 'filters.past' },
] as const;

export function ActivityList(): JSX.Element {
  const { t } = useTranslation();
  const { activities, roles, signups, loading } = useActivities();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([]);

  const categoryTranslations: Record<string, string> = {
    'PvE Activities': t('activityTypes.pveActivities'),
    'PvP Activities': t('activityTypes.pvpActivities'),
    'Mixed (PvE & PvP)': t('activityTypes.mixedActivities'),
  };

  const filteredActivities = useMemo(() => {
    if (!user) return [];

    let filtered = [...activities];

    // Apply status/ownership filter
    switch (filter) {
      case 'my-activities':
        filtered = filtered.filter(a => a.creator === user.id);
        break;
      case 'signed-up': {
        const userSignupActivityIds = new Set(
          signups.filter(s => s.player === user.id).map(s => s.activity)
        );
        filtered = filtered.filter(a => userSignupActivityIds.has(a.id));
        break;
      }
      case 'upcoming':
        filtered = filtered.filter(isUpcoming);
        break;
      case 'past':
        filtered = filtered.filter(isPast);
        break;
      default:
        break;
    }

    // Apply activity type filter (if any types are selected)
    if (selectedTypeFilters.length > 0) {
      filtered = filtered.filter(a => {
        const activityTypes = a.activityTypes || [];
        // Show if activity has at least one of the selected types
        return selectedTypeFilters.some(type => activityTypes.includes(type));
      });
    }

    return filtered.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [activities, signups, user, filter, selectedTypeFilters]);

  const handleTypeFilterToggle = (type: string) => {
    if (selectedTypeFilters.includes(type)) {
      setSelectedTypeFilters(selectedTypeFilters.filter(t => t !== type));
    } else {
      setSelectedTypeFilters([...selectedTypeFilters, type]);
    }
  };

  const clearTypeFilters = () => {
    setSelectedTypeFilters([]);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '4rem 2rem', 
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner" style={{ 
          width: '2rem', 
          height: '2rem',
          borderWidth: '3px',
          color: 'var(--albion-gold)'
        }}></div>
        <p className="text-dim" style={{ fontSize: '1.125rem' }}>{t('activities.loadingActivities')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Left Sidebar - Activity Type Filters */}
      <div style={{ 
        width: '240px', 
        flexShrink: 0,
        position: 'sticky',
        top: '2rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ 
            marginBottom: '0.75rem',
            color: 'var(--albion-gold)',
            fontSize: '1rem',
            fontWeight: 600
          }}>
            {t('activities.filterByType')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--albion-text-dim)', marginBottom: '1rem' }}>
            {t('activities.filterByTypeDesc')}
          </p>
          
          {/* Meta tags (PvE/PvP) filter */}
          <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--albion-border)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {META_TAGS.map((tag) => (
                <label
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.4rem 0.75rem',
                    backgroundColor: selectedTypeFilters.includes(tag) 
                      ? (tag === 'PvE' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)') 
                      : 'var(--albion-darker)',
                    border: selectedTypeFilters.includes(tag) 
                      ? `1px solid ${tag === 'PvE' ? '#2ecc71' : '#e74c3c'}` 
                      : '1px solid var(--albion-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontSize: '0.8125rem',
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypeFilters.includes(tag)}
                    onChange={() => handleTypeFilterToggle(tag)}
                    style={{ width: '0.8rem', height: '0.8rem', cursor: 'pointer' }}
                  />
                  <span style={{ 
                    color: selectedTypeFilters.includes(tag) 
                      ? (tag === 'PvE' ? '#2ecc71' : '#e74c3c') 
                      : 'var(--albion-text)',
                    fontWeight: 600
                  }}>
                    {t(`activityTypes.${tag}`) || tag}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {Object.entries(ACTIVITY_TYPE_CATEGORIES).map(([category, types]) => (
              <div key={category}>
                <h4 style={{ 
                  fontSize: '0.7rem', 
                  color: category.includes('PvE') && !category.includes('PvP') ? '#2ecc71' : category.includes('PvP') && !category.includes('PvE') ? '#e74c3c' : 'var(--albion-gold)',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {categoryTranslations[category] || category}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {types.map((type) => (
                    <label
                      key={type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.5rem',
                        backgroundColor: selectedTypeFilters.includes(type) ? 'rgba(212, 175, 55, 0.15)' : 'var(--albion-darker)',
                        border: selectedTypeFilters.includes(type) ? '1px solid var(--albion-gold)' : '1px solid var(--albion-border)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontSize: '0.75rem'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypeFilters.includes(type)}
                        onChange={() => handleTypeFilterToggle(type)}
                        style={{ width: '0.75rem', height: '0.75rem', cursor: 'pointer' }}
                      />
                      <span style={{ color: selectedTypeFilters.includes(type) ? 'var(--albion-gold)' : 'var(--albion-text)' }}>
                        {t(`activityTypes.${type}`) || type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {selectedTypeFilters.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--albion-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--albion-text-dim)' }}>
                  {t('activities.selected', { count: selectedTypeFilters.length })}
                </span>
                <button
                  onClick={clearTypeFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--albion-text-dim)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textDecoration: 'underline'
                  }}
                >
                  {t('activities.clearAll')}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {selectedTypeFilters.map(type => (
                  <span
                    key={type}
                    style={{
                      padding: '0.2rem 0.4rem',
                      backgroundColor: type === 'PvE' ? 'rgba(46, 204, 113, 0.3)' : type === 'PvP' ? 'rgba(231, 76, 60, 0.3)' : 'var(--albion-gold)',
                      color: type === 'PvE' ? '#2ecc71' : type === 'PvP' ? '#e74c3c' : 'var(--albion-darker)',
                      borderRadius: '8px',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {t(`activityTypes.${type}`) || type}
                    <button
                      onClick={() => handleTypeFilterToggle(type)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: type === 'PvE' ? '#2ecc71' : type === 'PvP' ? '#e74c3c' : 'var(--albion-darker)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.75rem',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex-between" style={{ marginBottom: '2.5rem', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              color: 'var(--albion-gold)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, var(--albion-gold) 0%, var(--albion-gold-light) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {t('activities.guildActivities')}
            </h1>
            <p className="text-dim" style={{ fontSize: '1rem' }}>
              {t('activities.manageAndJoin')}
            </p>
          </div>
          <Link to="/create" className="btn-primary" style={{ marginTop: '0.5rem' }}>
            {t('activities.createActivity')}
          </Link>
        </div>

        <FilterButtons
          currentFilter={filter}
          filters={FILTER_OPTIONS.map(f => ({ value: f.value, label: t(f.label) }))}
          onFilterChange={(value) => setFilter(value as FilterType)}
        />

        {filteredActivities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p className="text-dim" style={{ fontSize: '1.125rem' }}>{t('activities.noActivities')}</p>
          </div>
        ) : (
          <div>
            {filteredActivities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                roles={roles.filter(r => r.activity === activity.id)}
                signups={signups.filter(s => s.activity === activity.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
