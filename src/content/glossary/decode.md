---
{"term": "Decode", "aliases": ["generation phase"], "module": "inference-internals-performance"}
---

The token-by-token generation phase. Each step re-reads weights + KV from HBM for a single-token matrix-vector multiply, so it is bandwidth-bound at low-to-moderate batch and sets per-token latency (TPOT/ITL).
