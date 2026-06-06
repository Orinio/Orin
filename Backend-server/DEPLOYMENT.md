# Orin Backend - Deployment Guide

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd Backend-server
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Run Development Server
```bash
npm run dev
```

Server starts at `http://localhost:3001`

---

## Production Deployment Options

### Option 1: Railway (Recommended)

Railway is the easiest option for Express servers.

#### Steps:
1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
cd Backend-server
railway init
```

4. **Set Environment Variables**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_ANON_KEY=your-anon-key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set NVIDIA_API_KEY=nvapi-your-api-key
railway variables set NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
railway variables set ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

5. **Deploy**
```bash
railway up
```

6. **Get Your URL**
```bash
railway domain
```

#### Railway Pricing:
- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited)

---

### Option 2: Render

#### Steps:
1. **Go to [render.com](https://render.com)** and sign up

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - **Name**: `orin-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NVIDIA_API_KEY=nvapi-your-api-key
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will auto-deploy on push

#### Render Pricing:
- **Free Tier**: 750 hours/month (spins down after inactivity)
- **Starter**: $7/month (always on)

---

### Option 3: Fly.io (Docker)

#### Steps:
1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login**
```bash
fly auth login
```

3. **Initialize App**
```bash
cd Backend-server
fly launch
```

4. **Set Secrets**
```bash
fly secrets set NODE_ENV=production
fly secrets set SUPABASE_URL=https://your-project.supabase.co
fly secrets set SUPABASE_ANON_KEY=your-anon-key
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
fly secrets set NVIDIA_API_KEY=nvapi-your-api-key
fly secrets set NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
fly secrets set ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

5. **Deploy**
```bash
fly deploy
```

#### Fly.io Pricing:
- **Free Tier**: 3 shared-cpu-1x VMs
- **Scale**: Pay as you go

---

### Option 4: Docker (Self-Hosted)

#### Build Image
```bash
cd Backend-server
docker build -t orin-backend .
```

#### Run Container
```bash
docker run -d \
  --name orin-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -e NVIDIA_API_KEY=nvapi-your-api-key \
  -e NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1 \
  -e ALLOWED_ORIGINS=https://your-frontend.vercel.app \
  orin-backend
```

---

## Frontend Deployment (Vercel)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Configure Environment Variables
```bash
cd Orin-Frontend
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://your-backend-url.railway.app
```

### 4. Deploy
```bash
vercel --prod
```

---

## Supabase Migration

### Run Migration
```bash
cd Orin-Frontend
supabase db push
# OR
supabase migration up
```

### Manual Migration
Go to Supabase Dashboard → SQL Editor → Run the migration file:
```
supabase/migrations/20260606000000_create_ai_memory_tables.sql
```

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port (default: 3001) | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NVIDIA_API_KEY` | NVIDIA NIM API key | Yes |
| `NVIDIA_BASE_URL` | NVIDIA API base URL | Yes |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | Yes |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |

---

## API Endpoints (Backend)

```
Health Check:
GET  /health

AI Agents:
GET  /ai/agents              - List all agents
GET  /ai/agents/:id          - Get agent details
POST /ai/agents/:id/run      - Run single agent
POST /ai/agents/chat         - Run chat agent
POST /ai/agents/chat/stream  - Stream chat (SSE)

Workflows:
POST /ai/workflows/career-analysis  - Run career workflow
POST /ai/workflows/verify-proof     - Run verification workflow

Tools:
GET  /ai/tools               - List all tools
GET  /ai/tools/:category     - Get tools by category

Memory:
POST /ai/memory/save         - Save to memory
GET  /ai/memory/search       - Search memories
GET  /ai/memory/preferences  - Get user preferences
GET  /ai/memory/skills       - Get user skills
GET  /ai/memory/goals        - Get user goals

Legacy AI:
POST /ai/verify              - Verify proofs
POST /ai/chat                - Non-streaming chat
POST /ai/chat-stream         - Streaming chat
GET  /ai/skills              - Skill analysis
POST /ai/match               - Match opportunities
POST /ai/learning-path       - Generate learning path
POST /ai/score               - Score portfolio
POST /ai/safety              - Check safety
```

---

## Testing Deployment

### Health Check
```bash
curl https://your-backend-url/health
```

### Test Agent Chat
```bash
curl -X POST https://your-backend-url/ai/agents/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"query": "Hello, who are you?"}'
```

---

## Troubleshooting

### Build Fails
- Ensure all environment variables are set
- Check Node.js version (use 20.x)

### CORS Errors
- Add frontend URL to `ALLOWED_ORIGINS`
- Include protocol: `https://your-frontend.vercel.app`

### 503 Service Unavailable
- Check if NVIDIA_API_KEY is valid
- Verify Supabase credentials

### Cold Starts
- Use paid tier for always-on services
- Or upgrade Railway/Render plan

---

## Recommended Setup

| Component | Service | Cost |
|-----------|---------|------|
| Backend | Railway (Starter) | $5/month |
| Frontend | Vercel (Hobby) | Free |
| Database | Supabase (Free) | Free |
| **Total** | | **~$5/month** |
