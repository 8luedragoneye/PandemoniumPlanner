import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Role, Signup, FillProvider, TransportSignupAttributes } from '../types';
import { formatDisplayDate, getSignupCount, isRoleFull, isUpcoming, checkOverlap } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { signupsApi, fillProvidersApi } from '../lib/api';
import { transformSignup } from '../lib/transformers';
import { SignupForm } from './SignupForm';
import { FillProviderRegistration } from './FillProviderRegistration';
import { CollapsibleSection } from './CollapsibleSection';

interface ActivityCardProps {
  activity: Activity;
  roles: Role[];
  signups: Signup[];
}

export function ActivityCard({ activity, roles, signups }: ActivityCardProps): JSX.Element {
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

  // Check if user is a fill provider (for transport activities)
  useEffect(() => {
    if (activity.type === 'transport' && user) {
      const checkFillProvider = async () => {
        try {
          const providers = await fillProvidersApi.getAll();
          const userProvider = providers.find(p => p.userId === user.id);
          setUserFillProvider(userProvider || null);
        } catch (error) {
          console.error('Error checking fill provider status:', error);
        }
      };
      checkFillProvider();
    }
  }, [activity.type, activity.id, user]);

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

  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showFillRegistration, setShowFillRegistration] = useState(false);
  const [userFillProvider, setUserFillProvider] = useState<FillProvider | null>(null);

  const handleRoleClick = async (role: Role) => {
    if (!user) return;
    if (isRoleFull(role.id, role.slots, activitySignups)) {
      alert('This role is full');
      return;
    }
    
    // For transport activities, show form. For regular, join directly
    if (activity.type === 'transport') {
      setSelectedRole(role);
      setShowSignupForm(true);
    } else {
      // Regular activity - join directly
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
    <>
    <CollapsibleSection 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              <Link 
                to={`/activity/${activity.id}`}
                style={{ textDecoration: 'none', color: 'var(--albion-gold)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {activity.name}
              </Link>
            </h2>
            {activity.type === 'transport' && (
              <span style={{
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
            <span className="text-dim" style={{ fontSize: '0.875rem' }}>
              {formatDisplayDate(activity.date)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`status-badge status-${activity.status}`}>
              {activity.status}
            </span>
            {isFull && (
              <span className="status-badge status-full">
                Full
              </span>
            )}
          </div>
        </div>
      }
      defaultExpanded={false}
    >
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
                                {activity.type === 'transport' && Object.keys(signup.attributes).length > 0 && (
                                  <div style={{ marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                                    {(() => {
                                      // Type guard to check if attributes match TransportSignupAttributes
                                      const attrs = signup.attributes as TransportSignupAttributes;
                                      return (
                                        <>
                                          {attrs.role && (
                                            <div className="text-dim" style={{ marginBottom: '0.25rem' }}>
                                              <strong>Role:</strong> {attrs.role}
                                            </div>
                                          )}
                                          {attrs.source && (
                                            <div className="text-dim" style={{ marginBottom: '0.25rem' }}>
                                              <strong>Origin:</strong> {attrs.source}
                                            </div>
                                          )}
                                          {attrs.target && (
                                            <div className="text-dim" style={{ marginBottom: '0.25rem' }}>
                                              <strong>Goal:</strong> {attrs.target}
                                            </div>
                                          )}
                                          {(attrs.slots || attrs.gewicht) && (
                                            <div className="text-dim" style={{ marginBottom: '0.25rem' }}>
                                              {attrs.slots && <span>Slots: {attrs.slots}</span>}
                                              {attrs.slots && attrs.gewicht && <span> • </span>}
                                              {attrs.gewicht && <span>Gewicht: {attrs.gewicht}t</span>}
                                            </div>
                                          )}
                                          {attrs.preferredPartner && (
                                            <div className="text-dim" style={{ marginBottom: '0.25rem' }}>
                                              <strong>Preferred Partner:</strong> {attrs.preferredPartner}
                                            </div>
                                          )}
                                          {attrs.gearNeeds && (
                                            <div className="text-dim" style={{ marginBottom: '0.25rem' }}>
                                              <strong>Gear:</strong> {attrs.gearNeeds}
                                            </div>
                                          )}
                                          {attrs.carleonTransport && (
                                            <div className="text-dim" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--albion-border)' }}>
                                              <strong>Carleon Transport:</strong>
                                              {attrs.carleonTransport.source && (
                                                <div style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                                                  <strong>Origin:</strong> {attrs.carleonTransport.source}
                                                </div>
                                              )}
                                              {attrs.carleonTransport.target && (
                                                <div style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                                                  <strong>Goal:</strong> {attrs.carleonTransport.target}
                                                </div>
                                              )}
                                              {(attrs.carleonTransport.slots || attrs.carleonTransport.gewicht) && (
                                                <div style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                                                  {attrs.carleonTransport.slots && <span>Slots: {attrs.carleonTransport.slots}</span>}
                                                  {attrs.carleonTransport.slots && attrs.carleonTransport.gewicht && <span> • </span>}
                                                  {attrs.carleonTransport.gewicht && <span>Gewicht: {attrs.carleonTransport.gewicht}t</span>}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                                {activity.type !== 'transport' && Object.keys(signup.attributes).length > 0 && (
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


      {activity.type === 'transport' && user && activitySignups.some(s => s.player === user.id) && (
        <>
          {userFillProvider ? (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              border: '1px solid var(--albion-gold)',
              borderRadius: '4px'
            }}>
              <div>
                <strong className="text-gold">Your Fill Provider Status</strong>
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Priority:</strong>{' '}
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: userFillProvider.priority && userFillProvider.priority > 0 
                        ? 'rgba(46, 204, 113, 0.2)' 
                        : userFillProvider.priority === 0
                        ? 'rgba(212, 175, 55, 0.2)'
                        : 'rgba(192, 57, 43, 0.2)',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {userFillProvider.priority ?? 0}
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Provides:</strong>{' '}
                    {userFillProvider.providesSlots && <span>Slots</span>}
                    {userFillProvider.providesSlots && userFillProvider.providesWeight && <span> • </span>}
                    {userFillProvider.providesWeight && <span>Weight</span>}
                  </div>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.8125rem', color: 'var(--albion-text-dim)' }}>
                    <strong>Status:</strong>{' '}
                    {userFillProvider.isActive ? (
                      <span style={{ color: 'var(--albion-green)' }}>Active</span>
                    ) : (
                      <span style={{ color: 'var(--albion-red)' }}>Inactive</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)', marginTop: '0.5rem' }}>
                    <strong>How priority works:</strong> +1 for participation, -1 for assignment, -1 for problems. Higher priority = assigned first.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--albion-gold)',
              borderRadius: '4px'
            }}>
              <div className="flex-between">
                <div>
                  <strong className="text-gold">Become a Fill Provider</strong>
                  <p className="text-dim" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
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
                      // Reload provider status
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
        </>
      )}

      <div className="flex-between" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--albion-border)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isOwner && (
            <>
              <Link
                to={`/activity/${activity.id}`}
                className="btn-secondary"
              >
                View Details
              </Link>
              <Link
                to={`/activity/${activity.id}/edit`}
                className="btn-primary"
              >
                Edit Activity
              </Link>
            </>
          )}
          {!isOwner && (
            <Link
              to={`/activity/${activity.id}`}
              className="btn-secondary"
            >
              View Details
            </Link>
          )}
        </div>
        <div className="text-dim" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          Created by {activity.expand?.creator?.name || 'Unknown'}
        </div>
      </div>
    </CollapsibleSection>

    {showSignupForm && selectedRole && (
      <SignupForm
        activity={activity}
        role={selectedRole}
        onSuccess={() => {
          setShowSignupForm(false);
          setSelectedRole(null);
          handleSignupSuccess();
        }}
        onCancel={() => {
          setShowSignupForm(false);
          setSelectedRole(null);
        }}
        overlapWarning={overlapWarning}
      />
    )}
    </>
  );
}
