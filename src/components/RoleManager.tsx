import { useState, useEffect } from 'react';
import { Role, Signup } from '../types';
import { getSignupCount, isRoleFull } from '../lib/utils';
import { rolesApi } from '../lib/api';

interface RoleManagerProps {
  activityId: string;
  roles: Role[];
  signups: Signup[];
  onUpdate?: () => void;
}

export function RoleManager({ activityId, roles, signups, onUpdate }: RoleManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [localRoles, setLocalRoles] = useState<Role[]>(roles);
  
  // Sync local roles with props when they change
  useEffect(() => {
    setLocalRoles(roles);
  }, [roles]);
  const [formData, setFormData] = useState({
    name: '',
    slots: 1,
    attributes: {} as Record<string, unknown>,
  });
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddAttribute = () => {
    if (!newAttributeKey.trim()) return;
    setFormData(prev => ({
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
    setFormData(prev => {
      const newAttrs = { ...prev.attributes };
      delete newAttrs[key];
      return {
        ...prev,
        attributes: newAttrs,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called', { editingRole: editingRole?.id, formData });
    setError('');
    setLoading(true);

    try {
      if (editingRole) {
        console.log('Updating role:', editingRole.id, 'with data:', {
          name: formData.name,
          slots: formData.slots,
          attributes: formData.attributes,
        });
        const updated = await rolesApi.update(editingRole.id, {
          name: formData.name,
          slots: formData.slots,
          attributes: formData.attributes,
        });
        console.log('Role updated successfully:', updated);
        // Call onUpdate to refresh the roles list BEFORE closing form
        if (onUpdate) {
          console.log('Calling onUpdate callback...');
          await onUpdate();
          console.log('onUpdate callback completed');
        } else {
          console.warn('onUpdate callback is not defined!');
        }
      } else {
        console.log('Creating new role with data:', {
          activityId,
          name: formData.name,
          slots: formData.slots,
          attributes: formData.attributes,
        });
        await rolesApi.create({
          activityId,
          name: formData.name,
          slots: formData.slots,
          attributes: formData.attributes,
        });
        console.log('Role created successfully');
        // Call onUpdate to refresh the roles list BEFORE closing form
        if (onUpdate) {
          console.log('Calling onUpdate callback...');
          await onUpdate();
          console.log('onUpdate callback completed');
        } else {
          console.warn('onUpdate callback is not defined!');
        }
      }
      setShowForm(false);
      setEditingRole(null);
      setFormData({ name: '', slots: 1, attributes: {} });
      console.log('Form reset and closed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
      console.error('Error saving role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    // Reset form state first
    setError('');
    setNewAttributeKey('');
    setNewAttributeValue('');
    
    // Set editing role and populate form
    setEditingRole(role);
    setFormData({
      name: role.name,
      slots: role.slots,
      attributes: { ...role.attributes }, // Create a copy to avoid reference issues
    });
    setShowForm(true);
    
    // Scroll form into view
    setTimeout(() => {
      const formElement = document.querySelector('[data-role-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? All sign-ups for this role will be deleted.`)) return;

    try {
      await rolesApi.delete(role.id);
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ 
          color: 'var(--albion-gold)',
          fontSize: '1.5rem',
          fontWeight: 600
        }}>
          Manage Roles
        </h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            // Reset form state
            setError('');
            setNewAttributeKey('');
            setNewAttributeValue('');
            setEditingRole(null);
            setFormData({ name: '', slots: 1, attributes: {} });
            setShowForm(true);
            
            // Scroll form into view
            setTimeout(() => {
              const formElement = document.querySelector('[data-role-form]');
              if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          }}
        >
          + Add Role
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--albion-darker)',
          borderRadius: '12px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {editingRole ? 'Edit Role' : 'New Role'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem',
                fontWeight: 600,
                color: 'var(--albion-text)',
                fontSize: '0.9375rem'
              }}>
                Role Name <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{ width: '100%' }}
                placeholder="e.g., Tank, Healer, DPS"
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
                Slots <span style={{ color: 'var(--albion-red)' }}>*</span>
              </label>
              <input
                type="number"
                value={formData.slots}
                onChange={(e) => setFormData(prev => ({ ...prev, slots: parseInt(e.target.value) || 1 }))}
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
                Attributes (Requirements)
              </label>
              <div className="flex" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={newAttributeKey}
                  onChange={(e) => setNewAttributeKey(e.target.value)}
                  placeholder="Key (e.g., min_IP)"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  value={newAttributeValue}
                  onChange={(e) => setNewAttributeValue(e.target.value)}
                  placeholder="Value (e.g., 1300)"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddAttribute}
                >
                  Add
                </button>
              </div>
              {Object.keys(formData.attributes).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(formData.attributes).map(([key, value]) => (
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

            <div className="flex" style={{ gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--albion-border)' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingRole ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingRole(null);
                  setFormData({ name: '', slots: 1, attributes: {} });
                  setError('');
                  setNewAttributeKey('');
                  setNewAttributeValue('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {localRoles.length === 0 ? (
        <p className="text-dim">No roles defined. Add roles to allow sign-ups.</p>
      ) : (
        <div>
          {localRoles.map(role => {
            const count = getSignupCount(role.id, signups);
            const full = isRoleFull(role.id, role.slots, signups);
            return (
              <div
                key={role.id}
                style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--albion-darker)',
                  borderRadius: '4px',
                  border: full ? '1px solid var(--albion-red)' : '1px solid var(--albion-border)'
                }}
              >
                <div className="flex-between">
                  <div>
                    <strong>{role.name}</strong> ({count}/{role.slots})
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
                      onClick={() => handleEdit(role)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(role)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
