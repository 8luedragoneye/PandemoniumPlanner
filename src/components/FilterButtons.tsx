// Simple, reusable filter button component
interface FilterButtonsProps {
  currentFilter: string;
  filters: Array<{ value: string; label: string }>;
  onFilterChange: (filter: string) => void;
}

export function FilterButtons({ currentFilter, filters, onFilterChange }: FilterButtonsProps) {
  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {filters.map(filter => (
        <button
          key={filter.value}
          className={currentFilter === filter.value ? 'btn-primary' : 'btn-secondary'}
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
