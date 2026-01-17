import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Signup } from '../types';
import { formatDisplayDate, isPast, isUpcoming } from '../lib/utils';
import { ActivityCard } from './ActivityCard';

type FilterType = 'all' | 'my-activities' | 'signed-up' | 'upcoming' | 'past';

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
      case 'signed-up':
        const userSignupActivityIds = new Set(
          signups.filter(s => s.player === user.id).map(s => s.activity)
        );
        filtered = filtered.filter(a => userSignupActivityIds.has(a.id));
        break;
      case 'upcoming':
        filtered = filtered.filter(isUpcoming);
        break;
      case 'past':
        filtered = filtered.filter(isPast);
        break;
      default:
        // Show all
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

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'my-activities' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setFilter('my-activities')}
        >
          My Activities
        </button>
        <button
          className={filter === 'signed-up' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setFilter('signed-up')}
        >
          Signed Up
        </button>
        <button
          className={filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={filter === 'past' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

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
