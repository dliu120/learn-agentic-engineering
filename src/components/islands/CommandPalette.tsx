/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';

interface Item {
  title: string;
  href: string;
  kind: string;
}

type SearchWindow = Window & { __allmOpenSearchPending?: boolean };

export default function CommandPalette({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const close = () => setOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        close();
      }
    };
    const onOpen = () => {
      (window as SearchWindow).__allmOpenSearchPending = false;
      setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('allm:open-search', onOpen);
    if ((window as SearchWindow).__allmOpenSearchPending) onOpen();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('allm:open-search', onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setQ('');
    setSel(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => {
      window.clearTimeout(timer);
      window.setTimeout(() => previousFocusRef.current?.focus(), 0);
    };
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

  const onDialogKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overscroll-contain bg-text/20 p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the course"
      onClick={close}
      onKeyDown={onDialogKeyDown}
    >
      <div
        ref={panelRef}
        class="w-full max-w-xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_24px_70px_-35px_rgb(var(--text)/0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center border-b border-border">
          <input
            ref={inputRef}
            name="course-search"
            autoComplete="off"
            value={q}
            onInput={(e) => {
              setQ((e.target as HTMLInputElement).value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search modules and lessons…"
            aria-label="Search modules and lessons"
            class="min-w-0 flex-1 bg-transparent px-4 py-3 text-text outline-none placeholder:text-text-faint"
          />
          <button type="button" onClick={close} class="min-h-11 px-4 text-sm text-text-muted hover:text-text">
            Close
          </button>
        </div>
        <ul class="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && <li class="px-4 py-3 text-sm text-text-faint">No matches.</li>}
          {filtered.map((i, idx) => (
            <li key={i.href}>
              <button
                onMouseEnter={() => setSel(idx)}
                onClick={() => go(i)}
                class={`flex w-full items-center justify-between px-4 py-2.5 text-left active:translate-y-px ${idx === sel ? 'bg-surface-2' : ''}`}
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
