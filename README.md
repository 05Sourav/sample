# 🤖 AI Chat Assistant

A **modern, full-featured AI chat app** built with **Next.js** that supports both text generation and image creation.  
Packed with **user authentication**, **persistent chat sessions**, and a **sleek dark-themed interface**.

---

## 🚀 Features
- 🧠 **Dual AI Modes**:  
  - Text generation via **OpenRouter** (Gemma model)  
  - Image generation via **Stability AI** (SDXL)  
- 🔐 **User Authentication** with Auth0  
- 💾 **Persistent Chat Sessions** stored in Supabase  
- ⚡ **Real-time Interface** with smooth updates & loading states  
- 🎨 **Modern UI** with GitHub-inspired dark theme  
- 🗂 **Session Management**: create, switch, and manage chats easily  
- 🖼 **Inline Image Support** in conversations  
- 🛡 **Full TypeScript + tRPC** for end-to-end type safety  

---

## 🛠 Tech Stack
**Frontend:** Next.js 14, React, TypeScript, Bootstrap 5  
**Backend:** tRPC, Next.js API Routes  
**Auth:** Auth0  
**Database:** Supabase (PostgreSQL)  
**AI APIs:**  
- OpenRouter (Gemma Model - Text)  
- Stability AI (SDXL - Image)  
**State Management:** TanStack Query (React Query)  
**Styling:** Bootstrap 5 + custom dark theme  

---

## 📋 Prerequisites
Before running, make sure you have:
- Node.js **v18+**
- npm or yarn
- Auth0 account
- Supabase project
- OpenRouter API key
- Stability AI API key

---

## 🔧 Environment Variables
Create a `.env.local` file in the root:
```env
# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Keys
OPENROUTER_API_KEY=your_openrouter_api_key
STABILITY_API_KEY=your_stability_ai_api_key

🗄 Database Schema
chat_sessions table

CREATE TABLE chat_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

messages table

sql
Copy
Edit
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES chat_sessions(session_id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);

📦 Installation & Setup
1️⃣ Clone the repo

bash
Copy
Edit
git clone <your-repo-url>
cd ai-chat-assistant
2️⃣ Install dependencies

bash
Copy
Edit
npm install
# or
yarn install
3️⃣ Set up env variables

bash
Copy
Edit
cp .env.example .env.local
Fill in your actual keys.

4️⃣ Run dev server

bash
Copy
Edit
npm run dev
# or
yarn dev
App runs at → http://localhost:3000

🏗 Project Structure
python
Copy
Edit
app/
 ├── api/
 │   ├── auth/[...auth0]/     # Auth0 endpoints
 │   └── trpc/                # tRPC API routes
 ├── components/              # UI components (ChatSidebar, etc.)
 ├── trpc/                    # tRPC config
 ├── ClientProviders.tsx      # Context providers
 ├── layout.tsx               # Root layout
 ├── page.tsx                 # Main chat interface
 ├── supabaseClient.ts        # Supabase config
 └── globals.css              # Styles
🔌 API Endpoints
tRPC is used for type-safe backend calls:

hello → Test endpoint

generateText → Generate text with OpenRouter (Gemma)

generateImage → Generate images with Stability AI (SDXL)

🎨 Features in Detail
📝 Text Generation
Powered by Gemma via OpenRouter

Multi-turn conversations

Streaming responses

Error fallback

🖼 Image Generation
SDXL via Stability AI

1024×1024 resolution

Base64 inline display

📑 Session Management
Unlimited sessions

Auto-title generation

Stored in Supabase

💻 UI/UX
Mobile-first, responsive

Dark theme

Auto-scroll to latest

Keyboard shortcuts (Shift+Enter for newline)

🔒 Security
Auth0 authentication

User-specific data isolation

Server-side API key storage

Zod validation on inputs

📜 License
MIT License — feel free to use and modify.

👤 Author: Sourav Singh
