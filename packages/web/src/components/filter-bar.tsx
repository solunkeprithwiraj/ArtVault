'use client';

interface FilterBarProps {
  tags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  mediaType: string;
  onMediaTypeChange: (type: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  layout: 'masonry' | 'grid' | 'list' | 'museum' | 'portfolio';
  onLayoutChange: (layout: 'masonry' | 'grid' | 'list' | 'museum' | 'portfolio') => void;
}

export function FilterBar({
  tags,
  activeTags,
  onToggleTag,
  mediaType,
  onMediaTypeChange,
  sort,
  onSortChange,
  showFavorites,
  onToggleFavorites,
  layout,
  onLayoutChange,
}: FilterBarProps) {
  const selectClass =
    'rounded-lg border border-themed bg-themed-input px-3 py-2 text-sm text-themed focus:border-[var(--accent)] focus:outline-none';

  return (
    <div className="mb-6 space-y-4">
      {/* Top row: filters + layout toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Media type filter */}
        <select value={mediaType} onChange={(e) => onMediaTypeChange(e.target.value)} className={selectClass}>
          <option value="">All Types</option>
          <option value="IMAGE">Images</option>
          <option value="VIDEO">Videos</option>
          <option value="IFRAME">Embeds</option>
        </select>

        {/* Sort */}
        <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={selectClass}>
          <option value="custom">Custom Order</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title A-Z</option>
          <option value="title_desc">Title Z-A</option>
        </select>

        {/* Favorites toggle */}
        <button
          onClick={onToggleFavorites}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            showFavorites
              ? 'accent-bg text-white'
              : 'bg-themed-input text-themed-secondary hover:text-themed'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill={showFavorites ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          Favorites
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Layout toggles */}
        <div className="flex rounded-lg border border-themed bg-themed-input p-0.5">
          {([
            { value: 'masonry' as const, label: 'Masonry' },
            { value: 'grid' as const, label: 'Grid' },
            { value: 'list' as const, label: 'List' },
            { value: 'museum' as const, label: 'Museum' },
            { value: 'portfolio' as const, label: 'Portfolio' },
          ]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onLayoutChange(value)}
              className={`rounded-md p-1.5 transition-colors ${
                layout === value ? 'bg-themed-card text-themed shadow-sm' : 'text-themed-muted hover:text-themed'
              }`}
              title={label}
            >
              <span className="text-[10px] font-medium">{label.slice(0, 3)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags row */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => activeTags.length > 0 && activeTags.forEach(onToggleTag)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
              activeTags.length === 0
                ? 'accent-bg text-white'
                : 'bg-themed-input text-themed-secondary hover:text-themed'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                activeTags.includes(tag)
                  ? 'accent-bg text-white'
                  : 'bg-themed-input text-themed-secondary hover:text-themed'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
