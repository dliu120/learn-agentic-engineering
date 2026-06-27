# Agent guidance

Guidance for AI agents (Claude Code, Codex, etc.) working in this repo. See
[`README.md`](./README.md) for project overview and architecture.

## Commit messages — use Conventional Commits

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

- **type** (required): `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`, `style`.
- **scope** (optional): the area touched, e.g. `daily`, `viz`, `content`, `pipeline`, `deploy`.
- **subject**: imperative mood, no trailing period, ≤72 chars.
- **body** (optional): explain the *why* when it isn't obvious from the diff.
- Breaking changes: add `!` after the type/scope (`feat(content)!: …`) or a `BREAKING CHANGE:` footer.

Examples:

```
feat(daily): add Hugging Face blog RSS source
fix(viz): correct prefill/decode stepper timing
docs: document the daily pipeline failure modes
chore(deps): bump astro to 4.x
```

## Working conventions

- Run `npm run check` (typecheck) and `npm run test` before committing code changes.
- Keep changes surgical — touch only what the task requires; match existing style.
- Don't commit generated artifacts (`dist/`, `.astro/`) or secrets (`.env`); see `.gitignore`.
- Schemas in `src/content/schemas/` are the single source of truth shared with `scripts/` — update both sides together.
