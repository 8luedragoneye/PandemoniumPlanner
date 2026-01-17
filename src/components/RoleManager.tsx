import { useState } from 'react';
import { Role, Signup } from '../types';
import { getSignupCount, isRoleFull } from '../lib/utils';
import { rolesApi } from '../lib/api';

interface RoleManagerProps {
  activityId: string;
  roles: Role[];
  signups: Signup[];
}

export function RoleManager({ activityId, roles, signups, onUpdate }: RoleManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slots: 1,
    attributes: {} as Record<string, any>,
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
    setError('');
    setLoading(true);

    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, {
          name: formData.name,
          slots: formData.slots,
          attributes: formData.attributes,
        });
      } else {
        await rolesApi.create({
          activityId,
          name: formData.name,
          slots: formData.slots,
          attributes: formData.attributes,
        });
      }
      setShowForm(false);
      setEditingRole(null);
      setFormData({ name: '', slots: 1, attributes: {} });
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      slots: role.slots,
      attributes: role.attributes,
    });
    setShowForm(true);
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? All sign-ups for this role will be deleted.`)) return;

    try {
      await rolesApi.delete(role.id);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert('Failed to delete role');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--albion-gold)' }}>Manage Roles</h2>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingRole(null);
            setFormData({ name: '', slots: 1, attributes: {} });
            setShowForm(true);
          }}
        >
          Add Role
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--albion-darker)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {editingRole ? 'Edit Role' : 'New Role'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Role Name *
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Slots *
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
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
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: 'rgba(192, 57, 43, 0.1)',
                borderRadius: '4px'
              }}>
                {error}
              </div>
            )}

            <div className="flex" style={{ gap: '1rem' }}>
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
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {roles.length === 0 ? (
        <p className="text-dim">No roles defined. Add roles to allow sign-ups.</p>
      ) : (
        <div>
          {roles.map(role => {
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
                      className="btn-secondary"
                      onClick={() => handleEdit(role)}
                    >
                      Edit
                    </button>
                    <button
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
