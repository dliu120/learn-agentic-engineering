# MASTER GOAL PROMPT — Build "ALLM Academy": An Immersive, Self-Updating Production-LLM Learning Site

## 1. Mission

You are building **ALLM Academy** — a fully static, immersive, animated learning site that teaches a practicing AI engineer 22 advanced production-LLM topics (organized into 9 modules) through intuition-building 2D animated diagrams, interactive widgets, pre-generated narration, and gated quizzes — and keeps that engineer current via an auto-curated **daily "Stay Current" feed** produced by a build-time CI pipeline. The site ships as static HTML/JS/CSS (no runtime backend), persists learner progress in `localStorage`, and regenerates its daily content once per day via GitHub Actions. Your single overriding constraint: **the embedded technical content must be correct.**

## 2. Your Role & Operating Rules

You are a principal full-stack engineer + instructional designer. Build this in **verifiable phases** (Section 14). Obey these rules without exception:

- **Accuracy over fluency.** Do not invent APIs, library functions, flags, prices, or benchmark numbers. Every technical claim in shipped content must be either (a) drawn from the vetted scaffolding in Section 8, or (b) verified against current official docs at build time. Where the scaffolding's `Accuracy guardrails` say a fact is version/pricing-sensitive, present it as an order-of-magnitude range with a hedge, never a hard number.
- **Ask when blocked.** If a required source feed is unreachable, an API contract is ambiguous, a dependency version conflicts, or a spec decision is genuinely underdetermined, STOP and surface the specific blocker with options — do not guess and proceed silently.
- **Daily items stay linked to real sources.** Every auto-generated lesson must carry ≥1 working outbound source URL. Never fabricate a source, a quote, or a quiz answer; ground all generated text strictly in fetched titles/snippets.
- **No silent degradation.** Every failure path (source down, LLM bad output, TTS failure, empty day) must degrade to a clearly-flagged, still-valid result — never a crash, never a blank page, never bad data passed downstream.
- **Surgical, conventional code.** Match Astro/Tailwind idioms. No speculative abstractions. Prefer the simplest island that works (vanilla TS over Preact unless state/interaction warrants a component).
- **Verify each phase before advancing.** Run the explicit VERIFY step. A phase is done only when its check passes with evidence (build output, screenshot, test run, dry-run log).

## 3. Target Learner & Measurable Outcomes

**Learner:** an intermediate-to-advanced AI/software engineer who can already call an LLM API but wants production depth — real tradeoffs, internals, and failure modes. They learn by visual intuition + doing + staying current.

**Measurable learning outcomes (the site must enable and assess each via quiz gates):**
- O1. Correctly choose among in-context learning / RAG / fine-tuning / distillation for a task and name when each is the *wrong* tool.
- O2. Diagram an agent harness loop and predict where it breaks when a component is missing.
- O3. Explain why decode is memory-bandwidth-bound and prefill is compute-bound, and map each to its latency metric.
- O4. Lay out a request for KV/prompt-cache reuse (stable prefix first, volatile last).
- O5. Distinguish JSON-syntax / schema-conformance / semantic-correctness guarantees and build a validate→repair→fallback chain.
- O6. Bound an agent loop with the five layered budgets and distinguish retry from fallback.
- O7. Diagnose RAG quality by separating recall (the ceiling), precision, grounding, and citation quality.
- O8. Design evals + observability that catch silent quality regressions, given "no errors thrown ≠ no regression."
- O9. Reason about cost-per-successful-outcome, the lethal trifecta, and multi-tenant cache/contamination safety.

Each module ends with a quiz that **gates module completion** (default pass ≥ 80%); completing all modules + their gates = course complete.

## 4. Product Overview

A single static site with three pillars:
1. **Curriculum** — 9 modules / 22 topics; each lesson has animated 2D diagrams, accurate explanations, interactive widgets, core-concept audio narration, and an end-of-lesson quiz.
2. **Progress & dashboard** — home dashboard with learning-path map, overall + per-module rings/bars, streak, resume-where-left-off, a "Today" card; progress persisted in `localStorage` with JSON export/import.
3. **Stay Current** — a daily auto-curated feed: Today view, archive, calendar, topic filters, and news→module trend tagging that links each news item back to the module it reinforces.

Cross-cutting: search, keyboard nav, dark mode, responsive layout, WCAG 2.1 AA accessibility (audio transcripts + captions), and a glossary.

## 5. Tech Stack & Hard Constraints

- **Framework:** Astro (latest stable, `output: 'static'`). Islands architecture; hydrate interactivity only where needed (`client:visible` / `client:idle`).
- **Interactive islands:** Preact (`@astrojs/preact`) for stateful widgets; **vanilla TS** for simple DOM/animation islands. Keep per-island JS small.
- **Styling:** Tailwind CSS (`@astrojs/tailwind`). Design tokens in `tailwind.config.mjs`.
- **Animation (2D only — NO 3D / WebGL):** GSAP + ScrollTrigger for scrollytelling; inline **SVG** for structured diagrams; **Canvas 2D** for dense/dynamic particle/grid viz. All motion must respect `prefers-reduced-motion`.
- **Audio:** `edge-tts` (Python) at **build time** only, pre-generating MP3 + VTT for **core-concept sections only** (not quizzes/recaps). A player island with play/pause/seek/speed + visible transcript.
- **Search:** Pagefind (static, build-time index) — fully static, no server.
- **Content:** Astro Content Collections v2 with Zod schemas. Hand-authored module lessons in MDX; machine-generated daily content as JSON `data` collection.
- **Persistence:** browser `localStorage` only. No database, no auth, no runtime API.
- **Daily pipeline:** Node/TS scripts run in GitHub Actions on cron; commit generated content + audio; redeploy static output.
- **Hosting target:** must build to a static bundle deployable to GitHub Pages / Netlify / Vercel-static / Cloudflare Pages. No SSR, no serverless functions required at runtime.
- **Quality bars:** Lighthouse Performance ≥ 90 and Accessibility ≥ 90 on the dashboard and a representative module page; zero console errors; responsive 360px→1440px.

## 6. Information Architecture / Site Map

```
/                         Dashboard: path map, overall+per-module progress rings, streak, resume, Today card
/modules                  Module index (9 cards, locked/unlocked, % complete)
/modules/[id]             Module overview (objectives, lesson list, module quiz, "related news" rail)
/modules/[id]/[lesson]    Lesson page (scrollytelling viz, explanation, widgets, core audio, lesson quiz)
/modules/[id]/news        Per-module daily-news archive (trend-tagged items mapped to this module)
/today                    Today's daily digest (lessons, audio digest, micro-quizzes) — falls back to latest day
/archive                  Reverse-chronological list of all daily digests, with topic-tag filters
/calendar                 Month grid; only days with entries are linked; empty days greyed out
/glossary                 Searchable glossary of terms (cross-linked into lessons)
/search                   Pagefind UI (also a global ⌘K/Ctrl-K command palette overlay)
/about                    What this is, how daily curation works, honest limits, data/export-import controls
/feed.xml                 Atom feed of daily lessons
```
Global keyboard nav: `⌘K`/`Ctrl-K` search palette; `?` shortcuts help; `j/k` next/prev lesson; `[`/`]` prev/next module; `Space` audio play/pause when player focused; full tab-order + skip links.

## 7. Design System & Motion Language

**Visual direction:** "engineer's observatory" — calm dark-first canvas, high-contrast data-ink, restrained accents. Diagrams feel like instruments, not decoration.

**Color tokens (define in `tailwind.config.mjs`; provide light + dark):**
- Base: `bg` near-black `#0B0E14` (dark) / `#FBFCFE` (light); `surface`, `surface-2` elevations.
- Ink: `text`, `text-muted`, `text-faint`.
- Accents: `accent` (electric cyan, primary interactive), `accent-2` (violet), `signal-good` (green), `signal-warn` (amber), `signal-bad` (red). Token packets, "active node," and budget bars use these consistently across all viz.
- Module color keys: each of the 9 modules gets one hue used in its card, ring, and "related news" tags.

**Type:** Inter (or system UI stack) for prose; a monospace (JetBrains Mono / IBM Plex Mono) for code, tokens, metrics. Fluid type scale via `clamp()`. Generous line-height for long-form.

**Motion language (consistent grammar across every diagram):**
- **Token packet** = a moving dot/chip representing data/tokens flowing through a system.
- **Active node** = glowing highlight + callout for the currently-explained component.
- **Budget/meter bar** = depleting/filling bar for cost, tokens, latency, accuracy, utilization.
- **Red flash** = failure dramatization (runaway loop, OOM, cache miss, false hit).
- Scrollytelling: GSAP `ScrollTrigger` pins a section and advances one explanatory step per scroll beat; provide a non-scroll fallback (auto-play + step buttons) and honor reduced-motion (render final state statically, disable tweens).

**Component inventory (build once, reuse):**
- Layout: `BaseLayout`, `LessonLayout`, `DashboardLayout`, `Header/Nav`, `Footer`, `SkipLink`, `CommandPalette`.
- Content: `ConceptCard`, `KeyInsightCallout`, `TradeoffTable`, `MisconceptionFlip` (claim→correction), `FailureModeList`, `Glossary­Term` (hover/inline definition), `Citation`.
- Progress: `ProgressRing` (SVG), `ProgressBar`, `StreakFlame`, `ModuleCard`, `ResumeButton`, `OverallSummary`.
- Interactive islands: `AudioPlayer`, `Quiz` (MCQ + multi-select + ordering/matching), per-module widgets (Section 8).
- Viz primitives: `Scrollyteller` (ScrollTrigger wrapper), `SvgDiagram`, `CanvasStage`, `MotionGuard` (reduced-motion).
- Daily: `DailyLessonCard`, `TodayHero`, `CalendarGrid`, `ArchiveList`, `TagFilter`, `CurationFlagBadge`, `RelatedNewsRail`.

Accessibility is part of the design system, not an afterthought: every animated diagram has a text-equivalent summary; every interactive widget is keyboard-operable with ARIA; color is never the sole signal.

## 8. CURRICULUM (9 Modules / 22 Topics)

**Embed all scaffolding below accurately and do not water it down.** Each module is one route with one or more lessons; each lesson must include: animated visualization(s) as specified, accurate concept explanations with the verbatim **Key insight**, the interactive widget(s), core-concept audio narration (the narration angle), and an end-of-lesson quiz built from the quiz seeds. Respect each module's **Accuracy guardrails** — present version/pricing/benchmark specifics as hedged ranges, not hard facts.

### 22-Topic Coverage Matrix (the build MUST surface all 22; verify in DoD)

| # | Topic | Module |
|---|-------|--------|
| 1 | Prompt ⊂ context ⊂ harness mindset; LLM-as-OS | M1 |
| 2 | Context engineering (write/select/compress/isolate) + failure-mode taxonomy | M1 |
| 3 | Prefill vs decode; KV cache; PagedAttention | M2 |
| 4 | Continuous batching; prompt/prefix vs semantic caching | M2 |
| 5 | Speculative decoding (draft-verify, lossless) | M3 |
| 6 | Quantization (INT8/INT4/FP8, GPTQ vs AWQ) | M3 |
| 7 | Knowledge distillation | M3 |
| 8 | Structured-output guarantee ladder + constrained decoding | M4 |
| 9 | Tool/function calling reliability + idempotency | M4 |
| 10 | Bounded agent loops + 5 budget types + termination states | M5 |
| 11 | Guardrails & tripwires | M5 |
| 12 | Model routing | M5 |
| 13 | Retry vs fallback, circuit breakers, degraded-mode UX | M5 |
| 14 | Chunking, embeddings, bi-encoder vector search | M6 |
| 15 | Hybrid search + RRF fusion + cross-encoder reranking | M6 |
| 16 | Retrieval metrics, index freshness, grounding/citation quality | M6 |
| 17 | Eval types (golden/regression/adversarial/LLM-judge/human) | M7 |
| 18 | Traces/spans, token/latency/error telemetry, drift, closed loop | M7 |
| 19 | Cost attribution in the call graph + unit economics | M8 |
| 20 | Prompt injection, lethal trifecta, model-is-not-authZ | M8 |
| 21 | Multi-tenant isolation, cache safety, data-leakage/contamination | M8 |
| 22 | Adaptation strategy selection + the tradeoff surface + silent regressions | M9 |

---

### Module 1 — From Prompts to Harnesses: Foundations & Mindset (`foundations-prompts-to-harnesses`) — Topics 1–2

**Learning objectives:** distinguish prompt vs context vs harness engineering by nesting scope and explain why outer layers dominate at scale; diagram the harness loop (invoke → parse → execute-in-sandbox → observe → verify → check stop/budget) and locate cascade points; apply write/select/compress/isolate under a fixed token budget; predict accuracy/latency/cost as context grows (lost-in-the-middle, ~quadratic standard attention); explain KV/prompt caching and token-stable-prefix layout; diagnose context failure modes (poisoning/distraction/confusion/clash) → matching mitigation; evaluate single-agent (shared context) vs multi-agent (isolated context).

**Core concepts (teach each with its Key insight verbatim):**
- **Prompt ⊂ context ⊂ harness.** Prompt = wording of one instruction; context = the entire token set in the window each step (system prompt, tool defs, retrieved data, history, memory); harness = the code/control flow around the model (loop, tool execution, parsing, verification, state, recovery, budgets). Use Karpathy's LLM-as-OS: model = CPU, context window = RAM, harness = the OS deciding what to load and when to call tools. *Key insight: the prompt is the smallest lever; the model is a component, not the product — you ship a system, not a string.*
- **Harness engineering.** The program that turns a stateless next-token predictor into a task-completer; same model scores very differently by changing the harness (e.g., adding test execution + failure feedback). *Key insight: hold the model fixed and a better loop — tools, feedback, verification, budget control — can outperform any amount of prompt rewriting.*
- **Context engineering.** Per-step curation: **write** (persist to scratchpad/memory), **select** (retrieve only relevant docs/tools/examples), **compress** (summarize/compact), **isolate** (sub-agents with separate windows). Assembled fresh each turn. *Key insight: context is a dynamic, per-step assembly problem, not a one-time writing task — curate, don't accumulate.*
- **Why more tokens ≠ better.** Standard self-attention compute ~quadratic in length; "lost in the middle" (Liu et al., 2023); "context rot" before the limit; KV/prompt caching ~order-of-magnitude cheaper on cached input **only if the prefix is token-stable**. *Key insight: a larger context window is a budget, not a dumping ground — signal density and a cache-stable layout beat raw token count.*
- **Context failure-mode taxonomy (Breunig):** poisoning, distraction, confusion, clash — fixes are context-engineering moves, not prompt rewording. *Key insight: most "agent got dumber over the session" bugs are context failures you introduced, and naming the mode points straight at the fix.*

**Key tradeoffs:** bigger window vs context rot; pre-load RAG vs just-in-time retrieval; single-agent shared vs multi-agent isolated context (contested — Cognition vs Anthropic); cache-stable static prefix vs personalization; compaction vs fidelity; harness richness vs debuggability.

**Misconceptions → correction:** "bigger window = dump everything" (still suffers lost-in-the-middle/rot/distraction + quadratic cost); "prompt wording is the main lever" (smallest scope); "an agent is just the model in a while loop" (ignores parsing/sandbox/recovery/verification/budgets); "RAG is solved" (retrieval quality is the bottleneck); "more few-shot always helps" (budget + mimicry + confusion); "prompt caching always saves money" (only token-stable prefixes); "long context replaces retrieval" (selective retrieval still wins).

**Production failure modes:** runaway loop / no budget cap; silent context truncation dropping the system prompt; KV/prompt-cache invalidation from volatile prefixes; brittle output parsing cascades; context poisoning; tool/context confusion from too many tools; lost-in-the-middle; stale/contradictory RAG → clash; non-deterministic debugging without per-step logging.

**Required animated visualizations:**
- **Anatomy of an Agent Harness Loop** — SVG ring (Invoke→Parse→Execute(sandbox)→Observe→Verify→Check Stop/Budget); ScrollTrigger pins, advances a glowing token packet one hop per scroll, highlights active node; side HUD shows iteration count + depleting token-budget bar; at zero the loop flashes red (uncapped runaway). Optional Canvas motion trail.
- **The Context Window as RAM** — fixed-width bar = window; colored segments (system/tools/RAG/history) animate in; on overflow, middle compresses (compaction) or oldest slides off (eviction); overlaid U-shaped attention curve; draggable "key fact" chip drives an accuracy meter that dips mid-context.
- **Same Model, Different Harness** — two lanes share one central model chip; top lane single-shot → red X; bottom lane looped harness runs tests, feeds failures back, retries → green check; parallel GSAP timeline + score bar; caption emphasizes the model chip is byte-identical.
- **Four Context Failure Modes** — four scroll-revealed SVG panels (poisoning replicates a red token; distraction grows history while "skills" arrow shrinks; confusion overflows the tool tray; clash collides two chips) each ending with a one-line fix label (prune/compact/scope tools/rerank).

**Interactive widgets:** Context budget allocator (sliders split a fixed window; live truncation readout + predicted-quality meter + cost/latency rising with tokens; "cache-stable prefix" toggle drops cost); Harness assembler (drag loop steps to order; correct order runs a mini task to success, wrong order triggers the matching failure); Lost-in-the-middle lab (length slider + draggable needle position; accuracy gauge falls with length and dips mid-context; "rerank to edges" recovers it).

**Quiz seeds (build into the module gate):**
1. Same model, Team A single prompt vs Team B loop with test-execution+retry; B scores far higher → **the harness can dominate end-to-end performance with the model fixed.** (Distractors: bigger/fine-tuned model; prompt wording primary; results random.)
2. 8K→200K, stuff all docs, mid-context accuracy drops → **"lost in the middle"; rerank/curate so key info sits at edges and prune.** (Distractors: add more tokens; physical 8K limit; tokenizer drift.)
3. Fresh timestamp + reshuffled tool list prepended each request, caching on, cost still high → **changing the prefix invalidates the KV/prompt cache; stable content first, volatile last.** (Distractors: caching is output-only; timestamps un-tokenizable; tool lists never cacheable.)

**Narration angle (~75s):** reframe the model as one component, like a CPU — useless without a system around it. Three nested scopes via LLM-as-OS (window = RAM, harness = OS). Punchline: at production scale harness + curated context dominate; prompt wording is the smallest lever — the engineer's job shifts from "write a clever string" to "engineer the loop and the information it sees each step." One analogy throughout; end on mindset.

**Accuracy guardrails:** state context-window sizes as ranges (~200K common, 1M modes on some) not fixed; caching discounts/TTLs are pricing-dependent — hedge; do NOT cite specific SWE-bench numbers (keep the qualitative point); keep "roughly quadratic for *standard* attention" hedge (FlashAttention cuts IO not asymptotic compute; sub-quadratic archs exist); framework names are informal community terms; single- vs multi-agent is an open, contested tradeoff.

---

### Module 2 — Inference Internals & Performance (`inference-internals-performance`) — Topics 3–4

**Learning objectives:** distinguish prompt/prefix (KV) caching from semantic caching incl. correctness implications; estimate KV-cache memory and explain why it (not weights) caps throughput; explain prefill compute-bound vs decode bandwidth-bound and map to TTFT vs TPOT/ITL; describe PagedAttention (no fragmentation, prefix reuse, COW); explain continuous batching vs static and the throughput-vs-tail-latency tradeoff; diagnose prefix-order cache busting, KV OOM/preemption, head-of-line blocking, semantic-cache false hits; decide when to use chunked prefill, GQA/MQA, KV quantization, speculative decoding, prefill/decode disaggregation.

**Core concepts:**
- **Prompt (prefix) caching vs semantic caching.** Prefix caching reuses computed KV for an exact token-for-token matching prefix, skips prefill, output identical (correctness-safe), discounts input only. Semantic caching embeds the query, vector-matches prior query→response, returns the stored *response* if over threshold (skips the whole call) — bigger savings, real correctness risk. *Key insight: prompt caching is exact-prefix and returns the identical answer (pure compute optimization); semantic caching is fuzzy and can return the wrong answer — they trade off on correctness, not just savings, and are often layered.*
- **The KV cache.** bytes/token ≈ 2 × layers × kv_heads × head_dim × precision_bytes; grows linearly with length and batch; aggregate often rivals/exceeds weights; GQA shrinks KV by the query:KV head-group ratio (~4–8× typical) and MQA collapses to a single shared KV head (largest reduction, ≈ the query-head count); KV quantization trades quality for headroom. *Key insight: at serving time the KV cache, not the weights, is the dynamic memory bottleneck — it sets concurrency, the real throughput ceiling.*
- **PagedAttention.** Fixed-size non-contiguous KV blocks + per-sequence block table; cuts reservation waste to a few percent; COW prefix sharing (the mechanism behind automatic prefix caching); preemption via recompute or CPU-swap; LRU eviction. *Key insight: treating the KV cache like paged virtual memory turned KV memory from a fragmentation nightmare into a schedulable resource.*
- **Prefill vs decode.** Prefill = one parallel pass, compute-bound, sets TTFT. Decode = one token/step, re-reads weights+KV from HBM, bandwidth-bound at low-to-moderate batch (low arithmetic intensity), sets TPOT/ITL. Optimize differently; modern stacks use chunked prefill and prefill/decode disaggregation. *Key insight: same model and hardware, but prefill starves on compute while decode starves on bandwidth — one knob can't optimize both.*
- **Continuous batching.** Iteration-level scheduling (Orca / in-flight): evict finished, admit waiting after each token; kills idle bubbles; depends on dynamic KV allocation. Lever = throughput vs tail (P99) latency; gains flatten at the compute/KV ceiling. *Key insight: continuous batching needs dynamic, per-step KV allocation, and PagedAttention is the now-standard way to provide it — but they are separable: Orca introduced iteration-level (continuous) batching before paging existed.*

**Key tradeoffs:** prompt caching (safe, prefill-only) vs semantic caching (huge savings, wrong/stale risk + infra); batch size ↑throughput vs ↑tail latency until ceiling; long context/large KV vs concurrency; KV quant + GQA/MQA capacity vs quality; chunked prefill / disaggregation isolation vs scheduling + KV-transfer complexity; speculative decoding latency vs spare-FLOP dependence; TTFT (UX) vs TPOT/throughput (cost).

**Misconceptions → correction:** "prompt caching caches the response" (caches KV; still decodes fresh); "caching degrades output" (numerically equivalent); "saves on output tokens" (input/prefill only); "matches regardless of order" (prefix-based; one early differing token invalidates downstream); "decode is slow due to heavy compute" (bandwidth-bound, FLOPs idle); "KV cache is small vs model" (rivals/exceeds at long context × batch); "caches persist forever" (short TTL, LRU); "bigger batches always better" (saturates); "semantic caching is free and safe" (loose threshold → wrong answers on negations/numbers/dates).

**Production failure modes:** prefix-order cache busting (leading timestamp/request-id); TTL expiry/thrash; semantic-cache false positives; KV OOM → preemption/recompute storms; head-of-line blocking from long prefills; latency cliff at batch saturation; monitoring only average latency (hidden P99); disaggregation KV-transfer bottleneck; over-aggressive KV quantization; non-GQA model at long context blowing the budget.

**Required animated visualizations:**
- **Prefill compute-bound, decode bandwidth-bound** — GSAP SVG scrollytelling: Scene 1 prefill (all tokens slide in as one block; Compute meter ~100%, Bandwidth low; TTFT stopwatch freezes on first token); Scene 2 decode (tokens emit one-by-one; Bandwidth ~100% with looping "read weights+KV from HBM" ghost-arrow, Compute low; TPOT/ITL gap meter); final roofline mini-chart marking each phase.
- **Static vs continuous batching** — Canvas grid (rows=sequences, cols=time): top static (early-finishers gray out as bubbles, batch resets, utilization sags); bottom continuous (queued request slides into freed row, cells stay lit, utilization holds); diverging tokens/sec counters.
- **PagedAttention vs contiguous reservation** — two SVG memory strips: left naive (long contiguous reservations, hatched unused gaps, new request bounces off a "no contiguous space" wall); right paged (small blocks drop into any slot, block-table arrows, two sequences share identical prefix blocks via COW, one forks on divergence; live wasted-% drops ~70%→~3%).
- **Prefix cache hit vs semantic similarity hit** — left: aligned token strips with a draggable divergence marker (green reused / red recompute; drag to position 0 turns all red, cost jumps); right: 2D embedding scatter with similarity radius, cached points pulse green, an obviously-different query inside a loosened radius triggers a red "FALSE HIT."

**Interactive widgets:** KV-cache memory calculator (sliders: model size/layers, kv_heads + GQA toggle, head_dim, precision, context, batch → GB + "sequences that fit in 80GB" + fits/OOM badge); Batching simulator (arrivals on a timeline; Static vs Continuous toggle + max batch; live utilization, throughput, P99 tail, saturation cliff); Prompt-cache hit-rate playground (drag dynamic fields before/after the static prefix; computed hit fraction + per-call cost — "static first, dynamic last").

**Quiz seeds:**
1. Why is decode memory-bandwidth-bound? → **each step reads full weights + KV from HBM but does a single-token matrix-vector multiply (low arithmetic intensity).** (Distractors: recomputes KV each step; higher precision; CPU fallback.)
2. Per-request session ID prepended to an 8K system prompt with prefix caching → **cache invalidated for the entire prompt; prefix matching breaks at the first differing token (put static first, dynamic last).** (Distractors: still hits; only the tail caches; embedding partial hit.)
3. Defining change of continuous vs static batching → **schedules at each decoding iteration, evicting finished and admitting waiting sequences without waiting for the whole batch.** (Distractors: pads to equal length; separate GPUs; compresses KV.)

**Narration angle (~75s):** one request is really two workloads on the same chip — prefill (whole prompt at once, pegs compute, decides first-token speed) then decode (tokens trickle out, GPU half-idle on memory, decides streaming speed). Punchline: nearly every production technique exploits this split — prompt caching skips redundant prefill, continuous batching fills decode's idle cycles, PagedAttention makes KV dynamic, disaggregation splits the phases onto separate hardware. One concrete image: the compute meter pegged in prefill, the bandwidth meter pegged in decode.

**Accuracy guardrails:** keep provider cache pricing/TTL out of core text or cite live pages; recompute KV per-token size for the specific model in the calculator (don't hardcode ~320KB); present continuous-batching throughput as "several-fold," not a fixed multiplier; fragmentation figures (~60–80% naive, <4% paged) are directional (vLLM paper); disaggregation/chunked-prefill behavior is a moving target; TTFT standard, decode latency = TPOT/ITL (used interchangeably — note it).

---

### Module 3 — Model Efficiency & Compression (`model-efficiency-compression`) — Topics 5–7

**Learning objectives:** use the memory-bandwidth-bound decode lens to unify speculative decoding/quantization/distillation; explain the draft-then-verify loop and why rejection sampling makes it lossless, plus where speedup collapses; contrast the three across lossless/lossy, bottleneck attacked, cost to apply, memory direction; compute FP16/FP8/INT8/INT4 footprints and distinguish weight-only (W4A16) from weight+activation (W8A8/FP8); explain GPTQ (Hessian error-feedback) vs AWQ (activation-salient scaling); predict when quantization hurts (size, outliers, bit-width, granularity, task) and choose evals that surface it; explain distillation via soft targets / dark knowledge and its high-upfront / lowest-steady-state cost.

**Core concepts:**
- **Decoding bottleneck: bandwidth, not FLOPs.** At low batch, each token streams the entire weight matrix from HBM for a thin matrix-vector multiply. *Key insight: almost every efficiency win during decode comes from moving fewer bytes per generated token, not from doing less math.*
- **Speculative decoding (draft-then-verify).** Small draft proposes K tokens; large target verifies all K in one parallel pass; accept longest correct prefix via modified rejection sampling (accept w.p. min(1, p_target/p_draft), else resample from normalized positive difference) — provably reproduces the target distribution; ~2–3× typical, more with EAGLE/Medusa. *Key insight: exact-verification speculative decoding (vanilla speculative sampling, EAGLE/EAGLE-2/3) is lossless — output is statistically identical to the target alone; the draft only affects speed (acceptance rate), never correctness. Caveat: Medusa's default typical-acceptance and lossy n-gram/lookahead drafts relax exact verification and can shift the output distribution.*
- **Quantization fundamentals.** FP16 2B/param → INT8 1B → INT4 ~0.5B (+ group scales) → FP8. 70B ≈ 140GB FP16 / ~70GB INT8 / ~35GB INT4. Weight-only (W4A16, dequant to FP16 for matmul) helps memory-bound decode, little prefill gain; weight+activation (W8A8/FP8) runs the matmul on INT8/FP8 tensor cores → accelerates compute-bound prefill/high-batch. Granularity (per-group 128 common) preserves quality. *Key insight: "quantized" is underspecified — say bit-width, whether activations/KV are quantized, and granularity.*
- **INT8/INT4/FP8.** INT8 near-lossless (LLM.int8() keeps outlier dims in FP16 beyond ~6.7B; SmoothQuant migrates difficulty to weights for W8A8). INT4 aggressive, almost always weight-only, real risk especially for small models (AWQ/GPTQ/NF4). FP8 E4M3 / E5M2 with Hopper/Ada/Blackwell acceleration; exponent bits give wider dynamic range. *Key insight: same bit-count ≠ same behavior — FP8 trades dense-region precision for range and tolerates outliers better than INT8.*
- **AWQ vs GPTQ.** Both PTQ (small calibration set, not retraining). GPTQ: column-by-column, Hessian-guided, pushes rounding error onto not-yet-quantized weights. AWQ: protect the few activation-salient channels via per-channel scaling; uniform low-bit, hardware-friendly. *Key insight: GPTQ minimizes reconstruction error via Hessian-guided error feedback; AWQ preserves activation-salient channels via scaling — different cures for the same outlier disease.*
- **When quantization hurts.** Worse at INT4 and below, worse for small models; outliers/KV-quant/coarse granularity amplify; task-dependent (reasoning/math/code degrade more); perplexity barely moves while downstream drops; calibration mismatch hurts. *Key insight: quality loss is nonlinear and task-localized — a quantized model can look fine on perplexity and be broken on the reasoning that matters.*
- **Knowledge distillation.** Student mimics teacher's soft logit distribution (dark knowledge), often + intermediate/sequence matching; permanently fewer params → lowest steady-state cost; expensive training; lossy with a capability gap (DistilBERT, Gemma 2, Llama 3.2 1B/3B prune+distill). *Key insight: distillation is the only one that shrinks the model itself — highest upfront, bakes savings permanently into a smaller network.*
- **Choosing and composing.** Orthogonal: speculative decoding cuts latency (lossless, adds memory, low-batch); quantization cuts memory/bandwidth cheaply (lossy); distillation cuts params permanently (lossy, expensive). *Key insight: pick by bottleneck, not hype — latency vs memory vs permanent param count are different problems, and only exact-verification speculative decoding is free of quality risk (Medusa-style typical-acceptance trades a little quality for speed).*

**Key tradeoffs:** lossless vs lossy; bottleneck attacked; cost to apply; memory direction (spec-dec **increases** memory; Medusa/EAGLE share backbone); serving regime (spec-dec shines low-batch, W4A16 vs W8A8/FP8); granularity vs overhead; bits vs quality (cliff at 4-bit, earlier for small); FP8 vs INT8 at 8 bits.

**Misconceptions → correction:** "spec-dec degrades output" (lossless); "spec-dec saves memory" (costs extra); "quant always faster" (regime/kernel dependent); "INT4 = half INT8 quality" (nonlinear); "perplexity flat = quality preserved" (need downstream evals); "FP8 ≈ INT8" (different range/outliers); "distillation = fine-tune on teacher text" (matches soft logits); "AWQ/GPTQ are QAT" (both PTQ); "quant and distillation interchangeable" (precision vs param count, usually composed).

**Production failure modes:** ship after only perplexity check → reasoning/math/code regress; INT4 on ~7B hits a cliff; aggressive KV quant degrades long-context silently; calibration mismatch; spec-dec at high concurrency wastes FLOPs; weak draft → low acceptance → net slowdown; sampling/tokenizer mismatch breaks lossless/acceptance; FP8 without native tensor cores; W4A16 expected to speed up prefill (it won't); assuming compression savings multiply cleanly; distilled student with capability gaps on rare/hard inputs.

**Required animated visualizations:**
- **Why decode is bandwidth-bound (and what each technique does)** — Canvas scrollytelling: fixed-width pipe HBM→compute core; step 1 FP16 2-byte blocks flow (one token tick); step 2 quantization halves→quarters blocks, faster; step 3 distillation shrinks the tank; step 4 spec-dec lights K cores per single pipe fill (K tokens/load); HUD shows bytes/token + tokens/sec.
- **Draft-then-verify loop** — SVG/GSAP two race tracks: draft hops out K chips fast; target sweeps all K at once, chips flip green to first mismatch (red), one corrected token emitted; acceptance-rate slider rewires it live (high α long green runs/big speedup bar; low α shrinks toward 1×).
- **FP16→INT4 buckets: outliers, AWQ, GPTQ** — SVG number line + bell-curve histogram: weights snap to 16 INT4 bins, tail outliers clip red; AWQ scales a salient channel so it spans more bins (finer effective resolution); GPTQ residual error hops onto next weights, nudging them.
- **Bits-vs-quality cliff by model size** — SVG/Canvas line chart (X bits 16→2, Y downstream accuracy): large-model curve stays flat through 8/4 then bends; small-model curve plummets at 4-bit; annotations ("near-lossless plateau", "INT4 risk", "sub-4-bit cliff"); a faint flat perplexity line dramatizes the blind spot.

**Interactive widgets:** Speculative-decoding speedup calculator (K, acceptance α, draft/target cost ratio c → expected accepted tokens = (1−α^(K+1))/(1−α) + net speedup curve); Quantization footprint + fit planner (model size, precision → VRAM incl. rough KV estimate, fits-on-24/80GB, quality-risk badge red for INT4-on-small); Compression-stack builder (drag distillation→quantization→spec-dec; four meters latency/memory/quality/one-time-cost + guardrail warnings: "spec-dec ADDS memory", "INT4+7B = risk", "spec-dec gain shrinks at high batch").

**Quiz seeds:**
1. Why is speculative decoding lossless? → **a rejection-sampling verification step provably reproduces the target's exact output distribution; the draft only affects speed.** (Distractors: identical logits; quantized draft; KV compression.)
2. AWQ vs GPTQ → **AWQ scales activation-salient channels (no error-feedback reconstruction); GPTQ does Hessian-based layer-wise reconstruction pushing rounding error onto remaining weights.** (Distractors: AWQ is QAT; bit-width limits; AWQ needs no calibration.)
3. 7B INT4 weight-only, perplexity flat but GSM8K drops → **perplexity is a weak proxy that misses localized errors derailing multi-step reasoning; use downstream task evals.** (Distractors: INT4 increased footprint; weight-only corrupts KV; draft acceptance collapsed.)

**Narration angle (~75s):** generating one token, the LLM mostly *waits* — hauling the entire weight matrix from memory for a single token. Three answers to that one bottleneck: quantization (fewer bytes/weight), distillation (fewer weights), speculative decoding (one haul → several tokens). Punchline: spec-dec is the only lossless option (changes speed, never output); quantization/distillation trade quality for memory/cost — choose by your binding constraint (tail latency, VRAM, long-run serving cost). No math.

**Accuracy guardrails:** ~2–3× spec-dec is a range; DistilBERT figures are solid as cited; don't overstate proprietary distillation details; ~6.7B outlier threshold is INT8-specific/measurement-dependent; FP8 hardware + library behavior is point-in-time; AWQ-vs-GPTQ ranking is setting-dependent ("often competitive/better"); effective INT4 bits ~4.25–4.5 at group 128 — VRAM estimates must add KV + overhead.

---

### Module 4 — Reliable Structured Output & Tool Calling (`reliable-structured-output-tool-calling`) — Topics 8–9

**Learning objectives:** distinguish the three guarantee levels (prompt-only / JSON mode / schema-constrained) and what each does NOT guarantee; explain constrained decoding (schema→grammar/FSM→per-token logit masking) and where it still forces wrong/empty values; design a bounded, cheap-first, error-fed repair loop; architect a fallback chain that always degrades to a safe typed default/partial/human review; enumerate function-calling failure modes + mitigations; write a robust tool contract and validate LLM arguments as untrusted input; apply idempotency so an at-least-once loop yields exactly-once effects.

**Core concepts:**
- **The guarantee ladder.** Prompt-only guarantees nothing; JSON mode guarantees valid JSON syntax (not your schema); schema-constrained decoding guarantees structure + types. *Key insight: each rung guarantees a stronger property about shape, never about truth.*
- **How constrained decoding works (and bites).** Schema → grammar/FSM; per-step logit mask zeroes grammar-breaking tokens (Outlines, XGrammar, GBNF, lm-format-enforcer; server-side at OpenAI/Google); first complex schema pays one-time compile latency (then cached). *Key insight: forcing structure can degrade quality — the model can't say "I don't know" unless your schema gives it a way (nullable union, "unknown" enum, refusal/confidence field).*
- **Why it still fails; validation as the gate.** Truncation at max_tokens (`finish_reason='length'` → valid prefix, invalid JSON), enum/type drift, semantically-wrong-but-valid data. Run a typed validator (Pydantic/zod/jsonschema) on every output (Instructor wraps + validates). *Key insight: schema validity ≠ correctness — validation must encode business rules (ranges, referential existence, authorization).*
- **Repair loops: cheap-first, bounded, error-fed.** Deterministic repair first (json_repair, zero LLM calls); then re-ask with the failed output + exact validator error, lower temperature; cap retries (2–3). *Key insight: the validation error message is the highest-signal repair prompt — feed it back verbatim, and always cap the loop.*
- **Fallback chains.** strict → JSON mode + validate + deterministic repair → stronger/alternate model → deterministic safe default / partial w/ low-confidence flag / human review. *Key insight: never crash, never silently pass bad data — the terminal fallback is a known-safe value or explicit escalation.*
- **Function-calling mechanics & reliability.** Declare tools (name, description, JSON-schema params); model emits a call, executes nothing; your code runs it and returns a result; loop continues. `tool_choice` (auto/required/none/forced); forcing one tool is the canonical reliable-extraction trick. Failures: hallucinated/missing args, accuracy decay past ~10–20 overlapping tools, missing/over-eager calls, parallel race. *Key insight: the model is a planner, not an executor — reliability is won in the loop (forcing tool_choice, capping/retrieving tools, disabling parallel for dependent ops).*
- **Tool contracts & argument validation.** Descriptions are read by the model = prompt engineering (clear names, examples, enums, typed/required). Treat every generated arg as untrusted: schema shape + business rules + injection defense (SQLi/command/path traversal/SSRF). *Key insight: tool descriptions have outsized impact on selection accuracy, yet args must be re-validated server-side as if a hostile user typed them.*
- **Idempotency & side-effect safety.** At-least-once loops can duplicate effects; make writes idempotent (client idempotency keys deduped server-side, PUT/DELETE/upserts, dedup windows); split read vs write tools; add timeouts/bounded retries/circuit breakers. *Key insight: design for exactly-once effects on top of at-least-once delivery — the retry WILL happen, so the guard lives in the tool.*

**Key tradeoffs:** constrained guarantee vs compile latency + provider schema subset + possible reasoning degradation (mitigate with an early free-text reasoning field); LLM re-ask (semantic+structural) vs deterministic repair (free, syntax-only) — order cheap-first; `tool_choice=required` guarantees a call but removes "no tool needed"; all-required schema simple downstream but maximizes forced hallucination; more tools = capability vs selection accuracy (buy back with tool retrieval/namespacing/sub-agents); idempotency infra cost vs duplicate-effect incidents; deeper chains/higher caps = success rate vs tail latency/cost (tune to SLO).

**Misconceptions → correction:** "strict mode guarantees correct data" (shape only); "JSON mode = Structured Outputs" (syntax vs schema); "validates → safe to execute" (no business rules/authz/injection); "more tools more capable" (accuracy decays); "retries are free" (paid round-trips, can loop forever); "temperature=0 = deterministic" (not bit-for-bit); "the model executes the tool" (your code does — you own validation/idempotency/safety).

**Production failure modes:** truncation (`finish_reason='length'`) corrupts data when ignored; unbounded repair loops; semantically-wrong-but-valid data propagated; duplicate side effects from non-idempotent writes + retries; extraction breaks with `tool_choice='auto'`; injection through tool args; grammar-compile latency spikes; parallel calls racing dependent ops; all-required schemas forcing fabrication; schema drift across cached prompt/consumer/grammar.

**Required animated visualizations:**
- **The Guarantee Ladder** — SVG/Canvas scrollytelling: a JSON object builds char-by-char along an FSM track; at each step a logit bar chart slams illegal tokens to the floor (red, GSAP) while legal stay lit; sampled token flies onto the string; side rail of three rungs (Prompt/JSON mode/Constrained) with each rung's guarantee tooltip.
- **Repair Loop & Fallback Chain Flowmap** — SVG flowchart, glowing request dot via MotionPath through parse→validate→deterministic repair→bounded LLM re-ask→model/provider fallback→safe typed default; on failure it diverts down a red branch, a retry counter + cost/latency meter tick up; cap hit → locks into the green safe-default terminal.
- **Agent Tool Loop with Idempotency Guard** — two columns (Model | Your System); a tool_call card slides right → "validate args" gate → "execute" node incrementing a "charges=$X" counter; replay as a retry: key OFF doubles the counter (red), key ON hits a dedup cache (green check, unchanged).
- **Too-Many-Tools Accuracy Decay** — Canvas line chart (x tool count, y selection accuracy) animating down as a slider drags count up, with a confusion grid lighting off-diagonal cells; a "tool retrieval" switch animates a second curve that stays high.

**Interactive widgets:** Schema-strictness slider (Prompt-only→JSON mode→Strict; 20 sample outputs re-classify live as parse-fail/schema-fail/valid; failure-rate bar drops each rung); Repair-loop simulator (inject malformed payloads; step deterministic vs LLM re-ask; retry counter + cost meter + the fed-back validator error); Idempotency sandbox (fire duplicate calls, key ON/OFF; side-effect counter doubles or dedupes — at-least-once vs exactly-once).

**Quiz seeds:**
1. OpenAI Structured Outputs `strict:true` guarantees → **output conforms to the schema's structure and types** (not semantic correctness; not no-truncation; not always-calls-a-tool).
2. Required string field, model has no valid value → **constrained decoding still forces a syntactically valid (possibly hallucinated/empty) string — structure guaranteed, not truthfulness** (give an escape hatch). (Distractors: API errors; field omitted; emits "unknown".)
3. Why must write tools be idempotent in an agent loop? → **the loop is at-least-once: timeouts, retries, and re-issued calls duplicate side effects.** (Distractors: constrained decoding requires it; saves tokens; needed for valid args.)

**Narration angle:** one line — "structure is not the same as truth." Walk the ladder, land that even a schema-valid output is a well-typed claim from an unreliable, retry-prone producer of untrusted input. The real job lives in the loop: validate as the gate, repair cheap-first and bounded, fall back to a safe typed default, make every side effect idempotent because the retry WILL happen. A little contrarian about "strict mode solved it."

**Accuracy guardrails:** OpenAI Structured Outputs' supported JSON-schema subset has grown — verify current; Anthropic's reliable pattern is tool-use + forced `tool_choice` (+ prefill) — check if a native json_schema response format now exists rather than assuming; reasoning-degradation-from-constraints is a genuine open debate (Tam et al. vs Outlines rebuttal) — present as nuanced; ~10–20-tool decay is a model-dependent heuristic; OpenAI's "<40%→~100%" adherence is vendor-reported; spot-check parameter names (`parallel_tool_calls`, `tool_choice`) against live docs.

---

### Module 5 — Agent Engineering: Control, Routing & Degradation (`agent-control-routing-degradation`) — Topics 10–13

**Learning objectives:** explain why an unbounded loop is a hazard and enumerate the five layered budgets (iteration/tool/token/cost/time); design termination that separates success / exhaustion / failure incl. no-progress detection; implement layered input/output guardrails with tripwire veto; build a routing strategy trading cost/latency/capability and reason about the router's own latency/failure; distinguish retry (same model, transient) from fallback (different model/provider) with backoff+jitter, circuit breakers, hedging; design degraded-mode UX as a ladder that communicates reduced state; diagnose oscillating loops, retry storms, capability-mismatched fallbacks, silent degradation.

**Core concepts:**
- **The bounded agent loop.** Model reasons→emits tool call→runtime executes→observation fed back→repeat until the model signals done; the model decides when to stop, so wrap with an external step cap. *Key insight: by default the model, not your code, controls how many iterations run — every loop needs an external authority that can stop it.*
- **Tool/token/cost/time budgets.** Layered because the binding constraint differs by failure (oscillation→iteration cap, long-context crawl→token cap, hung tool→timeout); all enforced by the orchestrator. *Key insight: budgets are an OR of independent limits — the cheapest-to-breach fires first, so you need all of them.*
- **Termination & no-progress detection.** Three distinct reported states: success / exhaustion / failure; the dangerous middle is neither-done-nor-progressing — detect via hashing tool-name+args or state stagnation. *Key insight: "out of budget" and "finished successfully" must be different return states.*
- **Guardrails & tripwires.** Separate validation layers (not prompt instructions). Input: injection/PII/policy before the model; output: schema/moderation/grounding before downstream. A tripwire aborts the run. Run as cheap parallel classifiers. *Key insight: a rule enforced only in the system prompt is a suggestion the model can be talked out of — a guardrail is real only when a separate layer can veto.*
- **Model routing.** Send each request to the cheapest sufficient model — hard rules (capability), complexity classification (RouteLLM/NotDiamond/Martian), latency/cost policies. Frontier vs small differ ~10–30× per token. *Key insight: routing pays off only when the router's added latency + error cost stay below savings — and only if you measure the quality hit on down-routed queries, since that regression is silent.*
- **Retry vs fallback & circuit breakers.** Retry same model for transient errors (429, 5xx, Anthropic 529, timeouts) with exponential backoff + jitter; fallback to a different model/provider when exhausted/non-transient; circuit breaker trips open after repeated failures (fail fast) then half-opens. *Key insight: naive immediate retry during an outage is a thundering-herd amplifier — backoff+jitter+breaker is what makes retries safe.*
- **Degraded-mode UX.** Rungs: full model → smaller/faster → cached/templated → deterministic rule-based → honest failure; communicate reduced state (badge/partial/disabled features); idempotency keys so cross-rung retries don't double-execute. *Key insight: the worst degradation is invisible — users tolerate a labeled "reduced mode" far better than silently worse answers.*

**Key tradeoffs:** budget size (more hard tasks vs runaway); guardrail strictness (abuse blocked vs false positives + latency); routing (savings vs quality risk + router latency/failure); cross-provider fallback (availability vs capability mismatch); hedged requests (lower tail latency vs ~2× cost); breaker thresholds (protect early vs cut a recovering service); degraded-mode transparency (trust vs alarm/leak).

**Misconceptions → correction:** "high max_iterations = safe" (need all budgets); "retry handles failures" (retry≠fallback); "fallback is a drop-in" (capability mismatch); "the model knows when to stop" (need stop tools + no-progress detection); "routing always saves money" (router latency + mis-route cost); "guardrails = careful prompt wording" (separate veto layer); "degraded mode = an error message" (a ladder of rungs).

**Production failure modes:** oscillating/infinite tool loop; context-window overflow mid-loop dropping instructions; retry storm / thundering herd; cascading fallback saturating the backup; capability-mismatch fallback (no function calling/JSON/vision) producing silent malformed output; silent quality degradation; guardrail false positives/negatives; breaker stuck open or never tripping; cost blowup from fallback/hedging at peak; premature "looks done" termination; non-idempotent retries/fallbacks → double effects.

**Required animated visualizations:**
- **The Agent Loop on a Budget** — SVG ring (Reason→Act→Observe), glowing packet via MotionPath one lap per ScrollTrigger section; four side bars (iterations/tokens/$/time) drain per lap; the lap where any bar hits zero flashes red and freezes, lighting one of three outcome chips (✅ done / ⏳ exhausted / ❌ failed); replay toggle with a bigger token budget so a different bar binds.
- **Routing Lanes** — Canvas particle stream colored by complexity; central router gate reads a draggable threshold slider, deflects into cheap (top) / expensive (bottom) lanes; cumulative token + $ counters; quality gauge dips when a high-complexity particle goes cheap; dragging re-routes live.
- **Fallback Cascade & Circuit Breaker** — three SVG model boxes (A/B/C); request hits A, A flashes 429-red, retry arrows loop back with widening gaps (backoff); after N fails a badge flips closed→open and reroutes to B; split-screen toggle: naive immediate retry (arrow storm, spiking load) vs backoff+breaker (sparse arrows, flat load, fast reroute).
- **The Degradation Ladder** — vertical SVG ladder (Full→Smaller→Cached→Rule-based→Honest fail); load gauge fills on scroll; each threshold drops a marker one rung while a phone-UI mockup cross-fades states (full answer → "fast mode" badge → cached banner → static fallback); scrolling back climbs rungs.

**Interactive widgets:** Budget Tuner (sliders for max iterations/token/cost/tool caps on a deterministic mock run → outcome state + steps used + total cost; find the minimal budget that still completes); Routing Playground (mixed-complexity prompts + threshold + cheap/strong picks → blended cost, p95 latency, accuracy-on-hard-queries); Failure Injector (toggles 429/529/latency spike/B-down; configured policy responds live; two policy presets side-by-side on shared cost+latency+success dashboard).

**Quiz seeds:**
1. ReAct agent repeatedly calls the same tool with identical args, never finishes → **no-progress / loop detection that halts on repeated identical calls.** (Distractors: raise max_iterations; bigger model; more tools.)
2. Primary returns 429 → **retry the same model with exponential backoff and jitter** (fall back only when exhausted/non-transient). (Distractors: immediately escalate to pricier model; error to user; increase rate.)
3. After cross-provider failover, function-calling output goes silently malformed → **capability mismatch — B's tool-calling/JSON contract differs or isn't enabled.** (Distractors: B slower; A recovered; breaker tripped.)

**Narration angle (~60–90s):** an autonomous agent is a while-loop holding an API key and a credit card. The unsettling default: the model, not your code, decides when to stop. Production agents are defined less by the happy path and more by how they bound themselves (loop/tool/token/cost/time + real guardrails) and how gracefully they degrade (route, retry, fall back, step down a degradation ladder honestly). Takeaway: reliability is mostly the art of drawing limits and exits around a system that won't draw them for itself.

**Accuracy guardrails:** LangChain `max_iterations` default 15 / OpenAI Agents SDK `max_turns` default 10 as of early 2026 — confirm against installed versions (LangGraph uses `recursion_limit`); 429=rate limit, Anthropic 529 overloaded, standard 5xx — re-confirm; ~10–30× price ratios are order-of-magnitude, avoid exact dollars in UI; product names (RouteLLM, NotDiamond, Martian, LiteLLM, Portkey, OpenRouter, Llama Guard, NeMo Guardrails, Guardrails AI) are illustrative; "tripwire" is OpenAI-Agents-SDK terminology.

---

### Module 6 — RAG & Retrieval (`rag-retrieval`) — Topics 14–16

**Learning objectives:** explain chunk size/overlap's precision/recall + embedding-signal effects and choose a strategy; describe the bi-encoder pipeline and same-model/version requirement; justify hybrid (dense+BM25) and why RRF over score averaging; distinguish bi-encoder first-stage from cross-encoder rerank and the K/latency/precision tradeoff; diagnose freshness failures (stale vectors, version skew, missing deletions, recency); compute recall@k/precision@k/MRR/nDCG and why recall@k is the system ceiling; evaluate grounding/faithfulness + citation precision/recall and why grounded/correct/well-cited are independent.

**Core concepts:**
- **Chunking.** A precision/recall knob: oversized chunks blur multiple topics into one vector + waste budget; undersized fragment ideas; overlap (~10–20%) reduces boundary splits; structure-aware (headings/sentences/AST) beats blind cuts; ~200–500 tokens typical heuristic. *Key insight: a chunk's embedding ≈ an average of its content, so each chunk should be about one thing.*
- **Embeddings & vector search.** Bi-encoder encodes queries and docs independently (precompute doc vectors → ANN index HNSW/IVF); same model+version required; knobs: dimensionality (~384–3072), domain fit, max seq length, quantization. *Key insight: independent encoding makes retrieval scalable and is also why a bi-encoder is less accurate than a cross-encoder — query and doc never attend.*
- **Hybrid search & fusion.** Dense captures meaning but misses exact tokens (IDs, error codes, SKUs, names); BM25 is the inverse; fuse with RRF = Σ 1/(k+rank), k~60, no score normalization needed; SPLADE blurs the line. *Key insight: dense and sparse fail on opposite query types — fusion is near-strictly better; RRF works on ranks, side-stepping score normalization.*
- **Reranking (two-stage).** Cheap first stage (ANN, often hybrid) fetches top-K (50–200); cross-encoder jointly encodes query+candidate, scores, keeps 5–10; one forward pass per candidate, can't precompute. *Key insight: reranking buys precision with latency and undoes the bi-encoder's independence limitation — but only over candidates the first stage retrieved.*
- **Freshness & index lifecycle.** Index is a cache that drifts: incrementally embed new docs, re-embed edits, tombstone deletions; swapping the embedding model forces a full re-index; recency via time-decay/date filters; ANN params (HNSW ef) can silently drop recall. *Key insight: embedding-model version skew between index and query path is a silent catastrophic failure — treat the index as a versioned artifact tied to a model.*
- **Retrieval metrics.** recall@k (ceiling — generator can't use what wasn't retrieved), precision@k (noise/budget), MRR (first hit rank), nDCG (graded, log-discounted, normalized); raising k trades precision↓ for recall↑. *Key insight: measure retrieval separately and treat recall@k as a hard ceiling.*
- **Grounding, attribution, citation quality.** Grounding/faithfulness = each claim entailed by context (independent of truth); score by decomposing into atomic claims + NLI/LLM-judge (RAGAS, TruLens RAG triad); ALCE citation recall (supported statements cited?) + precision (cited passages actually support?). *Key insight: grounded, correct, and well-cited are three independent failure axes — measure each on its own.*

**Key tradeoffs:** chunk size (context vs blur/budget); k (recall vs precision/distraction); reranking (precision vs per-candidate latency, caps K); dense vs sparse (hybrid wins, adds index+fusion); dimensionality/model size vs storage/latency (quantization/Matryoshka trade accuracy); freshness vs cost; long context vs precision (lost-in-the-middle); eval rigor vs cost.

**Misconceptions → correction:** "big window removes need for retrieval/rerank" (position/cost/latency still matter); "cosine = relevance" (nearness ≠ answering; under-weights exact tokens); "more chunks always help" (noise degrades generation); "correct answer proves retrieval/grounding good" (may be parametric memory); "swap embedding model without re-indexing" (vectors not comparable); "BM25 obsolete" (still wins exact/rare-term; hybrid is the default); "average dense+BM25 scores" (different scales → RRF); "one chunking strategy fits all".

**Production failure modes:** embedding version skew; boundary split with no overlap; deleted/updated docs still served; semantic-only misses exact identifiers; reranker latency blowup forcing K down; recall ceiling hit → confident hallucination; citation hallucination (precision failure); eval on non-representative synthetic questions; near-duplicate chunks crowding top-k; ANN approximation dropping neighbors; metadata filter bugs; domain/multilingual mismatch.

**Required animated visualizations:**
- **Chunk Size & Embedding Dilution** — GSAP ScrollTrigger: left a document of colored paragraphs (topic A blue / B green) with a resizable chunking window; right a 2D PCA-style scatter with two clusters; small chunks drop cleanly into one cluster, a large A+B chunk tweens to the muddy midpoint and a query's nearest-neighbor line snaps to the wrong dot; overlap toggle shows a shared band.
- **The Two-Stage Retrieval Funnel** — SVG/Canvas: query pill splits into BM25 + Dense pipes (ranked columns); RRF stage interleaves + re-sorts with 1/(k+rank) badges; survivors enter a cross-encoder box pulsing once per card (one forward pass each) while a latency meter ticks; reorder, top-5 pass a narrowing funnel to an LLM, rejected cards fade.
- **Recall vs Precision Dial** — SVG grid of doc tiles (relevant = star); a top-k highlight ring expands with a k slider; precision@k and recall@k bars recompute (recall→1.0, precision erodes); nDCG curve shows diminishing returns; live TP/FP/FN.
- **Grounding & Citation Audit** — SVG: answer splits into atomic claim chips; source passages below; connectors draw green-solid (entailed + cited), amber-dashed (cited but unsupported = precision fail), red-to-nowhere (no source = hallucination / recall fail); running faithfulness / citation-precision / citation-recall tallies.

**Interactive widgets:** Chunking playground (size + overlap sliders over a sample doc; live chunk preview + simulated recall@k/precision@k on a fixed query set — clearly synthetic data); Hybrid fusion explorer (toggle a paraphrase query vs a rare-keyword/exact-ID query; switch dense-only / BM25-only / hybrid-RRF and watch top-10 reorder; RRF k slider); Retrieval eval calculator (small labeled corpus; set k + rerank on/off → recall@k/precision@k/MRR/nDCG live).

**Quiz seeds:**
1. Exact code "ERR_2049" missed by pure dense → **add a sparse/lexical retriever (BM25) and fuse (RRF).** (Distractors: more dims; smaller chunks; rerank — can't surface a doc the first stage never retrieved.)
2. Fact exists in corpus but never stated; precision@5=0.8, recall@5=0.2 → **recall: relevant docs aren't retrieved, so the generator can't use them.** (Distractors: precision; dimensionality; grounding.)
3. Why can't a cross-encoder be the first-stage retriever over 1M docs? → **it jointly encodes query+doc, so vectors can't be precomputed — a forward pass per document at query time.** (Distractors: lower quality; 512-token limit; GPU requirement.)

**Narration angle:** RAG is a funnel, not a magic box — embed + pull semantic matches, fuse with keyword matches for exact terms, rerank a small set with a cross-encoder, then a handful of passages reach the LLM. Land emotionally: the model can only reason over what retrieval handed it, so recall sets the ceiling for the entire system; everything downstream is precision and ordering. Close on separating retrieval quality from generation quality, and why grounded/correct/well-cited are three different questions.

**Accuracy guardrails:** embedding model names/dims (text-embedding-3, Cohere, BGE/E5/GTE/Nomic/Jina) are examples; chunk 200–500 / overlap 10–20% / K 50–200 / keep 5–10 are heuristics; RRF k=60 is the common default (tunable); long-context improving shifts but doesn't eliminate the rerank argument — phrase as a tradeoff; widget recall/precision must be clearly synthetic.

---

### Module 7 — Evaluation & Observability (`eval-observability`) — Topics 17–18

**Learning objectives:** distinguish the four eval types and when to layer; design regression evals surviving nondeterminism (tolerant graders, aggregate gates); identify/mitigate LLM-judge biases and validate against humans; read a trace as a span tree and attribute a bad/slow/expensive response to a step; instrument LLM-specific signals (tokens, TTFT/tail, semantic errors beyond HTTP); detect data/concept/model drift + why pin snapshots; wire the closed loop traces→sampled failures→golden set→regression gate→deploy.

**Core concepts:**
- **Golden sets & lifecycle.** Curated, version-controlled inputs + reference outputs / pass-fail criteria; representativeness + difficulty beat size; refresh as traffic shifts; per-example metadata for slicing. *Key insight: a golden set is code — version it, review in PRs, grow it from real production failures.*
- **Regression testing under nondeterminism.** Re-run on every prompt/model/retrieval change as a CI gate; no exact string equality (even temp 0 varies via batching/hardware/MoE/provider updates); use tolerant scorers (schema/regex, semantic similarity, LLM judge) + aggregate thresholds. *Key insight: temperature=0 reduces but never guarantees determinism — assert on tolerant scorers, gate on score deltas.*
- **Adversarial testing / red-teaming.** Probe injection, jailbreaks, unsafe/toxic, OOD/ambiguous, edge cases; separate suite + metrics (refusal/injection-success/leak rate); manual or attacker-LLM; feeds guardrails + regression. *Key insight: typical-case and adversarial evals answer different questions — a high golden-set score says nothing about injection resistance.*
- **LLM-as-judge.** Pointwise or pairwise; biases: position, verbosity, self-preference; mitigate by randomize+average positions, require CoT-before-score, explicit rubrics; validate against human labels (well-built judges ~80% agreement on some tasks). *Key insight: an unvalidated judge is just a second untested model — calibrate it against human labels first.*
- **Human evals & the method triangle.** Ground truth for subjective/high-stakes but slow/expensive/noisy (track inter-annotator agreement κ/α); pyramid — cheap automated on every run, LLM-judge on samples, human on a small high-value/disagreement subset. *Key insight: you layer methods, spending scarce human labels to calibrate cheaper graders.*
- **Traces & spans.** OpenTelemetry-style: a trace = one request end-to-end, a span = one timed unit (LLM call / retrieval / tool) nesting into a tree; GenAI semantic conventions standardize attributes. *Key insight: the unit of debugging is the trace, not the log line — without span structure you can't tell whether a bad answer came from retrieval, prompt, or model.*
- **Tokens, latency & errors.** Tokens (input vs output; output pricier + dominates latency, autoregressive); latency (TTFT, ITL, end-to-end at p50/p95/p99); errors beyond HTTP — invalid/unparseable output, schema violations, refusals, truncation, tool-call failures; aggregate per route/model/prompt-version. *Key insight: LLM observability must treat "valid JSON?", output-token count, and refusals as first-class signals — that's where LLM apps fail and bleed money.*
- **Drift & closing the loop.** Data/input drift, concept drift, model drift (silent provider update); detect via input/output/score distribution monitoring (PSI, KL, KS) + online sampled judge evals; mature loop = traces→sampled failures→golden set→regression gate→release. *Key insight: pin model snapshots and alert on drift — the scariest regression is the one you never deployed.*

**Key tradeoffs:** accuracy vs cost/speed (layer all three); golden-set size vs maintainability; determinism vs output quality (eval vs prod settings may differ); trace coverage vs cost/privacy (sampling + redaction); offline vs online evals; pinned snapshots vs floating endpoints; judge/guardrail strictness vs latency/cost.

**Misconceptions → correction:** "temp 0 = deterministic"; "high golden score = safe" (orthogonal to adversarial); "LLM-judge = objective ground truth"; "BLEU/ROUGE/exact-match good for open-ended" (n-gram misses semantics); "tracing = structured logging" (causal/hierarchical); "no HTTP errors = healthy" (silent 200 failures); "pinned prompt = fixed behavior" (provider model drift); "input/output tokens interchangeable" (output pricier + dominates latency).

**Production failure modes:** golden-set leakage/overfitting; stale golden set (green evals, complaining users); self-preference inflation; silent provider upgrade; counting unparsed output as success; cost blowup from output-token explosion; p99 tail behind a healthy p50; unredacted PII in traces; injection via retrieved content untested; tiny non-representative set making CI noisy; judge position/verbosity bias letting worse-but-longer win.

**Required animated visualizations:**
- **The Trace Waterfall** — SVG Gantt via ScrollTrigger: a playhead sweeps a time axis; each span bar grows from zero, indented for parent-child nesting, labeled ("retriever 220ms", "llm.chat 1.4s / 850 out-tok"); a running token+cost counter ticks; the slow retrieval span pulses red with a callout; a TTFT marker drops on the first LLM span; scroll-back collapses to a single "request 2.1s" bar.
- **Position Bias Flip** — SVG: two answer cards; judge highlights left card, win counter increments; GSAP swaps positions, the verdict flips (skewed 70/45 bars); "mitigation" toggle runs mirrored pairs, bars converge to ~50/50 with a green check.
- **Drift Detector** — Canvas density plot: static gray reference vs colored current week; a scrubber advances weeks, current curve translates/widens away; live PSI/KL climbs and crosses a dashed threshold → amber flash + "ALERT: drift detected"; a compact line below tracks the weekly eval score sagging in lockstep.
- **The Eval Feedback Loop** — SVG circular flow (Production→Traces→Sampled Failures→Golden Set→Regression Gate→Production); a glowing token travels via MotionPath; at "Sampled Failures" a red-flagged trace detaches into the Golden Set stack (grows by one); at the gate, green check passes to deploy, red X bounces back.

**Interactive widgets:** Judge-bias playground (toggle randomize-position / require-CoT / length-match; live agreement-with-human gauge rises, win-rate bars calibrate); Latency & cost budget builder (sliders output-token count / TTFT / ITL → end-to-end + p95 estimate + per-request cost — output length dominates); Drag-to-classify eval scenarios (drag cards into golden/regression, adversarial, LLM-judge, human buckets with instant feedback + explanation).

**Quiz seeds:**
1. Exact-match grader fails on "Sure!" vs "Of course!" → **exact match can't handle wording variance/nondeterminism; use tolerant scorers + aggregate gates.** (Distractors: raise temp; CI can't call APIs; trim set.)
2. Pinned prompt + temp 0, nothing deployed, scores drop overnight → **the hosted endpoint was silently updated (model drift).** (Distractors: spontaneous judge bias; temp 0 makes it impossible/logging bug; prices rose.)
3. A wins 70% shown first, 45% shown second → **run both orderings and average so the positional preference cancels.** (Distractors: bigger judge removes it; raise max_tokens; switch to ROUGE.)

**Narration angle:** a control loop, not a checklist — you can't improve what you can't measure, and LLMs break the two pillars engineers rely on: classic testing assumes determinism (LLMs aren't, even at temp 0) and classic monitoring assumes failures are 5xx (LLM failures hide inside 200s as bad JSON, refusals, hallucinations). So evals become your test suite for nondeterministic behavior, observability your sensor for silent failures. Punchline: they're one loop — traces feed the golden set, the golden set gates the next release, and the most dangerous regression is the one you never deployed.

**Accuracy guardrails:** "~80% judge-human agreement" (Zheng et al. 2023, task-dependent — say "on some tasks"); PSI thresholds (~0.1/~0.25) are a borrowed heuristic; OTel GenAI conventions were experimental in early 2026 — verify attribute names; output>input cost is true but the multiplier (~2–5×) varies — don't fix it; tool names current as of early 2026; end-to-end ≈ TTFT + ITL×output_tokens is a labeled approximation.

---

### Module 8 — Production Ops: Cost, Safety & Multi-Tenancy (`production-ops-cost-safety-multitenancy`) — Topics 19–21

**Learning objectives:** instrument cost attribution by propagating tenant/feature/journey tags through a multi-hop call graph and compute cost-per-successful-outcome; explain token asymmetry, reasoning/cached-token pricing, and whale tenants; distinguish direct vs indirect prompt injection and why there's no in-band trust boundary; apply the lethal trifecta to break exfiltration; design deterministic authorization at the retrieval/tool boundary with end-user identity (avoid confused deputy / excessive agency); construct tenant-safe cache keys and explain semantic-cache danger; identify/prevent cross-user contamination (shared mutable state, mis-keyed memory, pool/concurrency bugs).

**Core concepts:**
- **Cost lives in the call graph.** One user action fans out into planner/tool/retry/reflection/per-chunk calls; propagate tags through every hop (OTel GenAI + provider request-metadata) and sum token usage. *Key insight: per-call cost can stay flat while per-task cost explodes — the correct denominator is cost-per-successful-outcome, computable only if tags ride the whole fan-out.*
- **Unit economics: token asymmetry, caching, whales.** Output tokens cost several× input; reasoning "thinking" tokens billed (usually as output) even when hidden; prompt caching makes cached input far cheaper with a small write premium; usage is heavy-tailed (whales drive most cost). *Key insight: the expensive parts aren't on the invoice line — output tokens, hidden reasoning tokens, the long-tail whale — attribution + budgets surface them before they eat margin.*
- **Prompt injection & the missing in-band boundary.** Model sees system + user + retrieved/tool content as one stream; no reliable way to mark "data, never instructions." Direct (user override) vs indirect/cross-domain (instructions hidden in ingested content — OWASP LLM01, the dominant agent threat). Defenses layered/probabilistic: classifiers (guard models), spotlighting/delimiting, dual-LLM split, capability approaches (CaMeL). *Key insight: you cannot prompt your way out of prompt injection — safety is architecture limiting what a compromised model can DO, not instructions to behave.*
- **The lethal trifecta.** Catastrophic exfiltration needs all three: private-data access + untrusted content + an external channel; remove any leg to break it (scope tools, human approval for outbound/destructive, isolate untrusted-content processing). *Key insight: threat-model by the capability triangle, not the prompt — if all three are present, assume eventual exfiltration.*
- **The model is not your authorization layer.** Enforce authZ deterministically and externally on every retrieval/tool call using the end-user identity (RAG: ACL pre-filter at retrieval, not post-hoc trust). Confused deputy / excessive agency (OWASP LLM06) when an agent uses its own broad credentials on a user's behalf; fix with per-user credential scoping (OBO/OAuth) + deny-by-default. *Key insight: the security boundary is the deterministic code at the data/tool edge running with the user's identity, not the probabilistic model.*
- **Data-leakage prevention.** Leaks via observability logging full prompts/completions (PII/secrets), over-fetching, vendor retention/training; controls: PII/secret redaction before logging (Presidio), output DLP, never put secrets in prompts, zero-retention/no-train tiers for regulated data. *Key insight: your logging and caching infra is part of the attack surface — the most common real leak is PII sitting plaintext in traces and cache.*
- **Multi-tenant isolation & cache safety.** One missing tenant_id filter leaks across tenants (worst on vector queries — use namespaces/metadata filters/separate indexes). Semantic cache matches on meaning, so a similar question from Tenant B can hit Tenant A's private answer unless the key includes tenant/user/permission. Every cache key must encode all output/authZ dimensions and invalidate on permission change. *Key insight: a semantic cache is a similarity-based information-disclosure engine unless its key is partitioned by identity and authZ.*
- **Cross-user context contamination.** Shared mutable state (module-level/global buffer in an async server, singleton session, mis-keyed memory) bleeds users together — concurrency/state bugs, not model bugs (e.g., the March 2023 ChatGPT redis-py async bug). *Key insight: the scariest leaks are shared-state and pool race conditions wearing an AI costume — isolate per-request state, namespace every memory store by full identity.*

**Key tradeoffs:** guardrails (safety vs +100–500ms/hop + cost); per-tenant physical isolation (safety vs cost/complexity) vs shared logical (cheaper, relies on never missing a filter); semantic caching (cost/latency vs correctness + cross-tenant risk); autonomy/tools (capability vs attack surface / excessive agency); shared cached prefix savings vs tenant-specific content in it = leakage; coarse vs fine attribution; logging for debug vs leakage (redaction hides debug content).

**Misconceptions → correction:** "telling the model not to reveal X is a control" (never a boundary); "input/output tokens cost the same"; "strong system prompt + delimiters solve injection" (indirect bypasses); "provider prompt caching leaks to other customers" (scoped to your org — the risk is YOUR semantic cache across YOUR tenants); "RAG is safe, model only answers from retrieved docs" (over-fetch beyond ACL surfaces unauthorized data); "reasoning tokens are free"; "per-request cost = feature cost" (fan-out); "multi-tenant isolation is the provider's job" (yours).

**Production failure modes:** missing tenant filter on a vector query; semantic cache serves A's answer to B; module-level/singleton buffer interleaving concurrent users; indirect injection in a retrieved email/page/PDF driving exfiltration (all trifecta legs); confused deputy with broad service creds; PII/secrets logged plaintext + retained; reasoning model 5–10×'s cost via hidden tokens; runaway agent/tool loop with no per-tenant budget; whales inverting margin; permission revocation not invalidating cache/memory; mis-keyed long-term memory injecting another user's history.

**Required animated visualizations:**
- **Cost Flows Through the Call Graph** — SVG directed graph (User action → planner → multiple tool/LLM/retrieval → retries, left-to-right); Canvas token particles stream along edges; per-node live-incrementing $ counters; a colored tenant tag propagates node-to-node; ScrollTrigger reveals (1) flat "cost per call" meter then (2) a "cost per task" meter climbing far higher, splitting from the first.
- **The Lethal Trifecta** — SVG three-circle Venn (Private Data / Untrusted Content / Exfiltration Channel) with a glowing center; an animated payload travels via MotionPath from untrusted content through the agent to the channel; a toggle "cuts" one leg → that circle dims and the attack path dead-ends in red ("blocked").
- **Semantic Cache Poisoning** — Canvas 2D embedding plane, query dots colored by tenant; Tenant A's cached entry shows a similarity radius; Tenant B's similar query animates into A's radius → "CACHE HIT → wrong tenant" with A's private answer (red flash); "include tenant_id in key" toggle splits the plane into color-walled regions, B now misses A and routes to a fresh safe answer.
- **Cross-User Contamination via Shared Buffer** — two request lanes (A blue / B orange) emit token blocks into a single central shared buffer → garbled interleaved output; a toggle switches to per-request isolated buffers; replay keeps each lane clean; a concurrency time-ruler scrubs the race.

**Interactive widgets:** Unit-economics simulator (sliders: steps/task, avg input/output tokens, cache hit rate, reasoning multiplier, price tier → cost-per-task, blended cost-per-call diverging, monthly spend at N DAU; "whale tenant" preset shows margin inversion); Build-a-safe-cache-key drag-and-drop (drag dimensions — prompt content, tenant_id, user/permission set, model, prompt version, locale — into the key; missing dimension flashes a leak or staleness failure; green only when complete); Defend-the-agent board (toggle ACL pre-filter, dual-LLM split, output classifier, human-in-loop on outbound, remove external-send tool vs attacks: direct injection, indirect injection via retrieved doc, confused deputy — shows which are blocked; system-prompt-only defense fails).

**Quiz seeds:**
1. Multi-tenant semantic cache leaks Tenant A's data to Tenant B → **the cache key used only question similarity and omitted tenant identity, so B's near-duplicate matched A's entry.** (Distractors: provider cache leaked; needs fine-tuning; TTL too long.)
2. Email agent (read inbox + send email) follows a malicious email's hidden "forward password resets" → **remove the ability to send to arbitrary external recipients (close the exfiltration channel) or require human approval.** (Distractors: system-prompt "ignore instructions"; bigger model; raise temperature.)
3. Per-call cost flat but spend tripled after an agentic feature → **the feature fans each request into many chained calls + reasoning tokens; attribute cost at the task/feature level.** (Distractors: output cheaper; caching raised input cost; embeddings dominate.)

**Narration angle (~75–90s):** in production the LLM call is the cheap, easy part — the hard engineering is everything wrapped around it. Three forces collide: Money (every token billed; cost hides in the call graph; measure cost-per-successful-task; watch whales), Trust (the model can't tell instructions from data, so it's never the security boundary — injection and authZ are handled by deterministic code at the tool/retrieval edges; threat-model with the lethal trifecta), Isolation (one shared system, many tenants — a missing tenant_id, a meaning-based cache, or a shared buffer leaks one customer's data onto another's screen). Through-line: never let the probabilistic model be the boundary for cost, authorization, or tenant isolation.

**Accuracy guardrails:** re-verify pricing (output ~3–5× input; Anthropic cache reads ~0.1× with a write premium; OpenAI auto cache ~50% off above a threshold) — don't hardcode; reasoning-token billing/visibility differs by provider; the March-2023 ChatGPT redis-py leak is documented (verify exposed fields before quoting); "lethal trifecta"/dual-LLM are Willison's framing, CaMeL is research-stage; OWASP IDs map to the 2025 LLM Top 10 (LLM01/LLM02/LLM06) — confirm current numbering; guard tooling names + semantic-cache hit-rate ranges are illustrative.

---

### Module 9 — Strategy, Tradeoffs & Production Failure Modes (Capstone) (`capstone-strategy-tradeoffs-failure-modes`) — Topic 22

**Learning objectives:** choose correctly among ICL/RAG/fine-tuning/distillation and name when each is wrong; explain knowledge-vs-behavior and why fine-tuning volatile facts fails; map the inference stack to TTFT (prefill) vs ITL (decode) and the cost-per-token knobs; reason quantitatively about latency/throughput/cost/quality/reliability of batching, quantization, caching, spec-dec, routing; diagnose structured-output failures (syntactic vs schema vs semantic); identify root causes + guardrails for stale retrieval and runaway agents; design regression evals + monitoring that catch silent regressions.

**Core concepts:**
- **Matching adaptation to the problem.** ICL + RAG inject knowledge at inference (no weight change); fine-tuning (SFT/LoRA/PEFT) + distillation change behavior/form (weights). RAG = large/volatile/citable knowledge; fine-tuning = consistent style/format/narrow skill/prompt-shortening; distillation = compress a validated pipeline into a cheaper student. Each is wrong on the other axis (fine-tuning facts → stale snapshot + retrain cost + catastrophic forgetting; RAG can't teach new behavior/format). *Key insight: as a tendency (not a clean identity), fine-tuning is most reliable for behavior, format, and style and is a brittle vehicle for knowledge — it CAN encode facts, but they go stale, require a retrain, risk catastrophic forgetting, and can even raise hallucination; RAG is the better path for volatile, citable knowledge. Most production systems need both; the most common mistake is fine-tuning to inject facts.*
- **The inference-stack tradeoff surface.** client→gateway/router→model server (vLLM/TGI/TensorRT-LLM)→GPU. Prefill compute-bound (TTFT); decode bandwidth-bound (TPOT). Continuous batching ↑tokens/s/GPU ↓cost but can ↑TTFT under load; quantization/KV trade memory+quality for speed; spec-dec + prefix caching cut latency/cost with little quality loss. *Key insight: latency is two numbers (TTFT from prefill, per-token from decode), and the biggest cost lever is usually model choice + caching + output-length control, not kernel micro-optimization.*
- **Structured-output failures.** Invalid JSON (fences/trailing commas/unescaped/truncation), hallucinated tools; basic JSON mode = syntax only; strict schema-constrained = schema; semantic correctness needs evaluation. *Key insight: syntactic validity, schema conformance, and semantic correctness are three distinct guarantees.*
- **Retrieval & agent failure modes.** Stale retrieval (index lag, stale chunks, embedding version skew → confident wrong answers); runaway agents (loops, repeated calls, fan-out). Guardrails: freshness SLAs/TTL/incremental re-index/recency filters; max-step/token/cost caps, loop/no-progress detection, timeouts, circuit breakers; retrieved content is an injection vector. *Key insight: both failures are silent AND confident — you need hard ceilings and freshness/parity checks, not just correctness checks.*
- **Silent eval regressions.** Prompt edit, dependency bump, retrieval change, or unannounced provider model update behind a stable alias degrade quality with zero errors + green infra metrics; defenses: version prompts + pinned model IDs together, golden/regression suites in CI, canary/A-B, monitor proxy signals (refusal rate, output-length distribution, tool-error rate, schema-failure rate, thumbs-down). *Key insight: "no errors" is not "no regression" — the most dangerous regressions look exactly like success.*

**Key tradeoffs:** freshness/updatability (RAG) vs behavioral consistency/lower prompt overhead (fine-tune); throughput/cost-per-token (big batches) vs per-request TTFT under load; quality (bigger/reasoning models) vs latency/$ (resolve via routing); quant/distill savings vs accuracy loss (eval-gate); constrained-decoding guarantee vs distribution shift; agent autonomy vs predictable cost/runtime/safety; retrieval recall vs context cost/latency/lost-in-the-middle; eval rigor vs velocity; reliability via redundancy vs cost/tail + thundering-herd risk.

**Misconceptions → correction:** "RAG and fine-tuning are competitors" (orthogonal axes, usually combined); "fine-tuning teaches facts" (shapes behavior; facts go stale); "JSON mode guarantees schema" (syntax only); "constrained decoding is free quality-wise" (can shift distribution); "bigger model always better" (ignores latency/cost; route); "no errors = healthy"; "vector search always returns relevant context"; "more autonomy = more capability" (without caps = runaway); "latency is one number"; "higher top-k improves answers" (adds noise past a point).

**Production failure modes:** hallucinated tool calls; schema-valid but semantically-wrong args; malformed/truncated JSON; stale retrieval; embedding version mismatch; indirect injection via retrieved content; runaway agents; cascading retries / thundering herd; silent regression from provider update; silent regression from prompt/dependency change; judge drift / eval contamination false-green; KV-cache OOM / context overflow; cost regression from uncontrolled output/reasoning length.

**Required animated visualizations:**
- **The Adaptation Decision Plane (Knowledge vs Behavior)** — SVG 2×2 (x: knowledge volatility static→dynamic; y: behavior change none→heavy); axes draw-on via ScrollTrigger; a sample query token glides as sliders/scroll move its (volatility, behavior) position; the matching quadrant scales up + glows, others dim; landing in a "wrong tool" zone (high volatility + fine-tuning) fires a red "goes stale" pulse; per-quadrant callout cards.
- **Anatomy of a Token: Prefill vs Decode** — Canvas timeline: prompt tokens light simultaneously (prefill block) → TTFT marker drops → output tokens pop one-by-one at steady ITL cadence; a batch-size slider packs more request rows in (tokens/sec/GPU climbs while each row's TTFT bar stretches); spec-dec toggle shows a faint draft stream verified in bursts.
- **The Tradeoff Radar You Can't Max Out** — SVG radar (latency/cost/quality/reliability); dragging a model-tier or batch-size control morphs the polygon (raise quality → latency/cost spokes retract); a fixed dashed "ideal" polygon the achievable shape never fills; preset buttons (chat UX / batch pipeline / cost-min) tween to canonical operating points.
- **Failure Gallery: One Request, Five Ways to Break** — horizontal scrollytelling pipeline (client→retrieval→model→tool→eval): a request packet travels; a JSON brace stream truncates mid-object (red strike); a tool call points to a phantom node fading to 404; a retrieval doc's stale timestamp flips red; an agent node spins into a tightening recursive spiral until a "max-steps" barrier snaps it shut; finally a quality line dips while the error-rate line stays flat green + a "🚨 silent regression" label.

**Interactive widgets:** Adaptation Advisor (set knowledge volatility / data volume / citations needed / latency budget / behavior change / data availability → recommends ICL/RAG/fine-tune/distill or a combination + one-line justification + "why the others are wrong here"); Inference Cost & Latency Simulator (sliders model tier / prompt length / output length / batch / quantization / cache hit-rate → approximate TTFT, tokens/sec, $/1k-requests, **clearly labeled illustrative order-of-magnitude**); Break-the-Agent Sandbox (toggle max-steps / token-cost budget / loop detection / timeout on a simulated agent; converges or spirals with a live token/cost meter that redlines when caps are off).

**Quiz seeds:**
1. Fine-tuned on a weekly-changing catalog, answers grow stale → **move the volatile catalog into RAG so it's retrieved fresh at inference.** (Distractors: nightly retrain with higher LR; bigger base model; raise temperature.)
2. Basic JSON mode on, syntactically valid, yet missing fields break parsing → **JSON mode guarantees only valid syntax, not schema conformance; validate against the schema or use strict structured outputs.** (Distractors: JSON mode malfunctioning; context too small; HTTP client corruption.)
3. "Silent eval regression" best described as → **output quality drifts with no error raised, often after an unannounced model/prompt change, slipping by because no regression eval gates it.** (Distractors: HTTP 500s in logs; eval script throws; p99 spikes a pager.)

**Narration angle:** the jump from "I can call an LLM" to "I run an LLM system in production" — a meta-skill in two halves: (1) match the tool to the problem's axis (RAG/ICL change what it KNOWS, fine-tune/distill change how it BEHAVES; most failures start by confusing the two); (2) every inference-stack lever (batch, quantization, model, autonomy) trades latency/cost/quality/reliability — you never get all four. Close on the production mindset: the scariest failures are silent, confident ones — stale retrieval, runaway agents, quality regressions — that throw no errors and look exactly like success, so guardrails + continuous evals matter more than any single model choice.

**Accuracy guardrails:** JSON mode vs Structured Outputs semantics differ by provider — don't present one vendor's terms as universal; library names (vLLM/TGI/TensorRT-LLM/Outlines/XGrammar) accurate early 2026 but verify; ALL numbers (TTFT ~100ms–1s, per-token tens of ms, cache savings ~50–90%, $/M-token) are illustrative — the simulator MUST be labeled illustrative, not a calculator; "prefill compute-bound / decode bandwidth-bound" is standard but batch/length/hardware dependent; distillation spans classic logit-KD and synthetic-data SFT — keep broad.

## 9. DAILY "Stay Current" Feature

A build-time CI pipeline fetches public sources, dedupes/filters/ranks, LLM-curates into 5–8 teachable daily lessons, tags each to one of the 9 modules, generates a short edge-tts digest, writes a content-collection entry, commits, and redeploys. **Self-contained:** public APIs/RSS + one LLM key + edge-tts + GITHUB_TOKEN. **Degrades gracefully** when any source or step fails.

### 9.1 Sources (per-source adapter, isolated try/catch, own timeout)

| Source | Fetch | Reliability / handling |
|---|---|---|
| Hacker News (Algolia) | `GET hn.algolia.com/api/v1/search?tags=front_page` and `search_by_date?tags=story&query=LLM\|AI\|inference&numericFilters=created_at_i>{epoch_24h_ago},points>40` (JSON, no auth) | **Anchor source — design so it never blocks.** |
| arXiv cs.CL/cs.AI/cs.LG | `GET export.arxiv.org/api/query?search_query=cat:cs.CL+OR+cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=80` (Atom). Sleep ≥3s between calls, single-threaded. | Good; rate-limited/slow → backoff. Quiet weekends. |
| Hugging Face blog | `GET huggingface.co/blog/feed.xml` (RSS). Optional Hub trending API. | Stable, low-medium volume. |
| Simon Willison | `GET simonwillison.net/atom/everything/` | Excellent, high cadence, stable. |
| Sebastian Raschka | `GET magazine.sebastianraschka.com/feed` | Stable, low cadence → weight high when present. |
| Lilian Weng | `GET lilianweng.github.io/index.xml` | High quality, infrequent. |
| Anthropic news | No reliable RSS. Parse `anthropic.com/news` embedded JSON/Next data or HTML cards; community RSS fallback. **Verify selector in CI.** | Fragile → try/catch, alert on parse-zero. |
| OpenAI blog | Try `openai.com/blog/rss.xml`; if 404 scrape `openai.com/news/`. Verify in CI. | Fragile, best-effort. |
| Google DeepMind | Try `deepmind.google/blog/rss.xml` / `discover/blog/rss.xml`; else scrape index. | Fragile, HTML fallback. |
| Reddit r/LocalLLaMA, r/MachineLearning | `GET reddit.com/r/LocalLLaMA/top.rss?t=day` etc. Unique descriptive User-Agent required. | Medium-LOW from CI (429/403 on datacenter IPs). **Tolerate empty most days.** |
| GitHub trending | GitHub Search API `GET api.github.com/search/repositories?q=topic:llm+pushed:>{date}&sort=stars&order=desc` with `GITHUB_TOKEN`. | Good (approximation of trending, not the real list). |
| X / Twitter | **Omit as a direct source** — rely on reshares into HN/Reddit/blogs. Optional `agent-reach` enrichment, never a dependency. | Poor for unattended CI. |

### 9.2 Pipeline steps
1. **Load config & date** — `sources.yaml` (URLs, weights, thresholds, keyword allowlist), `modules.ts` taxonomy, model id, target content-day (UTC; explicit 24–48h window).
2. **Fetch (concurrent, isolated)** — per-source adapter, ~15s timeout, retry+backoff, conditional GET (ETag/Last-Modified) against an `actions/cache`-persisted HTTP cache; one failure never aborts; persist `cache/raw/` for debug + stale-fallback.
3. **Normalize** → `RawItem { id, source, title, url, author, publishedAt, text, signal, type }`.
4. **Dedupe & merge** — canonicalize URL (strip `utm_`/query/fragment), arXiv ID, title near-match (Jaccard/simhash); merge signals → corroboration boost, not two slots.
5. **Filter** — time window; AI-engineering relevance gate (keyword allowlist + optional embedding similarity to a practitioner centroid); per-source signal floors (HN points<40 drop); drop off-topic/NSFW/job-spam.
6. **Rank** — `score = source_weight × recency_decay × signal_norm × relevance × corroboration_bonus`; sort desc; take top ~20 candidates.
7. **LLM curate (structured)** — single call (or 1/lesson) with tool-use/JSON-schema output, grounded STRICTLY in fetched titles+snippets: select best 5–8, write headline + 2–4 bullets + why-it-matters-for-an-AI-engineer + primary module (enum) + optional secondary + a 1-question micro-quiz (answer+explanation) + tags. Validate every lesson against Zod.
8. **Repair / validate** — on schema/enum violation re-prompt with the exact error (max 2 retries); persistently bad → drop or downgrade to a templated link+heuristic-module lesson; apply deterministic module-map fallback for missing/invalid mapping.
9. **Render content** — write the day's object to `src/content/daily/{YYYY-MM-DD}.json`; update derived indexes (calendar, per-module, tags). Idempotent overwrite.
10. **Audio digest** — LLM writes a ~60–120s script (intro + one line/lesson + module callout + sign-off); edge-tts → mp3 + vtt; store path/transcript/duration. On failure skip audio, flag text-only.
11. **Build** — `astro build` consumes the collection + emits `/feed.xml`.
12. **Commit & deploy** — commit generated content + audio, deploy static output; last-good content stays committed so a failed run never blanks the site.

### 9.3 Daily lesson shape (Zod-validated)
`slug/id` (e.g., `2026-06-25-01`), `headline` (teachable, not clickbait), `sourceLinks[]` `{title,url,source}` (≥1), `summaryBullets[]` (2–4, grounded), `whyItMatters` (1–3 sentences for an engineer), `module` (enum) + `secondaryModules[]`, `moduleRationale` (1 line), `microQuiz` `{question, options?[], answer, explanation}`, `tags[]`, `meta` `{difficulty, readingTimeMin, signals{hnPoints?, githubStars?...}}`, `curationFlag` `'curated'|'uncurated-fallback'|'quiet-day'`.

### 9.4 News→module trend tagging
Define the 9 modules once in `src/content/modules.ts` (id kebab-enum, display name, 1-line scope, ~8–12 concept keywords, example topics). This object is (a) injected into the curation prompt as the allowed label set and (b) the deterministic fallback. LLM returns primary + optional secondary, each validated ∈ enum; invalid/missing → fallback scorer (lowercase keyword overlap + optional embedding cosine between item title+bullets and each module's keyword/scope text, argmax, ties by fixed priority). The ranker applies a mild **module-diversity penalty** (avoid 5/8 lessons in one module). Build a per-module archive `/modules/{id}/news` and a "related news" rail on each module page; each news item links back to its module. Mapping examples: vLLM/paged-attention/throughput→Inference Internals; GPTQ/AWQ/quant/distill→Model Efficiency; JSON-mode/function-calling/constrained-decoding→Structured Output; agent-framework/router/fallback→Agent Engineering; embeddings/reranker/chunking→RAG; LLM-as-judge/eval-harness→Eval & Observability; serving-cost/PII/rate-limiting/multi-tenancy→Production Ops; model-launch/benchmark-controversy/postmortem→Capstone Strategy; prompting/harness/mindset→Foundations.

### 9.5 Scheduling, audio, storage, failure handling, secrets, limits
- **Scheduling:** GitHub Actions `on: { schedule: [{cron: '17 13 * * *'}], workflow_dispatch: {} }` (UTC; after US-morning news + arXiv weekday listing; off-:00 reduces queue delay). Job: checkout → setup-node + setup-python → restore caches → fetch+curate → astro build → commit content+audio → deploy. `concurrency:{group: daily-lessons, cancel-in-progress:false}`, job timeout ~20min, `permissions: contents:write` (+`pages:write` if Pages). Static stays fresh because CI regenerates daily; content is intentionally frozen between builds; failed runs leave last-good deploy live.
- **Audio:** edge-tts Python step; `edge-tts --voice en-US-AndrewNeural --file script.txt --write-media public/audio/daily/{date}.mp3 --write-subtitles public/audio/daily/{date}.vtt`. Store mp3/vtt/duration/transcript in the day entry; render a small player island with the VTT as a caption track. Undocumented endpoint → try/catch + 1 retry, on failure publish text-only with `audio.available=false`. Optional Piper local backup.
- **Storage:** Astro Content Collections v2, one `data` entry per DAY `src/content/daily/{YYYY-MM-DD}.json`, Zod-validated; `{date, lessons[], audio{mp3,vtt,transcript,durationSec,available}, meta{curationFlag, sourcesUsed[], generatedAt}}`. JSON-as-data (machine-generated); MDX reserved for hand-written module lessons. Audio binaries in `public/audio/`. Derived views generated at build: `/archive` (reverse-chron), `/calendar` (month grid linking only days with entries), `/modules/{id}/news`, tag pages, `/feed.xml`. `getCollection('daily')` sorted desc drives Today, falling back to the most recent available day if today hasn't built.
- **Failure handling:** source down/timeout/parse-zero → isolated try/catch, serve cached prior (stale-ok), continue; scraper parse-zero emits non-fatal alert. Rate limits (429/403) → backoff+jitter, honor Retry-After, cap, skip; Reddit empty is normal. Empty day → synthesize `quiet-day` entry (1–2 evergreen "revisit a fundamental" cards on a rotating module). Bad LLM output → Zod + re-prompt (max 2) → drop or templated `uncurated-fallback`; never write invalid content. LLM API/quota error → skip curation, publish minimal auto-digest from top-ranked raw items (links + heuristic module map), flagged uncurated; the day still ships. edge-tts failure → text-only. Build/deploy failure → CI fails loudly (optionally open an issue/webhook), last-good site stays live. Idempotency: keyed by content-day; re-runs overwrite deterministically.
- **Secrets/config:** `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) — the single required LLM key; `GITHUB_TOKEN` (auto) for Search API + committing; deploy credential only if not Pages; `USER_AGENT` (config, not secret); `sources.yaml` + `src/content/modules.ts` committed. No secret for edge-tts/HN/arXiv/RSS.
- **Honest limits (surface on `/about`):** X/Twitter has no free automatable ToS-clean API — omitted, leaned on reshares. Vendor blogs lack stable RSS — scraping breaks on redesign, needs parse-zero alerts + occasional manual selector maintenance. Reddit often 429s from Actions IPs — empty many days. GitHub "trending" is approximated via Search API. LLM curation is non-deterministic and not authoritative (grounded, linked, flagged — a learning aid). Freshness is daily, not real-time (UTC window). edge-tts is a gray-area undocumented endpoint (audio optional). Only short transformative summaries + outbound links (copyright/etiquette). Static-by-design: no personalization, no live comments, frozen between builds. **All source URLs/behaviors are stated from prior knowledge — validate each feed on first CI run and alert on any returning zero/4xx.**

## 10. Cross-Cutting Systems

### 10.1 Progress tracker — exact `localStorage` schema
Single key `allm.progress.v1` (bump version + migrate on schema change). A separate transient export blob mirrors this object.

```jsonc
// localStorage key: "allm.progress.v1"
{
  "version": 1,
  "userId": "uuid-v4",                 // local-only, for export labeling
  "createdAt": "2026-06-25T00:00:00Z",
  "updatedAt": "2026-06-25T12:00:00Z",
  "lessons": {                          // key = "<moduleId>/<lessonId>"
    "rag-retrieval/chunking": {
      "status": "completed",            // "not-started" | "in-progress" | "completed"
      "completedAt": "2026-06-25T12:00:00Z",
      "lastVisitedAt": "2026-06-25T12:00:00Z",
      "scrollDepth": 1.0                // 0..1, max reached
    }
  },
  "quizzes": {                          // key = "<moduleId>/<lessonId>" or "<moduleId>/module-gate"
    "rag-retrieval/module-gate": {
      "bestScore": 0.9,                 // 0..1
      "lastScore": 0.8,
      "attempts": 2,
      "passed": true,                   // bestScore >= passThreshold (0.8)
      "lastAnswers": { "q1": [0], "q2": [1,3], "q3": ["b","a","c"] },
      "lastAttemptAt": "2026-06-25T12:00:00Z"
    }
  },
  "modules": {                          // key = moduleId
    "rag-retrieval": {
      "percentComplete": 100,           // derived: lessons completed + gate passed
      "lessonsCompleted": 3,
      "lessonsTotal": 3,
      "gatePassed": true,
      "unlocked": true                  // module-1 always unlocked; others unlock on prior gate pass (configurable)
    }
  },
  "overall": { "percentComplete": 42, "modulesCompleted": 4, "modulesTotal": 9 },
  "streak": {
    "current": 5, "longest": 12,
    "lastActiveDay": "2026-06-25",      // YYYY-MM-DD local
    "history": ["2026-06-21","2026-06-22","2026-06-23","2026-06-24","2026-06-25"]
  },
  "resume": {
    "lastRoute": "/modules/rag-retrieval/reranking",
    "lastModuleId": "rag-retrieval", "lastLessonId": "reranking",
    "at": "2026-06-25T12:00:00Z"
  },
  "daily": {
    "viewedDays": ["2026-06-24","2026-06-25"],
    "lastViewedDay": "2026-06-25",
    "quizAnswers": { "2026-06-25-01": { "answer": 1, "correct": true } }
  },
  "settings": { "audioSpeed": 1.0, "theme": "system", "reducedMotion": false }
}
```
Rules: all writes go through `src/lib/progress.ts` (read-modify-write, update `updatedAt`, recompute derived `modules`/`overall`). Streak increments when the user completes any lesson/quiz/views Today on a new local day; resets if a calendar day is skipped. Export = download the object as `allm-progress-{date}.json`; Import = validate against the Zod mirror, merge or replace (ask). Guard `localStorage` access (private-mode/quota → in-memory fallback + a non-blocking notice). Rings/bars read derived fields only.

### 10.2 Quiz engine
Island `Quiz.tsx` consumes a typed `Quiz` object. Supported types: `mcq` (single correct), `multi` (multi-select, partial credit optional), and at least one `ordering` (drag to sequence) or `matching` (pair left↔right). Each question carries `explanation` shown on submit. Instant per-question feedback with the explanation; scored 0..1; module-gate quizzes set `passed` at ≥ pass threshold (default 0.8) and flip `modules[id].gatePassed` → unlock next module + update rings. Fully keyboard-operable (arrow keys for options/ordering, Enter to submit), ARIA roles, focus management, color-independent correct/incorrect markers (icon + text). Retake allowed; `bestScore` retained.

### 10.3 Audio system (edge-tts build script)
Core-concept narration is generated at build time, NOT per request. `scripts/gen-audio.ts` reads each module's core-concept narration scripts (authored alongside lessons, or extracted from frontmatter `narration`), and for each produces `public/audio/core/{moduleId}-{lessonId}.mp3` + `.vtt`. Skip regeneration if the source script hash is unchanged (cache a manifest). The `AudioPlayer` island offers play/pause, seek scrubber, speed (0.75/1/1.25/1.5/2), and a visible transcript synced via the VTT (`<track kind="captions">`), persisting `audioSpeed`. Only core-concept sections get audio (quizzes/recaps do not). On missing audio the player hides itself.

### 10.4 Search & nav
Pagefind indexes built HTML at the end of `astro build`; `/search` + a `⌘K`/`Ctrl-K` command palette query it (titles, module names, glossary, daily headlines, tags). Global keyboard map per Section 6. Skip-to-content link; visible focus rings; semantic landmarks.

### 10.5 Accessibility (WCAG 2.1 AA)
Every animated diagram has a text-equivalent summary (visually-hidden or expandable) and respects `prefers-reduced-motion` (render final static state, disable tweens, replace scroll-driven steps with buttons). Audio has transcripts + VTT captions. All interactive widgets keyboard-operable with ARIA. Color contrast ≥ AA; never color-only signaling. Forms/quizzes have labels + error text. Test with axe + keyboard-only pass.

### 10.6 Performance budgets
Per route: initial JS ≤ ~150KB gzipped (islands only where needed; `client:visible`/`client:idle`); LCP < 2.5s, CLS < 0.1 on mid-tier mobile; lazy-load GSAP/Canvas viz below the fold; preconnect fonts, subset/`font-display: swap`; images/audio lazy + sized. Lighthouse Performance & Accessibility ≥ 90 on dashboard + a representative module page. Zero console errors/warnings in production build.

## 11. Project File Structure

```
allm-academy/
├── .github/workflows/daily.yml
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── README.md
├── sources.yaml                       # daily-pipeline config (feeds, weights, thresholds, allowlist, model, voice)
├── public/
│   ├── audio/
│   │   ├── core/                       # {moduleId}-{lessonId}.mp3/.vtt (build-time, core concepts)
│   │   └── daily/                      # {YYYY-MM-DD}.mp3/.vtt (daily digest)
│   ├── fonts/
│   └── favicon.svg
├── scripts/
│   ├── gen-audio.ts                    # build-time edge-tts for core-concept narration
│   ├── lib/{http.ts,cache.ts,llm.ts,zod-schemas.ts,log.ts}
│   └── daily/
│       ├── run.ts                      # orchestrator (steps 1-12)
│       ├── sources/{hackernews.ts,arxiv.ts,huggingface.ts,willison.ts,raschka.ts,
│       │            lilianweng.ts,anthropic.ts,openai.ts,deepmind.ts,reddit.ts,github.ts}
│       ├── normalize.ts
│       ├── dedupe.ts
│       ├── filter.ts
│       ├── rank.ts
│       ├── curate.ts                   # LLM call + Zod validate + repair loop
│       ├── moduleMap.ts                # deterministic fallback mapper
│       ├── audioDigest.ts              # script + edge-tts
│       └── render.ts                   # write content entry + derived indexes
├── src/
│   ├── content/
│   │   ├── config.ts                   # Zod collections: lessons, daily, glossary
│   │   ├── modules.ts                  # typed 9-module taxonomy (enum + keywords + scope)
│   │   ├── lessons/<moduleId>/<lessonId>.mdx
│   │   ├── daily/{YYYY-MM-DD}.json      # generated
│   │   └── glossary/*.md
│   ├── components/
│   │   ├── islands/{AudioPlayer.tsx,Quiz.tsx,ProgressRing.tsx,CommandPalette.tsx,
│   │   │            ContextBudgetAllocator.tsx,HarnessAssembler.tsx,KvCacheCalculator.tsx,
│   │   │            BatchingSimulator.tsx,SpecDecodeCalculator.tsx,QuantFitPlanner.tsx,
│   │   │            SchemaStrictnessSlider.tsx,RepairLoopSim.tsx,IdempotencySandbox.tsx,
│   │   │            BudgetTuner.tsx,RoutingPlayground.tsx,FailureInjector.tsx,
│   │   │            ChunkingPlayground.tsx,HybridFusionExplorer.tsx,RetrievalEvalCalc.tsx,
│   │   │            JudgeBiasPlayground.tsx,LatencyCostBuilder.tsx,EvalClassifier.tsx,
│   │   │            UnitEconomicsSim.tsx,SafeCacheKeyBuilder.tsx,DefendTheAgent.tsx,
│   │   │            AdaptationAdvisor.tsx,InferenceSimulator.tsx,BreakTheAgent.tsx,CalendarGrid.tsx}
│   │   ├── viz/{Scrollyteller.ts,HarnessLoop.ts,ContextRam.ts,PrefillDecode.ts,Paged
│   │   │        Attention.ts,GuaranteeLadder.ts,LethalTrifecta.ts,TraceWaterfall.ts, ...}
│   │   └── ui/{ConceptCard.astro,KeyInsightCallout.astro,TradeoffTable.astro,
│   │           MisconceptionFlip.astro,FailureModeList.astro,ModuleCard.astro,
│   │           StreakFlame.astro,DailyLessonCard.astro,RelatedNewsRail.astro,CurationFlagBadge.astro}
│   ├── layouts/{BaseLayout.astro,LessonLayout.astro,DashboardLayout.astro}
│   ├── pages/
│   │   ├── index.astro
│   │   ├── modules/index.astro
│   │   ├── modules/[id].astro
│   │   ├── modules/[id]/[lesson].astro
│   │   ├── modules/[id]/news.astro
│   │   ├── today.astro
│   │   ├── archive.astro
│   │   ├── calendar.astro
│   │   ├── glossary.astro
│   │   ├── search.astro
│   │   ├── about.astro
│   │   └── feed.xml.ts
│   ├── lib/{progress.ts,quiz.ts,search.ts,motion.ts,format.ts,store.ts}
│   └── styles/global.css
└── tests/{progress.test.ts,quiz.test.ts,daily-pipeline.test.ts,schema.test.ts}
```

## 12. Content Model (Astro Content Collections + frontmatter)

```ts
// src/content/config.ts
import { defineCollection, z, reference } from 'astro:content';

const MODULE_IDS = [
  'foundations-prompts-to-harnesses','inference-internals-performance',
  'model-efficiency-compression','reliable-structured-output-tool-calling',
  'agent-control-routing-degradation','rag-retrieval','eval-observability',
  'production-ops-cost-safety-multitenancy','capstone-strategy-tradeoffs-failure-modes',
] as const;
const moduleEnum = z.enum(MODULE_IDS);

const quizQuestion = z.object({
  id: z.string(),
  type: z.enum(['mcq','multi','ordering','matching']),
  question: z.string(),
  options: z.array(z.string()).optional(),          // mcq/multi
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(), // matching
  correct: z.union([z.number(), z.array(z.number()), z.array(z.string())]),
  explanation: z.string(),
});

const lessons = defineCollection({
  type: 'content', // MDX
  schema: z.object({
    moduleId: moduleEnum,
    lessonId: z.string(),
    title: z.string(),
    order: z.number(),
    topicNumbers: z.array(z.number()),               // which of the 22 topics
    objectives: z.array(z.string()),
    hasAudio: z.boolean().default(true),
    narration: z.string().optional(),                // core-concept script for edge-tts
    visualizations: z.array(z.object({ title: z.string(), summary: z.string() })),
    quiz: z.array(quizQuestion),
    isModuleGate: z.boolean().default(false),
  }),
});

const daily = defineCollection({
  type: 'data', // JSON
  schema: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    generatedAt: z.string(),
    curationFlag: z.enum(['curated','uncurated-fallback','quiet-day']),
    sourcesUsed: z.array(z.string()),
    audio: z.object({ mp3: z.string().optional(), vtt: z.string().optional(),
                      transcript: z.string().optional(), durationSec: z.number().optional(),
                      available: z.boolean() }),
    lessons: z.array(z.object({
      id: z.string(),
      headline: z.string(),
      sourceLinks: z.array(z.object({ title: z.string(), url: z.string().url(), source: z.string() })).min(1),
      summaryBullets: z.array(z.string()).min(2).max(4),
      whyItMatters: z.string(),
      module: moduleEnum,
      secondaryModules: z.array(moduleEnum).default([]),
      moduleRationale: z.string(),
      microQuiz: z.object({ question: z.string(), options: z.array(z.string()).optional(),
                            answer: z.union([z.number(), z.string()]), explanation: z.string() }),
      tags: z.array(z.string()),
      meta: z.object({ difficulty: z.enum(['beginner','intermediate','advanced']),
                       readingTimeMin: z.number(),
                       signals: z.record(z.number()).optional() }),
    })).min(1),
  }),
});

const glossary = defineCollection({
  type: 'content',
  schema: z.object({ term: z.string(), aliases: z.array(z.string()).default([]),
                     module: moduleEnum.optional() }),
});

export const collections = { lessons, daily, glossary };
```

```yaml
# Example lesson frontmatter — src/content/lessons/rag-retrieval/reranking.mdx
moduleId: rag-retrieval
lessonId: reranking
title: "Reranking: Two-Stage Retrieval"
order: 2
topicNumbers: [15]
objectives:
  - "Distinguish bi-encoder first-stage retrieval from cross-encoder reranking"
  - "Reason about the K / latency / precision tradeoff"
hasAudio: true
narration: "A cheap first stage casts a wide net..."
visualizations:
  - { title: "The Two-Stage Retrieval Funnel", summary: "Query splits into BM25 + dense, fuses via RRF, a cross-encoder reranks a small candidate set." }
quiz:
  - { id: q1, type: mcq, question: "Why can't a cross-encoder be the first-stage retriever over 1M docs?",
      options: ["It jointly encodes query+doc so nothing can be precomputed — a forward pass per doc at query time","Lower-quality scores","512-token cap","Needs a GPU"],
      correct: 0, explanation: "Joint encoding means no precomputed index; scoring 1M docs/query is infeasible." }
isModuleGate: false
```

## 13. Build / Dev Scripts & CI Outlines

```jsonc
// package.json scripts
{
  "scripts": {
    "dev": "astro dev",
    "build": "npm run gen:audio && astro build && npx pagefind --site dist",
    "preview": "astro preview",
    "gen:audio": "tsx scripts/gen-audio.ts",
    "daily": "tsx scripts/daily/run.ts",
    "daily:dry": "tsx scripts/daily/run.ts --dry-run",   // fetch+curate, write to /tmp, NO commit/deploy
    "test": "vitest run",
    "lint": "astro check && tsc --noEmit"
  }
}
```

```
# scripts/gen-audio.ts (outline)
load manifest (hash -> output) ; for each lesson with hasAudio && narration:
  hash = sha256(narration + voice)
  if manifest[lessonId] == hash && files exist: skip
  else: write narration to tmp ; run edge-tts (mp3 + vtt) into public/audio/core/
        on failure: log warn, mark lesson audio unavailable (do not fail build)
  update manifest
write manifest
```

```
# scripts/daily/run.ts (outline)
args = parse(--dry-run, --date)
cfg = loadConfig(sources.yaml) ; taxonomy = loadModules()
day = args.date ?? utcContentDay()
raws = await Promise.allSettled(sources.map(s => withTimeout(adapter[s](cfg, httpCache))))  // isolated
items = normalize(flatten(fulfilled(raws)))
items = dedupeMerge(items)
items = filter(items, cfg)                      // window + relevance + signal floors
ranked = rank(items, cfg).slice(0, cfg.candidateCap ?? 20)
if ranked.length == 0: writeQuietDay(day); return
lessons = await curate(ranked, taxonomy, cfg)   // LLM + Zod + repair(max 2) + module fallback
if !lessons: lessons = templatedFallback(ranked, taxonomy)  // flag uncurated-fallback
audio = await audioDigest(lessons, day, cfg)    // edge-tts; on fail -> {available:false}
entry = buildEntry(day, lessons, audio, sourcesUsed)
if args.dryRun: writeTo('/tmp', entry); printSummary(); return
writeContent(`src/content/daily/${day}.json`, entry)   // idempotent overwrite
updateDerivedIndexes()
```

```yaml
# .github/workflows/daily.yml (outline)
name: daily-lessons
on:
  schedule: [{ cron: '17 13 * * *' }]
  workflow_dispatch: {}
concurrency: { group: daily-lessons, cancel-in-progress: false }
permissions: { contents: write }            # + pages: write if deploying to Pages
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: { node-version: 20, cache: npm }
      - uses: actions/setup-python@v5 with: { python-version: '3.12' }
      - run: pip install edge-tts
      - run: npm ci
      - uses: actions/cache@v4 with: { path: .cache, key: http-cache-${{ github.run_id }}, restore-keys: http-cache- }
      - run: npm run daily
        env: { ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}, GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}, USER_AGENT: 'allm-academy-bot/1.0 (+https://site/about)' }
      - run: npm run build
      - name: commit content+audio
        run: |
          git config user.name "allm-bot"; git config user.email "bot@users.noreply.github.com"
          git add src/content/daily public/audio/daily
          git commit -m "daily: ${{ github.run_id }}" || echo "no changes"
          git push
      - name: deploy            # Pages/Netlify/Cloudflare — deploy dist/; last-good stays live on failure
        run: echo "deploy dist/"
```

## 14. Implementation Plan (ordered phases, each with VERIFY)

**Phase 0 — Scaffold.** Astro + Tailwind + Preact + Pagefind; tokens; base layouts/nav; content config + `modules.ts`; CI skeleton. **VERIFY:** `npm run build` clean; dashboard placeholder + 9 module placeholders render; zero console errors; `astro check` passes.

**Phase 1 — Design system & motion.** Component inventory (UI + viz primitives `Scrollyteller`, `MotionGuard`, `SvgDiagram`, `CanvasStage`); dark/light; reduced-motion fallback. **VERIFY:** a sample scrollytelling diagram pins, advances on scroll, and renders a correct static final state with reduced-motion on; keyboard + contrast pass.

**Phase 2 — Progress + quiz engines.** `progress.ts` (full schema, derived recompute, streak, resume, export/import), `Quiz.tsx` (mcq/multi/ordering/matching, gating). **VERIFY:** complete a lesson + pass a gate → rings/overall update, next module unlocks, survives reload; export→clear→import round-trips; unit tests green.

**Phase 3 — Curriculum content (all 9 modules / 22 topics).** Author lessons with accurate scaffolding, ≥1 required animated viz per module, interactive widgets, quizzes, narration scripts; embed accuracy guardrails as hedged language; glossary. **VERIFY:** coverage matrix script confirms all 22 topics present; each module has ≥1 lesson, ≥1 animated diagram, a gate quiz; a domain spot-check confirms no invented APIs/numbers and hedged version-sensitive claims.

**Phase 4 — Audio.** `gen-audio.ts` (edge-tts, hash-cache), `AudioPlayer` with transcript/captions/speed. **VERIFY:** core-concept MP3+VTT generate for ≥1 lesson per module; player plays/seeks/changes speed; captions sync; missing-audio hides player; reduced-motion unaffected.

**Phase 5 — Daily pipeline (local).** Adapters, normalize/dedupe/filter/rank, curate (LLM+Zod+repair), module map, audio digest, render; Today/archive/calendar/per-module news/feed. **VERIFY:** `npm run daily:dry` produces a schema-valid day with ≥1 source-linked lesson; force each failure path (kill a source, feed bad LLM output, empty candidates, TTS fail) and confirm graceful flags (`quiet-day`/`uncurated-fallback`/`audio:false`) with no crash.

**Phase 6 — CI + deploy.** `daily.yml`; secrets; caches; commit+deploy. **VERIFY:** `workflow_dispatch` run completes, commits a valid day, site rebuilds and shows Today; a deliberately failing run leaves last-good deploy live; first run validates each feed and alerts on zero/4xx.

**Phase 7 — Search, a11y, performance, polish.** Pagefind + ⌘K palette; keyboard map; axe pass; Lighthouse tuning; responsive sweep. **VERIFY:** search returns lessons/glossary/daily; full keyboard-only traversal; Lighthouse Perf & A11y ≥ 90 on dashboard + a module page; 360→1440px responsive; zero console errors.

## 15. Definition of Done (verifiable acceptance checklist)

- [ ] `npm run build` completes clean; `astro check` + `tsc --noEmit` pass; **zero console errors/warnings** in the production build.
- [ ] **All 22 topics** present and mapped (coverage-matrix check passes); all 9 modules reachable.
- [ ] Each module has ≥1 lesson, **≥1 working animated 2D diagram** (GSAP/SVG/Canvas, no 3D), interactive widget(s), and an end-of-lesson/gate quiz with explanations.
- [ ] Quizzes include MCQ + multi-select + at least one ordering/matching; gates flip module completion and unlock the next module.
- [ ] Progress persists across reload (lessons, quiz scores, streak, %-per-module, overall %, resume); rings/bars reflect derived state; **JSON export/import round-trips**.
- [ ] Core-concept audio generates at build (edge-tts) and **plays** with play/pause/seek/speed + synced transcript/captions; non-core sections have no audio.
- [ ] Daily pipeline runs **locally dry-run** (schema-valid day, ≥1 source-linked lesson) **and via GitHub Actions** (commits + redeploys); failure paths degrade to flagged `quiet-day`/`uncurated-fallback`/`audio:false` without crashing or blanking the site.
- [ ] Today / archive / calendar (only days-with-entries linked) / per-module news rail / tag filters / `/feed.xml` all work; news items link back to their mapped module.
- [ ] Search works; full keyboard nav + ⌘K palette; dark mode; responsive 360→1440px; `prefers-reduced-motion` honored on every diagram.
- [ ] **Lighthouse Performance ≥ 90 and Accessibility ≥ 90** on the dashboard and a representative module page; WCAG AA (transcripts/captions, ARIA, contrast, color-independent signals).
- [ ] No invented APIs/prices/benchmarks; version-sensitive facts hedged per each module's accuracy guardrails; every daily item carries ≥1 real outbound source link.

## 16. Stretch Goals (optional, clearly non-blocking)

- Spaced-repetition review deck auto-built from missed quiz questions.
- "Confidence pass" badge when a learner explains a tradeoff in their own words (self-graded checklist).
- Piper local-TTS fallback so a self-hosted runner produces audio when the edge-tts endpoint is down.
- Optional `agent-reach`-backed X/Twitter enrichment for the daily feed (kept strictly optional; never a dependency).
- Per-module embedding-similarity "related news" ranking (beyond keyword overlap).
- Printable/exportable per-module cheat-sheets generated from the scaffolding.
- A "failure-mode flashcard" mode aggregating all production failure modes across modules.
- Multi-voice daily digest (alternating narrators per lesson) and per-user playback-speed memory across sessions.

---

## 17. Build Corrections & Clarifications (AUTHORITATIVE — apply these; they override any conflict above)

> This section resolves ambiguities and gaps surfaced in adversarial review. Where it conflicts with §1–§16, **this section wins.** Items marked **[BLOCKER]** must be settled before the relevant phase.

### 17.1 Critical blockers

- **[BLOCKER] Build-script vs phase ordering.** In §13/`package.json`, define the Phase-0 `build` script as `astro build && npx pagefind --site dist` (NO `gen:audio` yet). In **Phase 4**, create `scripts/gen-audio.ts` AND change `build` to `npm run gen:audio && astro build && npx pagefind --site dist`. Phase 0 must also create a **no-op stub** `scripts/gen-audio.ts` that logs "audio: phase 0 stub" and exits 0, so any early `npm run gen:audio` never breaks. Phase-0 VERIFY (`npm run build`) must pass with zero audio.
- **[BLOCKER] Daily schema must permit the mandated degradation paths.** The Zod daily schema (§12) MUST: make `lessons[].microQuiz` **optional** (degraded/quiet days omit it); allow `sourceLinks[].url` to be **either** an absolute `http(s)` URL **or** a site-root-relative path (for evergreen quiet-day cards); add a `curationFlag: 'curated' | 'uncurated-fallback' | 'quiet-day'` field. Use the schema from the reviser's content-model (single `src/content/schemas/daily.ts` source of truth, imported by BOTH `src/content/config.ts` and `scripts/daily/curate.ts` — delete any duplicate `scripts/lib/zod-schemas.ts`). Provide two committed example fixtures that pass validation: one `quiet-day` entry and one `uncurated-fallback` entry.
- **[BLOCKER] Lesson decomposition rule (drives routes, audio filenames, progress keys, gates).** Canonical rule: **one lesson per source topic → 22 topic-lessons total**, plus **one `module-gate` lesson per module (9 gates)**. `lessonId` = kebab-case concept slug; `order` = position within module; `topicNumbers` = the 1–22 topic(s) the lesson covers (union across all lessons MUST equal {1..22}). Each module page lists its topic-lessons then its gate. Provide the explicit `lessonId` list per module in §8 (add it) so routes `/modules/[id]/[lesson]`, audio paths `public/audio/core/{moduleId}-{lessonId}.mp3`, and progress keys are all derivable.

### 17.2 Curriculum / content decisions

- **Module-gate & objectives storage.** Module-level metadata (learning `objectives[]`, `colorHue`, `order:number`, scope, keywords) lives in `src/content/modules.ts` (or a `modules` collection). The gate is `lessons/<moduleId>/module-gate.mdx` with `isModuleGate:true`; its `quiz[]` = the module's 3 quiz seeds (expanded). Unlock follows ascending module `order` (module order 1 unlocked by default; each subsequent unlocks on the prior gate pass).
- **Audio narration granularity.** Audio is **per-lesson**: each topic-lesson supplies its own `narration` string (~60–90s) covering that lesson's core concept. The single §8 "narration angle" is the script for the module's **first/primary** topic-lesson; the agent authors the remaining per-lesson narration scripts from that module's scaffolding. Gate lessons set `hasAudio:false`.
- **Viz/widget scope (reconcile DoD with §8).** §8 lists ~4 visualizations + ~3 widgets per module (the file tree enumerates them all). Tag a **per-module MVP subset = the single highest-value animated viz + single highest-value widget per module** as **build-blocking**; the rest are **strongly-encouraged but non-blocking**. DoD checks the MVP subset (see 17.5), not all 30+.

### 17.3 Schema & data-model

- **Quiz answer encoding (define precisely in the `quizQuestion` schema).** `mcq` → `options[]`, `correct: number` (index). `multi` → `options[]`, `correct: number[]` (indices). `ordering` → `options[]` holds the items, `correct: number[]` = option indices in the required order; the widget shuffles render order. `matching` → `pairs:[{left,right}]` is the authoritative mapping; the widget shuffles the `right` column; **omit `correct`** (derived from `pairs`). Persist a learner's answer in `lastAnswers` using the same encoding per type. Add at least one `ordering` and one `matching` worked example to the embedded scaffolding.
- **Glossary.** The term definition is the **MDX body** of each `glossary` entry. Cross-linking: authors wrap terms inline as `<GlossaryTerm term="kv-cache">KV cache</GlossaryTerm>`, which renders a hover/popover definition and links to `/glossary#kv-cache`. Add `GlossaryTerm.astro` to the file tree if absent.
- **Dark mode / ThemeToggle.** Add `ThemeToggle` to the component inventory. `settings.theme` enum = `'system' | 'light' | 'dark'` (default `'system'`). Resolve via an **inline `<head>` script applied pre-hydration** (read localStorage → set `data-theme` on `<html>`) to avoid flash-of-wrong-theme; manual override persists to localStorage.
- **Inventory consistency.** Every interactive widget named in §8 maps to exactly one island file in §11 — add the three missing islands: `LostInTheMiddleLab.tsx` (M1), `PromptCacheHitRatePlayground.tsx` (M2), `CompressionStackBuilder.tsx` (M3). Either add every §7-named component (`GlossaryTerm`, `Citation`, `ProgressBar`, `ResumeButton`, `OverallSummary`, `TodayHero`, `ArchiveList`, `TagFilter`, `SkipLink`, `Header`, `Nav`, `Footer`, `ThemeToggle`) to the file tree, or annotate the `ui/` + `islands/` lists as "representative, not exhaustive."

### 17.4 Astro / build / CI / deploy

- **Astro version pin (avoid API mixing).** Pin **Astro 4.x** in `package.json` and write `src/content/config.ts` with the v4 `type:'content'`/`type:'data'` collection API (as drafted). If you choose Astro 5.x instead, you MUST switch every collection to the Content Layer `loader: glob(...)` API — do not mix.
- **Astro "vanilla TS island" clarification.** There is no vanilla-TS `client:*` island. Viz primitives (`viz/*.ts`) are imported and invoked from a `<script>` block inside a thin `VizWrapper.astro` (Astro bundled client script) using `IntersectionObserver` for below-the-fold lazy-init. Only **stateful** widgets are real framework islands (`.tsx`, hydrated `client:visible`/`client:idle`).
- **Derived views = build-time, not write-time.** Remove `updateDerivedIndexes()` from `scripts/daily/run.ts`. `/archive`, `/calendar`, `/modules/[id]/news`, tag pages, and `feed.xml` are all computed at `astro build` via `getCollection('daily')`. The daily job only fetches → curates → writes one `src/content/daily/YYYY-MM-DD.json` → commits → triggers rebuild.
- **Default host = GitHub Pages.** Provide a primary `.github/workflows/deploy.yml` (build + `actions/upload-pages-artifact` + `actions/deploy-pages`; needs only `GITHUB_TOKEN`, no extra secret) triggered on push to `main`. `daily.yml` (cron) commits the new day's file to `main`, which triggers `deploy.yml` (or calls the same deploy steps). Replace any `echo "deploy dist/"` placeholder with the real steps.
- **`sources.yaml` schema + ranking constants.** Provide an example `sources.yaml` with, per source: `name`, `type` (rss|hn|arxiv|reddit|github), `url/endpoint`, `weight`, optional `keywordAllowlist`. Define the rank formula constants explicitly: `recencyDecayHalfLifeHours = 24`, `candidateCap = 60`, `perSourceCap = 8`, score = `weight * recencyDecay(ageHours) + signalNorm(points/comments) + corroborationBonus(#sources mentioning)`. Pin `model id` and edge-tts `voice` in this file too.
- **Cache & audio-manifest persistence.** Use one cache dir `.cache/` with subdirs `.cache/http/` (raw fetch cache) and `.cache/raw/`. Commit `public/audio/core/` and a committed `audio-manifest.json` (hash → file) so `gen-audio.ts`'s hash-skip actually avoids regenerating unchanged narration across CI runs.
- **Lint scoping.** Set `lint = astro check` (drop redundant `tsc --noEmit`), OR scope `tsc --noEmit` to a dedicated `tsconfig.scripts.json` covering only `scripts/**/*.ts` + `src/lib/**/*.ts` (exclude `.astro`). State which.

### 17.5 Verification & Definition-of-Done tightening

- **Add `scripts/check-coverage.ts`** (+ `tests/coverage.test.ts`): asserts the union of `topicNumbers` across all lesson entries === {1..22}; wire into a `npm run check:coverage` and into `lint`/CI. This is the script the DoD's "22-topic coverage matrix" depends on.
- **Lighthouse mechanism:** use `@lhci/cli` (`lhci autorun`) with assertions `performance>=0.9` and `accessibility>=0.9` against the built `dist/`; this is the executable form of the ≥90 gates.
- **Tighten DoD bars to match requirements:** "every **topic-lesson** has ≥1 animated 2D diagram" (not just per-module); add explicit DoD lines for the **≤150 KB-gzip initial-JS budget**, the **glossary renders + cross-links**, and the **MVP viz/widget subset** (17.2) being present + functional.
- **Outcome traceability:** add an O1–O9 → module-gate mapping table to §3 and a DoD line: "each of O1–O9 is exercised by ≥1 gate-quiz question."
- **Phase-6 (daily CI) external prerequisites + local fallback.** Phase 6 needs a live repo, real secrets (`ANTHROPIC_API_KEY`, etc.), and configured Pages. Make the **agent-verifiable** check a LOCAL simulation: `npm run daily -- --dry-run` (uses a test key / fixture sources) then `npm run build`, asserting a valid day file + successful build. Mark live `workflow_dispatch` verification as a **human-gated** step, not an autonomous blocker.

### 17.6 Accuracy clarification (carry into the relevant lesson)

- **temperature=0 determinism (M4 & M7).** Keep the correct "temp 0 is not bit-for-bit deterministic" framing, but add the root cause: nondeterminism comes from **batch-dependent floating-point reduction order** in serving, and **batch-invariant kernels can recover determinism** (per *Defeating Nondeterminism in LLM Inference*, 2025). So determinism is a **serving-implementation property, not a fundamental law** — keep the practical guidance (don't assert exact-match in evals; use tolerance/semantic checks).
