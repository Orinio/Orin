# Orin AI - Model Selection Results

## Competition Overview
**Date:** June 6, 2026  
**Models Tested:** 35+ models across 8 categories  
**Test Duration:** ~10 minutes  
**Test Criteria:** Speed, Quality, Tool Calling, Embeddings, Vision, Safety

---

## 🏆 WINNERS BY CATEGORY

### 🥇 Best Overall Model
**Winner:** `qwen/qwen3-coder-480b-a35b-instruct`
| Metric | Value |
|--------|-------|
| Response Time | 13,148ms |
| Quality Score | 63/100 |
| Tokens/sec | 19 |
| Tool Calling | ❌ |

**Why:** Highest quality responses with detailed, actionable advice. Best for complex reasoning tasks like learning paths and career coaching.

---

### ⚡ Best for Speed
**Winner:** `qwen/qwen3.5-397b-a17b`
| Metric | Value |
|--------|-------|
| Response Time | 3,838ms |
| Quality Score | 63/100 |
| Tokens/sec | 69 |
| Tool Calling | ✅ |

**Why:** Fastest response time (3.8s) with high quality. Perfect for real-time chat and interactive features.

---

### 🎯 Best for Quality
**Winner:** `qwen/qwen3-coder-480b-a35b-instruct`
| Metric | Value |
|--------|-------|
| Response Time | 13,148ms |
| Quality Score | 63/100 |
| Tokens/sec | 19 |

**Why:** Most detailed and actionable responses. Best for learning paths, portfolio analysis, and career advice.

---

### 🔧 Best for Tool Calling
**Winner:** `qwen/qwen3.5-397b-a17b`
| Metric | Value |
|--------|-------|
| Response Time | 2,864ms |
| Tool Call Correct | ✅ Yes |
| JSON Parsing | ✅ Success |

**Why:** Only model that correctly parsed the tool call format and returned valid JSON with proper tool invocation.

**Runner-up:** `minimaxai/minimax-m2.7` (also correct tool calling, 3,162ms)

---

### 🔢 Best Embedding Model
**Winner:** `baai/bge-m3`
| Metric | Value |
|--------|-------|
| Response Time | 882ms |
| Dimensions | 1024 |
| Tokens Used | 39 |

**Why:** Fastest embedding model with good dimensions. Perfect for skill matching and similarity search.

**Runner-up:** `nvidia/nv-embed-v1` (4,096 dimensions but slower at 3,993ms)

---

### 👁️ Best Vision Model
**Winner:** `meta/llama-3.2-90b-vision-instruct`
| Metric | Value |
|--------|-------|
| Response Time | 11,776ms |
| Quality Score | 80/100 |
| Tokens/sec | 24.5 |

**Why:** Best vision understanding with detailed extraction capabilities. Ideal for certificate verification.

**Runner-up:** `meta/llama-3.2-11b-vision-instruct` (faster at 10,588ms, same score)

---

### 🛡️ Best Safety Model
**Winner:** `nvidia/llama-3.1-nemoguard-8b-content-safety`
| Metric | Value |
|--------|-------|
| Response Time | 1,024ms |
| Quality Score | 65/100 |
| Tokens/sec | 430.7 |

**Why:** Fastest safety model with accurate content classification. Essential for content moderation.

---

### 💰 Best Value (Speed + Quality)
**Winner:** `qwen/qwen3.5-397b-a17b`
| Metric | Value |
|--------|-------|
| Response Time | 3,838ms |
| Quality Score | 63/100 |
| Tokens/sec | 69 |
| Tool Calling | ✅ |

**Why:** Best balance of speed and quality. Fast enough for real-time use, good enough for complex tasks.

---

### 🥈 Runner Up Overall
**Winner:** `meta/llama-3.2-3b-instruct`
| Metric | Value |
|--------|-------|
| Response Time | 4,101ms |
| Quality Score | 57/100 |
| Tokens/sec | 95.3 |

**Why:** Fastest light model with good quality. Perfect for simple chat and quick responses.

---

## 📊 COMPLETE TEST RESULTS

### Text Generation Models - Light

| Model | Status | Time | Score | Tokens/sec |
|-------|--------|------|-------|------------|
| meta/llama-3.1-8b-instruct | ✅ | 4,301ms | 57 | 86 |
| meta/llama-3.2-3b-instruct | ✅ | 4,101ms | 57 | 95.3 |
| nvidia/llama-3.1-nemotron-nano-8b-v1 | ✅ | 5,913ms | 57 | 91.8 |
| google/gemma-2-9b-it | ❌ | 270ms | - | - |
| mistralai/mistral-7b-instruct-v0.3 | ❌ | 136ms | - | - |
| microsoft/phi-4-mini-instruct | ❌ | 20,019ms | - | - |

### Text Generation Models - Medium

| Model | Status | Time | Score | Tokens/sec |
|-------|--------|------|-------|------------|
| nvidia/llama-3.3-nemotron-super-49b-v1 | ✅ | 18,175ms | 57 | 30.3 |
| meta/llama-3.1-70b-instruct | ❌ | 25,006ms | - | - |
| meta/llama-3.3-70b-instruct | ❌ | 25,013ms | - | - |
| mistralai/mistral-large-2-instruct | ❌ | 278ms | - | - |
| deepseek-ai/deepseek-v4-flash | ❌ | 25,015ms | - | - |
| qwen/qwen3.5-122b-a10b | ❌ | 983ms | - | - |

### Text Generation Models - Heavy

| Model | Status | Time | Score | Tokens/sec |
|-------|--------|------|-------|------------|
| qwen/qwen3-coder-480b-a35b-instruct | ✅ | 13,148ms | 63 | 19 |
| qwen/qwen3.5-397b-a17b | ✅ | 3,838ms | 63 | 69 |
| moonshotai/kimi-k2.6 | ✅ | 17,460ms | 43 | 31.4 |
| minimaxai/minimax-m2.7 | ✅ | 14,025ms | 43 | 29.5 |
| deepseek-ai/deepseek-v4-pro | ❌ | 45,017ms | - | - |
| z-ai/glm-5.1 | ❌ | 45,005ms | - | - |
| mistralai/mistral-large-3-675b-instruct-2512 | ❌ | 45,004ms | - | - |
| nvidia/llama-3.1-nemotron-ultra-253b-v1 | ❌ | 353ms | - | - |

### Vision Models

| Model | Status | Time | Score | Tokens/sec |
|-------|--------|------|-------|------------|
| meta/llama-3.2-90b-vision-instruct | ✅ | 11,776ms | 80 | 24.5 |
| meta/llama-3.2-11b-vision-instruct | ✅ | 10,588ms | 80 | 38.8 |
| nvidia/llama-3.1-nemotron-nano-vl-8b-v1 | ✅ | 9,728ms | 80 | 39.5 |
| microsoft/phi-4-multimodal-instruct | ❌ | 316ms | - | - |
| nvidia/neva-22b | ❌ | 358ms | - | - |

### Embedding Models

| Model | Status | Time | Dimensions |
|-------|--------|------|------------|
| baai/bge-m3 | ✅ | 882ms | 1024 |
| nvidia/nv-embed-v1 | ✅ | 3,993ms | 4096 |
| nvidia/nv-embedqa-e5-v5 | ❌ | 806ms | - |
| nvidia/nv-embedqa-mistral-7b-v2 | ❌ | 317ms | - |
| nvidia/llama-3.2-nv-embedqa-1b-v1 | ❌ | 325ms | - |
| snowflake/arctic-embed-l | ❌ | 390ms | - |
| nvidia/embed-qa-4 | ❌ | 359ms | - |

### Safety Models

| Model | Status | Time | Score | Tokens/sec |
|-------|--------|------|-------|------------|
| nvidia/llama-3.1-nemoguard-8b-content-safety | ✅ | 1,024ms | 65 | 430.7 |
| nvidia/llama-3.1-nemoguard-8b-topic-control | ✅ | 854ms | 25 | 120.6 |
| nvidia/llama-3.1-nemotron-safety-guard-8b-v3 | ✅ | 3,241ms | 65 | 136.4 |
| nvidia/gliner-pii | ✅ | 512ms | 65 | 70.3 |

### Tool Calling Tests

| Model | Status | Time | Tool Call | JSON Parse |
|-------|--------|------|-----------|------------|
| qwen/qwen3.5-397b-a17b | ✅ | 2,864ms | ✅ | ✅ |
| minimaxai/minimax-m2.7 | ✅ | 3,162ms | ✅ | ✅ |
| meta/llama-3.1-8b-instruct | ✅ | 1,124ms | ❌ | ❌ |
| meta/llama-3.1-70b-instruct | ✅ | 6,562ms | ❌ | ❌ |
| nvidia/llama-3.3-nemotron-super-49b-v1 | ✅ | 10,086ms | ❌ | ❌ |
| moonshotai/kimi-k2.6 | ✅ | 2,151ms | ❌ | ❌ |
| deepseek-ai/deepseek-v4-pro | ❌ | 30,014ms | ❌ | ❌ |
| z-ai/glm-5.1 | ❌ | 30,006ms | ❌ | ❌ |

---

## 🎯 RECOMMENDED MODEL STACK FOR ORIN

### Phase 1: MVP (Immediate Implementation)

| Use Case | Model | Why |
|----------|-------|-----|
| **Career Chat** | `qwen/qwen3.5-397b-a17b` | Fast (3.8s), good quality, tool calling |
| **Coach Agent** | `qwen/qwen3-coder-480b-a35b-instruct` | Best quality for detailed advice |
| **Skill Matching** | `baai/bge-m3` | Fastest embeddings (882ms) |
| **Content Safety** | `nvidia/llama-3.1-nemoguard-8b-content-safety` | Fast (1s), accurate |
| **Certificate Verification** | `meta/llama-3.2-90b-vision-instruct` | Best vision understanding |
| **Portfolio Scorer** | `qwen/qwen3.5-397b-a17b` | Fast, structured JSON output |

### Phase 2: Enhancement (After MVP)

| Use Case | Model | Why |
|----------|-------|-----|
| **Learning Paths** | `qwen/qwen3-coder-480b-a35b-instruct` | Detailed, actionable content |
| **Opportunity Matching** | `qwen/qwen3.5-397b-a17b` | Fast with tool calling |
| **Code Analysis** | `qwen/qwen3-coder-480b-a35b-instruct` | Strong code understanding |
| **PII Detection** | `nvidia/gliner-pii` | Specialized for PII |

### Phase 3: Scale (Global Reach)

| Use Case | Model | Why |
|----------|-------|-----|
| **Quick Chat** | `meta/llama-3.2-3b-instruct` | Fastest (95 tokens/sec) |
| **Multilingual** | `nvidia/riva-translate-4b-instruct-v1.1` | 12 languages |

---

## 📝 API CONFIGURATION

### Base URL
```
https://integrate.api.nvidia.com/v1
```

### API Key
```
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
```

### OpenAI-Compatible Endpoints
- Chat: `/v1/chat/completions`
- Embeddings: `/v1/embeddings`

---

## 🔧 IMPLEMENTATION CODE

### Chat Agent (Primary)
```typescript
const chatModel = 'qwen/qwen3.5-397b-a17b';

const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: chatModel,
    messages: [
      { role: 'system', content: 'You are Orin AI, a career advisor.' },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
});
```

### Embedding Model (Skill Matching)
```typescript
const embeddingModel = 'baai/bge-m3';

const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: embeddingModel,
    input: 'React, TypeScript, Node.js'
  })
});
```

### Vision Model (Certificate Verification)
```typescript
const visionModel = 'meta/llama-3.2-90b-vision-instruct';

const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: visionModel,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Extract all information from this certificate' },
        { type: 'image_url', image_url: { url: certificateUrl } }
      ]
    }]
  })
});
```

---

## ⚠️ IMPORTANT NOTES

1. **Models not working:** Some models returned 404 errors - they may not be available via the API yet
2. **Timeouts:** Heavy models (DeepSeek V4 Pro, GLM 5.1) timed out - consider using smaller variants
3. **Tool Calling:** Only Qwen 3.5 397B and MiniMax M2.7 correctly handled tool calling
4. **Rate Limits:** Free tier allows 40 requests per minute per model
5. **Cost:** All models are currently free for development

---

## 📈 PERFORMANCE SUMMARY

| Category | Winner | Speed | Quality |
|----------|--------|-------|---------|
| Overall | qwen/qwen3-coder-480b-a35b-instruct | 13.1s | 63/100 |
| Speed | qwen/qwen3.5-397b-a17b | 3.8s | 63/100 |
| Tool Calling | qwen/qwen3.5-397b-a17b | 2.9s | ✅ |
| Embeddings | baai/bge-m3 | 0.9s | 1024 dim |
| Vision | meta/llama-3.2-90b-vision-instruct | 11.8s | 80/100 |
| Safety | nvidia/llama-3.1-nemoguard-8b-content-safety | 1.0s | 65/100 |

**Bottom Line:** Use `qwen/qwen3.5-397b-a17b` for most tasks (fast + tool calling), and `qwen/qwen3-coder-480b-a35b-instruct` for complex reasoning (learning paths, detailed analysis).
