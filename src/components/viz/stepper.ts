// Shared scrollytelling-style stepper: consistent play / step controls + live caption for every viz.
// Reduced-motion → jumps to final step, no autoplay. Auto-pauses when scrolled offscreen.
import { prefersReducedMotion } from '@/lib/motion';

export interface Step {
  label: string;
  caption: string;
}
export interface StepperOpts {
  steps: Step[];
  onStep: (i: number, dir: number) => void;
  reduced?: boolean;
  autoMs?: number;
  loop?: boolean;
}

export function mountStepper(root: HTMLElement, stage: HTMLElement, opts: StepperOpts) {
  const reduced = opts.reduced ?? prefersReducedMotion();
  const n = opts.steps.length;
  let i = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const bar = document.createElement('div');
  bar.className = 'flex items-center gap-2 border-t border-border px-4 py-2';

  const mk = (label: string, aria: string) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.type = 'button';
    b.className =
      'grid h-7 w-7 place-items-center rounded border border-border text-text-muted hover:text-text disabled:opacity-30';
    return b;
  };

  const prev = mk('‹', 'Previous step');
  const play = mk('▶', 'Play animation');
  const next = mk('›', 'Next step');
  const stepLbl = document.createElement('span');
  stepLbl.className = 'font-mono text-xs text-text-faint tabular-nums';
  const caption = document.createElement('p');
  caption.className = 'flex-1 text-sm text-text-muted';
  caption.setAttribute('aria-live', 'polite');

  function set(target: number, dir = 1) {
    i = ((target % n) + n) % n;
    opts.onStep(i, dir);
    caption.textContent = opts.steps[i].caption;
    stepLbl.textContent = `${i + 1}/${n}`;
    prev.disabled = !opts.loop && i === 0;
    next.disabled = !opts.loop && i === n - 1;
  }
  function stop() {
    play.textContent = '▶';
    play.setAttribute('aria-label', 'Play animation');
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function start() {
    if (reduced) return;
    play.textContent = '⏸';
    play.setAttribute('aria-label', 'Pause animation');
    timer = setInterval(() => {
      if (i === n - 1 && !opts.loop) return stop();
      set(i + 1, 1);
    }, opts.autoMs ?? 2200);
  }

  prev.onclick = () => {
    stop();
    set(i - 1, -1);
  };
  next.onclick = () => {
    stop();
    set(i + 1, 1);
  };
  play.onclick = () => (timer ? stop() : start());

  bar.append(prev, play, next, stepLbl, caption);
  root.appendChild(bar);

  set(0, 1);
  if (reduced) {
    set(n - 1, 1);
    play.style.display = 'none';
  } else {
    start();
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => !e.isIntersecting && stop()),
    { threshold: 0 },
  );
  io.observe(stage);

  return { set, stop };
}
