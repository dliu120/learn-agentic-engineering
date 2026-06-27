---
{"term": "KV cache", "aliases": ["key-value cache"], "module": "inference-internals-performance"}
---

The key/value tensors cached per token so attention is not recomputed every decode step. It grows linearly with sequence length × batch and is the *dynamic* memory bottleneck at serving time — it, not the weights, usually caps concurrency.
