import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ActivityFormData, Role, Signup } from '../types';
import { formatCETDate, formatDateInput, parseDateInput } from '../lib/utils';
import { transformActivity, transformRole, transformSignup } from '../lib/transformers';
import { activitiesApi, rolesApi, signupsApi } from '../lib/api';
import { RoleManager } from './RoleManager';
import { ACTIVITY_TYPE_CATEGORIES, getAutoAssignedMetaTags } from '../lib/constants';

export function EditActivity(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activityRoles, setActivityRoles] = useState<Role[]>([]);
  const [activitySignups, setActivitySignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    date: '',
    massupTime: undefined,
    description: '',
    zone: '',
    minEquip: undefined,
  });
  const [dateInput, setDateInput] = useState<string>(''); // German format: dd mm yyyy
  const [timeInput, setTimeInput] = useState<string>(''); // HH:mm
  const [massupTimeInput, setMassupTimeInput] = useState<string>(''); // Just time (HH:mm)
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchActivity = async () => {
      try {
        const record = await activitiesApi.getOne(id);
        const activity = transformActivity(record);
        
        if (activity.creator !== user?.id) {
          navigate('/');
          return;
        }

        setActivity(activity);
        const activityDate = formatCETDate(activity.date).replace(' ', 'T');
        const activityDateStr = formatDateInput(activity.date);
        const activityTimeStr = formatCETDate(activity.date).split('T')[1].substring(0, 5);
        
        let massupTimeStr = '';
        if (activity.massupTime) {
          const massupDate = new Date(activity.massupTime);
          massupTimeStr = `${String(massupDate.getHours()).padStart(2, '0')}:${String(massupDate.getMinutes()).padStart(2, '0')}`;
        } else {
          massupTimeStr = activityTimeStr;
        }
        
        setFormData({
          name: activity.name,
          date: activityDate,
          massupTime: activity.massupTime ? formatCETDate(activity.massupTime).replace(' ', 'T') : undefined,
          description: activity.description,
          zone: activity.zone || '',
          minEquip: activity.minEquip || undefined,
        });
        setDateInput(activityDateStr);
        setTimeInput(activityTimeStr);
        setMassupTimeInput(massupTimeStr);
        setSelectedActivityTypes(activity.activityTypes || []);
        
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
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activity:', error);
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !user) return;

    setError('');
    setSaving(true);

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
          setError('Massup time cannot be later than activity date');
          setSaving(false);
          return;
        }
        
        // Format as datetime-local string
        massupTime = formatCETDate(massupDate).replace(' ', 'T');
      }

      // Combine selected types with auto-assigned meta tags
      const autoMetaTags = getAutoAssignedMetaTags(selectedActivityTypes);
      const allActivityTypes = [...selectedActivityTypes, ...autoMetaTags];

      await activitiesApi.update(activity.id, {
        name: formData.name,
        date: formData.date,
        massupTime: massupTime,
        description: formData.description,
        zone: formData.zone || undefined,
        minEquip: formData.minEquip || undefined,
        activityTypes: allActivityTypes,
      });
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update activity');
    } finally {
      setSaving(false);
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
      const isoString = formatCETDate(parsedDate).replace(' ', 'T').split('T')[0] + 'T00:00';
      setFormData(prev => ({ ...prev, date: isoString }));
    }
    
    // Auto-update massup time when date changes (if time is set)
    if (timeInput) {
      setMassupTimeInput(timeInput);
    }
    setError('');
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
    setError('');
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
    setError('');
  };

  // Generate next 4 hours from current time in CET (rounded up)
  const getQuickTimes = (): string[] => {
    const now = new Date();
    // Get current time in CET
    const cetTimeStr = formatCETDate(now);
    const [datePart, timePart] = cetTimeStr.split('T');
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
    setError('');
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
    setError(''); // Clear any previous errors
  };

  const handleStatusChange = async (newStatus: 'recruiting' | 'full' | 'running') => {
    if (!activity) return;
    try {
      await activitiesApi.update(activity.id, { status: newStatus });
      setActivity({ ...activity, status: newStatus });
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!activity) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${activity.name}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setSaving(true);
    setError('');

    try {
      await activitiesApi.delete(activity.id);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity');
      setSaving(false);
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

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <div className="card">
        <h1 className="card-title" style={{ marginBottom: '1.5rem' }}>
          Edit Activity
        </h1>

        <div style={{ 
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--albion-darker)',
          borderRadius: '12px',
          border: '1px solid var(--albion-border)'
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '1rem',
            fontWeight: 600,
            color: 'var(--albion-text)',
            fontSize: '0.9375rem'
          }}>
            Activity Status
          </label>
          <div className="flex" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={activity.status === 'recruiting' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('recruiting')}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
            >
              Recruiting
            </button>
            <button
              type="button"
              className={activity.status === 'full' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('full')}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
            >
              Full
            </button>
            <button
              type="button"
              className={activity.status === 'running' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => handleStatusChange('running')}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
            >
              Running
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Activity Name <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
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
              Datum & Zeit (CET) <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--albion-text-dim)'
                }}>
                  Datum (dd mm yyyy)
                </label>
                <input
                  type="text"
                  name="dateInput"
                  value={dateInput}
                  onChange={handleDateChange}
                  required
                  style={{ width: '100%' }}
                  placeholder="dd mm yyyy oder dd.mm.yyyy"
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
                    Heute
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
                    Morgen
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
                  Zeit (HH:mm)
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
              Massup Zeit (CET) <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
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
              Auto-set to activity time when date is set. Uses the same date as the activity.
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
              Description <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={{ width: '100%', minHeight: '120px' }}
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
              Zone <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
            </label>
            <input
              type="text"
              name="zone"
              value={formData.zone || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
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
              Minimum Equipment <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(optional)</span>
            </label>
            <select
              name="minEquip"
              value={formData.minEquip || ''}
              onChange={handleChange}
              style={{ width: '100%' }}
            >
              <option value="">None</option>
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

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Activity Tags <span style={{ color: 'var(--albion-text-dim)', fontSize: '0.875rem' }}>(PvE/PvP auto-assigned)</span>
            </label>
            
            {/* Auto-assigned meta tags display */}
            {selectedActivityTypes.length > 0 && (
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.5rem 0.75rem', 
                backgroundColor: 'rgba(212, 175, 55, 0.1)', 
                borderRadius: '6px',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--albion-text-dim)', marginRight: '0.5rem' }}>
                  Auto-assigned:
                </span>
                {getAutoAssignedMetaTags(selectedActivityTypes).map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: tag === 'PvE' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                      color: tag === 'PvE' ? '#2ecc71' : '#e74c3c',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      marginRight: '0.5rem'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--albion-darker)',
              borderRadius: '8px',
              border: '1px solid var(--albion-border)'
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
                    {category}
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
                          backgroundColor: selectedActivityTypes.includes(type) ? 'rgba(212, 175, 55, 0.15)' : 'var(--albion-dark)',
                          border: selectedActivityTypes.includes(type) ? '1px solid var(--albion-gold)' : '1px solid var(--albion-border)',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontSize: '0.8125rem'
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
                          style={{ width: '0.875rem', height: '0.875rem', cursor: 'pointer' }}
                        />
                        <span style={{ color: selectedActivityTypes.includes(type) ? 'var(--albion-gold)' : 'var(--albion-text)' }}>
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedActivityTypes.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--albion-text-dim)' }}>Selected:</span>
                {selectedActivityTypes.map(type => (
                  <span
                    key={type}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--albion-gold)',
                      color: 'var(--albion-darker)',
                      borderRadius: '10px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => setSelectedActivityTypes(selectedActivityTypes.filter(t => t !== type))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--albion-darker)',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.875rem',
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedActivityTypes([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--albion-text-dim)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textDecoration: 'underline',
                    marginLeft: '0.5rem'
                  }}
                >
                  Clear all
                </button>
              </div>
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

          <div className="flex" style={{ gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--albion-border)' }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDelete}
              disabled={saving}
              style={{
                backgroundColor: 'var(--albion-red)',
                color: 'white',
                marginLeft: 'auto'
              }}
            >
              Delete Activity
            </button>
          </div>
        </form>

        <div style={{ 
          marginBottom: '2rem', 
          marginTop: '2rem', 
          paddingTop: '2rem', 
          borderTop: '2px solid var(--albion-border)' 
        }}>
          <RoleManager 
            activityId={activity.id} 
            roles={activityRoles} 
            signups={activitySignups}
            activityType={activity.type}
            onUpdate={async () => {
              try {
                const roleRecords = await rolesApi.getByActivity(activity.id);
                setActivityRoles(roleRecords.map(transformRole));
                
                const signupRecords = await signupsApi.getByActivity(activity.id);
                setActivitySignups(signupRecords.map(transformSignup));
              } catch (error) {
                console.error('Error refetching roles/signups:', error);
                alert('Failed to refresh roles. Please reload the page.');
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
