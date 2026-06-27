---
{"term": "PagedAttention", "aliases": ["paged attention"], "module": "inference-internals-performance"}
---

Stores the KV cache in fixed-size, non-contiguous blocks addressed by a per-sequence block table — turning KV memory into a schedulable, low-fragmentation resource and enabling copy-on-write prefix sharing.
