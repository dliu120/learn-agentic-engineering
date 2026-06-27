---
{"term": "Speculative decoding", "aliases": ["draft-verify decoding"], "module": "model-efficiency-compression"}
---

A small draft model proposes K tokens that the large target verifies in one parallel pass. With *exact* verification (vanilla, EAGLE) it is lossless — output is distributionally identical to the target; the draft only affects speed via acceptance rate.
