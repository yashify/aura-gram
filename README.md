# Aura Gram

An AI-powered social media caption generator that analyzes images and generates platform-specific captions for Instagram, Twitter, Facebook, LinkedIn, TikTok, Pinterest, and Threads. Built with Next.js 15, React 19, and powered by NVIDIA's vision and language models.

## 🎯 Overview

Aura Gram is a full-stack web application designed to streamline content creation. Simply upload an image or provide an image URL, and the application:

1. **Analyzes the image** using a vision model to understand visual context, composition, lighting, and mood
2. **Generates tailored captions** for 7 major social platforms with platform-specific optimization
3. **Tracks usage metrics** with rate limiting, visitor analytics, and developer dashboard
4. **Provides multiple caption options** allowing you to select and copy the best version for each platform

## ✨ Features

### Core Functionality
- **Dual Input Methods**: Upload images as files or provide external image URLs
- **Multi-Platform Captions**: Generate optimized captions for 7 social media platforms
  - Instagram (hashtags & emojis)
  - Twitter (280 character limit)
  - Facebook (conversational tone)
  - LinkedIn (professional & value-driven)
  - TikTok (Gen Z friendly)
  - Pinterest (inspirational & SEO)
  - Threads (casual & authentic)
- **Two Processing Modes**:
  - **Captions Mode**: Full platform-specific caption generation
  - **Analysis Mode**: Detailed image analysis without caption generation
- **Full Caption Visibility**: No truncation - view and copy entire captions easily
- **Individual Copy Buttons**: Copy button for each platform's caption

### Backend & Performance
- **Rate Limiting**: Configurable hourly (2) and daily (5) API call limits
- **Visitor Tracking**: Analytics on daily visitor sessions
- **Developer Dashboard**: Real-time metrics, API usage charts, error logs
- **Optional Password Protection**: Secure developer dashboard with optional authentication

### Design & UX
- **Mistral Brand Design System**: Warm golden color palette, bold typography, European minimalism
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Status**: Visual processing feedback during image analysis
- **Custom UI Components**: Built with shadcn/ui and Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui with custom Mistral theming
- **Charts**: Recharts for analytics visualization
- **Type Safety**: TypeScript

### Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: Supabase PostgreSQL
- **LLM APIs**: NVIDIA NIM (via OpenAI-compatible SDK)
  - Vision Model: Qwen 3.5 122B
  - Text Model: Llama 4 Maverick 17B
- **Authentication**: UUID-based cookie sessions

### Infrastructure
- **Deployment Ready**: Optimized for Vercel
- **Database**: Supabase (PostgreSQL)
- **API Integration**: NVIDIA NIM for LLM inference

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase project (free tier available)
- NVIDIA API key for LLM access

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd aura-gram
   npm install
   ```

2. **Configure environment variables** (copy and edit):
   ```bash
   cp .env.local.example .env.local
   ```

3. **Set up environment variables**:
   - `NVIDIA_API_KEY`: Your NVIDIA NIM API key
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
   - Optional: Custom vision/text models, platform-specific prompts, rate limits

4. **Set up Supabase database**:
   - Create tables for: `users`, `api_calls`, `visit_logs`, `user_settings`, `developer_metrics`
   - Disable RLS for development (enable with policies for production)
   - See database schema below

5. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## 📋 Environment Variables

```env
# NVIDIA LLM API
NVIDIA_API_KEY=your_nvidia_api_key_here

# LLM Models (with defaults)
VISION_MODEL=qwen/qwen3.5-122b-a10b
TEXT_MODEL=meta/llama-4-maverick-17b-128e-instruct

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Rate Limiting
RATE_LIMIT_CALLS_PER_DAY=5          # Max API calls per day
RATE_LIMIT_CALLS_PER_HOUR=2         # Max API calls per hour
RATE_LIMIT_WINDOW_MS=3600000        # Rate limit window (ms)

# Platform-Specific System Prompts (optional)
DEFAULT_SYSTEM_PROMPT_INSTAGRAM="You are an expert Instagram caption writer..."
DEFAULT_SYSTEM_PROMPT_TWITTER="You are a Twitter expert..."
DEFAULT_SYSTEM_PROMPT_FACEBOOK="You are a Facebook marketing expert..."
DEFAULT_SYSTEM_PROMPT_LINKEDIN="You are a LinkedIn professional..."
DEFAULT_SYSTEM_PROMPT_TIKTOK="You are a TikTok content expert..."
DEFAULT_SYSTEM_PROMPT_PINTEREST="You are a Pinterest expert..."
DEFAULT_SYSTEM_PROMPT_THREADS="You are a Threads expert..."

# Developer Dashboard (optional)
DEVELOPER_DASHBOARD_PASSWORD=your-optional-password-here
```

## 📁 Project Structure

```
aura-gram/
├── app/
│   ├── api/
│   │   ├── generate/          # Main caption generation endpoint
│   │   ├── visitor-tracking/  # Visitor analytics endpoint
│   │   ├── settings/          # User settings endpoint
│   │   └── metrics/           # Developer metrics endpoint
│   ├── components/            # React components
│   │   ├── ModeSelector.tsx
│   │   ├── PlatformSelector.tsx
│   │   ├── ProcessingStatus.tsx
│   │   └── ResultDisplay.tsx
│   ├── developer/             # Protected analytics dashboard
│   │   └── page.tsx
│   ├── layout.tsx             # Root layout with header/footer
│   ├── page.tsx               # Main application page
│   └── globals.css            # Global styles & CSS variables
├── lib/
│   ├── auth.ts                # User authentication & session
│   ├── rateLimiter.ts         # Rate limiting logic
│   ├── visitorTracker.ts      # Visitor analytics tracking
│   ├── metrics.ts             # Metrics collection
│   └── supabaseClient.ts      # Supabase client configuration
├── components/                # shadcn/ui components
├── middleware.ts              # Next.js middleware for /developer protection
├── tailwind.config.js         # Tailwind CSS config with Mistral colors
├── tsconfig.json              # TypeScript configuration
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
├── DESIGN.md                  # Design system documentation
├── SUPABASE_SETUP.md          # Database setup guide
└── README.md                  # This file
```

## 🗄 Database Schema

### Tables

**users**
```sql
- user_token (UUID, PRIMARY KEY)
- created_at (timestamp)
- last_visit_date (date)
- updated_at (timestamp)
```

**api_calls**
```sql
- id (SERIAL PRIMARY KEY)
- user_token (UUID, FK → users.user_token)
- status ('success' | 'error' | 'rate_limited')
- model_used (string)
- error_message (text)
- response_time_ms (integer)
- retry_count (integer)
- created_at (timestamp)
```

**visit_logs**
```sql
- id (SERIAL PRIMARY KEY)
- user_token (UUID, FK → users.user_token)
- visit_date (date)
- created_at (timestamp)
```

**user_settings**
```sql
- id (SERIAL PRIMARY KEY)
- user_token (UUID, FK → users.user_token)
- custom_api_key (text)
- custom_model (string)
- custom_system_prompt (text)
- created_at (timestamp)
- updated_at (timestamp)
```

**developer_metrics**
```sql
- id (SERIAL PRIMARY KEY)
- metric_name (string)
- metric_value (integer)
- created_at (timestamp)
```

## 🔌 API Endpoints

### POST /api/generate
Generate captions for an image.

**Request (JSON)**:
```json
{
  "imageBase64": "base64_encoded_image",  // OR
  "imageUrl": "https://example.com/image.jpg",
  "platforms": ["instagram", "twitter", "facebook"],
  "mode": "captions"  // or "analysis"
}
```

**Response**:
```json
{
  "description": "Detailed image analysis...",
  "captions": {
    "instagram": "Caption with hashtags...",
    "twitter": "Short caption...",
    "facebook": "Friendly caption...",
    ...
  },
  "retries": 0
}
```

### GET /api/visitor-tracking
Track visitor sessions (auto-called on page load).

### GET /api/metrics
Retrieve developer dashboard metrics.

### POST /api/settings
Update user settings (custom models, API keys, prompts).

## 🎨 Design System

Aura Gram uses the **Mistral Brand Design System** — a warm, European aesthetic with:

- **Color Palette**: Golden amber (#fa520f), cream (#fff0c2), warm black (#1f1f1f)
- **Typography**: Bold, large headlines with aggressive negative tracking
- **Components**: Sharp geometry (no rounded corners), warm shadows, minimal borders
- **Philosophy**: Maximalist warmth, minimalist structure

See [DESIGN.md](./DESIGN.md) for comprehensive design documentation.

## 🔐 Security Notes

- **RLS (Row Level Security)**: Currently disabled for development
- **Rate Limiting**: Prevents abuse with configurable daily/hourly limits
- **Session Management**: UUID-based cookies with HTTP-only flag
- **Password Protection**: Optional dev dashboard password via environment variable

For production:
- Enable Supabase RLS with proper policies
- Use HTTPS only
- Set `NODE_ENV=production`
- Use secure, random `DEVELOPER_DASHBOARD_PASSWORD`

## 📊 Developer Dashboard

Access analytics at `/developer`:
- **Metrics**: API call counts, success/error rates, response times
- **Charts**: 7-day trends, model usage breakdown
- **Error Logs**: Failed requests with timestamps and messages
- **Visitor Stats**: Daily active visitors, session counts

Optional password protection via `DEVELOPER_DASHBOARD_PASSWORD` env variable.

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy with `vercel deploy`

### Self-Hosted
1. Set all environment variables
2. Run `npm run build`
3. Run `npm start`
4. Use reverse proxy (nginx) for HTTPS

## 📝 Usage Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/photo.jpg',
    platforms: ['instagram', 'tiktok'],
    mode: 'captions'
  })
});
const data = await response.json();
console.log(data.captions.instagram);
```

### cURL
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/photo.jpg",
    "platforms": ["instagram", "twitter"],
    "mode": "captions"
  }'
```

## 🐛 Troubleshooting

**"Image base64 is required"**
- Ensure you're sending either `imageBase64` or `imageUrl` in request body

**Rate limit exceeded**
- Check `RATE_LIMIT_CALLS_PER_DAY` and `RATE_LIMIT_CALLS_PER_HOUR` settings
- Rate limits reset daily at UTC midnight

**Supabase connection errors**
- Verify environment variables are set correctly
- Check if RLS is disabled for development
- Ensure all required tables exist

**ERR_TOO_MANY_REDIRECTS on /developer**
- Check if `DEVELOPER_DASHBOARD_PASSWORD` is set
- Clear cookies and try again
- Ensure `/developer/auth` is accessible

## 📚 Additional Resources

- [DESIGN.md](./DESIGN.md) - Design system documentation
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup guide
- [LANGGRAPH_ARCHITECTURE.md](./LANGGRAPH_ARCHITECTURE.md) - LangGraph workflow architecture & graph design
- [LANGGRAPH_EXAMPLES.md](./LANGGRAPH_EXAMPLES.md) - LangGraph usage examples & extensions
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 📄 License

This project is proprietary. All rights reserved.

## 👨‍💻 Development

### Local Development
```bash
npm run dev        # Start dev server on :3000
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Code Style
- TypeScript strict mode enabled
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

## 🤝 Contributing

Internal project. For contributions, contact the development team.

---

**Last Updated**: April 2026  
**Status**: Active Development
