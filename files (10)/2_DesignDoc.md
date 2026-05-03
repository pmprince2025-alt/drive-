# 🎨 Design Document
## WalkieTalk — UI/UX & System Design
**Version:** 1.0 | **Date:** May 2026

---

## 1. Design Philosophy

WalkieTalk should feel **immediate, physical, and alive** — like holding a real radio. The design is bold and tactile: dark backgrounds, high-contrast accent colors, large interactive elements, and satisfying haptic + audio feedback. No clutter. No menus in the way. The PTT button is the hero of every screen.

**Aesthetic Direction:** Industrial Utility meets Modern Dark UI
- Dark navy / near-black backgrounds
- Neon green or electric orange as the PTT accent
- Monospaced or semi-condensed typeface for status labels
- Sound wave / pulse animations throughout
- Generous touch targets (minimum 56px height for all buttons)

---

## 2. Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0D0F14` | Main app background |
| `--bg-surface` | `#161A23` | Cards, contact rows, modals |
| `--bg-elevated` | `#1E2330` | Popup overlays, drawers |
| `--accent-ptt` | `#00E676` | PTT button idle glow |
| `--accent-ptt-active` | `#FF3D00` | PTT button while recording |
| `--accent-incoming` | `#FF9100` | Incoming popup accent |
| `--text-primary` | `#FFFFFF` | Main text |
| `--text-secondary` | `#8892A4` | Timestamps, secondary labels |
| `--text-muted` | `#4A5568` | Placeholder text |
| `--status-online` | `#00E676` | Online dot |
| `--status-busy` | `#FFD600` | Busy dot |
| `--status-offline` | `#4A5568` | Offline dot |
| `--error` | `#FF5252` | Form errors |
| `--success` | `#69F0AE` | Success states |

---

## 3. Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| App Title / Logo | `Orbitron` (Google Font) | 700 | 28px |
| Screen Headings | `Rajdhani` | 600 | 22px |
| Body / Labels | `Inter` | 400 | 14px |
| Contact Names | `Inter` | 600 | 16px |
| Status / Timestamps | `JetBrains Mono` | 400 | 12px |
| PTT Button Label | `Rajdhani` | 700 | 18px |

---

## 4. Screen Designs

### 4.1 Splash Screen
- Full `--bg-primary` background
- Centered logo (radio wave icon + "WalkieTalk" in Orbitron)
- Subtle pulsing green ring animation behind logo
- Auto-navigates after session check completes

### 4.2 Login Screen
- Logo at top (smaller)
- Two input fields: Email, Password
- "Log In" CTA button (full width, `--accent-ptt` color)
- "Forgot Password?" text link below button
- "Don't have an account? Sign Up" at bottom
- Inline error messages in `--error` red below each field
- No background image — pure dark with subtle grid dot texture

### 4.3 Sign Up Screen
- Fields: Display Name, Email, Password, Confirm Password
- Password strength indicator bar (4 segments: weak → strong)
- "Create Account" CTA button
- "Already have an account? Log In" link
- All validation inline, not on submit

### 4.4 Email Verify Pending Screen
- Envelope icon with animated float
- "Check your inbox" heading
- Email address shown in monospaced font
- "Resend email" button (rate-limited to 60 seconds)
- "Open Email App" deep-link button

### 4.5 Home Screen (Contact List)
```
┌─────────────────────────────────────┐
│  👤 [Avatar]   WalkieTalk    [+] [⚙]│  ← Header
├─────────────────────────────────────┤
│  🔍 Search contacts...              │  ← Search bar
├─────────────────────────────────────┤
│  CHANNELS                           │
│  ┌──────────────────────────────┐   │
│  │ 🟢 Team Alpha        [PTT →] │   │
│  │ ⚫ Family Group       [PTT →] │   │
│  └──────────────────────────────┘   │
│  CONTACTS                           │
│  ┌──────────────────────────────┐   │
│  │ 🟢 Rahul Sharma              │   │
│  │ 🟡 Priya Mehta               │   │
│  │ ⚫ Arjun Singh               │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```
- Each contact row: Avatar (40px circle), Name, status dot, last active
- Tap row → opens Channel screen with that contact

### 4.6 Channel Screen (PTT Screen)
```
┌─────────────────────────────────────┐
│  ← Rahul Sharma            🟢 Online│
├─────────────────────────────────────┤
│                                     │
│         [Avatar — 80px]             │
│         Rahul Sharma                │
│         🟢 Available                │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  ~~~  Ready to transmit  ~~~│   │  ← waveform idle
│   └─────────────────────────────┘   │
│                                     │
│         ╔═══════════════╗           │
│         ║               ║           │
│         ║  HOLD TO TALK ║           │  ← Giant PTT button
│         ║               ║           │
│         ╚═══════════════╝           │
│                                     │
│      [🔇 Mute]    [📞 Release]      │
└─────────────────────────────────────┘
```

**PTT Button States:**
- **Idle:** Dark border, `--accent-ptt` glow ring, label "HOLD TO TALK"
- **Recording:** Turns `--accent-ptt-active` red, pulsing ring animation, label "RECORDING..." + live waveform
- **Sending:** Spinner + "SENDING..." label briefly
- **Channel Busy:** Greyed out, label "CHANNEL IN USE", pulse from other user's avatar

### 4.7 Incoming Audio Popup (Full-Screen Overlay)
```
┌─────────────────────────────────────┐
│                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← blurred app beneath
│                                     │
│    ┌──────────────────────────┐     │
│    │                          │     │
│    │   [Avatar — 100px]       │     │
│    │                          │     │
│    │   Rahul Sharma           │     │
│    │   is talking to you...   │     │
│    │                          │     │
│    │   ▁▃▅▇▅▃▁▅▇▃▁▅▇▅▃▁     │     │  ← animated waveform
│    │                          │     │
│    │   [━━━━━━━━━─────] 0:04  │     │  ← playback progress
│    │                          │     │
│    │   [        DISMISS       ]     │  ← appears after audio ends
│    └──────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

- Background: full-screen dark overlay with heavy blur of app behind
- Card: `--bg-elevated`, rounded 24px corners, shadow
- Accent bar at top: `--accent-incoming` orange
- Waveform animation syncs with audio amplitude
- Dismiss button only appears after playback finishes (prevents accidental skip)

---

## 5. Component Library

| Component | Description |
|---|---|
| `PTTButton` | Giant hold-to-talk button with state machine |
| `IncomingPopup` | Full-screen audio overlay modal |
| `ContactRow` | Avatar + name + status dot + last active |
| `ChannelRow` | Channel icon + name + member count + PTT shortcut |
| `WaveformVisualizer` | Animated audio waveform bars |
| `StatusDot` | 10px colored dot (online/busy/offline) |
| `AudioProgressBar` | Playback progress bar with timestamp |
| `InputField` | Dark-themed text input with inline error |
| `PrimaryButton` | Full-width CTA button with loading state |
| `AvatarCircle` | User avatar with fallback initials |
| `PresenceBadge` | Status overlay on avatar |

---

## 6. Animations & Interactions

| Interaction | Animation |
|---|---|
| PTT button press | Scale down to 0.94, glow pulse starts |
| PTT recording | Red ripple rings expand outward continuously |
| Incoming popup appear | Slide up from bottom + fade in (300ms) |
| Waveform (recording) | Live amplitude bars update every 50ms |
| Waveform (playback) | Bars animate from stored amplitude data |
| Contact row press | Light opacity flash (50ms) |
| Status dot (online) | Slow pulse every 3 seconds |
| Screen transitions | Slide left/right via Expo Router |
| Auth form errors | Shake animation on input field (150ms) |

---

## 7. System Design

### 7.1 Architecture Overview
```
┌──────────────────────────────────────────────────┐
│                  React Native App                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Auth Layer │  │  PTT Engine  │  │  UI     │ │
│  │  (Supabase) │  │  (Socket.IO) │  │  Layer  │ │
│  └──────┬──────┘  └──────┬───────┘  └────┬────┘ │
└─────────┼────────────────┼───────────────┼──────┘
          │                │               │
          ▼                ▼               ▼
   ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
   │  Supabase   │  │  Node.js /   │  │    Expo     │
   │  Auth + DB  │  │  Socket.IO   │  │ Notifications│
   │  (Postgres) │  │  Server      │  │  (Push)     │
   └─────────────┘  └──────────────┘  └─────────────┘
```

### 7.2 Audio Pipeline
```
User holds PTT
     │
     ▼
expo-av starts recording (PCM/M4A)
     │
     ▼
Audio chunks buffered in memory
     │
     ▼
User releases PTT
     │
     ▼
Full audio blob → Base64 encoded
     │
     ▼
Emitted via Socket.IO to server
     │
     ▼
Server broadcasts to channel members
     │
     ▼
Receiver decodes Base64 → temp file
     │
     ▼
expo-av plays audio
     │
     ▼
IncomingPopup renders over screen
```

### 7.3 Supabase Database Schema

**`profiles` table**
```sql
id          uuid (FK → auth.users.id)
username    text UNIQUE
display_name text
avatar_url  text
status      text ('online' | 'busy' | 'offline')
last_seen   timestamp
created_at  timestamp
```

**`contacts` table**
```sql
id           uuid
user_id      uuid (FK → profiles.id)
contact_id   uuid (FK → profiles.id)
status       text ('pending' | 'accepted' | 'blocked')
created_at   timestamp
```

**`channels` table**
```sql
id           uuid
name         text
emoji        text
created_by   uuid (FK → profiles.id)
created_at   timestamp
```

**`channel_members` table**
```sql
channel_id   uuid (FK → channels.id)
user_id      uuid (FK → profiles.id)
role         text ('admin' | 'member')
joined_at    timestamp
```

**`transmissions` table** (metadata only, no audio stored)
```sql
id           uuid
channel_id   uuid
sender_id    uuid
duration_ms  int
sent_at      timestamp
```

### 7.4 Push Notification Flow
```
Sender transmits audio
     │
     ▼
Server receives audio blob
     │
     ▼
Server calls Expo Push API with receiver's push token
(token stored in Supabase `profiles.push_token`)
     │
     ▼
Expo Push Service → APNs (iOS) / FCM (Android)
     │
     ▼
Device wakes → app handles notification
     │
     ▼
IncomingPopup triggered + audio plays
```

---

## 8. Navigation Structure

```
Root Stack
│
├── AuthStack (unauthenticated)
│   ├── /splash
│   ├── /login
│   ├── /signup
│   ├── /verify
│   ├── /forgot
│   └── /reset
│
└── AppStack (authenticated)
    ├── BottomTabs
    │   ├── /home          (Contacts + Channels list)
    │   ├── /profile       (My profile)
    │   └── /settings
    │
    └── Modals
        ├── /channel/:id   (PTT screen)
        ├── /add-contact
        └── /create-channel
```

---

## 9. Accessibility

- All interactive elements have `accessibilityLabel` and `accessibilityRole`
- PTT button announces "Hold to talk, double tap and hold to activate" for VoiceOver / TalkBack
- Minimum contrast ratio 4.5:1 on all text
- Incoming popup works with screen reader (audio auto-plays, dismiss button announced)
- Font scaling respected (no fixed pixel text that breaks at large sizes)
