AI Chat Assistant
A modern, full-featured AI chat application built with Next.js that supports both text generation and image creation. Features include user authentication, persistent chat sessions, and a sleek dark-themed interface.
🚀 Features

Dual AI Capabilities: Text generation via OpenRouter and image generation via Stability AI
User Authentication: Secure login system powered by Auth0
Persistent Chat Sessions: Store and manage multiple chat conversations
Real-time Interface: Smooth, responsive chat experience with loading states
Modern UI: Clean, GitHub-inspired dark theme with Bootstrap styling
Session Management: Create, switch between, and manage multiple chat sessions
Image Support: Generate and display AI-created images inline with text
Type Safety: Full TypeScript implementation with tRPC for end-to-end type safety

🛠️ Tech Stack

Frontend: Next.js 14, React, TypeScript, Bootstrap 5
Backend: tRPC, Next.js API Routes
Authentication: Auth0
Database: Supabase (PostgreSQL)
AI Services:

OpenRouter (Text generation with Gemma model)
Stability AI (Image generation with SDXL)


State Management: TanStack Query (React Query)
Styling: Bootstrap 5 with custom dark theme

📋 Prerequisites
Before running this application, make sure you have:

Node.js 18+ installed
npm or yarn package manager
Auth0 account and application configured
Supabase project with database tables set up
OpenRouter API key
Stability AI API key

🔧 Environment Variables
Create a .env.local file in the root directory with the following variables:
bash# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Service API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
STABILITY_API_KEY=your_stability_ai_api_key
🗄️ Database Schema
Set up the following tables in your Supabase database:
chat_sessions table
sqlCREATE TABLE chat_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
messages table
sqlCREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES chat_sessions(session_id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
Indexes for performance
sqlCREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
🚀 Installation & Setup

Clone the repository

bashgit clone <your-repo-url>
cd ai-chat-assistant

Install dependencies

bashnpm install
# or
yarn install

Set up environment variables

bashcp .env.example .env.local
# Edit .env.local with your actual values

Configure Auth0

Create a new application in Auth0 dashboard
Set the callback URL to http://localhost:3000/api/auth/callback
Set logout URL to http://localhost:3000
Add your domain to allowed origins


Set up Supabase

Create a new Supabase project
Run the database schema SQL commands above
Get your project URL and anon key from settings


Get API Keys

Sign up for OpenRouter and get your API key
Sign up for Stability AI and get your API key


Run the development server

bashnpm run dev
# or
yarn dev

Open your browser
Navigate to http://localhost:3000

🏗️ Project Structure
├── app/
│   ├── api/
│   │   ├── auth/[...auth0]/    # Auth0 authentication endpoints
│   │   └── trpc/               # tRPC API routes
│   ├── components/             # React components
│   │   └── ChatSidebar.tsx    # Chat session sidebar
│   ├── trpc/                  # tRPC configuration
│   │   ├── client.ts          # tRPC client setup
│   │   └── router.ts          # API route definitions
│   ├── ClientProviders.tsx    # Client-side providers wrapper
│   ├── layout.tsx             # Root layout component
│   ├── page.tsx               # Main chat interface
│   ├── supabaseClient.ts      # Supabase client configuration
│   └── globals.css            # Global styles
├── public/                    # Static assets
└── package.json              # Dependencies and scripts
🔌 API Endpoints
The application uses tRPC for type-safe API communication:

hello: Simple greeting endpoint for testing
generateText: Text generation using OpenRouter's Gemma model
generateImage: Image generation using Stability AI's SDXL model

🎨 Features in Detail
Text Generation

Uses Google's Gemma model via OpenRouter
Supports multi-turn conversations
Real-time streaming responses
Error handling and fallbacks

Image Generation

Powered by Stability AI's SDXL model
1024x1024 high-quality images
Base64 encoded for immediate display
Configurable parameters (steps, CFG scale, etc.)

Session Management

Create unlimited chat sessions
Automatic session title generation
Persistent storage in Supabase
Switch between sessions seamlessly

User Interface

Responsive design works on all devices
Dark theme with GitHub-inspired colors
Smooth animations and transitions
Keyboard shortcuts (Shift+Enter for new lines)
Auto-expanding text input
Loading states and error handling

🔒 Security Features

Authentication: Secure user authentication via Auth0
Authorization: User-specific data isolation
API Keys: Server-side API key management
Input Validation: Zod schema validation for all inputs
Error Handling: Comprehensive error boundaries
