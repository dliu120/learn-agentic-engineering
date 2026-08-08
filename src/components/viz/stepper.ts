// Shared stepper: consistent play / step controls + live caption for every viz.
// Motion is learner-initiated. Reduced-motion jumps to the final state and hides playback.
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
  bar.className = 'flex flex-wrap items-center gap-2 px-4 pb-4 pt-2';

  const mk = (label: string, aria: string) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.type = 'button';
    b.className =
      'grid min-h-11 min-w-11 place-items-center rounded-sm border border-border px-2 text-xs text-text-muted hover:border-accent hover:text-accent disabled:opacity-30';
    return b;
  };

  const prev = mk('Prev', 'Previous step');
  const play = mk('Play', 'Play animation');
  const next = mk('Next', 'Next step');
  const stepLbl = document.createElement('span');
  stepLbl.className = 'font-mono text-xs text-text-faint tabular-nums';
  const caption = document.createElement('p');
  caption.className = 'min-w-0 basis-full text-sm text-text-muted sm:basis-auto';
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
    play.textContent = 'Play';
    play.setAttribute('aria-label', 'Play animation');
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function start() {
    if (reduced) return;
    if (!opts.loop && i === n - 1) set(0, -1);
    play.textContent = 'Pause';
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
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => !e.isIntersecting && stop()),
    { threshold: 0 },
  );
  io.observe(stage);
  root.addEventListener(
    'allm:viz-dispose',
    () => {
      stop();
      io.disconnect();
    },
    { once: true },
  );

  return { set, stop };
}
