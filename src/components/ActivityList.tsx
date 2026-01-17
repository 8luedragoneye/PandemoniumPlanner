import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from '../types';
import { isPast, isUpcoming } from '../lib/utils';
import { ActivityCard } from './ActivityCard';
import { FilterButtons } from './FilterButtons';

type FilterType = 'all' | 'my-activities' | 'signed-up' | 'upcoming' | 'past';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'my-activities', label: 'My Activities' },
  { value: 'signed-up', label: 'Signed Up' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
] as const;

export function ActivityList() {
  const { activities, roles, signups, loading } = useActivities();
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredActivities = useMemo(() => {
    if (!user) return [];

    let filtered = [...activities];

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

    return filtered.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [activities, signups, user, filter]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--albion-gold)' }}>
          Guild Activities
        </h1>
        <Link to="/create" className="btn-primary">
          Create Activity
        </Link>
      </div>

      <FilterButtons
        currentFilter={filter}
        filters={FILTER_OPTIONS}
        onFilterChange={setFilter}
      />

      {filteredActivities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-dim">No activities found.</p>
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
  );
}
