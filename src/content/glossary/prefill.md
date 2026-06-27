---
{"term": "Prefill", "aliases": ["prompt processing"], "module": "inference-internals-performance"}
---

The first inference phase: the whole prompt is processed in one parallel, compute-bound pass. It sets TTFT (time to first token).
