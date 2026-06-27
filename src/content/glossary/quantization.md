---
{"term": "Quantization", "aliases": ["INT8", "INT4", "FP8", "GPTQ", "AWQ"], "module": "model-efficiency-compression"}
---

Representing weights/activations in fewer bits to cut memory and bandwidth. Weight-only (e.g. W4A16) vs weight+activation (W8A8/FP8) differ; quality can fall off a cliff at low bit-width, especially for small models — and perplexity hides it, so use task evals.
