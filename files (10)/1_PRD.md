# 📋 Product Requirements Document (PRD)
## WalkieTalk — Real-Time Push-to-Talk Mobile App
**Version:** 1.0 | **Date:** May 2026 | **Status:** Draft | **IDE:** Antigravity

---

## 1. Overview

### 1.1 Product Vision
WalkieTalk is a mobile-first, real-time push-to-talk (PTT) app inspired by Ten-Ten. Users hold a button to record and instantly transmit voice to contacts — with a full-screen popup appearing on the receiver's device even when the app is backgrounded or the phone is locked. Auth is handled by Supabase (email + password).

### 1.2 Problem Statement
Existing messaging apps require the receiver to manually open and play voice messages. There is no "live interrupt" experience on mobile that mimics a physical walkie-talkie — where audio plays the instant it arrives, demanding immediate attention.

### 1.3 Target Users
- Friend groups wanting a casual, always-on voice channel
- Field workers (construction, logistics, warehouses)
- Gamers wanting quick voice comms
- Families who want a fun and immediate way to talk

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Audio delivered to receiver in **under 1 second** after transmission
- **Full-screen popup** on receiver regardless of app state
- **iOS + Android** support from one React Native / Expo codebase
- **Supabase** for all auth, user data, and channel metadata
- **Email + password** sign-up and login with email verification
- One-to-one and group channels (up to 10 members)

### 2.2 Non-Goals (v1.0)
- No social OAuth (Google/Apple) — v2
- No video calling
- No persistent message/audio history
- No end-to-end encryption — v2
- No web client
- No paid plans

---

## 3. Authentication (Supabase)

| Screen | Description |
|---|---|
| Splash | Checks for active Supabase session on launch |
| Sign Up | Email, Password, Confirm Password, Display Name |
| Email Verify | Supabase sends verification email; pending screen shown |
| Login | Email + Password → Supabase Auth |
| Forgot Password | Email input → Supabase sends reset link |
| Reset Password | New password form after clicking email link |

**Auth Rules:**
- Email must be verified before accessing protected routes
- Password: min 8 chars, 1 uppercase, 1 number
- Sessions auto-refreshed via Supabase JS client
- All Supabase tables protected with Row Level Security (RLS)

---

## 4. Core Features

| Feature | Priority | Description |
|---|---|---|
| Email/Password Auth | P0 | Sign up, log in, verify, reset via Supabase |
| Push-to-Talk Button | P0 | Hold to record, release to send |
| Incoming Audio Popup | P0 | Full-screen overlay, auto-plays audio on receiver |
| Contact List | P0 | Find users by email or username |
| Background Operation | P0 | Works minimized or on locked screen |
| Push Notifications | P0 | Wakes device for incoming transmissions |
| Group Channels | P1 | Named channels, up to 10 members |
| Online Presence | P1 | Real-time green / yellow / grey status dots |
| User Profile | P1 | Display name + avatar stored in Supabase |

---

## 5. Key User Flows

### Sign Up
```
Launch → Splash → Login Screen → "Create Account"
→ Fill Sign Up form → Supabase creates user + sends email
→ "Check your inbox" screen → User clicks link → Verified
→ Home Screen
```

### Login
```
Launch → Splash (no session) → Login Screen
→ Email + Password → Supabase Auth → Home Screen
```

### Send PTT
```
Home → Select Contact / Channel → Hold PTT Button
→ Recording (waveform) → Release → Audio sent via Socket
→ Supabase logs metadata → Receiver gets popup
```

### Receive PTT
```
Any app state → Push notification fires → Full-screen popup
→ Sender name + avatar → Audio auto-plays
→ Popup auto-dismisses after playback
```

### Forgot Password
```
Login → "Forgot Password?" → Enter email
→ Supabase sends reset link → Reset screen → New password
→ Back to Login
```

---

## 6. Screens

| Screen | Auth Required |
|---|---|
| Splash | No |
| Login | No |
| Sign Up | No |
| Email Verify Pending | No |
| Forgot / Reset Password | No |
| Home (Contacts) | Yes |
| Channel | Yes |
| Profile | Yes |
| Settings | Yes |
| Add Contact | Yes |
| Create Channel | Yes |

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Audio latency end-to-end | < 1 second |
| App cold start | < 2 seconds |
| Auth response time | < 500 ms |
| Platform support | iOS 15+, Android 10+ |
| Crash-free rate | > 99.5% |

---

## 8. Success Metrics

- 70% of new sign-ups complete email verification within 10 minutes
- Average PTT latency under 800 ms on 4G
- Popup appears on receiver within 2 seconds of transmission
- Day-7 retention > 40%
