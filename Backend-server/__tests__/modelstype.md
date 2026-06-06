# Orin AI - Model Categories Selection

## Platform Overview
Orin is a career development platform for students and early-career developers featuring AI-powered career coaching, skill analysis, portfolio scoring, opportunity matching, proof verification, and learning path generation.

---

## Recommended Model Categories

### 1. Text Generation (PRIMARY - Core Feature)
**Use Case:** Chat, coaching, learning paths, portfolio analysis, opportunity matching
**Priority:** CRITICAL

| Feature | Recommended Model | Why |
|---------|------------------|-----|
| Career Chat | `meta/llama-3.1-8b-instruct` | Fast, free, good for Q&A |
| Coach Agent | `meta/llama-3.3-70b-instruct` | Higher quality advice |
| Learning Paths | `qwen/qwen3.5-122b-a10b` | Strong reasoning for recommendations |
| Portfolio Scorer | `meta/llama-3.1-8b-instruct` | Structured JSON output |
| Opportunity Matcher | `meta/llama-3.1-8b-instruct` | Fast matching with embeddings |

**API Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
**Compatibility:** OpenAI-compatible (drop-in replacement)

---

### 2. Text-to-Embedding (CRITICAL - Matching Engine)
**Use Case:** Skill similarity, opportunity matching, semantic search
**Priority:** CRITICAL

| Feature | Recommended Model | Why |
|---------|------------------|-----|
| Skill Matching | `nvidia/nv-embedqa-e5-v5` | Best quality embeddings |
| Portfolio Similarity | `nvidia/nv-embed-v1` | NVIDIA optimized |
| Fast Matching | `nvidia/llama-3.2-nv-embedqa-1b-v1` | Lightweight, fast |

**API Endpoint:** `https://integrate.api.nvidia.com/v1/embeddings`
**Compatibility:** OpenAI-compatible

---

### 3. Code Generation (IMPORTANT - Proof Analysis)
**Use Case:** Analyze GitHub code, code quality assessment, skill extraction from code
**Priority:** HIGH

| Feature | Recommended Model | Why |
|---------|------------------|-----|
| Code Analysis | `nvidia/llama-3.1-nemotron-51b-instruct` | Strong code understanding |
| Code Review | `mistralai/codestral-22b-instruct-v0.1` | Purpose-built for code |
| Skill Extraction | `bigcode/starcoder2-15b` | Code-specific training |

**API Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
**Compatibility:** OpenAI-compatible

---

### 4. Vision / Image-to-Text (HIGH VALUE - Certificate Verification)
**Use Case:** Verify certificates, analyze screenshots, read badge images
**Priority:** HIGH

| Feature | Recommended Model | Why |
|---------|------------------|-----|
| Certificate OCR | `meta/llama-3.2-90b-vision-instruct` | Best vision understanding |
| Screenshot Analysis | `microsoft/phi-4-multimodal-instruct` | Efficient multimodal |
| Badge Reading | `nvidia/llama-3.1-nemotron-nano-vl-8b-v1` | Fast, NVIDIA optimized |

**API Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
**Compatibility:** OpenAI-compatible (send image URLs)

---

### 5. Safety & Moderation (REQUIRED - Content Safety)
**Use Case:** Filter inappropriate content, prevent abuse, ensure safe interactions
**Priority:** REQUIRED

| Feature | Recommended Model | Why |
|---------|------------------|-----|
| Content Safety | `nvidia/llama-3.1-nemoguard-8b-content-safety` | Purpose-built guardrails |
| Topic Control | `nvidia/llama-3.1-nemoguard-8b-topic-control` | Keep conversations on-topic |
| PII Detection | `nvidia/gliner-pii` | Detect personal information |

**API Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
**Compatibility:** OpenAI-compatible

---

### 6. RAG (Retrieval Augmented Generation) (MEDIUM - Enhanced Matching)
**Use Case:** Better opportunity matching, document retrieval, enhanced search
**Priority:** MEDIUM

| Feature | Recommended Model | Why |
|---------|------------------|-----|
| Document QA | `nvidia/llama3-chatqa-1.5-70b` | Optimized for RAG |
| Retriever | `nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1` | Multimodal retrieval |
| Re-ranking | `nvidia/nemoretriever-parse` | Document parsing |

**API Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
**Compatibility:** OpenAI-compatible

---

### 7. Text Translation (LOW PRIORITY - Future Feature)
**Use Case:** Multi-language support for global users
**Priority:** LOW (Phase 2)

| Feature | Recommended Model | Why |
|---------|------------------|-----|
| Translation | `nvidia/riva-translate-4b-instruct-v1.1` | 12 languages, few-shot |

**API Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
**Compatibility:** OpenAI-compatible

---

## Implementation Priority

### Phase 1 (MVP)
1. **Text Generation** - `meta/llama-3.1-8b-instruct` (chat, verification, portfolio)
2. **Text-to-Embedding** - `nvidia/nv-embedqa-e5-v5` (skill matching)
3. **Safety & Moderation** - `nvidia/llama-3.1-nemoguard-8b-content-safety`

### Phase 2 (Enhancement)
4. **Code Generation** - `mistralai/codestral-22b-instruct-v0.1` (code analysis)
5. **Vision** - `meta/llama-3.2-90b-vision-instruct` (certificate verification)

### Phase 3 (Scale)
6. **RAG** - `nvidia/llama3-chatqa-1.5-70b` (enhanced matching)
7. **Translation** - `nvidia/riva-translate-4b-instruct-v1.1` (global reach)

---

## API Usage Examples

### Text Generation (Chat)
```typescript
const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer nvapi-YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'meta/llama-3.1-8b-instruct',
    messages: [{ role: 'user', content: 'Give me career advice' }],
    temperature: 0.7,
    max_tokens: 500
  })
});
```

### Embeddings (Skill Matching)
```typescript
const response = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer nvapi-YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'nvidia/nv-embedqa-e5-v5',
    input: 'React, TypeScript, Node.js'
  })
});
```

### Vision (Certificate Verification)
```typescript
const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer nvapi-YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'meta/llama-3.2-90b-vision-instruct',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'What certification is this?' },
        { type: 'image_url', image_url: { url: 'https://...' } }
      ]
    }]
  })
});
```

---

## Cost Considerations

| Category | Free Tier | Rate Limit |
|----------|-----------|------------|
| Text Generation | ✅ Yes | 40 RPM |
| Embeddings | ✅ Yes | 40 RPM |
| Vision | ✅ Yes | 40 RPM |
| Safety | ✅ Yes | 40 RPM |

**Note:** All models on NVIDIA NIM are currently free for development. Production use requires NVIDIA AI Enterprise license.

---

## Summary

| Category | Models | Priority | Use Case |
|----------|--------|----------|----------|
| Text Generation | 101 | CRITICAL | Chat, coaching, analysis |
| Text-to-Embedding | 11 | CRITICAL | Skill matching, search |
| Code Generation | 10 | HIGH | Code analysis |
| Vision / Image-to-Text | 11 | HIGH | Certificate verification |
| Safety & Moderation | 8 | REQUIRED | Content safety |
| RAG | 3 | MEDIUM | Enhanced matching |
| Text Translation | 2 | LOW | Global reach |

**Total Recommended:** 147 models across 7 categories
