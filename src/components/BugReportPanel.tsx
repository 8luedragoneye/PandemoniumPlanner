import { useState, useEffect, useCallback } from 'react';
import { bugReportsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiBugReport } from '../lib/apiTypes';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  open: '#c0392b',
  in_progress: '#3498db',
  resolved: '#27ae60',
  closed: '#7f8c8d',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BugReportPanel(): JSX.Element {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reports, setReports] = useState<ApiBugReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'mine'>('all');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bugReportsApi.getAll();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch bug reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, fetchReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setSubmitting(true);
    try {
      await bugReportsApi.create({ title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      setShowForm(false);
      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bug report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bugReportsApi.delete(id);
      await fetchReports();
    } catch (err) {
      console.error('Failed to delete bug report:', err);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'open') return r.status === 'open' || r.status === 'in_progress';
    if (filter === 'mine') return r.reporterId === user?.id;
    return true;
  });

  return (
    <>
      {/* Floating Bug Report Button */}
      <button
        className="bug-report-fab"
        onClick={() => setIsOpen(!isOpen)}
        title="Report a Bug"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          zIndex: 1000,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          padding: 0,
          background: isOpen
            ? 'linear-gradient(135deg, var(--albion-gold) 0%, var(--albion-gold-dark) 100%)'
            : 'linear-gradient(135deg, var(--albion-red) 0%, var(--albion-red-dark) 100%)',
          color: isOpen ? 'var(--albion-dark)' : 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isOpen
            ? 'var(--shadow-gold-hover)'
            : '0 4px 14px 0 rgba(192, 57, 43, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '1.5rem',
          lineHeight: 1,
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>X</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="bug-report-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className="bug-report-panel"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '440px',
          maxWidth: '100vw',
          height: 'calc(100vh - 70px)',
          backgroundColor: 'var(--albion-darker)',
          borderRight: '2px solid var(--albion-gold)',
          borderTop: '2px solid var(--albion-gold)',
          zIndex: 999,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Panel Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '2px solid var(--albion-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: 'linear-gradient(180deg, rgba(25, 25, 25, 1) 0%, rgba(15, 15, 15, 1) 100%)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--albion-gold)',
            letterSpacing: '-0.025em',
          }}>
            Bug Reports
          </h2>
          <button
            className="btn-primary"
            onClick={() => { setShowForm(!showForm); setError(''); }}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
          >
            {showForm ? 'Cancel' : '+ Report Bug'}
          </button>
        </div>

        {/* New Bug Report Form */}
        {showForm && (
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '2px solid var(--albion-border)',
            flexShrink: 0,
            background: 'rgba(37, 37, 37, 0.5)',
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--albion-text-dim)',
                  marginBottom: '0.375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the bug"
                  style={{ borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--albion-text-dim)',
                  marginBottom: '0.375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Steps to reproduce, expected vs actual behavior..."
                  style={{
                    borderRadius: '8px',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.875rem',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
              </div>
              {error && (
                <p style={{
                  color: 'var(--albion-red)',
                  fontSize: '0.8125rem',
                  marginBottom: '0.75rem',
                  fontWeight: 500,
                }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem' }}
              >
                {submitting ? (
                  <>
                    <span className="loading-spinner" style={{ width: '0.875rem', height: '0.875rem' }}></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Bug Report'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0',
          padding: '0 1.5rem',
          borderBottom: '1px solid var(--albion-border)',
          flexShrink: 0,
        }}>
          {(['all', 'open', 'mine'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: filter === f ? '2px solid var(--albion-gold)' : '2px solid transparent',
                color: filter === f ? 'var(--albion-gold)' : 'var(--albion-text-dim)',
                padding: '0.75rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                borderRadius: 0,
                boxShadow: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Mine'}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1.5rem',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="loading-spinner" style={{
                width: '1.5rem',
                height: '1.5rem',
                borderWidth: '2px',
                color: 'var(--albion-gold)',
                margin: '0 auto',
              }}></div>
              <p className="text-dim" style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem 0',
              color: 'var(--albion-text-dim)',
            }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>No bug reports found</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                {filter === 'mine' ? "You haven't reported any bugs yet." : 'No reports match this filter.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    backgroundColor: 'var(--albion-bg-secondary)',
                    border: '1px solid var(--albion-border)',
                    borderRadius: '10px',
                    padding: '1rem 1.125rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--albion-text)',
                      lineHeight: 1.3,
                      flex: 1,
                    }}>
                      {report.title}
                    </h4>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.2rem 0.625rem',
                      borderRadius: '12px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: STATUS_COLORS[report.status] + '22',
                      color: STATUS_COLORS[report.status],
                      border: `1px solid ${STATUS_COLORS[report.status]}44`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    color: 'var(--albion-text-dim)',
                    lineHeight: 1.5,
                    marginBottom: '0.625rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {report.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--albion-text-dim)',
                  }}>
                    <span>
                      by <span style={{ color: 'var(--albion-gold)', fontWeight: 500 }}>
                        {report.reporter?.name || 'Unknown'}
                      </span>
                      {' · '}
                      {formatDate(report.createdAt)}
                    </span>
                    {report.reporterId === user?.id && (
                      <button
                        onClick={() => handleDelete(report.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--albion-red)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          boxShadow: 'none',
                          opacity: 0.7,
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                        title="Delete this bug report"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
