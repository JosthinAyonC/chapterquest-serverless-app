import type { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export default function Tabs({ items, activeId, onChange, ariaLabel }: TabsProps) {
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className="tabs">
      <div
        className="tabs-list"
        role="tablist"
        aria-label={ariaLabel ?? 'Sections'}
      >
        {items.map((item) => {
          const selected = item.id === activeItem?.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${item.id}`}
              className={`tabs-trigger${selected ? ' tabs-trigger--active' : ''}`}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        className="tabs-panel"
        role="tabpanel"
        id={`tabpanel-${activeItem?.id}`}
        aria-labelledby={`tab-${activeItem?.id}`}
      >
        {activeItem?.content}
      </div>
    </div>
  );
}
