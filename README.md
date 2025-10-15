## Native AI Chat (Expo + React Native)

### What is this app?

A simple mobile AI chat application. You can start a new chat or continue existing ones, send a prompt, and watch the assistant stream its reply live. It shows a bouncing dots animation while responses are loading and a clear message if an error occurs.

### Website

- [Check the website](https://aichat.builddev.in)

### Built with

- Expo Router + React Native 0.81 + React 19
- Supabase Auth (for session + Bearer tokens)
- Tailwind via NativeWind
- React Native Reanimated (bouncing dots animation)
- Lucide icons
- TypeScript

A minimal chat app built with Expo Router and React Native that streams assistant responses over Server-Sent Events (SSE), with animated loading dots and clear error states. Auth is powered by Supabase; API requests are authenticated with the current session.

### Features

- **Chat streaming**: incremental tokens via SSE with graceful finalization
- **Loading state**: assistant draft shows bouncing dots animation while streaming
- **Error state**: assistant messages render with an error style and message on failures
- **New chat greeting**: task shortcuts to quickly start common prompts
- **Sidebar**: list, paginate, and delete previous chats
- **Theming**: `ThemedText`/`ThemedView` + Tailwind (NativeWind)

### Repositories

- App (React Native): [deepak-coding-art/ai_chat_app](https://github.com/deepak-coding-art/ai_chat_app)
- Backend: [deepak-coding-art/ai_chat_server](https://github.com/deepak-coding-art/ai_chat_server)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm/npm/yarn
- Android Studio (for Android build) or Xcode (iOS)

### Install

```bash
pnpm install
# or
npm install
```

### Environment

Set your API base URL via one of the following (preferred first):

```bash
# .env or shell env
EXPO_PUBLIC_API_URL=https://your.api.host
# fallback supported var
API_URL=https://your.api.host
```

The app requires one of these to be defined at runtime. All API calls are routed to `${BASE_URL}/api/*` and will include a Bearer token if a Supabase session exists.

Supabase configuration lives in `lib/supabase.ts` (ensure your credentials are set there or via env if it reads from env).

## Scripts

```bash
pnpm start         # Expo dev server
pnpm android       # Run on Android (build native code if needed)
pnpm ios           # Run on iOS (macOS + Xcode)
pnpm web           # Run on web
pnpm reset-project # Clean caches and reset Expo state
```

## App Overview

### Chat Screen

- File: `app/(tabs)/index.tsx`
- Fetches history via `getChatMessages(chat_id)` and streams replies via `streamChat`.
- Draft assistant message is created before streaming; while `status` is loading or empty content, the UI shows bouncing dots. On tokens/final, content updates and status becomes `sent`. On errors, status becomes `error` and renders with an error style.

### Types

- File: `lib/types.ts`
- Key types: `Message`, `ChatEvent`, `ChatTask`.
- `Message` supports optional `status` ("loading" | "sent" | "error") and `error` string.

### API Layer

- File: `lib/api.ts`
- `apiRequest` builds URLs using `EXPO_PUBLIC_API_URL`/`API_URL`, injects Supabase Bearer token, and redirects to `/login` on 401.
- `getChatMessages(chat_id)` loads message history.
- `streamChat({ message, chat_id }, handlers)` opens an SSE-like POST channel and invokes `handlers.onEvent` for tokens/finals/tool events.

### Backend

- Server repository: [deepak-coding-art/ai_chat_server](https://github.com/deepak-coding-art/ai_chat_server)

### Sidebar

- File: `components/sidebar.tsx`
- Lists chats with pagination; supports deletion via `DELETE /api/chat/messages?chat_id=...`.

## Building Android

```bash
pnpm android
```

If using EAS or gradle directly, ensure the API URL env is available at build time (Expo public env for runtime). For release builds you can also set `app.json` as needed.

## Troubleshooting

- **Missing API base URL**: App will throw "API base URL is missing. Set EXPO_PUBLIC_API_URL or API_URL." Ensure env is set before starting.
- **Unauthorized (401)**: Session may be invalid; the app signs out and navigates to `/login`.
- **No streaming**: Verify your backend supports SSE-like streaming over `POST /api/chat` and emits events matching `ChatEvent`.
- **Android network**: Use `adb reverse tcp:PORT tcp:PORT` for local APIs or expose via tunnel (e.g., `ngrok`).

## Directory Highlights

- `app/(tabs)/index.tsx`: Chat UI and streaming logic
- `components/`: UI components including sidebar and themed primitives
- `lib/api.ts`: API transport and streaming
- `lib/types.ts`: Shared types
- `assets/`: images and icons
- `android/`: native Android project

## License

MIT

Built with ❤️ by [builddev.in](https://builddev.in).
