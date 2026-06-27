/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  src?: string;
  vtt?: string;
  transcript?: string;
  title?: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const fmt = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

export default function AudioPlayer({ src, vtt, transcript, title = 'Listen to this concept' }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const [available, setAvailable] = useState(!!src);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setCur(a.currentTime);
    const onMeta = () => setDur(a.duration);
    const onEnd = () => setPlaying(false);
    const onErr = () => setAvailable(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onErr);
    };
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setPlaying(true)).catch(() => setAvailable(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const seek = (e: Event) => {
    const a = ref.current;
    if (!a) return;
    a.currentTime = Number((e.target as HTMLInputElement).value);
  };
  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (ref.current) ref.current.playbackRate = s;
  };

  return (
    <section class="card my-6 p-4" aria-label="Audio narration">
      {src && (
        <audio ref={ref} preload="metadata" src={src}>
          {vtt && <track kind="captions" src={vtt} srclang="en" label="English" default />}
        </audio>
      )}

      {available ? (
        <div class="flex flex-wrap items-center gap-3">
          <button
            onClick={toggle}
            class="grid h-10 w-10 place-items-center rounded-full bg-accent text-bg"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <div class="min-w-[8rem] flex-1">
            <div class="text-sm font-medium text-text">{title}</div>
            <div class="mt-1 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={dur || 0}
                value={cur}
                onInput={seek}
                class="h-1 flex-1 accent-accent"
                aria-label="Seek"
              />
              <span class="font-mono text-xs tabular-nums text-text-faint">
                {fmt(cur)} / {fmt(dur)}
              </span>
            </div>
          </div>
          <label class="flex items-center gap-1 text-xs text-text-faint">
            speed
            <select
              class="rounded border border-border bg-surface px-1.5 py-1 text-text"
              value={speed}
              onChange={(e) => changeSpeed(Number((e.target as HTMLSelectElement).value))}
            >
              {SPEEDS.map((s) => (
                <option value={s} key={s}>
                  {s}×
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <p class="text-sm text-text-muted">
          <span class="font-medium text-text">Audio unavailable.</span> Read the transcript below — narration is
          generated at build time with edge-tts and may not be present in this checkout.
        </p>
      )}

      {transcript && (
        <div class="mt-3">
          <button onClick={() => setShowText((v) => !v)} class="text-sm text-accent">
            {showText ? 'Hide transcript' : 'Show transcript'}
          </button>
          {showText && <p class="mt-2 rounded-lg bg-surface-2 p-3 text-sm leading-relaxed text-text-muted">{transcript}</p>}
        </div>
      )}
    </section>
  );
}
