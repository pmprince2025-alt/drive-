# ⚙️ Tech Stack Document
## WalkieTalk — Technology Choices & Justifications
**Version:** 1.0 | **Date:** May 2026

---

## 1. Overview

WalkieTalk is built mobile-first using React Native and Expo Go, with Supabase powering auth and the database, and a lightweight Node.js server handling real-time audio relay. The stack is chosen for developer speed, cross-platform reach, and minimal operational overhead.

---

## 2. Development Environment

| Tool | Version | Purpose |
|---|---|---|
| **Antigravity** (Google AI IDE) | Latest | Primary IDE for writing, reviewing, and auto-completing code |
| Node.js | 20 LTS | Runtime for tooling and backend server |
| npm | 10+ | Package manager |
| Git | Latest | Version control |
| Expo CLI | Latest | Build, start, and manage the Expo project |
| Expo Go | Latest | Test on real devices without native builds |

> **Antigravity** is used as the primary IDE. Its AI-powered code generation, inline documentation, and context-aware autocomplete significantly speed up development of the Socket.IO event handlers, Supabase queries, and React Native component logic.

---

## 3. Frontend — Mobile App

| Technology | Version | Purpose |
|---|---|---|
| **React Native** | 0.74+ | Cross-platform mobile framework (iOS + Android) |
| **Expo SDK** | 51+ | Managed workflow: camera, audio, notifications, permissions |
| **Expo Router** | 3+ | File-based navigation (similar to Next.js but for RN) |
| **Expo AV** (`expo-av`) | Latest | Audio recording (PTT) and playback (incoming audio) |
| **Expo Notifications** | Latest | Push notification registration and foreground/background handling |
| **Expo Haptics** | Latest | Haptic feedback on PTT button press/release |
| **Expo SecureStore** | Latest | Securely store auth tokens on device |
| **Expo Linking** | Latest | Handle deep links for email verification and password reset |

### 3.1 State Management

| Library | Purpose |
|---|---|
| **Zustand** | Lightweight global state (auth user, contacts, active channel, popup state) |
| React `useState` / `useReducer` | Local component state |
| Supabase Realtime | Live DB subscriptions (presence, contact list updates) |

### 3.2 UI & Styling

| Library | Purpose |
|---|---|
| **React Native StyleSheet** | Core styling |
| **React Native Reanimated 3** | PTT button press animations, popup slide-in, waveform |
| **React Native Gesture Handler** | Long-press detection for PTT button |
| **@expo/vector-icons** | Icon set (Ionicons) |
| Custom `WaveformVisualizer` | Built in-house using Reanimated animated values |

### 3.3 Networking

| Library | Purpose |
|---|---|
| **Socket.IO Client** (`socket.io-client`) | Real-time bidirectional audio transmission |
| **Supabase JS Client** (`@supabase/supabase-js`) | Auth, DB queries, Realtime subscriptions |
| `fetch` (native) | REST calls where needed |

---

## 4. Backend — Real-Time Server

| Technology | Purpose |
|---|---|
| **Node.js** (v20 LTS) | Server runtime |
| **Express.js** | HTTP server (health check, push token registration endpoint) |
| **Socket.IO** | Real-time WebSocket server for audio relay between clients |
| **Expo Push API** | Sending push notifications via Expo's managed push service |

### 4.1 Why a Separate Backend?

Supabase Realtime is great for database events but not suited for high-frequency binary audio streaming. The Node.js / Socket.IO server handles the hot path — relaying audio blobs between connected clients in real time. Supabase handles everything else: auth, user data, and channel metadata.

### 4.2 Server Responsibilities

- Accept authenticated WebSocket connections (validate Supabase JWT on connect)
- Manage channel rooms: join, leave, broadcast audio to room members
- Detect channel-busy state and block concurrent transmissions
- Call Expo Push API to wake offline/backgrounded receivers
- Log transmission metadata to Supabase via Supabase service-role client

### 4.3 Deployment Options

| Option | Notes |
|---|---|
| **Railway** (recommended) | Easy Node.js deploy, free tier available, supports WebSockets |
| Render | Free tier but sleeps on inactivity — not ideal for PTT |
| Fly.io | Great for low-latency global deployment |
| VPS (DigitalOcean) | Full control, requires manual setup |

---

## 5. Auth & Database — Supabase

| Feature | Supabase Service |
|---|---|
| Email + Password Auth | Supabase Auth (built-in) |
| Email Verification | Supabase Auth (auto-sends verification email) |
| Password Reset | Supabase Auth (auto-sends reset email) |
| Session Management | Supabase Auth JWT + auto-refresh |
| User Profiles | PostgreSQL `profiles` table via Supabase |
| Contacts | PostgreSQL `contacts` table |
| Channels & Members | PostgreSQL `channels` + `channel_members` tables |
| Transmission Logs | PostgreSQL `transmissions` table |
| Presence (online status) | Supabase Realtime OR heartbeat via Socket.IO |
| Row Level Security | Enabled on all tables — users access only their own data |
| Storage | Supabase Storage for avatar images |
| Real-time Subscriptions | Supabase Realtime for contact list live updates |

### 5.1 Supabase Auth Configuration

```
Email confirmations:    ENABLED
Minimum password length: 8
Allowed email domains:  all (no restriction in v1)
JWT expiry:             3600s (1 hour), refresh tokens enabled
Redirect URLs (deep links):
  walkietalk://verify
  walkietalk://reset-password
```

### 5.2 Supabase RLS Policy Examples

```sql
-- Users can only read/update their own profile
CREATE POLICY "Own profile only" ON profiles
  USING (auth.uid() = id);

-- Users can only see contacts they are part of
CREATE POLICY "Own contacts" ON contacts
  USING (auth.uid() = user_id OR auth.uid() = contact_id);

-- Channel members can see their channels
CREATE POLICY "Channel members" ON channel_members
  USING (auth.uid() = user_id);
```

---

## 6. Push Notifications

| Layer | Tool |
|---|---|
| iOS | APNs via Expo Push Service |
| Android | FCM via Expo Push Service |
| Token Storage | Supabase `profiles.push_token` column |
| Sending Notifications | Node.js server calls `https://exp.host/--/api/v2/push/send` |
| Foreground Handling | `expo-notifications` `addNotificationReceivedListener` |
| Background / Lock Screen | Expo Notifications background task + full-screen intent (Android) / CallKit (iOS) |

### 6.1 iOS Incoming Popup Strategy
- Use **CallKit** via `react-native-callkeep` to display a native call-style UI when audio arrives on a locked iPhone
- This gives phone-call-level interruption priority, overriding Do Not Disturb

### 6.2 Android Incoming Popup Strategy
- Use a **full-screen intent notification** (HIGH_PRIORITY) to show the popup over the lock screen
- Managed via a foreground service using `expo-task-manager`

---

## 7. Audio

| Concern | Approach |
|---|---|
| Recording | `expo-av` `Audio.Recording` with HIGH_QUALITY preset |
| Playback | `expo-av` `Audio.Sound` |
| Format | M4A (AAC codec) — good compression, widely supported |
| Transmission | Base64-encoded blob sent via Socket.IO emit |
| Max Duration | 60 seconds enforced client-side |
| Audio Session (iOS) | `Audio.setAudioModeAsync` with `allowsRecordingIOS: true` and `playsInSilentModeIOS: true` |
| Audio Focus (Android) | Managed via `expo-av` audio mode configuration |

---

## 8. Package List (app)

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-av": "~14.0.0",
    "expo-notifications": "~0.28.0",
    "expo-haptics": "~13.0.0",
    "expo-secure-store": "~13.0.0",
    "expo-linking": "~6.3.0",
    "expo-router": "~3.5.0",
    "expo-task-manager": "~11.8.0",
    "@supabase/supabase-js": "^2.43.0",
    "socket.io-client": "^4.7.5",
    "react-native-reanimated": "~3.10.0",
    "react-native-gesture-handler": "~2.16.0",
    "@expo/vector-icons": "^14.0.0",
    "zustand": "^4.5.2",
    "react-native-callkeep": "^4.3.12"
  }
}
```

---

## 9. Package List (server)

```json
{
  "dependencies": {
    "express": "^4.19.0",
    "socket.io": "^4.7.5",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.43.0",
    "dotenv": "^16.4.5",
    "axios": "^1.7.0"
  }
}
```

---

## 10. Environment Variables

### App (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_SOCKET_URL=https://your-server.railway.app
```

### Server (.env)
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send
PORT=3001
```

---

## 11. Tech Decision Summary

| Decision | Choice | Why |
|---|---|---|
| Framework | React Native + Expo | One codebase, fast iteration, Expo managed audio + notifications |
| IDE | Antigravity | AI-powered code gen speeds up Socket.IO + Supabase integration |
| Auth | Supabase Auth | Built-in email/password, email verify, password reset — zero custom code |
| Database | Supabase (Postgres) | RLS, Realtime, and Storage in one platform |
| Real-time audio | Socket.IO | Low-latency binary relay; Supabase Realtime not suited for audio blobs |
| State | Zustand | Simpler than Redux for this use case; works great with Supabase subscriptions |
| Animations | Reanimated 3 | Native-thread animations — no jank during audio recording |
| Push (iOS popup) | CallKit | Only way to interrupt a locked iOS screen reliably |
| Push (Android popup) | Full-screen intent | Standard approach for incoming call–style popups on Android |
| Deployment | Railway | WebSocket support, easy Node.js deploy, generous free tier |
