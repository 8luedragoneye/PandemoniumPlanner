import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { Activity, Role, Signup } from '../types';
import { formatDisplayDate, getSignupCount, isRoleFull, checkOverlap, isUpcoming } from '../lib/utils';
import { RoleManager } from './RoleManager';
import { SignupForm } from './SignupForm';
import { activitiesApi, signupsApi, rolesApi } from '../lib/api';

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities, roles, signups, refetch } = useActivities();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityRoles, setActivityRoles] = useState<Role[]>([]);
  const [activitySignups, setActivitySignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      try {
        const record = await activitiesApi.getOne(id);
        // Transform API response
        const activity: Activity = {
          id: record.id,
          name: record.name,
          date: record.date,
          description: record.description,
          creator: record.creatorId,
          status: record.status,
          zone: record.zone,
          minIP: record.minIP,
          minFame: record.minFame,
          created: record.createdAt,
          updated: record.updatedAt,
          expand: {
            creator: record.creator,
          },
        };
        setActivity(activity);
        
        // Fetch roles and signups for this activity
        try {
          const roleRecords = await rolesApi.getByActivity(id);
          const transformedRoles = roleRecords.map((r: any) => ({
            id: r.id,
            activity: r.activityId,
            name: r.name,
            slots: r.slots,
            attributes: typeof r.attributes === 'string' ? JSON.parse(r.attributes) : r.attributes,
            created: r.createdAt,
            updated: r.updatedAt,
          }));
          setActivityRoles(transformedRoles);
        } catch (error) {
          console.error('Error fetching roles:', error);
        }
        
        try {
          const signupRecords = await signupsApi.getByActivity(id);
          const transformedSignups = signupRecords.map((s: any) => ({
            id: s.id,
            activity: s.activityId,
            role: s.roleId,
            player: s.playerId,
            attributes: typeof s.attributes === 'string' ? JSON.parse(s.attributes) : s.attributes,
            comment: s.comment,
            created: s.createdAt,
            updated: s.updatedAt,
            expand: {
              activity: s.activity,
              role: s.role,
              player: s.player,
            },
          }));
          setActivitySignups(transformedSignups);
        } catch (error) {
          console.error('Error fetching signups:', error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activity:', error);
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  useEffect(() => {
    if (activity && user) {
      // Check for overlapping activities
      const userSignups = signups.filter(s => s.player === user.id);
      const userActivities = activities.filter(a => 
        userSignups.some(s => s.activity === a.id)
      );

      const overlaps = userActivities.filter(a => 
        a.id !== activity.id && checkOverlap(a, activity)
      );

      if (overlaps.length > 0) {
        setOverlapWarning(
          `Warning: You are already signed up for ${overlaps.length} overlapping activity(ies): ${overlaps.map(a => a.name).join(', ')}`
        );
      } else {
        setOverlapWarning('');
      }
    }
  }, [activity, user, signups, activities]);

  const handleDelete = async () => {
    if (!activity || !user || activity.creator !== user.id) return;
    if (!confirm('Are you sure you want to delete this activity? All roles and sign-ups will be deleted.')) return;

    try {
      await activitiesApi.delete(activity.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleRoleClick = (role: Role) => {
    if (isRoleFull(role.id, role.slots, activitySignups)) {
      alert('This role is full');
      return;
    }
    setSelectedRole(role);
    setShowSignupForm(true);
  };

  const handleSignupSuccess = async () => {
    setShowSignupForm(false);
    setSelectedRole(null);
    // Refetch signups for this activity
    try {
      const records = await signupsApi.getByActivity(id!);
      const transformed = records.map((s: any) => ({
        id: s.id,
        activity: s.activityId,
        role: s.roleId,
        player: s.playerId,
        attributes: typeof s.attributes === 'string' ? JSON.parse(s.attributes) : s.attributes,
        comment: s.comment,
        created: s.createdAt,
        updated: s.updatedAt,
        expand: {
          activity: s.activity,
          role: s.role,
          player: s.player,
        },
      }));
      setActivitySignups(transformed);
      refetch(); // Also refetch all data
    } catch (error) {
      console.error('Error refetching signups:', error);
      refetch();
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!activity) {
    return <div style={{ padding: '2rem' }}>Activity not found</div>;
  }

  const isOwner = user?.id === activity.creator;
  const userSignup = activitySignups.find(s => s.player === user?.id);
  const canSignup = isUpcoming(activity) && activity.status === 'recruiting' && !userSignup;

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h1 className="card-title">{activity.name}</h1>
            <p className="text-dim" style={{ marginTop: '0.5rem' }}>
              {formatDisplayDate(activity.date)} (CET)
            </p>
          </div>
          <div>
            <span className={`status-badge status-${activity.status}`}>
              {activity.status}
            </span>
          </div>
        </div>

        <p style={{ marginBottom: '1rem' }}>{activity.description}</p>

        {(activity.zone || activity.minIP || activity.minFame) && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem',
            backgroundColor: 'var(--albion-darker)',
            borderRadius: '4px'
          }}>
            {activity.zone && (
              <p><strong className="text-gold">Zone:</strong> {activity.zone}</p>
            )}
            {activity.minIP && (
              <p><strong className="text-gold">Min IP:</strong> {activity.minIP}</p>
            )}
            {activity.minFame && (
              <p><strong className="text-gold">Min Fame:</strong> {activity.minFame.toLocaleString()}</p>
            )}
          </div>
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

        {isOwner && (
          <div style={{ marginBottom: '1.5rem' }}>
            <RoleManager 
              activityId={activity.id} 
              roles={activityRoles} 
              signups={activitySignups}
              onUpdate={async () => {
                // Refetch roles and signups
                try {
                  const roleRecords = await rolesApi.getByActivity(activity.id);
                  const transformedRoles = roleRecords.map((r: any) => ({
                    id: r.id,
                    activity: r.activityId,
                    name: r.name,
                    slots: r.slots,
                    attributes: typeof r.attributes === 'string' ? JSON.parse(r.attributes) : r.attributes,
                    created: r.createdAt,
                    updated: r.updatedAt,
                  }));
                  setActivityRoles(transformedRoles);
                  
                  const signupRecords = await signupsApi.getByActivity(activity.id);
                  const transformedSignups = signupRecords.map((s: any) => ({
                    id: s.id,
                    activity: s.activityId,
                    role: s.roleId,
                    player: s.playerId,
                    attributes: typeof s.attributes === 'string' ? JSON.parse(s.attributes) : s.attributes,
                    comment: s.comment,
                    created: s.createdAt,
                    updated: s.updatedAt,
                    expand: {
                      activity: s.activity,
                      role: s.role,
                      player: s.player,
                    },
                  }));
                  setActivitySignups(transformedSignups);
                  refetch();
                } catch (error) {
                  console.error('Error refetching:', error);
                  refetch();
                }
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--albion-gold)' }}>
            Sign-ups
          </h2>
          {activityRoles.length === 0 ? (
            <p className="text-dim">No roles defined yet. {isOwner && 'Add roles to allow sign-ups.'}</p>
          ) : (
            <div>
              {activityRoles.map(role => {
                const roleSignups = activitySignups.filter(s => s.role === role.id);
                const count = roleSignups.length;
                const full = isRoleFull(role.id, role.slots, activitySignups);
                return (
                  <div key={role.id} style={{ marginBottom: '1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                      <h3 style={{ color: 'var(--albion-gold)' }}>
                        {role.name} ({count}/{role.slots})
                      </h3>
                      {canSignup && !full && (
                        <button
                          className="btn-primary"
                          onClick={() => handleRoleClick(role)}
                        >
                          Join
                        </button>
                      )}
                    </div>
                    {Object.keys(role.attributes).length > 0 && (
                      <div style={{ 
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: 'var(--albion-darker)',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        <strong>Requirements:</strong>
                        {Object.entries(role.attributes).map(([key, value]) => (
                          <span key={key} style={{ marginLeft: '0.5rem' }}>
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                    {roleSignups.length === 0 ? (
                      <p className="text-dim">No sign-ups yet</p>
                    ) : (
                      <div>
                        {roleSignups.map(signup => {
                          const isOwnSignup = signup.player === user?.id;
                          return (
                            <div 
                              key={signup.id}
                              style={{
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                backgroundColor: 'var(--albion-darker)',
                                borderRadius: '4px',
                                border: isOwnSignup ? '1px solid var(--albion-gold)' : '1px solid var(--albion-border)'
                              }}
                            >
                              <div className="flex-between">
                                <div>
                                  <strong>{signup.expand?.player?.name || 'Unknown'}</strong>
                                  {signup.comment && (
                                    <p className="text-dim" style={{ marginTop: '0.25rem' }}>
                                      {signup.comment}
                                    </p>
                                  )}
                                  {Object.keys(signup.attributes).length > 0 && (
                                    <div style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                                      {Object.entries(signup.attributes).map(([key, value]) => (
                                        <span key={key} className="text-dim" style={{ marginRight: '1rem' }}>
                                          {key}: {String(value)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  {isOwnSignup && (
                                    <button
                                      className="btn-secondary"
                                      style={{ marginRight: '0.5rem' }}
                                      onClick={async () => {
                                        if (confirm('Cancel your sign-up?')) {
                                          try {
                                            await signupsApi.delete(signup.id);
                                            refetch();
                                          } catch (error) {
                                            alert('Failed to cancel sign-up');
                                          }
                                        }
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  {isOwner && !isOwnSignup && (
                                    <button
                                      className="btn-danger"
                                      onClick={async () => {
                                        if (confirm('Remove this sign-up?')) {
                                          try {
                                            await signupsApi.delete(signup.id);
                                            // Refetch signups
                                            const records = await signupsApi.getByActivity(activity.id);
                                            const transformed = records.map((s: any) => ({
                                              id: s.id,
                                              activity: s.activityId,
                                              role: s.roleId,
                                              player: s.playerId,
                                              attributes: typeof s.attributes === 'string' ? JSON.parse(s.attributes) : s.attributes,
                                              comment: s.comment,
                                              created: s.createdAt,
                                              updated: s.updatedAt,
                                              expand: {
                                                activity: s.activity,
                                                role: s.role,
                                                player: s.player,
                                              },
                                            }));
                                            setActivitySignups(transformed);
                                            refetch();
                                          } catch (error) {
                                            alert('Failed to remove sign-up');
                                          }
                                        }
                                      }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
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

        {userSignup && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--albion-gold)',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <strong className="text-gold">You are signed up for this activity!</strong>
          </div>
        )}

        {showSignupForm && selectedRole && (
          <SignupForm
            activity={activity}
            role={selectedRole}
            onSuccess={handleSignupSuccess}
            onCancel={() => {
              setShowSignupForm(false);
              setSelectedRole(null);
            }}
            overlapWarning={overlapWarning}
          />
        )}

        <div className="flex" style={{ gap: '1rem', marginTop: '2rem' }}>
          <Link to="/" className="btn-secondary">
            Back to List
          </Link>
          {isOwner && (
            <>
              <Link to={`/activity/${activity.id}/edit`} className="btn-primary">
                Edit Activity
              </Link>
              <button className="btn-danger" onClick={handleDelete}>
                Delete Activity
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
