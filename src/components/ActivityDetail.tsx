import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { Activity, Role, Signup, TransportPair } from '../types';
import { formatDisplayDate, isRoleFull, checkOverlap, isUpcoming } from '../lib/utils';
import { transformActivity, transformRole, transformSignup, transformPair } from '../lib/transformers';
import { SignupForm } from './SignupForm';
import { TransportPairManager } from './TransportPairManager';
import { FillProviderManager } from './FillProviderManager';
import { FillAssignmentManager } from './FillAssignmentManager';
import { FillProviderRegistration } from './FillProviderRegistration';
import { CollapsibleSection } from './CollapsibleSection';
import { activitiesApi, signupsApi, rolesApi, pairsApi, fillProvidersApi } from '../lib/api';

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities, roles, signups, refetch } = useActivities();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityRoles, setActivityRoles] = useState<Role[]>([]);
  const [activitySignups, setActivitySignups] = useState<Signup[]>([]);
  const [pairs, setPairs] = useState<TransportPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string>('');
  const [showFillRegistration, setShowFillRegistration] = useState(false);
  const [userFillProvider, setUserFillProvider] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      try {
        const record = await activitiesApi.getOne(id);
        const transformedActivity = transformActivity(record);
        setActivity(transformedActivity);
        
        // Fetch roles and signups for this activity
        try {
          const roleRecords = await rolesApi.getByActivity(id);
          setActivityRoles(roleRecords.map(transformRole));
        } catch (error) {
          console.error('Error fetching roles:', error);
        }
        
        try {
          const signupRecords = await signupsApi.getByActivity(id);
          setActivitySignups(signupRecords.map(transformSignup));
        } catch (error) {
          console.error('Error fetching signups:', error);
        }
        
        // Fetch pairs if transport activity
        if (transformedActivity.type === 'transport') {
          try {
            const pairRecords = await pairsApi.getByActivity(id);
            setPairs(pairRecords.map(transformPair));
          } catch (error) {
            console.error('Error fetching pairs:', error);
          }

          // Check if user is a fill provider
          if (user) {
            try {
              const providers = await fillProvidersApi.getAll();
              const userProvider = providers.find(p => p.userId === user.id);
              setUserFillProvider(userProvider || null);
            } catch (error) {
              console.error('Error checking fill provider status:', error);
            }
          }
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

  const handleRoleClick = async (role: Role) => {
    if (isRoleFull(role.id, role.slots, activitySignups)) {
      alert('This role is full');
      return;
    }
    
    // For transport activities, show form. For regular, join directly
    if (isTransport) {
      setSelectedRole(role);
      setShowSignupForm(true);
    } else {
      // Regular activity - join directly
      if (!user) return;
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
    }
  };

  const handleSignupSuccess = async () => {
    setShowSignupForm(false);
    setSelectedRole(null);
    // Refetch signups for this activity
    try {
      const records = await signupsApi.getByActivity(id!);
      setActivitySignups(records.map(transformSignup));
      refetch(); // Also refetch all data
    } catch (error) {
      console.error('Error refetching signups:', error);
      refetch();
    }
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
        <p className="text-dim" style={{ fontSize: '1.125rem' }}>Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return <div style={{ padding: '2rem' }}>Activity not found</div>;
  }

  const isOwner = user?.id === activity.creator;
  const userSignup = activitySignups.find(s => s.player === user?.id);
  const canSignup = isUpcoming(activity) && activity.status === 'recruiting' && !userSignup;
  const isTransport = activity.type === 'transport';

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 2rem' }}>
      {/* Header Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <h1 className="card-title">
              {activity.name}
              {isTransport && (
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'var(--albion-gold)',
                  color: 'var(--albion-dark)',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  TRANSPORT
                </span>
              )}
            </h1>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <p className="text-dim">
                <strong className="text-gold">Date:</strong> {formatDisplayDate(activity.date)}
              </p>
              {activity.massupTime && (
                <p className="text-dim">
                  <strong className="text-gold">Massup:</strong> {formatDisplayDate(activity.massupTime)}
                </p>
              )}
            </div>
          </div>
          <div>
            <span className={`status-badge status-${activity.status}`}>
              {activity.status}
            </span>
          </div>
        </div>

        {activity.description && (
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{activity.description}</p>
        )}

        {(activity.zone || activity.minEquip) && (
          <div style={{ 
            display: 'flex',
            gap: '1.5rem',
            padding: '0.75rem 0',
            borderTop: '1px solid var(--albion-border)',
            marginTop: '1rem',
            paddingTop: '1rem'
          }}>
            {activity.zone && (
              <div>
                <strong className="text-gold">Zone:</strong> <span className="text-dim">{activity.zone}</span>
              </div>
            )}
            {activity.minEquip && (
              <div>
                <strong className="text-gold">Min Equipment:</strong> <span className="text-dim">{activity.minEquip}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warnings */}
      {overlapWarning && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'rgba(212, 175, 55, 0.2)',
          border: '1px solid var(--albion-gold)',
          borderRadius: '8px',
          color: 'var(--albion-gold)'
        }}>
          {overlapWarning}
        </div>
      )}

      {userSignup && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid var(--albion-gold)',
          borderRadius: '8px'
        }}>
          <strong className="text-gold">You are signed up for this activity!</strong>
        </div>
      )}

      {/* Management Sections (Owner Only) */}
      {isOwner && isTransport && (
        <CollapsibleSection title="Management" defaultExpanded={false}>
          <TransportPairManager
            activityId={activity.id}
            signups={activitySignups}
            onUpdate={async () => {
              try {
                const signupRecords = await signupsApi.getByActivity(activity.id);
                setActivitySignups(signupRecords.map(transformSignup));
                const pairRecords = await pairsApi.getByActivity(activity.id);
                setPairs(pairRecords.map(transformPair));
                refetch();
              } catch (error) {
                console.error('Error refetching:', error);
                refetch();
              }
            }}
          />
        </CollapsibleSection>
      )}

      {/* Fill System Section (Transport Only) */}
      {isTransport && (
        <CollapsibleSection title="Fill System" defaultExpanded={false}>
          {/* User Fill Provider Status */}
          {userFillProvider ? (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                marginBottom: '1rem', 
                color: 'var(--albion-gold)',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                Your Fill Provider Status
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--albion-darker)',
                borderRadius: '8px',
                marginBottom: '0.75rem'
              }}>
                <div>
                  <div className="text-dim" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Priority</div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: userFillProvider.priority && userFillProvider.priority > 0 
                      ? 'rgba(46, 204, 113, 0.2)' 
                      : userFillProvider.priority === 0
                      ? 'rgba(212, 175, 55, 0.2)'
                      : 'rgba(192, 57, 43, 0.2)',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}>
                    {userFillProvider.priority ?? 0}
                  </span>
                </div>
                <div>
                  <div className="text-dim" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Provides</div>
                  <div>
                    {userFillProvider.providesSlots && <span style={{ marginRight: '0.5rem' }}>Slots</span>}
                    {userFillProvider.providesWeight && <span>Weight</span>}
                  </div>
                </div>
                <div>
                  <div className="text-dim" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</div>
                  <div>
                    {userFillProvider.isActive ? (
                      <span style={{ color: 'var(--albion-green)', fontWeight: 600 }}>Active</span>
                    ) : (
                      <span style={{ color: 'var(--albion-red)', fontWeight: 600 }}>Inactive</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-dim" style={{ fontSize: '0.8125rem' }}>
                <strong>How priority works:</strong> +1 for participation, -1 for assignment, -1 for problems. Higher priority = assigned first.
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: '2rem' }}>
              <div className="flex-between">
                <div>
                  <h3 style={{ 
                    marginBottom: '0.5rem', 
                    color: 'var(--albion-gold)',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    Become a Fill Provider
                  </h3>
                  <p className="text-dim" style={{ fontSize: '0.875rem' }}>
                    Help optimize transport inventories by providing fill items. Earn priority points for fair rotation.
                  </p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowFillRegistration(true)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Register
                </button>
              </div>
              {showFillRegistration && (
                <div style={{ marginTop: '1rem' }}>
                  <FillProviderRegistration
                    onSuccess={async () => {
                      setShowFillRegistration(false);
                      try {
                        const providers = await fillProvidersApi.getAll();
                        const userProvider = providers.find(p => p.userId === user?.id);
                        setUserFillProvider(userProvider || null);
                      } catch (error) {
                        console.error('Error checking fill provider status:', error);
                      }
                    }}
                    onCancel={() => setShowFillRegistration(false)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Owner Fill Management */}
          {isOwner && (
            <>
              <div style={{ 
                marginTop: '2rem', 
                paddingTop: '2rem', 
                borderTop: '1px solid var(--albion-border)',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ 
                  marginBottom: '1rem', 
                  color: 'var(--albion-gold)',
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  Fill Providers
                </h3>
                <FillProviderManager
                  onUpdate={refetch}
                />
              </div>

              <div style={{ 
                marginTop: '2rem', 
                paddingTop: '2rem', 
                borderTop: '1px solid var(--albion-border)'
              }}>
                <h3 style={{ 
                  marginBottom: '1rem', 
                  color: 'var(--albion-gold)',
                  fontSize: '1rem',
                  fontWeight: 600
                }}>
                  Fill Assignments
                </h3>
                <FillAssignmentManager
                  activityId={activity.id}
                  pairs={pairs}
                  onUpdate={async () => {
                    try {
                      const pairRecords = await pairsApi.getByActivity(activity.id);
                      setPairs(pairRecords.map(transformPair));
                      refetch();
                    } catch (error) {
                      console.error('Error refetching pairs:', error);
                    }
                  }}
                />
              </div>
            </>
          )}
        </CollapsibleSection>
      )}

      {/* Sign-ups Section */}
      <CollapsibleSection title="Sign-ups" defaultExpanded={false}>
        {activityRoles.length === 0 ? (
          <p className="text-dim">No roles defined yet. {isOwner && 'Add roles to allow sign-ups.'}</p>
        ) : (
          <div>
            {activityRoles.map(role => {
              const roleSignups = activitySignups.filter(s => s.role === role.id);
              const count = roleSignups.length;
              const full = isRoleFull(role.id, role.slots, activitySignups);
              return (
                <div key={role.id} style={{ marginBottom: '2rem' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--albion-gold)', fontSize: '1.125rem', fontWeight: 600 }}>
                      {role.name} <span className="text-dim" style={{ fontWeight: 400 }}>({count}/{role.slots})</span>
                    </h3>
                    {canSignup && !full && (
                      <button
                        className="btn-primary"
                        onClick={() => handleRoleClick(role)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        + Join
                      </button>
                    )}
                  </div>
                  {Object.keys(role.attributes).length > 0 && (
                    <div style={{ 
                      marginBottom: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--albion-darker)',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}>
                      <strong className="text-gold">Requirements:</strong>
                      {Object.entries(role.attributes).map(([key, value]) => (
                        <span key={key} className="text-dim" style={{ marginLeft: '0.75rem' }}>
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                  {roleSignups.length === 0 ? (
                    <p className="text-dim" style={{ padding: '1rem', textAlign: 'center' }}>No sign-ups yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {roleSignups.map(signup => {
                        const isOwnSignup = signup.player === user?.id;
                        const transportAttrs = isTransport && signup.attributes && typeof signup.attributes === 'object' 
                          ? (signup.attributes as any) 
                          : null;
                        return (
                          <div 
                            key={signup.id}
                            style={{
                              padding: '1rem',
                              backgroundColor: 'var(--albion-darker)',
                              borderRadius: '8px',
                              border: isOwnSignup ? '2px solid var(--albion-gold)' : '1px solid var(--albion-border)'
                            }}
                          >
                            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                  <strong style={{ fontSize: '1rem' }}>{signup.expand?.player?.name || 'Unknown'}</strong>
                                  {isTransport && transportAttrs?.role && (
                                    <span style={{
                                      padding: '0.25rem 0.75rem',
                                      backgroundColor: transportAttrs.role === 'Fighter' 
                                        ? 'rgba(192, 57, 43, 0.2)' 
                                        : 'rgba(52, 152, 219, 0.2)',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: transportAttrs.role === 'Fighter' ? '#e74c3c' : '#3498db'
                                    }}>
                                      {transportAttrs.role}
                                    </span>
                                  )}
                                </div>
                                
                                {isTransport && transportAttrs && (
                                  <div style={{ 
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '0.5rem',
                                    marginTop: '0.75rem',
                                    padding: '0.75rem',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '6px',
                                    fontSize: '0.8125rem'
                                  }}>
                                    {transportAttrs.weaponType && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>Weapon:</span>{' '}
                                        <span className="text-dim">{transportAttrs.weaponType}</span>
                                      </div>
                                    )}
                                    {transportAttrs.source && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>From:</span>{' '}
                                        <span className="text-dim">{transportAttrs.source}</span>
                                      </div>
                                    )}
                                    {transportAttrs.target && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>To:</span>{' '}
                                        <span className="text-dim">{transportAttrs.target}</span>
                                      </div>
                                    )}
                                    {transportAttrs.preferredPartner && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>Prefers:</span>{' '}
                                        <span className="text-gold">{transportAttrs.preferredPartner}</span>
                                      </div>
                                    )}
                                    {transportAttrs.gearNeeds && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>Gear:</span>{' '}
                                        <span className="text-dim">{transportAttrs.gearNeeds}</span>
                                      </div>
                                    )}
                                    {transportAttrs.returnTransport && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>Return:</span>{' '}
                                        <span className="text-dim">
                                          {transportAttrs.returnTransport.slots} slots, {transportAttrs.returnTransport.weight}t
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {!isTransport && signup.comment && (
                                  <p className="text-dim" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                    {signup.comment}
                                  </p>
                                )}
                                
                                {!isTransport && Object.keys(signup.attributes).length > 0 && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                    {Object.entries(signup.attributes).map(([key, value]) => (
                                      <span key={key} className="text-dim" style={{ marginRight: '1rem' }}>
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {isTransport && signup.comment && (
                                  <p className="text-dim" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                    {signup.comment}
                                  </p>
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                                {isOwnSignup && (
                                  <button
                                    className="btn-secondary"
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
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
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
                                          const records = await signupsApi.getByActivity(activity.id);
                                          setActivitySignups(records.map(transformSignup));
                                          refetch();
                                        } catch (error) {
                                          alert('Failed to remove sign-up');
                                        }
                                      }
                                    }}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
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
      </CollapsibleSection>

      {/* Signup Form Modal */}
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

      {/* Action Buttons */}
      <div className="flex" style={{ gap: '1rem', marginTop: '2rem', marginBottom: '2rem' }}>
        <Link to="/" className="btn-secondary">
          ← Back to List
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
  );
}
