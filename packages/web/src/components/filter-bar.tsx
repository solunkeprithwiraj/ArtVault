'use client';

import { useState } from 'react';
import { ThemedSelect } from './themed-select';

interface TagWithCount {
  name: string;
  count: number;
}

interface FilterBarProps {
  tags: TagWithCount[];
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

const TOP_TAGS_COUNT = 10;

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
  const [showAllTags, setShowAllTags] = useState(false);

  const visibleTags = showAllTags ? tags : tags.slice(0, TOP_TAGS_COUNT);
  const hiddenCount = tags.length - TOP_TAGS_COUNT;

  return (
    <div className="mb-6 space-y-4">
      {/* Top row: filters + layout toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <ThemedSelect
          value={mediaType}
          onValueChange={onMediaTypeChange}
          placeholder="All Types"
          options={[
            { value: 'ALL', label: 'All Types' },
            { value: 'IMAGE', label: 'Images' },
            { value: 'VIDEO', label: 'Videos' },
            { value: 'IFRAME', label: 'Embeds' },
          ]}
        />

        <ThemedSelect
          value={sort}
          onValueChange={onSortChange}
          placeholder="Sort"
          options={[
            { value: 'custom', label: 'Custom Order' },
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
            { value: 'title', label: 'Title A-Z' },
            { value: 'title_desc', label: 'Title Z-A' },
          ]}
        />

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

        <div className="flex-1" />

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

      {/* Tags row with counts */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
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
          {visibleTags.map((tag) => {
            const isActive = activeTags.includes(tag.name);
            const maxCount = tags[0]?.count || 1;
            const opacity = 0.15 + (tag.count / maxCount) * 0.85;
            return (
              <button
                key={tag.name}
                onClick={() => onToggleTag(tag.name)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                  isActive
                    ? 'accent-bg text-white shadow-sm'
                    : 'bg-themed-input text-themed-secondary hover:text-themed'
                }`}
              >
                {tag.name}
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold leading-none"
                  style={{
                    backgroundColor: isActive
                      ? `rgba(255,255,255,${opacity * 0.3})`
                      : `rgba(236,72,153,${opacity})`,
                    color: isActive ? 'white' : 'white',
                  }}
                >
                  {tag.count}
                </span>
              </button>
            );
          })}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              className="rounded-full border border-themed px-3 py-1.5 text-xs font-medium text-themed-muted transition-colors hover:border-[var(--accent)] hover:text-themed sm:px-4 sm:text-sm"
            >
              {showAllTags ? 'Show less' : `+${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
