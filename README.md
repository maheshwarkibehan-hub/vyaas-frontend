# VYAAS AI - Voice-Enabled AI Assistant

A modern AI assistant application built with Next.js, featuring voice interaction, real-time communication, and a beautiful user interface.

## 🚀 Features

- **Voice Interaction** - Natural voice conversations powered by LiveKit
- **Real-time Chat** - Instant messaging with AI
- **User Authentication** - Secure Firebase authentication
- **Admin Dashboard** - Complete admin panel for user management
- **Winter Events** - Special seasonal rewards system
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Supabase (PostgreSQL)
- **Voice/Video**: LiveKit
- **Animations**: Framer Motion

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/vyaas-ai.git
   cd vyaas-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your credentials in `.env.local`

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_FIREBASE_*` - Your Firebase configuration
- `NEXT_PUBLIC_LIVEKIT_URL` - Your LiveKit server URL
- `LIVEKIT_API_KEY` & `LIVEKIT_API_SECRET` - Your LiveKit credentials

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes
│   ├── admin/           # Admin dashboard
│   └── ...
├── components/          # React components
│   ├── ui/             # Base UI components
│   └── app/            # Application components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions & configurations
├── public/             # Static assets
└── styles/             # Global styles
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ by VYAAS AI Team
