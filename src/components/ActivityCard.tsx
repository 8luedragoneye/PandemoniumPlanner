import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Role, Signup } from '../types';
import { formatDisplayDate, getSignupCount, isRoleFull, isUpcoming, checkOverlap } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { signupsApi } from '../lib/api';
import { transformSignup } from '../lib/transformers';

interface ActivityCardProps {
  activity: Activity;
  roles: Role[];
  signups: Signup[];
}

export function ActivityCard({ activity, roles, signups }: ActivityCardProps) {
  const { user } = useAuth();
  const { activities, signups: allSignups, refetch } = useActivities();
  const isOwner = user?.id === activity.creator;
  const [activityRoles, setActivityRoles] = useState<Role[]>(roles);
  const [activitySignups, setActivitySignups] = useState<Signup[]>(signups);

  // Sync state with props when they change
  useEffect(() => {
    setActivityRoles(roles);
    setActivitySignups(signups);
  }, [roles, signups]);

  const totalSlots = activityRoles.reduce((sum, role) => sum + role.slots, 0);
  const totalSignups = activitySignups.length;
  const isFull = totalSignups >= totalSlots;

  // Check for overlapping activities
  const overlapWarning = (() => {
    if (!activity || !user) return '';
    const userSignups = allSignups.filter(s => s.player === user.id);
    const userActivities = activities.filter(a => 
      userSignups.some(s => s.activity === a.id)
    );
    const overlaps = userActivities.filter(a => 
      a.id !== activity.id && checkOverlap(a, activity)
    );
    if (overlaps.length > 0) {
      return `Warning: You are already signed up for ${overlaps.length} overlapping activity(ies): ${overlaps.map(a => a.name).join(', ')}`;
    }
    return '';
  })();

  const handleRoleClick = async (role: Role) => {
    if (!user) return;
    if (isRoleFull(role.id, role.slots, activitySignups)) {
      alert('This role is full');
      return;
    }
    
    try {
      await signupsApi.create({
        activityId: activity.id,
        roleId: role.id,
        attributes: {},
        comment: undefined,
      });
      handleSignupSuccess();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to sign up');
    }
  };

  const handleSignupSuccess = async () => {
    // Refetch signups for this activity
    try {
      const records = await signupsApi.getByActivity(activity.id);
      setActivitySignups(records.map(transformSignup));
      refetch();
    } catch (error) {
      console.error('Error refetching signups:', error);
      refetch();
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">{activity.name}</h2>
          <p className="text-dim" style={{ marginTop: '0.5rem' }}>
            {formatDisplayDate(activity.date)}
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
      {activity.minEquip && (
        <p className="text-dim" style={{ marginBottom: '0.5rem' }}>
          <strong>Min Equipment:</strong> {activity.minEquip}
        </p>
      )}
      {activity.massupTime && (
        <p className="text-dim" style={{ marginBottom: '1rem' }}>
          <strong>Massup:</strong> {formatDisplayDate(activity.massupTime)}
        </p>
      )}

      {overlapWarning && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(212, 175, 55, 0.2)',
          border: '1px solid var(--albion-gold)',
          borderRadius: '4px',
          color: 'var(--albion-gold)'
        }}>
          {overlapWarning}
        </div>
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
        {activityRoles.length === 0 ? (
          <p className="text-dim" style={{ fontStyle: 'italic' }}>No roles defined yet. {isOwner && 'Add roles to allow sign-ups.'}</p>
        ) : (
          <div>
            {activityRoles.map(role => {
              const roleSignups = activitySignups.filter(s => s.role === role.id);
              const count = roleSignups.length;
              const full = isRoleFull(role.id, role.slots, activitySignups);
              const isOwnSignup = roleSignups.some(s => s.player === user?.id);
              const canJoin = user && !full && !isOwnSignup;
              
              return (
                <div 
                  key={role.id}
                  style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--albion-darker)',
                    borderRadius: '12px',
                    border: full ? '2px solid var(--albion-red)' : '1.5px solid var(--albion-border)',
                    transition: 'all 0.2s',
                    boxShadow: full ? '0 2px 8px rgba(192, 57, 43, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                    <div>
                      <strong style={{ color: full ? 'var(--albion-red)' : 'inherit', fontSize: '1.125rem' }}>
                        {role.name}
                      </strong>
                      <span className="text-dim" style={{ marginLeft: '0.5rem', fontWeight: 600 }}>
                        ({count}/{role.slots})
                      </span>
                    </div>
                    {canJoin && (
                      <button
                        className="btn-primary"
                        onClick={() => handleRoleClick(role)}
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Join
                      </button>
                    )}
                    {isOwnSignup && (
                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          const signup = roleSignups.find(s => s.player === user?.id);
                          if (signup && confirm('Cancel your sign-up?')) {
                            try {
                              await signupsApi.delete(signup.id);
                              handleSignupSuccess();
                            } catch (error) {
                              alert('Failed to cancel sign-up');
                            }
                          }
                        }}
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  
                  {Object.keys(role.attributes).length > 0 && (
                    <div style={{ 
                      marginBottom: '0.75rem', 
                      fontSize: '0.8125rem', 
                      paddingBottom: '0.75rem', 
                      borderBottom: '1px solid var(--albion-border)' 
                    }}>
                      <strong className="text-gold" style={{ fontSize: '0.875rem' }}>Requirements:</strong>
                      {Object.entries(role.attributes).map(([key, value]) => (
                        <span key={key} className="text-dim" style={{ marginLeft: '0.5rem' }}>
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}

                  {roleSignups.length === 0 ? (
                    <p className="text-dim" style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>No sign-ups yet</p>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--albion-text)' }}>
                        Participants:
                      </p>
                      {roleSignups.map(signup => {
                        const isOwn = signup.player === user?.id;
                        return (
                          <div 
                            key={signup.id}
                            style={{
                              padding: '0.5rem',
                              marginBottom: '0.25rem',
                              backgroundColor: 'var(--albion-dark)',
                              borderRadius: '6px',
                              border: isOwn ? '1px solid var(--albion-gold)' : '1px solid transparent',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div className="flex-between">
                              <div>
                                <strong>{signup.expand?.player?.name || 'Unknown'}</strong>
                                {signup.comment && (
                                  <p className="text-dim" style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                                    {signup.comment}
                                  </p>
                                )}
                                {Object.keys(signup.attributes).length > 0 && (
                                  <div style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                                    {Object.entries(signup.attributes).map(([key, value]) => (
                                      <span key={key} className="text-dim" style={{ marginRight: '0.75rem' }}>
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isOwner && !isOwn && (
                                <button
                                  className="btn-danger"
                                  onClick={async () => {
                                    if (confirm('Remove this sign-up?')) {
                                      try {
                                        await signupsApi.delete(signup.id);
                                        handleSignupSuccess();
                                      } catch (error) {
                                        alert('Failed to remove sign-up');
                                      }
                                    }
                                  }}
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
          {isOwner && (
            <Link 
              to={`/activity/${activity.id}/edit`} 
              className="btn-primary"
            >
              Edit Activity
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
