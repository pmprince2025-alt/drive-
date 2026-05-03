# ✅ To-Do Document
## WalkieTalk — Development Task List
**Version:** 1.0 | **Date:** May 2026

Tasks are broken into phases. Complete each phase fully before moving to the next. Use this as your daily checklist inside Antigravity.

---

## Phase 0 — Project Setup

- [ ] Create new Expo project: `npx create-expo-app walkietalk --template tabs`
- [ ] Install Expo Router and configure file-based routing
- [ ] Set up Antigravity workspace and open project
- [ ] Install all app dependencies (see Tech Stack doc package list)
- [ ] Create `.env` file with Supabase URL, anon key, and Socket server URL
- [ ] Set up `app.json` with bundle ID, scheme (`walkietalk://`), and permissions
  - Microphone permission
  - Notification permission
  - Audio background mode
- [ ] Create Git repo and push initial commit
- [ ] Set up Supabase project (free tier) at supabase.com
- [ ] Enable Email Auth in Supabase → Authentication → Providers
- [ ] Configure email redirect URLs in Supabase:
  - `walkietalk://verify`
  - `walkietalk://reset-password`
- [ ] Initialize Node.js server project (`/server` folder)
- [ ] Install server dependencies (express, socket.io, cors, supabase-js, dotenv)
- [ ] Create server `.env` with Supabase service role key

---

## Phase 1 — Supabase Database Setup

- [ ] Create `profiles` table in Supabase with columns:
  - `id` (uuid, FK → auth.users)
  - `username` (text, unique)
  - `display_name` (text)
  - `avatar_url` (text, nullable)
  - `status` (text, default 'offline')
  - `last_seen` (timestamp)
  - `push_token` (text, nullable)
  - `created_at` (timestamp, default now())
- [ ] Create `contacts` table
- [ ] Create `channels` table
- [ ] Create `channel_members` table
- [ ] Create `transmissions` table
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Write and apply RLS policies for each table (see Design Doc §7.3)
- [ ] Create Supabase trigger: auto-insert into `profiles` on `auth.users` insert
- [ ] Enable Supabase Storage bucket for avatars (`avatars` bucket, public)
- [ ] Test all tables in Supabase Table Editor

---

## Phase 2 — Auth Screens

- [ ] Create `lib/supabase.ts` — initialize and export Supabase client
- [ ] Create `store/authStore.ts` — Zustand store for `user`, `session`, `loading`
- [ ] Create `app/(auth)/_layout.tsx` — auth stack layout (no tab bar)
- [ ] Build **Splash Screen** (`app/index.tsx`)
  - Check for existing Supabase session on mount
  - Navigate to `/home` if session found, `/login` if not
- [ ] Build **Login Screen** (`app/(auth)/login.tsx`)
  - Email input + Password input
  - "Log In" button → `supabase.auth.signInWithPassword()`
  - Show inline error messages
  - Link to Sign Up
  - Link to Forgot Password
- [ ] Build **Sign Up Screen** (`app/(auth)/signup.tsx`)
  - Display Name, Email, Password, Confirm Password inputs
  - Password strength bar component
  - "Create Account" → `supabase.auth.signUp()`
  - On success → navigate to `/verify`
- [ ] Build **Email Verify Pending Screen** (`app/(auth)/verify.tsx`)
  - Show email address
  - "Resend Email" button with 60-second cooldown
  - "Open Email App" deep link button
- [ ] Build **Forgot Password Screen** (`app/(auth)/forgot.tsx`)
  - Email input → `supabase.auth.resetPasswordForEmail()`
  - Success message shown after submit
- [ ] Build **Reset Password Screen** (`app/(auth)/reset.tsx`)
  - Handle `walkietalk://reset-password` deep link
  - New password + confirm → `supabase.auth.updateUser()`
- [ ] Set up `expo-linking` to handle deep links for verify and reset
- [ ] Test full sign-up → verify → login flow on physical device via Expo Go
- [ ] Test forgot password → reset flow

---

## Phase 3 — Core App Screens (Post-Auth)

- [ ] Create `app/(app)/_layout.tsx` — bottom tab layout (Home, Profile, Settings)
- [ ] Build **Home Screen** (`app/(app)/home.tsx`)
  - Fetch contacts from Supabase `contacts` table (accepted only)
  - Fetch channels from `channel_members` join `channels`
  - Display contacts list with `ContactRow` component
  - Display channels list with `ChannelRow` component
  - Search bar to filter list
  - "+" button to add contact or create channel
- [ ] Build `ContactRow` component (avatar, name, status dot, last seen)
- [ ] Build `ChannelRow` component (emoji, name, member count)
- [ ] Build `StatusDot` component (green/yellow/grey)
- [ ] Build `AvatarCircle` component (image or initials fallback)
- [ ] Build **Add Contact Screen** (`app/(app)/add-contact.tsx`)
  - Search by username or email against Supabase `profiles`
  - Send contact request (insert into `contacts` with status 'pending')
- [ ] Build **Create Channel Screen** (`app/(app)/create-channel.tsx`)
  - Channel name input + emoji picker
  - Search and add members from contacts
  - Create channel in Supabase + add members
- [ ] Build **Profile Screen** (`app/(app)/profile.tsx`)
  - Display and edit display name, username, avatar
  - Avatar upload to Supabase Storage
  - Status selector (online / busy / offline)
  - Logout button → `supabase.auth.signOut()`
- [ ] Build **Settings Screen** (`app/(app)/settings.tsx`)
  - Notification preferences
  - Account deletion (v1: placeholder)

---

## Phase 4 — Real-Time Server

- [ ] Build `server/index.js`:
  - Express HTTP server with health check route `GET /health`
  - Socket.IO server attached to HTTP server
  - CORS configured for Expo client origin
- [ ] Implement JWT validation on Socket.IO connection:
  - Client sends Supabase JWT in `auth` handshake
  - Server verifies JWT via Supabase `getUser(token)`
  - Reject unauthenticated connections
- [ ] Implement Socket.IO events:
  - `join_channel` — client joins a room
  - `leave_channel` — client leaves a room
  - `ptt_start` — sender notifies channel they are transmitting
  - `ptt_audio` — sender emits Base64 audio blob to server
  - `ptt_end` — sender signals transmission complete
  - `channel_busy` — server broadcasts to room when someone is transmitting
  - `channel_free` — server broadcasts when transmission ends
- [ ] Implement `POST /register-token` route to store Expo push token in Supabase
- [ ] Implement push notification sending:
  - On `ptt_audio`, fetch push tokens of all offline/backgrounded channel members
  - Call Expo Push API with audio payload
- [ ] Log each transmission to Supabase `transmissions` table
- [ ] Deploy server to Railway (or chosen platform)
- [ ] Test WebSocket connection from Expo Go on physical device

---

## Phase 5 — PTT Engine (Audio Recording + Sending)

- [ ] Create `hooks/useAudioRecorder.ts`
  - Configure `Audio.setAudioModeAsync` for recording + silent mode playback
  - `startRecording()` → `Audio.Recording.createAsync()`
  - `stopRecording()` → stop + get URI → read file as Base64
  - Enforce 60-second max recording duration
- [ ] Create `hooks/useSocket.ts`
  - Connect to Socket.IO server with Supabase JWT
  - Expose `joinChannel()`, `sendAudio(base64)`, `on(event, handler)`
  - Auto-reconnect on disconnect
- [ ] Build `PTTButton` component (`components/PTTButton.tsx`)
  - Long press gesture via `react-native-gesture-handler`
  - `onPressIn` → emit `ptt_start` + start recording
  - `onPressOut` → stop recording + encode + emit `ptt_audio` + emit `ptt_end`
  - Animate with Reanimated 3 (scale + glow ring)
  - Handle `channel_busy` state (grey out + label change)
  - Haptic feedback on press and release via `expo-haptics`
- [ ] Build `WaveformVisualizer` component
  - Input: array of amplitude values (0–1)
  - Render animated bars using Reanimated
  - Update every 50ms during recording via polling metering
- [ ] Build **Channel Screen** (`app/(app)/channel/[id].tsx`)
  - Join Socket.IO room on mount, leave on unmount
  - Show contact/channel info at top
  - Show `WaveformVisualizer` (idle or recording)
  - Render `PTTButton` centred
  - Show "channel busy" overlay when another user is transmitting

---

## Phase 6 — Incoming Audio Popup

- [ ] Create `hooks/useAudioPlayer.ts`
  - `playAudio(base64)` → decode → write temp file → `Audio.Sound.createAsync()` → play
  - Expose `isPlaying`, `progress`, `duration`
- [ ] Build `IncomingPopup` component (`components/IncomingPopup.tsx`)
  - Full-screen modal (`Modal` with `transparent` + `animationType="slide"`)
  - Show sender avatar, display name, "is talking to you..."
  - Show `WaveformVisualizer` playing live amplitude data
  - Show `AudioProgressBar` with elapsed time
  - Dismiss button appears after audio finishes
  - Calls `playAudio` automatically on mount
- [ ] Wire `IncomingPopup` to Socket.IO `ptt_audio` event in a root-level listener
- [ ] Ensure popup renders over any screen in the app (use root-level `Portal` or absolute modal)

---

## Phase 7 — Push Notifications & Background Handling

- [ ] Configure `expo-notifications` in `app/_layout.tsx`:
  - Request notification permissions on first launch
  - Register device for push → get Expo push token
  - `POST /register-token` to server with token + Supabase user ID
- [ ] Handle **foreground** notifications:
  - `addNotificationReceivedListener` → trigger `IncomingPopup` with audio payload
- [ ] Handle **background** notifications (app minimized):
  - `addNotificationResponseReceivedListener` → open app + trigger popup
- [ ] Handle **killed app / locked screen** (Android):
  - Configure foreground service via `expo-task-manager`
  - Full-screen intent notification to show popup on lock screen
- [ ] Handle **locked screen** (iOS):
  - Integrate `react-native-callkeep` for CallKit incoming call UI
  - Display WalkieTalk incoming call screen on locked iPhone
- [ ] Test popup on: foreground, background, locked screen — both iOS and Android

---

## Phase 8 — Presence System

- [ ] On app launch (authenticated): update `profiles.status` to 'online' and `last_seen` to now
- [ ] On app background: update `profiles.status` to 'offline'
- [ ] On app foreground: update back to 'online'
- [ ] Subscribe to Supabase Realtime on `profiles` for contacts' status changes
- [ ] Update `StatusDot` in real time as contacts go online/offline
- [ ] Socket.IO heartbeat as fallback (emit `heartbeat` every 30s; server marks offline if missed)

---

## Phase 9 — Polish & QA

- [ ] Add loading skeletons for contact list while fetching
- [ ] Add empty state UI (no contacts yet — illustration + "Add your first contact" CTA)
- [ ] Add network offline banner (no connection = banner at top of screen)
- [ ] Add error boundaries for crash resilience
- [ ] Confirm all `accessibilityLabel` props on interactive elements
- [ ] Test on iOS (physical device via Expo Go)
- [ ] Test on Android (physical device via Expo Go)
- [ ] Test on slow 3G connection (simulate in dev)
- [ ] Test audio popup on locked screen (iOS + Android)
- [ ] Fix any animation jank (check Reanimated native thread)
- [ ] Performance audit: startup time, audio latency measurement

---

## Phase 10 — Build & Submission

- [ ] Run `eas build --platform ios` and `eas build --platform android`
- [ ] Test production builds on physical devices
- [ ] Write App Store / Play Store descriptions
- [ ] Prepare screenshots for both platforms
- [ ] Submit to TestFlight (iOS) and Internal Testing (Android)
- [ ] Collect beta feedback and log bugs

---

## Bug Tracker Template

| # | Bug Description | Screen | Priority | Status |
|---|---|---|---|---|
| 1 | | | | Open |

---

## Notes

- Always test audio features on a **real device** — Expo Go simulator does not support microphone properly
- Supabase free tier limits: 500MB DB storage, 1GB file storage, 50,000 monthly active users — sufficient for v1
- CallKit (iOS) requires a **paid Apple Developer account** and a real device build — not testable in Expo Go
- Keep the Socket.IO server stateless where possible — channel room state should survive server restarts by re-joining from the client
