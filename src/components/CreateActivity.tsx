import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ActivityFormData } from '../types';
import { formatCETDate, formatDateInput, parseDateInput } from '../lib/utils';
import { activitiesApi } from '../lib/api';

export function CreateActivity(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    date: '',
    massupTime: undefined,
    description: '',
    zone: '',
    minEquip: undefined,
  });
  const [activityType, setActivityType] = useState<'regular' | 'transport'>('regular');
  // Initialize with current date/time in German format
  const now = new Date();
  const defaultDate = formatDateInput(now);
  const defaultTime = formatCETDate(now).split('T')[1].substring(0, 5);
  const defaultDateTime = formatCETDate(now).replace(' ', 'T');
  
  const [dateInput, setDateInput] = useState<string>(defaultDate); // German format: dd mm yyyy
  const [timeInput, setTimeInput] = useState<string>(defaultTime); // HH:mm
  const [massupTimeInput, setMassupTimeInput] = useState<string>(''); // Just time (HH:mm)
  
  // Initialize formData.date with default datetime
  useEffect(() => {
    if (!formData.date) {
      setFormData(prev => ({ ...prev, date: defaultDateTime }));
    }
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
          setError('Massup time cannot be later than activity date');
          setLoading(false);
          return;
        }
        
        // Format as datetime-local string
        massupTime = formatCETDate(massupDate).replace(' ', 'T');
      }

      const activity = await activitiesApi.create({
        name: formData.name,
        date: formData.date,
        massupTime: massupTime,
        description: formData.description,
        zone: formData.zone || undefined,
        minEquip: formData.minEquip || undefined,
        type: activityType,
      });

      navigate(`/activity/${activity.id}/edit`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
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


  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <div className="card">
        <h1 className="card-title" style={{ marginBottom: '2rem' }}>
          Create New Activity
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem',
              fontWeight: 600,
              color: 'var(--albion-text)',
              fontSize: '0.9375rem'
            }}>
              Activity Type <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as 'regular' | 'transport')}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              <option value="regular">Regular Activity</option>
              <option value="transport">Transport Activity</option>
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
                <strong className="text-gold">Transport Activity:</strong> This activity will use the transport pairing system. Participants will need to provide source, target, and other transport-specific information when signing up.
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
              Activity Name <span style={{ color: 'var(--albion-red)' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%' }}
              placeholder="e.g., Black Zone Raid"
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
              placeholder="Describe the activity..."
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
              placeholder="e.g., Thetford, Martlock"
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
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Activity'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
