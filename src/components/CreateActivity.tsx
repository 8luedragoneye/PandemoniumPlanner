import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { ActivityFormData, RoleFormData } from '../types';
import { formatCETDate, formatDateInput, parseDateInput } from '../lib/utils';
import { activitiesApi, rolesApi, premadeActivitiesApi } from '../lib/api';
import type { ApiPremadeActivity } from '../lib/apiTypes';
import { ACTIVITY_TYPE_CATEGORIES, getAutoAssignedMetaTags } from '../lib/constants';

export function CreateActivity(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const categoryTranslations: Record<string, string> = {
    'PvE Activities': t('activityTypes.pveActivities'),
    'PvP Activities': t('activityTypes.pvpActivities'),
    'Mixed (PvE & PvP)': t('activityTypes.mixedActivities'),
  };
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    date: '',
    massupTime: undefined,
    description: '',
    zone: '',
    minEquip: undefined,
  });
  const [activityType, setActivityType] = useState<'regular' | 'transport'>('regular');
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  // Initialize with current date/time in German format
  const now = new Date();
  const defaultDate = formatDateInput(now);
  const defaultTime = formatCETDate(now).split('T')[1].substring(0, 5);
  const defaultDateTime = formatCETDate(now).replace(' ', 'T');
  
  const [dateInput, setDateInput] = useState<string>(defaultDate); // German format: dd mm yyyy
  const [timeInput, setTimeInput] = useState<string>(defaultTime); // HH:mm
  const [massupTimeInput, setMassupTimeInput] = useState<string>(''); // Just time (HH:mm)
  
  // Role management state
  const [roles, setRoles] = useState<RoleFormData[]>([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({
    name: '',
    slots: 1,
    attributes: {},
  });
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [roleError, setRoleError] = useState('');
  
  // Transport-specific role state
  const [isFighterRole, setIsFighterRole] = useState(false);
  const [isTransporterRole, setIsTransporterRole] = useState(false);
  const [weaponTypeAttr, setWeaponTypeAttr] = useState('');
  const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
  
  // Premade activities state
  const [premadeActivities, setPremadeActivities] = useState<ApiPremadeActivity[]>([]);
  const [selectedPremadeId, setSelectedPremadeId] = useState<string>('');
  const [isLoadingPremades, setIsLoadingPremades] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [, setIsCreatingNewTemplate] = useState(false);
  
  // Initialize formData.date with default datetime
  useEffect(() => {
    if (!formData.date) {
      setFormData(prev => ({ ...prev, date: defaultDateTime }));
    }
  }, []);

  // Fetch premade activities on mount
  useEffect(() => {
    const fetchPremadeActivities = async () => {
      setIsLoadingPremades(true);
      try {
        const premades = await premadeActivitiesApi.getAll();
        setPremadeActivities(premades);
      } catch (err) {
        console.error('Error fetching premade activities:', err);
      } finally {
        setIsLoadingPremades(false);
      }
    };

    fetchPremadeActivities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // Combine activity date with massup time if provided
      let massupTime: string | undefined = undefined;
      if (massupTimeInput && formData.date) {
        const activityDate = new Date(formData.date);
        const [hours, minutes] = massupTimeInput.split(':').map(Number);
        const massupDate = new Date(activityDate);
        massupDate.setHours(hours, minutes, 0, 0);
        
        // Validate that massupTime is not later than activity date
        if (massupDate > activityDate) {
          setError(t('createActivity.massupTimeError'));
          setLoading(false);
          return;
        }
        
        // Format as datetime-local string
        massupTime = formatCETDate(massupDate).replace(' ', 'T');
      }

      // Combine selected types with auto-assigned meta tags
      const autoMetaTags = getAutoAssignedMetaTags(selectedActivityTypes);
      const allActivityTypes = [...selectedActivityTypes, ...autoMetaTags];

      const activity = await activitiesApi.create({
        name: formData.name,
        date: formData.date,
        massupTime: massupTime,
        description: formData.description,
        zone: formData.zone || undefined,
        minEquip: formData.minEquip || undefined,
        type: activityType,
        activityTypes: allActivityTypes,
      });

      // Create all roles if any were added
      if (roles.length > 0) {
        try {
          await Promise.all(
            roles.map(role =>
              rolesApi.create({
                activityId: activity.id,
                name: role.name,
                slots: role.slots,
                attributes: role.attributes,
              })
            )
          );
        } catch (roleErr: unknown) {
          // If role creation fails, still navigate but show error
          setError(roleErr instanceof Error ? roleErr.message : t('createActivity.failedToCreateRoles'));
          setLoading(false);
          return;
        }
      }

      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('createActivity.failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Auto-format: convert dots/slashes to spaces, limit length
    value = value.replace(/[.\/]/g, ' ');
    // Remove extra spaces
    value = value.replace(/\s+/g, ' ').trim();
    
    setDateInput(value);
    
    // Parse and convert to ISO format for backend
    const parsedDate = parseDateInput(value);
    if (parsedDate && timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      parsedDate.setHours(hours, minutes, 0, 0);
      const isoString = formatCETDate(parsedDate).replace(' ', 'T');
      setFormData(prev => ({ ...prev, date: isoString }));
    } else if (parsedDate) {
      // If no time set yet, just set date part
      const isoString = formatCETDate(parsedDate).replace(' ', 'T').split('T')[0] + 'T00:00';
      setFormData(prev => ({ ...prev, date: isoString }));
    }
    
    // Auto-update massup time when date changes (if time is set)
    if (timeInput) {
      setMassupTimeInput(timeInput);
    }
  };

  const setQuickDate = (daysOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    const dateStr = formatDateInput(date);
    setDateInput(dateStr);
    
    // Update formData
    if (timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      const isoString = formatCETDate(date).replace(' ', 'T');
      setFormData(prev => ({ ...prev, date: isoString }));
    }
  };

  const setQuickTime = (time: string) => {
    setTimeInput(time);
    
    // Update formData if date is set
    if (dateInput) {
      const parsedDate = parseDateInput(dateInput);
      if (parsedDate) {
        const [hours, minutes] = time.split(':').map(Number);
        parsedDate.setHours(hours, minutes, 0, 0);
        const isoString = formatCETDate(parsedDate).replace(' ', 'T');
        setFormData(prev => ({ ...prev, date: isoString }));
      }
    }
    
    // Auto-update massup time when time changes
    setMassupTimeInput(time);
  };

  // Generate next 4 hours from current time in CET (rounded up)
  const getQuickTimes = (): string[] => {
    const now = new Date();
    // Get current time in CET
    const cetTimeStr = formatCETDate(now);
    const [, timePart] = cetTimeStr.split('T');
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Round up to next hour if we're past the hour
    const startHour = minute > 0 ? hour + 1 : hour;
    
    const times: string[] = [];
    for (let i = 0; i < 4; i++) {
      const hour = (startHour + i) % 24;
      times.push(`${String(hour).padStart(2, '0')}:00`);
    }
    return times;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Format input as user types (HH:mm)
    // Remove any non-digit characters except colon
    value = value.replace(/[^\d:]/g, '');
    
    // Auto-format: add colon after 2 digits
    if (value.length === 2 && !value.includes(':')) {
      value = value + ':';
    }
    
    // Limit to HH:mm format (5 characters max)
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    
    // Validate format before setting
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (value === '' || timePattern.test(value) || value.length < 5) {
      setTimeInput(value);
      
      // Only update formData if valid time format
      if (timePattern.test(value) && dateInput) {
        const parsedDate = parseDateInput(dateInput);
        if (parsedDate) {
          const [hours, minutes] = value.split(':').map(Number);
          parsedDate.setHours(hours, minutes, 0, 0);
          const isoString = formatCETDate(parsedDate).replace(' ', 'T');
          setFormData(prev => ({ ...prev, date: isoString }));
        }
      }
      
      // Auto-update massup time when time changes (if valid)
      if (timePattern.test(value)) {
        setMassupTimeInput(value);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  const handleMassupTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Format input as user types (HH:mm)
    // Remove any non-digit characters except colon
    value = value.replace(/[^\d:]/g, '');
    
    // Auto-format: add colon after 2 digits
    if (value.length === 2 && !value.includes(':')) {
      value = value + ':';
    }
    
    // Limit to HH:mm format (5 characters max)
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    
    setMassupTimeInput(value);
  };

  // Role management handlers
  const handleAddRole = () => {
    setRoleError('');
    setNewAttributeKey('');
    setNewAttributeValue('');
    setEditingRoleIndex(null);
    setIsFighterRole(false);
    setIsTransporterRole(false);
    setWeaponTypeAttr('');
    
    // Pre-populate for transport activities
    if (activityType === 'transport') {
      const hasFighter = roles.some(r => r.name === 'Fighter');
      const hasTransporter = roles.some(r => r.name === 'Transporter');
      
      if (!hasFighter) {
        setIsFighterRole(true);
        setRoleFormData({ 
          name: 'Fighter', 
          slots: 1, 
          attributes: {} 
        });
      } else if (!hasTransporter) {
        setIsTransporterRole(true);
        setRoleFormData({ 
          name: 'Transporter', 
          slots: 9999,
          attributes: {} 
        });
      } else {
        setRoleFormData({ name: '', slots: 1, attributes: {} });
      }
    } else {
      setRoleFormData({ name: '', slots: 1, attributes: {} });
    }
    setShowRoleForm(true);
  };

  const handleFighterRoleChange = (checked: boolean) => {
    setIsFighterRole(checked);
    if (checked) {
      setIsTransporterRole(false);
      setRoleFormData(prev => ({
        ...prev,
        name: 'Fighter',
        slots: 1,
        attributes: weaponTypeAttr ? { weaponType: weaponTypeAttr } : {},
      }));
    } else {
      setRoleFormData(prev => ({
        ...prev,
        name: '',
        slots: 1,
        attributes: {},
      }));
    }
  };

  const handleTransporterRoleChange = (checked: boolean) => {
    setIsTransporterRole(checked);
    if (checked) {
      setIsFighterRole(false);
      setRoleFormData(prev => ({
        ...prev,
        name: 'Transporter',
        slots: 9999,
        attributes: {},
      }));
    } else {
      setRoleFormData(prev => ({
        ...prev,
        name: '',
        slots: 1,
        attributes: {},
      }));
    }
  };

  const handleAddAttribute = () => {
    if (!newAttributeKey.trim()) return;
    setRoleFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [newAttributeKey]: newAttributeValue || 'required',
      },
    }));
    setNewAttributeKey('');
    setNewAttributeValue('');
  };

  const handleRemoveAttribute = (key: string) => {
    setRoleFormData(prev => {
      const newAttrs = { ...prev.attributes };
      delete newAttrs[key];
      return {
        ...prev,
        attributes: newAttrs,
      };
    });
  };

  const handleSaveRole = () => {
    setRoleError('');
    
    // Validate transport role selection
    if (activityType === 'transport' && editingRoleIndex === null) {
      if (!isFighterRole && !isTransporterRole) {
        setRoleError(t('roles.selectFighterOrTransporter'));
        return;
      }
      if (!roleFormData.name) {
        setRoleError(t('roles.roleNameRequired'));
        return;
      }
    }
    
    if (!roleFormData.name.trim()) {
      setRoleError(t('roles.roleNameRequired'));
      return;
    }

    if (editingRoleIndex !== null) {
      // Update existing role
      const updatedRoles = [...roles];
      updatedRoles[editingRoleIndex] = { ...roleFormData };
      setRoles(updatedRoles);
    } else {
      // Add new role
      setRoles([...roles, { ...roleFormData }]);
    }
    
    setShowRoleForm(false);
    setEditingRoleIndex(null);
    setRoleFormData({ name: '', slots: 1, attributes: {} });
    setIsFighterRole(false);
    setIsTransporterRole(false);
    setWeaponTypeAttr('');
    setRoleError('');
  };

  const handleEditRole = (index: number) => {
    const role = roles[index];
    setRoleFormData({ ...role });
    setEditingRoleIndex(index);
    setShowRoleForm(true);
    setRoleError('');
    setNewAttributeKey('');
    setNewAttributeValue('');
    
    // Check if it's a transport role
    if (activityType === 'transport') {
      if (role.name === 'Fighter') {
        setIsFighterRole(true);
        setIsTransporterRole(false);
        setWeaponTypeAttr(role.attributes.weaponType as string || '');
      } else if (role.name === 'Transporter') {
        setIsTransporterRole(true);
        setIsFighterRole(false);
      }
    }
  };

  const handleDeleteRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleCancelRole = () => {
    setShowRoleForm(false);
    setEditingRoleIndex(null);
    setRoleFormData({ name: '', slots: 1, attributes: {} });
    setIsFighterRole(false);
    setIsTransporterRole(false);
    setWeaponTypeAttr('');
    setRoleError('');
    setNewAttributeKey('');
    setNewAttributeValue('');
  };

  // Load premade activity into form
  const handleLoadPremade = async (premadeId: string) => {
    if (!premadeId) {
      return;
    }

    try {
      const premade = await premadeActivitiesApi.getOne(premadeId);
      
      // Populate form fields
      setFormData({
        name: premade.name,
        date: formData.date || defaultDateTime, // Keep existing date or use default
        massupTime: undefined,
        description: premade.description,
        zone: premade.zone || '',
        minEquip: premade.minEquip || undefined,
      });
      
      // Set activity type
      if (premade.type) {
        setActivityType(premade.type as 'regular' | 'transport');
      }
      
      // Populate roles
      if (premade.roles && premade.roles.length > 0) {
        const loadedRoles: RoleFormData[] = premade.roles.map(role => ({
          name: role.name,
          slots: role.slots,
          attributes: role.attributes || {},
        }));
        setRoles(loadedRoles);
      } else {
        setRoles([]);
      }
      
      setSelectedPremadeId(premadeId);
      setShowForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load premade activity');
    }
  };

  // Handle starting from scratch
  const handleStartFromScratch = () => {
    setSelectedPremadeId('');
    setIsCreatingNewTemplate(false);
    setFormData({
      name: '',
      date: defaultDateTime,
      massupTime: undefined,
      description: '',
      zone: '',
      minEquip: undefined,
    });
    setRoles([]);
    setActivityType('regular');
    setSelectedActivityTypes([]);
    setShowForm(true);
  };


  // Handle back to template selection
  const handleBackToSelection = () => {
    setShowForm(false);
    setSelectedPremadeId('');
    setError('');
    setTemplateSuccess('');
  };

  // Save current form as template
  const handleSaveAsTemplate = async () => {
    if (!formData.name || !formData.description) {
      setError(t('createActivity.templateRequiresFields'));
      return;
    }

    setSavingTemplate(true);
    setTemplateSuccess('');
    setError('');

    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        zone: formData.zone || undefined,
        minEquip: formData.minEquip || undefined,
        type: activityType,
        roles: roles.length > 0 ? roles.map(role => ({
          name: role.name,
          slots: role.slots,
          attributes: role.attributes,
        })) : undefined,
      };

      await premadeActivitiesApi.create(templateData);
      
      setTemplateSuccess(t('createActivity.templateSaved'));
      
      // Refresh premade activities list
      const premades = await premadeActivitiesApi.getAll();
      setPremadeActivities(premades);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTemplateSuccess('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createActivity.failedToSaveTemplate'));
    } finally {
      setSavingTemplate(false);
    }
  };

  // Template Selection View
  if (!showForm) {
    return (
      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '2rem' }}>
        <div className="card">
          <h1 className="card-title" style={{ marginBottom: '2rem' }}>
            {t('createActivity.title')}
          </h1>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ 
              color: 'var(--albion-text-dim)', 
              fontSize: '0.9375rem',
              marginBottom: '1.5rem'
            }}>
              {t('createActivity.chooseTemplate')}
            </p>

            {/* Start from scratch option */}
            <div
              onClick={handleStartFromScratch}
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--albion-darker)',
                border: '2px solid var(--albion-border)',
                borderRadius: '12px',
                marginBottom: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--albion-gold)';
                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--albion-border)';
                e.currentTarget.style.backgroundColor = 'var(--albion-darker)';
              }}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '8px',
                backgroundColor: 'var(--albion-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'var(--albion-gold)',
                flexShrink: 0
              }}>
                +
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  margin: 0, 
                  marginBottom: '0.25rem',
                  color: 'var(--albion-text)',
                  fontSize: '1.125rem',
                  fontWeight: 600
                }}>
                  {t('createActivity.startFromScratch')}
                </h3>
                <p style={{ 
                  margin: 0,
                  color: 'var(--albion-text-dim)', 
                  fontSize: '0.875rem'
                }}>
                  {t('createActivity.startFromScratchDesc')}
                </p>
              </div>
            </div>

            {/* Available Templates */}
            {premadeActivities.length > 0 && (
              <div>
                <h2 style={{ 
                  color: 'var(--albion-gold)',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '1rem'
                }}>
                  {t('createActivity.availableTemplates')}
                </h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem'
                }}>
                  {premadeActivities.map(premade => (
                    <div
                      key={premade.id}
                      onClick={() => handleLoadPremade(premade.id)}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--albion-darker)',
                        border: '2px solid var(--albion-border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--albion-gold)';
                        e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--albion-border)';
                        e.currentTarget.style.backgroundColor = 'var(--albion-darker)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <h3 style={{ 
                          margin: 0,
                          color: 'var(--albion-text)',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}>
                          {premade.name}
                        </h3>
                        {premade.type && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: 'var(--albion-dark)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: 'var(--albion-text-dim)',
                            textTransform: 'capitalize'
                          }}>
                            {premade.type}
                          </span>
                        )}
                      </div>
                      <p style={{ 
                        margin: 0,
                        marginBottom: '0.75rem',
                        color: 'var(--albion-text-dim)', 
                        fontSize: '0.875rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {premade.description}
                      </p>
                      {premade.roles && premade.roles.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '0.5rem', 
                          flexWrap: 'wrap',
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--albion-border)'
                        }}>
                          {premade.roles.slice(0, 3).map((role, idx) => (
                            <span key={idx} style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--albion-dark)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--albion-text-dim)'
                            }}>
                              {role.name} ({role.slots})
                            </span>
                          ))}
                          {premade.roles.length > 3 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--albion-dark)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--albion-text-dim)'
                            }}>
                              +{premade.roles.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoadingPremades && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--albion-text-dim)' }}>
                {t('createActivity.loadingTemplates')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Left Sidebar - Activity Tags */}
      <div style={{ 
        width: '280px', 
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
            {t('createActivity.activityTags')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--albion-text-dim)', marginBottom: '1rem' }}>
            {t('createActivity.tagsAutoAssigned')}
          </p>
          
          {/* Auto-assigned meta tags display */}
          {selectedActivityTypes.length > 0 && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.5rem 0.75rem', 
              backgroundColor: 'rgba(212, 175, 55, 0.1)', 
              borderRadius: '6px',
              border: '1px solid rgba(212, 175, 55, 0.3)'
            }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--albion-text-dim)', display: 'block', marginBottom: '0.375rem' }}>
                {t('createActivity.autoAssigned')}
              </span>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {getAutoAssignedMetaTags(selectedActivityTypes).map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: tag === 'PvE' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                      color: tag === 'PvE' ? '#2ecc71' : '#e74c3c',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 600
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '450px',
            overflowY: 'auto'
          }}>
            {Object.entries(ACTIVITY_TYPE_CATEGORIES).map(([category, types]) => (
              <div key={category}>
                <h4 style={{ 
                  fontSize: '0.75rem', 
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
                        padding: '0.4rem 0.6rem',
                        backgroundColor: selectedActivityTypes.includes(type) ? 'rgba(212, 175, 55, 0.15)' : 'var(--albion-darker)',
                        border: selectedActivityTypes.includes(type) ? '1px solid var(--albion-gold)' : '1px solid var(--albion-border)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontSize: '0.75rem'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedActivityTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedActivityTypes([...selectedActivityTypes, type]);
                          } else {
                            setSelectedActivityTypes(selectedActivityTypes.filter(t => t !== type));
                          }
                        }}
                        style={{ width: '0.8rem', height: '0.8rem', cursor: 'pointer' }}
                      />
                      <span style={{ color: selectedActivityTypes.includes(type) ? 'var(--albion-gold)' : 'var(--albion-text)' }}>
                        {t(`activityTypes.${type}`) || type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {selectedActivityTypes.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--albion-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--albion-text-dim)' }}>
                  {t('activities.selected', { count: selectedActivityTypes.length })}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedActivityTypes([])}
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
                {selectedActivityTypes.map(type => (
                  <span
                    key={type}
                    style={{
                      padding: '0.2rem 0.4rem',
                      backgroundColor: 'var(--albion-gold)',
                      color: 'var(--albion-darker)',
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
                      type="button"
                      onClick={() => setSelectedActivityTypes(selectedActivityTypes.filter(t => t !== type))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--albion-darker)',
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

      {/* Main Content - Form Card */}
      <div className="card" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 className="card-title" style={{ margin: 0 }}>
            {t('createActivity.title')}
          </h1>
          <button
            type="button"
            onClick={handleBackToSelection}
            className="btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            {t('createActivity.backButton')}
          </button>
        </div>

        {selectedPremadeId && (
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1rem', color: 'var(--albion-gold)' }}>✓</span>
            <p style={{ 
              margin: 0,
              fontSize: '0.875rem', 
              color: 'var(--albion-text)',
              fontWeight: 500
            }}>
              {t('createActivity.usingTemplate').split('<1>')[0]}<strong>{premadeActivities.find(p => p.id === selectedPremadeId)?.name}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Removed Premade Activity Selection - now handled in first step */}
          {false && premadeActivities.length > 0 && (
            <div style={{ 
              marginBottom: '2.5rem', 
              padding: '1.75rem',
              backgroundColor: 'var(--albion-darker)',
              borderRadius: '12px',
              border: '2px solid var(--albion-border)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <label style={{ 
                  display: 'block', 
                  margin: 0,
                  fontWeight: 600,
                  color: 'var(--albion-gold)',
                  fontSize: '1rem',
                  letterSpacing: '0.025em'
                }}>
                  Quick Start from Template
                </label>
                {selectedPremadeId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPremadeId('');
                      setFormData({
                        name: '',
                        date: defaultDateTime,
                        massupTime: undefined,
                        description: '',
                        zone: '',
                        minEquip: undefined,
                      });
                      setRoles([]);
                      setActivityType('regular');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--albion-border)',
                      borderRadius: '6px',
                      color: 'var(--albion-text-dim)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--albion-red)';
                      e.currentTarget.style.color = 'var(--albion-red)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--albion-border)';
                      e.currentTarget.style.color = 'var(--albion-text-dim)';
                    }}
                  >
                    Clear Template
                  </button>
                )}
              </div>
              <select
                value={selectedPremadeId}
                onChange={(e) => {
                  setSelectedPremadeId(e.target.value);
                  if (e.target.value) {
                    handleLoadPremade(e.target.value);
                  }
                }}
                disabled={isLoadingPremades}
                style={{ 
                  width: '100%',
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--albion-dark)',
                  border: '2px solid var(--albion-border)',
                  borderRadius: '8px',
                  color: 'var(--albion-text)',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d4af37' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--albion-gold)';
                }}
                onMouseLeave={(e) => {
                  if (!selectedPremadeId) {
                    e.currentTarget.style.borderColor = 'var(--albion-border)';
                  }
                }}
              >
                <option value="" style={{ padding: '0.5rem' }}>Start from scratch</option>
                {premadeActivities.map(premade => (
                  <option key={premade.id} value={premade.id} style={{ padding: '0.5rem' }}>
                    {premade.name} {premade.type ? `(${premade.type})` : ''}
                  </option>
                ))}
              </select>
              {selectedPremadeId && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.875rem',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ 
                    fontSize: '1rem',
                    color: 'var(--albion-gold)'
                  }}>✓</span>
                  <p style={{ 
                    margin: 0,
                    fontSize: '0.875rem', 
                    color: 'var(--albion-text)',
                    fontWeight: 500
                  }}>
                    Template loaded. You can modify any fields before creating the activity.
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('createActivity.activityType')} <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as 'regular' | 'transport')}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              <option value="regular">{t('createActivity.regularActivity')}</option>
              <option value="transport">{t('createActivity.transportActivity')}</option>
            </select>
            {activityType === 'transport' && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid var(--albion-gold)',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}>
                <strong className="text-gold">{t('createActivity.transportInfo').split(':')[0]}:</strong> {t('createActivity.transportInfo').split(':').slice(1).join(':').trim()}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('createActivity.activityName')} <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%' }}
              placeholder={t('createActivity.activityNamePlaceholder')}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('createActivity.dateTimeCET')} <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--albion-text-dim)'
                }}>
                  {t('createActivity.dateLabel')}
                </label>
                <input
                  type="text"
                  name="dateInput"
                  value={dateInput}
                  onChange={handleDateChange}
                  required
                  style={{ width: '100%' }}
                  placeholder={t('createActivity.datePlaceholder')}
                  pattern="\d{1,2}[\s.\/]+\d{1,2}[\s.\/]+\d{4}"
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8125rem',
                      backgroundColor: 'var(--albion-darker)',
                      border: '1px solid var(--albion-border)',
                      borderRadius: '6px',
                      color: 'var(--albion-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {t('createActivity.today')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8125rem',
                      backgroundColor: 'var(--albion-darker)',
                      border: '1px solid var(--albion-border)',
                      borderRadius: '6px',
                      color: 'var(--albion-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {t('createActivity.tomorrow')}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--albion-text-dim)'
                }}>
                  {t('createActivity.timeLabel')}
                </label>
                <input
                  type="text"
                  name="timeInput"
                  value={timeInput}
                  onChange={handleTimeChange}
                  required
                  style={{ width: '100%' }}
                  placeholder="HH:mm"
                  pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
                  maxLength={5}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {getQuickTimes().map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setQuickTime(time)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8125rem',
                        backgroundColor: 'var(--albion-darker)',
                        border: '1px solid var(--albion-border)',
                        borderRadius: '6px',
                        color: 'var(--albion-text)',
                        cursor: 'pointer'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('createActivity.massupTimeCET')} <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>({t('common.optional')})</span>
            </label>
            <input
              type="text"
              name="massupTime"
              value={massupTimeInput}
              onChange={handleMassupTimeChange}
              style={{ width: '100%' }}
              placeholder="HH:mm"
              pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              maxLength={5}
            />
            <p style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              color: 'var(--albion-text-dim)' 
            }}>
              {t('createActivity.massupTimeHelp')}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('common.description')} <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={{ width: '100%', minHeight: '120px' }}
              placeholder={t('createActivity.descriptionPlaceholder')}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('common.zone')} <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>({t('common.optional')})</span>
            </label>
            <input
              type="text"
              name="zone"
              value={formData.zone || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
              placeholder={t('createActivity.zonePlaceholder')}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              {t('createActivity.minEquipment')} <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>({t('common.optional')})</span>
            </label>
            <select
              name="minEquip"
              value={formData.minEquip || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
            >
              <option value="">{t('common.none')}</option>
              <option value="T4">T4</option>
              <option value="T5">T5</option>
              <option value="T6">T6</option>
              <option value="T7">T7</option>
              <option value="T8">T8</option>
              <option value="T9">T9</option>
              <option value="T10">T10</option>
              <option value="T11">T11</option>
            </select>
          </div>

          {/* Roles Section */}
          <div style={{ 
            marginBottom: '2rem', 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '2px solid var(--albion-border)' 
          }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ 
                color: 'var(--albion-gold)',
                fontSize: '1.25rem',
                fontWeight: 600
              }}>
                {t('createActivity.roles')} <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem', fontWeight: 400 }}>({t('common.optional')})</span>
              </h2>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddRole}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                {t('createActivity.addRole')}
              </button>
            </div>

            {showRoleForm && (
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--albion-darker)',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                  {editingRoleIndex !== null ? t('roles.editRole') : t('roles.newRole')}
                </h3>
                {activityType === 'transport' && editingRoleIndex === null ? (
                  <>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--albion-text)',
                        fontSize: '0.9375rem'
                      }}>
                        {t('roles.roleType')} <span style={{ color: 'var(--albion-red)' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          backgroundColor: 'var(--albion-dark)',
                          borderRadius: '8px',
                          border: isTransporterRole ? '2px solid var(--albion-gold)' : '1px solid var(--albion-border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="checkbox"
                            checked={isTransporterRole}
                            onChange={(e) => handleTransporterRoleChange(e.target.checked)}
                            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t('roles.transporter')}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)', marginTop: '0.25rem' }}>
                              {t('roles.transporterDesc')}
                            </div>
                          </div>
                        </label>

                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          backgroundColor: 'var(--albion-dark)',
                          borderRadius: '8px',
                          border: isFighterRole ? '2px solid var(--albion-gold)' : '1px solid var(--albion-border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}>
                          <input
                            type="checkbox"
                            checked={isFighterRole}
                            onChange={(e) => handleFighterRoleChange(e.target.checked)}
                            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{t('roles.fighter')}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--albion-text-dim)', marginTop: '0.25rem' }}>
                              {t('roles.fighterDesc')}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {isFighterRole && (
                      <>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: 'var(--albion-text)',
                            fontSize: '0.9375rem'
                          }}>
                            {t('roles.weaponType')} <span style={{ color: 'var(--albion-red)' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={weaponTypeAttr}
                            onChange={(e) => {
                              setWeaponTypeAttr(e.target.value);
                              setRoleFormData(prev => ({
                                ...prev,
                                attributes: e.target.value ? { weaponType: e.target.value } : {},
                              }));
                            }}
                            placeholder="DPS"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem',
                            fontWeight: 600,
                            color: 'var(--albion-text)',
                            fontSize: '0.9375rem'
                          }}>
                            {t('common.slots')} <span style={{ color: 'var(--albion-red)' }}>*</span>
                          </label>
                          <input
                            type="number"
                            value={roleFormData.slots}
                            onChange={(e) => setRoleFormData(prev => ({ ...prev, slots: parseInt(e.target.value) || 1 }))}
                            required
                            min="1"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--albion-text)',
                        fontSize: '0.9375rem'
                      }}>
                        {t('roles.roleName')} <span style={{ color: 'var(--albion-red)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={roleFormData.name}
                        onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        style={{ width: '100%' }}
                        placeholder={t('roles.roleNamePlaceholder')}
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--albion-text)',
                        fontSize: '0.9375rem'
                      }}>
                        {t('common.slots')} <span style={{ color: 'var(--albion-red)' }}>*</span>
                      </label>
                      <input
                        type="number"
                        value={roleFormData.slots}
                        onChange={(e) => setRoleFormData(prev => ({ ...prev, slots: parseInt(e.target.value) || 1 }))}
                        required
                        min="1"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--albion-text)',
                        fontSize: '0.9375rem'
                      }}>
                        {t('roles.attributes')}
                      </label>
                      <div className="flex" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={newAttributeKey}
                          onChange={(e) => setNewAttributeKey(e.target.value)}
                          placeholder={t('roles.keyPlaceholder')}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          value={newAttributeValue}
                          onChange={(e) => setNewAttributeValue(e.target.value)}
                          placeholder={t('roles.valuePlaceholder')}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleAddAttribute}
                        >
                          {t('common.add')}
                        </button>
                      </div>
                      {Object.keys(roleFormData.attributes).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {Object.entries(roleFormData.attributes).map(([key, value]) => (
                            <div
                              key={key}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: 'var(--albion-dark)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <span>{key}: {String(value)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttribute(key)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--albion-red)',
                                  cursor: 'pointer',
                                  padding: '0.25rem'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {roleError && (
                  <div style={{ 
                    color: 'var(--albion-red)', 
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(192, 57, 43, 0.15)',
                    borderRadius: '12px',
                    border: '1px solid rgba(192, 57, 43, 0.3)',
                    fontWeight: 500
                  }}>
                    {roleError}
                  </div>
                )}

                <div className="flex" style={{ gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleSaveRole}
                  >
                    {editingRoleIndex !== null ? t('roles.updateRole') : t('roles.addRoleBtn')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCancelRole}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {roles.length === 0 && !showRoleForm ? (
              <p className="text-dim" style={{ fontSize: '0.875rem' }}>
                {t('createActivity.noRolesYet')}
              </p>
            ) : (
              roles.length > 0 && (
                <div>
                  {roles.map((role, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        backgroundColor: 'var(--albion-darker)',
                        borderRadius: '4px',
                        border: '1px solid var(--albion-border)'
                      }}
                    >
                      <div className="flex-between">
                        <div>
                          <strong>{role.name}</strong> ({role.slots} slots)
                          {Object.keys(role.attributes).length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                              {Object.entries(role.attributes).map(([key, value]) => (
                                <span key={key} className="text-dim" style={{ marginRight: '1rem' }}>
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex" style={{ gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleEditRole(index)}
                            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => handleDeleteRole(index)}
                            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

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

          {templateSuccess && (
            <div style={{ 
              color: 'var(--albion-gold)', 
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              fontWeight: 500
            }}>
              {templateSuccess}
            </div>
          )}

          <div className="flex" style={{ gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--albion-border)' }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || savingTemplate}
            >
              {loading ? t('common.creating') : t('createActivity.createActivityBtn')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSaveAsTemplate}
              disabled={loading || savingTemplate || !formData.name || !formData.description}
              style={{
                opacity: (!formData.name || !formData.description) ? 0.5 : 1,
                cursor: (!formData.name || !formData.description) ? 'not-allowed' : 'pointer'
              }}
            >
              {savingTemplate ? t('common.saving') : t('createActivity.saveAsTemplate')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              disabled={loading || savingTemplate}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
