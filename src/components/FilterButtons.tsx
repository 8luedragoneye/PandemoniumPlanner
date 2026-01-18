// Simple, reusable filter button component
interface FilterButtonsProps {
  currentFilter: string;
  filters: Array<{ value: string; label: string }>;
  onFilterChange: (filter: string) => void;
}

export function FilterButtons({ currentFilter, filters, onFilterChange }: FilterButtonsProps) {
  return (
    <div style={{ 
      marginBottom: '2rem', 
      display: 'flex', 
      gap: '0.75rem', 
      flexWrap: 'wrap',
      padding: '0.5rem',
      backgroundColor: 'var(--albion-darker)',
      borderRadius: '12px',
      border: '1px solid var(--albion-border)'
    }}>
      {filters.map(filter => (
        <button
          key={filter.value}
          className={currentFilter === filter.value ? 'btn-primary' : 'btn-secondary'}
          onClick={() => onFilterChange(filter.value)}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem'
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
