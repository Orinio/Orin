# NVIDIA NIM Models for Orin

## All Available Models (119 total)

### Categorized by Type

---

## 1. CHAT / INSTRUCT MODELS (Text Generation)

Used for: AI Coach, Career Advice, Proof Analysis, User Interactions

| Model | Size | Speed | Best For | Orin Use |
|-------|------|-------|----------|----------|
| `meta/llama-3.1-8b-instruct` | 8B | ⚡ Fast | Tool calling, coaching | ✅ Primary Agent |
| `meta/llama-3.2-3b-instruct` | 3B | ⚡⚡ Ultra Fast | Simple tips, quick responses | ✅ Lightweight |
| `meta/llama-3.3-70b-instruct` | 70B | 🐢 Slow | Complex analysis | ✅ Deep Analysis |
| `meta/llama-3.1-70b-instruct` | 70B | 🐢 Slow | High quality responses | ✅ Fallback |
| `meta/llama-4-maverick-17b-128e-instruct` | 17B | 🚀 Medium | Balanced performance | ✅ Alternative |
| `qwen/qwen3.5-122b-a10b` | 122B | 🚀 Medium | Reasoning, tool calling | ✅ Complex Tasks |
| `qwen/qwen3-coder-480b-a35b-instruct` | 480B | 🐢 Slow | Code generation | ✅ Code Analysis |
| `qwen/qwen3-next-80b-a3b-instruct` | 80B | 🚀 Medium | General tasks | ✅ Alternative |
| `z-ai/glm-5.1` | Large | 🚀 Medium | Tool calling | ✅ Verified Working |
| `mistralai/mistral-7b-instruct-v0.3` | 7B | ⚡ Fast | General chat | ✅ Quick Responses |
| `mistralai/mistral-large-2-instruct` | 123B | 🐢 Slow | Complex reasoning | ✅ Advanced |
| `mistralai/mistral-large-3-675b-instruct-2512` | 675B | 🐢 Slow | Highest quality | ✅ Premium |
| `mistralai/ministral-14b-instruct-2512` | 14B | 🚀 Medium | Balanced | ✅ Alternative |
| `deepseek-ai/deepseek-v4-flash` | Large | ⚡ Fast | Quick analysis | ✅ Fast Fallback |
| `deepseek-ai/deepseek-v4-pro` | Large | 🐢 Slow | Complex tasks | ✅ Advanced |
| `nvidia/llama-3.3-nemotron-super-49b-v1.5` | 49B | 🚀 Medium | NVIDIA optimized | ✅ Optimized |
| `nvidia/llama-3.1-nemotron-70b-instruct` | 70B | 🐢 Slow | Enterprise grade | ✅ Enterprise |
| `nvidia/llama-3.1-nemotron-51b-instruct` | 51B | 🚀 Medium | Balanced | ✅ Alternative |
| `nvidia/nemotron-4-340b-instruct` | 340B | 🐢 Slow | Maximum quality | ✅ Premium |
| `google/gemma-3-12b-it` | 12B | 🚀 Medium | Google quality | ✅ Alternative |
| `google/gemma-4-31b-it` | 31B | 🚀 Medium | Latest Google | ✅ Alternative |
| `moonshotai/kimi-k2.6` | Large | 🐢 Slow | Long context | ✅ Long Documents |
| `minimaxai/minimax-m2.7` | Large | 🐢 Slow | Creative writing | ✅ Content Gen |

---

## 2. CODE GENERATION MODELS

Used for: Code proof analysis, GitHub verification, technical assessments

| Model | Size | Speed | Best For | Orin Use |
|-------|------|-------|----------|----------|
| `bigcode/starcoder2-15b` | 15B | ⚡ Fast | Code completion | ✅ Code Analysis |
| `google/codegemma-1.1-7b` | 7B | ⚡ Fast | Code generation | ✅ Quick Code |
| `google/codegemma-7b` | 7B | ⚡ Fast | Code tasks | ✅ Quick Code |
| `meta/codellama-70b` | 70B | 🐢 Slow | Complex code | ✅ Deep Code |
| `deepseek-ai/deepseek-coder-6.7b-instruct` | 6.7B | ⚡ Fast | Code instruct | ✅ Code Coach |
| `mistralai/codestral-22b-instruct-v0.1` | 22B | 🚀 Medium | Code generation | ✅ Code Gen |
| `ibm/granite-34b-code-instruct` | 34B | 🚀 Medium | Enterprise code | ✅ Enterprise |
| `ibm/granite-8b-code-instruct` | 8B | ⚡ Fast | Quick code | ✅ Quick Code |
| `qwen/qwen3-coder-480b-a35b-instruct` | 480B | 🐢 Slow | Best code model | ✅ Premium Code |

---

## 3. VISION / MULTIMODAL MODELS

Used for: Certificate image verification, profile photo analysis, UI screenshots

| Model | Size | Speed | Best For | Orin Use |
|-------|------|-------|----------|----------|
| `meta/llama-3.2-11b-vision-instruct` | 11B | 🚀 Medium | Image understanding | ✅ Cert Verification |
| `meta/llama-3.2-90b-vision-instruct` | 90B | 🐢 Slow | Complex vision | ✅ Deep Analysis |
| `nvidia/neva-22b` | 22B | 🚀 Medium | NVIDIA vision | ✅ Image Analysis |
| `nvidia/vila` | Large | 🚀 Medium | Video understanding | ✅ Video Analysis |
| `nvidia/llama-3.1-nemotron-nano-vl-8b-v1` | 8B | ⚡ Fast | Quick vision | ✅ Quick Vision |
| `nvidia/nemotron-nano-12b-v2-vl` | 12B | 🚀 Medium | Vision tasks | ✅ Alternative |
| `microsoft/kosmos-2` | Large | 🚀 Medium | Multimodal | ✅ Alternative |
| `microsoft/phi-3-vision-128k-instruct` | Small | ⚡ Fast | Vision instruct | ✅ Quick Vision |
| `microsoft/phi-4-multimodal-instruct` | Small | ⚡ Fast | Multimodal | ✅ Alternative |
| `nvidia/llama-nemotron-embed-vl-1b-v2` | 1B | ⚡⚡ Ultra Fast | Quick embed+vision | ✅ Embedding |

---

## 4. EMBEDDING MODELS

Used for: Skill matching, proof similarity search, recommendation engine

| Model | Size | Speed | Best For | Orin Use |
|-------|------|-------|----------|----------|
| `nvidia/nv-embed-v1` | Large | 🚀 Medium | General embeddings | ✅ Skill Embeddings |
| `nvidia/nv-embedqa-e5-v5` | Large | 🚀 Medium | QA embeddings | ✅ Proof Search |
| `nvidia/nv-embedqa-mistral-7b-v2` | 7B | 🚀 Medium | QA embeddings | ✅ Alternative |
| `nvidia/embed-qa-4` | Large | 🚀 Medium | Latest QA | ✅ Best QA |
| `nvidia/llama-3.2-nv-embedqa-1b-v1` | 1B | ⚡ Fast | Quick embeddings | ✅ Fast Embed |
| `nvidia/llama-nemotron-embed-1b-v2` | 1B | ⚡ Fast | Quick embed | ✅ Fast Embed |
| `nvidia/nv-embedcode-7b-v1` | 7B | 🚀 Medium | Code embeddings | ✅ Code Search |
| `baai/bge-m3` | Large | 🚀 Medium | Multi-lingual | ✅ Multi-language |
| `snowflake/arctic-embed-l` | Large | 🚀 Medium | Arctic embeddings | ✅ Alternative |

---

## 5. RETRIEVAL / SEARCH MODELS

Used for: Finding similar proofs, opportunity matching, skill recommendations

| Model | Size | Speed | Best For | Orin Use |
|-------|------|-------|----------|----------|
| `nvidia/nemoretriever-parse` | Large | 🚀 Medium | Document parsing | ✅ Doc Parsing |
| `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1` | 1B | ⚡ Fast | Quick retrieval | ✅ Quick Search |
| `nvidia/nemotron-parse` | Large | 🚀 Medium | Data parsing | ✅ Data Parse |
| `baai/bge-m3` | Large | 🚀 Medium | Retrieval | ✅ RAG |

---

## 6. TRANSLATION MODELS

Used for: Multi-language support, international users

| Model | Size | Speed | Best For | Orin Use |
|-------|------|-------|----------|----------|
| `nvidia/riva-translate-4b-instruct` | 4B | ⚡ Fast | Translation | ✅ i18n |
| `nvidia/riva-translate-4b-instruct-v1.1` | 4B | ⚡ Fast | Translation v2 | ✅ i18n |

---

## 7. SAFETY / GUARD MODELS

Used for: Content moderation, toxic detection, safe AI responses

| Model | Size | Speed | Best For | Orin Use |
|-------|------|-------|----------|----------|
| `meta/llama-guard-4-12b` | 12B | 🚀 Medium | Content safety | ✅ Content Mod |
| `nvidia/llama-3.1-nemoguard-8b-content-safety` | 8B | ⚡ Fast | Content safety | ✅ Toxic Filter |
| `nvidia/llama-3.1-nemoguard-8b-topic-control` | 8B | ⚡ Fast | Topic control | ✅ Topic Filter |
| `nvidia/llama-3.1-nemotron-safety-guard-8b-v3` | 8B | ⚡ Fast | Safety guard | ✅ Safety |
| `nvidia/nemotron-3-content-safety` | Large | 🚀 Medium | Content safety | ✅ Alternative |
| `nvidia/nemotron-3.5-content-safety` | Large | 🚀 Medium | Content safety v2 | ✅ Alternative |
| `nvidia/nemotron-content-safety-reasoning-4b` | 4B | ⚡ Fast | Reasoning safety | ✅ Reasoning |
| `nvidia/gliner-pii` | Small | ⚡ Fast | PII detection | ✅ Privacy |

---

## 8. SPECIALIZED MODELS

| Model | Type | Best For | Orin Use |
|-------|------|----------|----------|
| `nvidia/ai-synthetic-video-detector` | Detection | Detect AI-generated video | ✅ Deepfake Detection |
| `nvidia/cosmos-reason2-8b` | Reasoning | Visual reasoning | ✅ Visual Analysis |
| `nvidia/ising-calibration-1-35b-a3b` | Calibration | Model calibration | ❌ Not needed |
| `nvidia/nemotron-4-340b-reward` | Reward | RLHF scoring | ❌ Not needed |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | Reasoning | Omni reasoning | ✅ Complex Reasoning |
| `google/deplot` | Visualization | Chart understanding | ✅ Chart Analysis |
| `adept/fuyu-8b` | Vision | Image understanding | ✅ Alternative |
| `01-ai/yi-large` | Large | General tasks | ✅ Alternative |
| `ai21labs/jamba-1.5-large-instruct` | Large | Long context | ✅ Long Docs |
| `aisingapore/sea-lion-7b-instruct` | 7B | SEA languages | ✅ Multi-language |
| `bytedance/seed-oss-36b-instruct` | 36B | General | ✅ Alternative |
| `databricks/dbrx-instruct` | Large | Enterprise | ✅ Enterprise |
| `ibm/granite-3.0-3b-a800m-instruct` | 3B | Efficient | ✅ Efficient |
| `ibm/granite-3.0-8b-instruct` | 8B | Balanced | ✅ Alternative |
| `openai/gpt-oss-120b` | 120B | High quality | ✅ Premium |
| `openai/gpt-oss-20b` | 20B | Balanced | ✅ Alternative |
| `sarvamai/sarvam-m` | Large | Indian languages | ✅ Multi-language |
| `stepfun-ai/step-3.5-flash` | Large | Fast | ✅ Alternative |
| `stepfun-ai/step-3.7-flash` | Large | Fast v2 | ✅ Alternative |
| `stockmark/stockmark-2-100b-instruct` | 100B | Japanese | ❌ Not needed |
| `upstage/solar-10.7b-instruct` | 10.7B | Korean | ❌ Not needed |
| `writer/palmyra-creative-122b` | 122B | Creative writing | ✅ Content Gen |
| `writer/palmyra-fin-70b-32k` | 70B | Financial | ❌ Not needed |
| `writer/palmyra-med-70b` | 70B | Medical | ❌ Not needed |
| `zyphra/zamba2-7b-instruct` | 7B | Balanced | ✅ Alternative |

---

## ORIN RECOMMENDED MODELS

### Primary Stack (Must Have)

| Use Case | Model | Speed | Quality |
|----------|-------|-------|---------|
| **AI Coach Agent** | `meta/llama-3.1-8b-instruct` | ⚡ 718ms | ✅ Excellent |
| **Proof Verification** | `meta/llama-3.1-8b-instruct` | ⚡ 718ms | ✅ Excellent |
| **Skill Embeddings** | `nvidia/nv-embed-v1` | 🚀 Medium | ✅ Excellent |
| **Code Analysis** | `qwen/qwen3-coder-480b-a35b-instruct` | 🐢 Slow | ✅ Best |
| **Certificate Vision** | `meta/llama-3.2-11b-vision-instruct` | 🚀 Medium | ✅ Good |
| **Content Safety** | `meta/llama-guard-4-12b` | 🚀 Medium | ✅ Excellent |
| **PII Detection** | `nvidia/gliner-pii` | ⚡ Fast | ✅ Good |

### Secondary Stack (Nice to Have)

| Use Case | Model | Speed | Quality |
|----------|-------|-------|---------|
| **Complex Analysis** | `qwen/qwen3.5-122b-a10b` | 🚀 Medium | ✅ Excellent |
| **Deep Reasoning** | `nvidia/llama-3.1-nemotron-ultra-253b-v1` | 🐢 Slow | ✅ Best |
| **Quick Responses** | `meta/llama-3.2-3b-instruct` | ⚡⚡ Ultra Fast | ✅ Good |
| **Code Search** | `nvidia/nv-embedcode-7b-v1` | 🚀 Medium | ✅ Good |
| **Translation** | `nvidia/riva-translate-4b-instruct` | ⚡ Fast | ✅ Good |
| **Video Analysis** | `nvidia/vila` | 🚀 Medium | ✅ Good |
| **Document Parsing** | `nvidia/nemoretriever-parse` | 🚀 Medium | ✅ Good |

---

## MODEL SELECTION BY FEATURE

### 1. AI Career Coach
```
Primary:   meta/llama-3.1-8b-instruct (718ms, tool calling)
Fallback:  qwen/qwen3.5-122b-a10b (1225ms, high quality)
Premium:   nvidia/llama-3.3-nemotron-super-49b-v1.5 (16s, best)
```

### 2. Proof Verification Agent
```
GitHub:    meta/llama-3.1-8b-instruct + verify_github tool
Certificate: meta/llama-3.2-11b-vision-instruct (image) or verify_certificate tool
Kaggle:    meta/llama-3.1-8b-instruct + check_kaggle tool
```

### 3. Skill Matching Engine
```
Embeddings: nvidia/nv-embed-v1 (skill vectors)
Similarity: nvidia/nv-embedqa-e5-v5 (proof search)
Code Skills: nvidia/nv-embedcode-7b-v1 (code matching)
```

### 4. Content Moderation
```
Toxic:     meta/llama-guard-4-12b
PII:       nvidia/gliner-pii
Safety:    nvidia/llama-3.1-nemoguard-8b-content-safety
```

### 5. Opportunity Matching
```
Ranking:   meta/llama-3.1-8b-instruct (match scoring)
Embeddings: nvidia/nv-embed-v1 (skill-opportunity vectors)
Reasoning: qwen/qwen3.5-122b-a10b (complex matching)
```

### 6. Certificate Image Verification
```
Vision:    meta/llama-3.2-11b-vision-instruct
Analysis:  nvidia/cosmos-reason2-8b (visual reasoning)
Detection: nvidia/ai-synthetic-video-detector (deepfake)
```

### 7. Multi-Language Support
```
Translation: nvidia/riva-translate-4b-instruct
SEA:        aisingapore/sea-lion-7b-instruct
Indian:     sarvamai/sarvam-m
```

---

## COST ESTIMATES

### Per 1000 API Calls

| Model Category | Tokens/Call | Cost Estimate |
|----------------|-------------|---------------|
| Lightweight (3-8B) | 200-300 | ~$0.01 |
| Medium (12-50B) | 300-500 | ~$0.05 |
| Large (70-120B) | 400-600 | ~$0.10 |
| Premium (120B+) | 500-800 | ~$0.20 |
| Embeddings | 100-200 | ~$0.005 |

### Monthly Cost Projection (1000 users)

| Feature | Calls/Month | Model | Cost |
|---------|-------------|-------|------|
| AI Coach | 5,000 | llama-3.1-8b | $0.05 |
| Proof Verify | 2,000 | llama-3.1-8b | $0.02 |
| Skill Embed | 10,000 | nv-embed-v1 | $0.05 |
| Content Mod | 5,000 | llama-guard-4 | $0.05 |
| Vision Verify | 1,000 | llama-3.2-vision | $0.01 |
| **Total** | 23,000 | | **~$0.18/month** |

---

## DEPLOYMENT COMMANDS

### List All Models
```bash
curl -H "Authorization: Bearer $NVIDIA_API_KEY" \
  https://integrate.api.nvidia.com/v1/models
```

### Test Model
```bash
curl -X POST https://integrate.api.nvidia.com/v1/chat/completions \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta/llama-3.1-8b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

### Generate Embeddings
```bash
curl -X POST https://integrate.api.nvidia.com/v1/embeddings \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nvidia/nv-embed-v1",
    "input": "React developer with 3 proofs"
  }'
```
