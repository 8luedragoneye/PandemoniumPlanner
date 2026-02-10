import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { Activity, Role, Signup, TransportPair, TransportSignupAttributes, FillProvider } from '../types';
import { formatDisplayDate, isRoleFull, checkOverlap, isUpcoming } from '../lib/utils';
import { transformActivity, transformRole, transformSignup, transformPair, transformFillProvider } from '../lib/transformers';
import { SignupForm } from './SignupForm';
import { TransportPairManager } from './TransportPairManager';
import { AutoPairButton } from './AutoPairButton';
import { FillProviderManager } from './FillProviderManager';
import { FillAssignmentManager } from './FillAssignmentManager';
import { FillProviderRegistration } from './FillProviderRegistration';
import { CollapsibleSection } from './CollapsibleSection';
import { activitiesApi, signupsApi, rolesApi, pairsApi, fillProvidersApi } from '../lib/api';

export function ActivityDetail(): JSX.Element {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activities, signups, refetch } = useActivities();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityRoles, setActivityRoles] = useState<Role[]>([]);
  const [activitySignups, setActivitySignups] = useState<Signup[]>([]);
  const [pairs, setPairs] = useState<TransportPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string>('');
  const [showFillRegistration, setShowFillRegistration] = useState(false);
  const [userFillProvider, setUserFillProvider] = useState<FillProvider | null>(null);

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
              setUserFillProvider(userProvider ? transformFillProvider(userProvider) : null);
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
          t('activities.overlapWarning', { count: overlaps.length, names: overlaps.map(a => a.name).join(', ') })
        );
      } else {
        setOverlapWarning('');
      }
    }
  }, [activity, user, signups, activities]);

  const handleDelete = async () => {
    if (!activity || !user || activity.creator !== user.id) return;
    if (!confirm(t('activities.confirmDelete'))) return;

    try {
      await activitiesApi.delete(activity.id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert(t('activities.failedToDelete'));
    }
  };

  const handleRoleClick = async (role: Role) => {
    if (isRoleFull(role.id, role.slots, activitySignups)) {
      alert(t('activities.roleFull'));
      return;
    }
    
    // For transport activities, show form. For regular, join directly
    if (isTransport) {
      setSelectedRole(role);
      setShowSignupForm(true);
    } else {
      // Regular activity - join directly
      if (!user || !activity) return;
      try {
        await signupsApi.create({
          activityId: activity.id,
          roleId: role.id,
          attributes: {},
          comment: undefined,
        });
        handleSignupSuccess();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : t('signups.failedToSignup'));
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
        <p className="text-dim" style={{ fontSize: '1.125rem' }}>{t('activities.loadingActivity')}</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '4rem auto', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ 
            color: 'var(--albion-gold)', 
            marginBottom: '1rem',
            fontSize: '1.5rem'
          }}>
            {t('activities.activityNotFound')}
          </h2>
          <p className="text-dim" style={{ marginBottom: '1.5rem' }}>
            {t('activities.activityNotFoundDesc')}
          </p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/')}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            {t('activities.backToActivities')}
          </button>
        </div>
      </div>
    );
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
                  {t('activities.transport')}
                </span>
              )}
            </h1>
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <p className="text-dim">
                <strong className="text-gold">{t('activities.date')}</strong> {formatDisplayDate(activity.date)}
              </p>
              {activity.massupTime && (
                <p className="text-dim">
                  <strong className="text-gold">{t('activities.massup')}</strong> {formatDisplayDate(activity.massupTime)}
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
                <strong className="text-gold">{t('activities.zoneLabel')}</strong> <span className="text-dim">{activity.zone}</span>
              </div>
            )}
            {activity.minEquip && (
              <div>
                <strong className="text-gold">{t('activities.minEquipment')}</strong> <span className="text-dim">{activity.minEquip}</span>
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
          <strong className="text-gold">{t('activities.signedUpMessage')}</strong>
        </div>
      )}

      {/* Management Sections (Owner Only) */}
      {isOwner && isTransport && (
        <CollapsibleSection 
          title={t('transport.transportPairing')} 
          defaultExpanded={false}
          headerActions={
            <AutoPairButton
              activityId={activity.id}
              signups={activitySignups}
              compact={true}
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
          }
        >
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
        <CollapsibleSection title={t('fill.fillSystem')} defaultExpanded={false}>
          {/* User Fill Provider Status */}
          {userFillProvider ? (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                marginBottom: '1rem', 
                color: 'var(--albion-gold)',
                fontSize: '1rem',
                fontWeight: 600
              }}>
                {t('fill.yourFillProviderStatus')}
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
                  <div className="text-dim" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{t('common.priority')}</div>
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
                  <div className="text-dim" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{t('common.provides')}</div>
                  <div>
                    {userFillProvider.providesSlots && <span style={{ marginRight: '0.5rem' }}>{t('common.slots')}</span>}
                    {userFillProvider.providesWeight && <span>{t('common.weight')}</span>}
                  </div>
                </div>
                <div>
                  <div className="text-dim" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{t('common.status')}</div>
                  <div>
                    {userFillProvider.isActive ? (
                      <span style={{ color: 'var(--albion-green)', fontWeight: 600 }}>{t('common.active')}</span>
                    ) : (
                      <span style={{ color: 'var(--albion-red)', fontWeight: 600 }}>{t('common.inactive')}</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-dim" style={{ fontSize: '0.8125rem' }}>
                {t('fill.howPriorityWorks')}
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
                    {t('fill.becomeFillProvider')}
                  </h3>
                  <p className="text-dim" style={{ fontSize: '0.875rem' }}>
                    {t('fill.becomeFillProviderDesc')}
                  </p>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowFillRegistration(true)}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {t('fill.registerBtn')}
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
                        setUserFillProvider(userProvider ? transformFillProvider(userProvider) : null);
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
                  {t('fill.fillProviders')}
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
                  {t('fill.fillAssignments')}
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
      <CollapsibleSection title={t('signups.signups')} defaultExpanded={false}>
        {activityRoles.length === 0 ? (
          <p className="text-dim">{isOwner ? t('roles.noRolesOwner') : t('roles.noRolesNoOwner')}</p>
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
                        {t('signups.plusJoin')}
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
                      <strong className="text-gold">{t('roles.requirements')}</strong>
                      {Object.entries(role.attributes).map(([key, value]) => (
                        <span key={key} className="text-dim" style={{ marginLeft: '0.75rem' }}>
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                  {roleSignups.length === 0 ? (
                    <p className="text-dim" style={{ padding: '1rem', textAlign: 'center' }}>{t('signups.noSignupsYet')}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {roleSignups.map(signup => {
                        const isOwnSignup = signup.player === user?.id;
                        const transportAttrs = isTransport && signup.attributes && typeof signup.attributes === 'object' 
                          ? (signup.attributes as unknown as TransportSignupAttributes) 
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
                                  <strong style={{ fontSize: '1rem' }}>{signup.expand?.player?.name || t('common.unknown')}</strong>
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
                                        <span className="text-gold" style={{ fontWeight: 600 }}>{t('signups.weaponLabel')}</span>{' '}
                                        <span className="text-dim">{transportAttrs.weaponType}</span>
                                      </div>
                                    )}
                                    {transportAttrs.source && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>{t('signups.fromLabel')}</span>{' '}
                                        <span className="text-dim">{transportAttrs.source}</span>
                                      </div>
                                    )}
                                    {transportAttrs.target && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>{t('signups.toLabel')}</span>{' '}
                                        <span className="text-dim">{transportAttrs.target}</span>
                                      </div>
                                    )}
                                    {transportAttrs.preferredPartner && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>{t('signups.prefersLabel')}</span>{' '}
                                        <span className="text-gold">{transportAttrs.preferredPartner}</span>
                                      </div>
                                    )}
                                    {transportAttrs.gearNeeds && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>{t('signups.gearLabel')}</span>{' '}
                                        <span className="text-dim">{transportAttrs.gearNeeds}</span>
                                      </div>
                                    )}
                                    {transportAttrs.returnTransport && (
                                      <div>
                                        <span className="text-gold" style={{ fontWeight: 600 }}>{t('signups.returnLabel')}</span>{' '}
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
                                      if (confirm(t('signups.cancelSignup'))) {
                                        try {
                                          await signupsApi.delete(signup.id);
                                          refetch();
                                        } catch (error) {
                                          alert(t('signups.failedToCancel'));
                                        }
                                      }
                                    }}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                  >
                                    {t('common.cancel')}
                                  </button>
                                )}
                                {isOwner && !isOwnSignup && (
                                  <button
                                    className="btn-danger"
                                    onClick={async () => {
                                      if (confirm(t('signups.removeSignup'))) {
                                        try {
                                          await signupsApi.delete(signup.id);
                                          const records = await signupsApi.getByActivity(activity.id);
                                          setActivitySignups(records.map(transformSignup));
                                          refetch();
                                        } catch (error) {
                                          alert(t('signups.failedToRemove'));
                                        }
                                      }
                                    }}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                  >
                                    {t('common.remove')}
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
          {t('activities.backToList')}
        </Link>
        {isOwner && (
          <>
            <Link to={`/activity/${activity.id}/edit`} className="btn-primary">
              {t('activities.editActivity')}
            </Link>
            <button className="btn-danger" onClick={handleDelete}>
              {t('activities.deleteActivity')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
