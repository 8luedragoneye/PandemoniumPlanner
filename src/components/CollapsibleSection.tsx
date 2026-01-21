import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string | ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = false,
  className = ''
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`card ${className}`} style={{ marginBottom: '1.5rem', padding: '0', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '1.5rem 2rem',
          marginBottom: isExpanded ? '1.5rem' : '0',
          borderBottom: isExpanded ? '1px solid var(--albion-border)' : 'none',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1
        }}>
          {typeof title === 'string' ? (
            <h2 style={{ 
              margin: 0,
              color: 'var(--albion-gold)',
              fontSize: '1.25rem',
              fontWeight: 600
            }}>
              {title}
            </h2>
          ) : (
            title
          )}
        </div>
        <span
          style={{
            display: 'inline-block',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: '1.25rem',
            color: 'var(--albion-gold)',
            userSelect: 'none'
          }}
        >
          ▼
        </span>
      </div>
      {isExpanded && (
        <div 
          style={{
            animation: 'fadeIn 0.2s ease',
            padding: '0 2rem 2rem 2rem'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}
