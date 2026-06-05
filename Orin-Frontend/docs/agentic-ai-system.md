# Agentic AI System - Implementation Guide

## Overview
Built a complete agentic AI system with tool calling capabilities using NVIDIA NIM models. The system can verify proofs, check certificates, and analyze portfolios using real-world tools.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Agentic AI System                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   User      │    │   Agent     │    │   Tools     │ │
│  │   Query     │───▶│   Loop      │───▶│   Execute   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                           │                    │        │
│                           ▼                    ▼        │
│                    ┌─────────────┐    ┌─────────────┐   │
│                    │  NVIDIA NIM │    │   Results   │   │
│                    │  (Llama 3.1)│    │   Return    │   │
│                    └─────────────┘    └─────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Model Performance Results

### Tested Models for Agentic Capabilities

| Model | Status | Time | Tool Calling | JSON Valid |
|-------|--------|------|--------------|------------|
| **meta/llama-3.1-8b-instruct** | OK | 718ms | Yes | Yes |
| **qwen/qwen3.5-122b-a10b** | OK | 1225ms | Yes | Yes |
| **nvidia/llama-3.3-nemotron-super-49b-v1.5** | OK | 16062ms | Yes | Yes |
| z-ai/glm-5.1 | OK | 8477ms | Yes | Yes |
| minimaxai/minimax-m2.7 | Timeout | - | - | - |
| moonshotai/kimi-k2.6 | OK | 10645ms | No | No |
| deepseek-ai/deepseek-v4-pro | Timeout | - | - | - |

### Recommended Models

| Use Case | Model | Why |
|----------|-------|-----|
| **Primary Agent** | meta/llama-3.1-8b-instruct | Fastest (718ms), reliable tool calling |
| **Complex Analysis** | qwen/qwen3.5-122b-a10b | High quality reasoning |
| **Fallback** | nvidia/llama-3.3-nemotron-super-49b-v1.5 | NVIDIA optimized |

## Available Tools

### 1. verify_github
```typescript
verify_github(url: string) → {
  exists: boolean;
  name?: string;
  stars?: number;
  language?: string;
  owner?: string;
  is_fork?: boolean;
}
```

**Purpose**: Verify GitHub repositories exist and get metadata.

### 2. verify_certificate
```typescript
verify_certificate(url: string) → {
  exists: boolean;
  status?: number;
  platform?: string;
  accessible?: boolean;
}
```

**Purpose**: Verify certificate URLs (Coursera, Udemy, edX, etc.)

### 3. check_kaggle
```typescript
check_kaggle(url: string) → {
  exists: boolean;
  status?: number;
  type?: 'notebook' | 'dataset';
  accessible?: boolean;
}
```

**Purpose**: Verify Kaggle notebooks and datasets.

### 4. web_search
```typescript
web_search(query: string) → {
  results: Array<{title, url, snippet}>;
}
```

**Purpose**: Search the web for information.

## API Endpoints

### POST /api/ai/verify

Verify a proof using agentic AI.

**Request:**
```json
{
  "action": "verify",
  "proofId": "uuid",
  "proofUrl": "https://github.com/user/repo",
  "sourceType": "github"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "verified": true,
    "thinking": "Verified GitHub repository exists",
    "toolCalls": [
      {
        "tool": "verify_github",
        "args": {"url": "https://github.com/user/repo"},
        "success": true,
        "data": {
          "exists": true,
          "name": "user/repo",
          "stars": 1234
        }
      }
    ],
    "answer": "Repository verified with 1234 stars",
    "iterations": 2,
    "tokensUsed": 250
  }
}
```

### POST /api/ai/verify (Analyze)

Analyze proof quality.

**Request:**
```json
{
  "action": "analyze",
  "proofData": {
    "title": "React Dashboard",
    "description": "A React dashboard project",
    "skills": ["react", "typescript"],
    "sourceType": "github"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "thinking": "Analyzing proof quality",
    "answer": "Your proof is strong. Consider adding tests...",
    "iterations": 1,
    "tokensUsed": 180
  }
}
```

## Agent Loop Process

1. **User Query** → Agent receives verification request
2. **Tool Selection** → AI selects appropriate tool (verify_github, etc.)
3. **Tool Execution** → System executes tool and returns results
4. **Reasoning** → AI processes tool results
5. **Iteration** → If more verification needed, repeat steps 2-4
6. **Final Answer** → AI provides verified result

## Example Agent Flow

```
User: "Verify https://github.com/facebook/react"

Iteration 1:
  AI: {"thinking":"Need to verify GitHub repo","tool_call":{"name":"verify_github","arguments":{"url":"https://github.com/facebook/react"}}}
  Tool: Execute verify_github → {exists: true, name: "facebook/react", stars: 245466}

Iteration 2:
  AI: {"thinking":"Repository verified","answer":"Repository exists with 245466 stars"}

Result: Verified ✓
```

## Usage in Orin

### Auto-Verification
When a user submits a proof, the system automatically:
1. Detects source type (GitHub, Certificate, Kaggle)
2. Calls appropriate verification tool
3. Updates proof status based on results
4. Returns verification result to user

### Manual Verification
Users can request verification from the dashboard:
1. Click "Verify" on any proof card
2. Agent runs verification in background
3. Proof status updates automatically
4. User sees detailed verification report

## Cost Analysis

### Token Usage per Verification
- **Simple verification**: ~200-300 tokens
- **Multi-tool verification**: ~400-600 tokens
- **Complex analysis**: ~300-500 tokens

### Monthly Costs (1000 users)
| Operation | Tokens/Month | Cost |
|-----------|--------------|------|
| GitHub verification | 50,000 | ~$0.05 |
| Certificate verification | 30,000 | ~$0.03 |
| Proof analysis | 40,000 | ~$0.04 |
| **Total** | 120,000 | **~$0.12** |

## Configuration

### Environment Variables
```env
NVIDIA_API_KEY=nvapi-your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Model Selection
Default: `meta/llama-3.1-8b-instruct` (fastest, reliable)
Alternative: `qwen/qwen3.5-122b-a10b` (highest quality)

## Deployment

### 1. Deploy Edge Functions
```bash
supabase functions deploy ai-verify
supabase functions deploy ai-coach
```

### 2. Set Environment Variables
```bash
supabase secrets set NVIDIA_API_KEY=nvapi-your_key_here
```

### 3. Test Verification
```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-verify \
  -H "Authorization: Bearer your anon key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"...","proofUrl":"https://github.com/facebook/react","sourceType":"github"}'
```

## Future Enhancements

### Planned Tools
1. **LinkedIn Verification** - Verify LinkedIn profiles
2. **LeetCode Verification** - Check coding achievements
3. **HackerRank Verification** - Verify badges and scores
4. **Email Verification** - Send verification emails
5. **Image Analysis** - Verify certificate images

### Multi-Agent System
- **Research Agent** - Gathers information
- **Verification Agent** - Validates proofs
- **Coach Agent** - Provides career advice
- **Orchestrator** - Coordinates all agents
