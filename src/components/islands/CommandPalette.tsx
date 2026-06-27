/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';

interface Item {
  title: string;
  href: string;
  kind: string;
}

export default function CommandPalette({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    document.addEventListener('allm:open-search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('allm:open-search', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  if (!open) return null;

  const filtered = (q ? items.filter((i) => i.title.toLowerCase().includes(q.toLowerCase())) : items).slice(0, 12);
  const go = (i?: Item) => i && (location.href = i.href);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(filtered[sel]);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div class="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={q}
          onInput={(e) => {
            setQ((e.target as HTMLInputElement).value);
            setSel(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Jump to a module or lesson…"
          aria-label="Search modules and lessons"
          class="w-full border-b border-border bg-transparent px-4 py-3 text-text outline-none placeholder:text-text-faint"
        />
        <ul class="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && <li class="px-4 py-3 text-sm text-text-faint">No matches.</li>}
          {filtered.map((i, idx) => (
            <li key={i.href}>
              <button
                onMouseEnter={() => setSel(idx)}
                onClick={() => go(i)}
                class={`flex w-full items-center justify-between px-4 py-2 text-left ${idx === sel ? 'bg-surface-2' : ''}`}
              >
                <span class="text-sm text-text">{i.title}</span>
                <span class="font-mono text-[10px] uppercase tracking-wider text-text-faint">{i.kind}</span>
              </button>
            </li>
          ))}
        </ul>
        <div class="flex gap-3 border-t border-border px-4 py-2 text-[11px] text-text-faint">
          <span><kbd class="kbd">↑↓</kbd> navigate</span>
          <span><kbd class="kbd">⏎</kbd> open</span>
          <span><kbd class="kbd">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
