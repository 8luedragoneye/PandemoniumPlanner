import { Link } from 'react-router-dom';
import { Activity, Role, Signup } from '../types';
import { formatDisplayDate, getSignupCount, isRoleFull } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface ActivityCardProps {
  activity: Activity;
  roles: Role[];
  signups: Signup[];
}

export function ActivityCard({ activity, roles, signups }: ActivityCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === activity.creator;

  const totalSlots = roles.reduce((sum, role) => sum + role.slots, 0);
  const totalSignups = signups.length;
  const isFull = totalSignups >= totalSlots;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">{activity.name}</h2>
          <p className="text-dim" style={{ marginTop: '0.5rem' }}>
            {formatDisplayDate(activity.date)} (CET)
          </p>
        </div>
        <div>
          <span className={`status-badge status-${activity.status}`}>
            {activity.status}
          </span>
          {isFull && (
            <span className="status-badge status-full" style={{ marginLeft: '0.5rem' }}>
              Full
            </span>
          )}
        </div>
      </div>

      <p style={{ marginBottom: '1rem' }}>{activity.description}</p>

      {activity.zone && (
        <p className="text-dim" style={{ marginBottom: '0.5rem' }}>
          <strong>Zone:</strong> {activity.zone}
        </p>
      )}
      {activity.minIP && (
        <p className="text-dim" style={{ marginBottom: '0.5rem' }}>
          <strong>Min IP:</strong> {activity.minIP}
        </p>
      )}
      {activity.minFame && (
        <p className="text-dim" style={{ marginBottom: '1rem' }}>
          <strong>Min Fame:</strong> {activity.minFame.toLocaleString()}
        </p>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ 
          marginBottom: '1rem', 
          color: 'var(--albion-gold)',
          fontSize: '1.25rem',
          fontWeight: 600
        }}>
          Roles ({totalSignups}/{totalSlots})
        </h3>
        {roles.length === 0 ? (
          <p className="text-dim" style={{ fontStyle: 'italic' }}>No roles defined yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {roles.map(role => {
              const count = getSignupCount(role.id, signups);
              const full = isRoleFull(role.id, role.slots, signups);
              return (
                <div 
                  key={role.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--albion-darker)',
                    borderRadius: '12px',
                    border: full ? '2px solid var(--albion-red)' : '1.5px solid var(--albion-border)',
                    transition: 'all 0.2s',
                    boxShadow: full ? '0 2px 8px rgba(192, 57, 43, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: full ? 'var(--albion-red)' : 'inherit' }}>{role.name}</strong>
                    <span className="text-dim" style={{ fontWeight: 600 }}>
                      {count}/{role.slots}
                    </span>
                  </div>
                  {Object.keys(role.attributes).length > 0 && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', paddingTop: '0.75rem', borderTop: '1px solid var(--albion-border)' }}>
                      {Object.entries(role.attributes).map(([key, value]) => (
                        <div key={key} className="text-dim" style={{ marginBottom: '0.25rem' }}>
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-between" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--albion-border)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/activity/${activity.id}`} className="btn-primary">
            View Details
          </Link>
          {isOwner && (
            <Link 
              to={`/activity/${activity.id}/edit`} 
              className="btn-secondary"
            >
              Edit
            </Link>
          )}
        </div>
        <div className="text-dim" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          Created by {activity.expand?.creator?.name || 'Unknown'}
        </div>
      </div>
    </div>
  );
}
