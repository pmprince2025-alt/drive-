import { useState, useEffect } from 'react'
import { Image, Layers, Palette } from 'lucide-react'
import { useTabsStore } from '../../store/tabs'
import { useThemeStore } from '../../store/theme'
import { SearchBar } from '../SearchBar'
import logo from '../../assets/logo.png'
import cognixBg from '../../assets/cognix-bg.png'

const DEFAULT_LINKS = [
  {
    label: 'GitHub',
    url: 'https://github.com',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    )
  },
  {
    label: 'Notion',
    url: 'https://notion.so',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H18l2 2.5V20a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
        <path d="M8 7h4" />
        <path d="M8 11h8" />
        <path d="M8 15h6" />
      </svg>
    )
  },
  {
    label: 'Linear',
    url: 'https://linear.app',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.293 20.707a1 1 0 0 1 0-1.414l16-16a1 1 0 1 1 1.414 1.414l-16 16a1 1 0 0 1-1.414 0Z" />
        <path d="M3 8V3h5" />
        <path d="M21 16v5h-5" />
      </svg>
    )
  },
  {
    label: 'Twitter',
    url: 'https://x.com',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    )
  }
]

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

function FlipDigit({ value }: { value: string }) {
  const [prev, setPrev] = useState(value)
  const [flipping, setFlipping] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'top' | 'bottom'>('idle')

  useEffect(() => {
    if (value !== prev) {
      setFlipping(true)
      setPhase('top')
      const t1 = setTimeout(() => {
        setPhase('bottom')
      }, 300)
      const t2 = setTimeout(() => {
        setPhase('idle')
        setFlipping(false)
        setPrev(value)
      }, 600)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [value])

  return (
    <div className="flip-card relative w-10 h-14 bg-[var(--bg-elevated)] rounded-md border border-[var(--border)] overflow-hidden select-none">
      {/* Base digit rendered once, centered in full card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-2xl leading-none font-bold text-text-primary">{value}</span>
      </div>
      {/* Top half mask */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
      >
        <span className="text-2xl leading-none font-bold text-text-primary">{value}</span>
      </div>
      {/* Bottom half mask */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
      >
        <span className="text-2xl leading-none font-bold text-text-primary">{value}</span>
      </div>
      {/* Divider line */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/30 z-10 pointer-events-none" />
      {/* Flipping top flap (old digit folds down) */}
      {phase === 'top' && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            clipPath: 'inset(0 0 50% 0)',
            transformOrigin: 'bottom',
            animation: 'flipTop 0.3s ease-in forwards',
            background: 'var(--bg-elevated)',
            zIndex: 20,
            borderBottom: 'none',
            borderRadius: '0.375rem 0.375rem 0 0'
          }}
        >
          <span className="text-2xl leading-none font-bold text-text-primary">{prev}</span>
        </div>
      )}
      {/* Flipping bottom flap (new digit rises up) */}
      {phase === 'bottom' && (
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            clipPath: 'inset(50% 0 0 0)',
            transformOrigin: 'top',
            animation: 'flipBottom 0.3s ease-out forwards',
            background: 'var(--bg-elevated)',
            zIndex: 20,
            borderTop: 'none',
            borderRadius: '0 0 0.375rem 0.375rem'
          }}
        >
          <span className="text-2xl leading-none font-bold text-text-primary">{value}</span>
        </div>
      )}
    </div>
  )
}

export function NewTab(): JSX.Element {
  const [time, setTime] = useState(new Date())
  const widgets = useThemeStore((s) => s.widgets)
  const customLinks = useThemeStore((s) => s.customLinks)
  const hiddenDefaultLinks = useThemeStore((s) => s.hiddenDefaultLinks)
  const removeCustomLink = useThemeStore((s) => s.removeCustomLink)
  const toggleDefaultLink = useThemeStore((s) => s.toggleDefaultLink)
  const setCustomizeOpen = useThemeStore((s) => s.setCustomizeOpen)
  const defaultLinks = DEFAULT_LINKS.filter((l) => !hiddenDefaultLinks.includes(l.url))
  const quickLinks = [...defaultLinks, ...customLinks.map((l) => ({ label: l.label, url: l.url, icon: null }))]

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])


  const clock = widgets.clock
  const greeting = widgets.greeting
  const searchW = widgets.search
  const quicklinks = widgets.quicklinks
  const weather = widgets.weather

  const renderClock = () => {
    switch (clock.variant) {
      case 'analog':
        return (
          <div className="relative w-32 h-32 rounded-full border-2 border-[var(--accent)]/30 flex items-center justify-center">
            <div className="absolute w-1 h-12 bg-accent rounded-full bottom-1/2 left-1/2 origin-bottom" style={{ transform: `translateX(-50%) rotate(${(time.getHours() % 12) * 30 + time.getMinutes() * 0.5}deg)` }} />
            <div className="absolute w-0.5 h-16 bg-accent/70 rounded-full bottom-1/2 left-1/2 origin-bottom" style={{ transform: `translateX(-50%) rotate(${time.getMinutes() * 6}deg)` }} />
            <div className="absolute w-0.5 bg-accent/40 rounded-full bottom-1/2 left-1/2 origin-bottom" style={{ height: '20px', transform: `translateX(-50%) rotate(${time.getSeconds() * 6}deg)` }} />
            <div className="w-2 h-2 rounded-full bg-accent absolute" />
          </div>
        )
      case 'flip':
        return (
          <div className="flex items-center gap-2 font-mono">
            <FlipDigit value={String(time.getHours() % 12 || 12).padStart(2, '0')[0]} />
            <FlipDigit value={String(time.getHours() % 12 || 12).padStart(2, '0')[1]} />
            <span className="text-2xl text-accent/50 animate-pulse mb-8">:</span>
            <FlipDigit value={String(time.getMinutes()).padStart(2, '0')[0]} />
            <FlipDigit value={String(time.getMinutes()).padStart(2, '0')[1]} />
            <span className="text-2xl text-accent/50 animate-pulse mb-8">:</span>
            <FlipDigit value={String(time.getSeconds()).padStart(2, '0')[0]} />
            <FlipDigit value={String(time.getSeconds()).padStart(2, '0')[1]} />
          </div>
        )
      case 'binary':
        return (
          <div className="flex items-center gap-4">
            {['Hours', 'Minutes', 'Seconds'].map((label, gi) => {
              const val = gi === 0 ? time.getHours() : gi === 1 ? time.getMinutes() : time.getSeconds()
              return (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
                  <div className="flex gap-1">
                    {[4, 2, 1].map((bit, bi) => {
                      const vals = [4, 2, 1, 4, 2, 1, 4, 2, 1]
                      const idx = gi * 3 + bi
                      const isSet = val & vals[idx]
                      return (
                        <div
                          key={bi}
                          className={`w-3 h-3 rounded-sm transition-colors ${isSet ? 'bg-accent shadow-[0_0_6px_var(--accent)]' : 'bg-[var(--border)]'}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      case 'minimal':
        return (
          <p className="text-2xl font-light text-text-secondary tracking-widest">
            {formatTime(time)}
          </p>
        )
      default:
        return (
          <h1 className="clock-display">
            {formatTime(time)}
          </h1>
        )
    }
  }

  const renderGreeting = () => {
    const h = new Date().getHours()
    switch (greeting.variant) {
      case 'poetic':
        return (
          <p className="text-lg text-text-secondary italic tracking-wide">
            {h < 6 ? 'The night is still young' :
             h < 12 ? 'A new dawn rises' :
             h < 14 ? 'The sun stands tall' :
             h < 18 ? 'Golden hours unfold' :
             h < 21 ? 'Twilight whispers in' :
             'The stars begin to sing'}
          </p>
        )
      case 'motivational':
        return (
          <p className="text-lg text-text-secondary font-medium tracking-wide">
            {h < 12 ? 'Make today count' :
             h < 17 ? 'Keep pushing forward' :
             'You\'ve got this'}
          </p>
        )
      case 'timebased':
        return (
          <p className="text-base text-text-secondary tracking-wide">
            {h < 6 ? 'Late night session' :
             h < 12 ? `Good morning · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` :
             h < 14 ? 'Good afternoon' :
             h < 18 ? `Hello · ${new Date().toLocaleDateString('en-US', { weekday: 'long' })} afternoon` :
             h < 21 ? 'Good evening' :
             'Night owl mode'}
          </p>
        )
      case 'minimal':
        return (
          <p className="text-base text-text-muted tracking-wide">
            Hello
          </p>
        )
      default:
        return (
          <p className="greeting-text">
            {getGreeting()}
            <span className="greeting-sparkle">✦</span>
          </p>
        )
    }
  }

  const renderSearch = () => {
    switch (searchW.variant) {
      case 'compact':
        return <SearchBar compact />
      case 'minimal':
        return <SearchBar minimal />
      case 'button':
        return <SearchBar button />
      case 'suggestions':
      default:
        return <SearchBar />
    }
  }

  const renderQuickLinks = () => {
    const renderIcon = (link: typeof quickLinks[0]) => {
      if (link.icon) return link.icon
      return (
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/10 text-accent text-sm font-bold">
          {link.label[0].toUpperCase()}
        </span>
      )
    }

    switch (quicklinks.variant) {
      case 'list':
        return (
          <div className="flex flex-col gap-1.5 mt-3 min-w-[200px]">
            {quickLinks.map((link) => (
              <div key={link.label} className="relative group">
                <button
                  onClick={() => {
                    const activeId = useTabsStore.getState().activeTabId
                    if (activeId) window.ipc.invoke('browser:navigate', { tabId: activeId, url: link.url })
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl glass-panel hover:bg-accent-glow transition-all text-left"
                >
                  <span className="text-accent/70 shrink-0">{renderIcon(link)}</span>
                  <span className="text-sm text-text-secondary">{link.label}</span>
                </button>
                <button
                    onClick={() => {
                      const isDefault = DEFAULT_LINKS.some((dl) => dl.url === link.url)
                      if (isDefault) toggleDefaultLink(link.url)
                      else removeCustomLink(link.url)
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/80 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    ✕
                  </button>
              </div>
            ))}
          </div>
        )
      case 'icons':
        return (
          <div className="flex gap-3 mt-3">
            {quickLinks.map((link) => (
              <div key={link.label} className="relative group">
                <button
                  onClick={() => {
                    const activeId = useTabsStore.getState().activeTabId
                    if (activeId) window.ipc.invoke('browser:navigate', { tabId: activeId, url: link.url })
                  }}
                  className="w-12 h-12 flex items-center justify-center rounded-xl glass-panel text-accent/70 hover:text-accent hover:bg-accent-glow transition-all"
                  title={link.label}
                >
                  {renderIcon(link)}
                </button>
                <button
                    onClick={() => {
                      const isDefault = DEFAULT_LINKS.some((dl) => dl.url === link.url)
                      if (isDefault) toggleDefaultLink(link.url)
                      else removeCustomLink(link.url)
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/80 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    ✕
                  </button>
              </div>
            ))}
          </div>
        )
      case 'dock':
        return (
          <div className="flex items-end gap-1.5 mt-3 px-3 py-2 rounded-2xl glass-panel">
            {quickLinks.map((link) => (
              <div key={link.label} className="relative group">
                <button
                  onClick={() => {
                    const activeId = useTabsStore.getState().activeTabId
                    if (activeId) window.ipc.invoke('browser:navigate', { tabId: activeId, url: link.url })
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent-glow text-accent/70 hover:text-accent transition-all"
                  title={link.label}
                >
                  {renderIcon(link)}
                </button>
                <button
                    onClick={() => {
                      const isDefault = DEFAULT_LINKS.some((dl) => dl.url === link.url)
                      if (isDefault) toggleDefaultLink(link.url)
                      else removeCustomLink(link.url)
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/80 text-white text-[8px] opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    ✕
                  </button>
              </div>
            ))}
          </div>
        )
      case 'compact':
        return (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {quickLinks.map((link) => (
              <div key={link.label} className="relative group">
                <button
                  onClick={() => {
                    const activeId = useTabsStore.getState().activeTabId
                    if (activeId) window.ipc.invoke('browser:navigate', { tabId: activeId, url: link.url })
                  }}
                  className="glass-card flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl min-w-[70px]"
                >
                  <span className="text-accent/70 text-lg">{renderIcon(link)}</span>
                  <span className="text-[10px] text-text-secondary font-medium">{link.label}</span>
                </button>
                <button
                    onClick={() => {
                      const isDefault = DEFAULT_LINKS.some((dl) => dl.url === link.url)
                      if (isDefault) toggleDefaultLink(link.url)
                      else removeCustomLink(link.url)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/80 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    ✕
                  </button>
              </div>
            ))}
          </div>
        )
      default:
        return (
          <div className="flex gap-4 mt-3">
            {quickLinks.map((link) => (
              <div key={link.label} className="relative group">
                <button
                  onClick={() => {
                    const activeId = useTabsStore.getState().activeTabId
                    if (activeId) window.ipc.invoke('browser:navigate', { tabId: activeId, url: link.url })
                  }}
                  className="glass-card flex flex-col items-center gap-3 px-7 py-6 rounded-2xl min-w-[110px]"
                >
                  <span className="text-accent/70">{renderIcon(link)}</span>
                  <span className="text-sm text-text-secondary font-medium">{link.label}</span>
                </button>
                <button
                    onClick={() => {
                      const isDefault = DEFAULT_LINKS.some((dl) => dl.url === link.url)
                      if (isDefault) toggleDefaultLink(link.url)
                      else removeCustomLink(link.url)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/80 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    ✕
                  </button>
              </div>
            ))}
          </div>
        )
    }
  }

  const renderWeather = () => {
    switch (weather.variant) {
      case 'minimal':
        return (
          <div className="absolute bottom-6 left-6 z-10 weather-widget px-3 py-2">
            <span className="text-sm text-text-primary font-light">28°C</span>
          </div>
        )
      case 'detailed':
        return (
          <div className="absolute bottom-6 left-6 z-10 weather-widget px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🌤️</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">28°C</span>
              <span className="text-[10px] text-text-muted">Feels like 26°C</span>
              <span className="text-[10px] text-text-muted">Humidity: 45% · Wind: 12 km/h</span>
            </div>
          </div>
        )
      case 'compact':
        return (
          <div className="absolute bottom-6 left-6 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel">
            <span className="text-base">🌤️</span>
            <span className="text-xs text-text-primary font-medium">28°</span>
          </div>
        )
      case 'icon':
        return (
          <div className="absolute bottom-6 left-6 z-10 weather-widget px-2.5 py-2">
            <span className="text-xl">🌤️</span>
          </div>
        )
      default:
        return (
          <div className="absolute bottom-6 left-6 z-10 weather-widget px-4 py-3 flex items-center gap-2.5">
            <span className="text-xl">🌤️</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">28°C</span>
              <span className="text-xs text-text-muted">Partly Cloudy</span>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center overflow-hidden">

      {/* Background scene */}
      <div className="newtab-scene">
        <div className="orb" />
        <div className="ambient-glow w-[700px] h-[500px] top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent" />
        <div className="mountain-layer h-[45vh]">
          <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
            <path d="M0 500 L0 280 Q100 230 200 260 Q350 200 500 250 Q650 180 800 230 Q950 150 1100 200 Q1250 160 1440 220 L1440 500 Z" fill="rgba(15, 25, 15, 0.5)" />
            <path d="M0 500 L0 320 Q150 260 300 300 Q500 250 700 280 Q850 230 1000 270 Q1150 240 1300 290 Q1380 310 1440 280 L1440 500 Z" fill="rgba(8, 15, 8, 0.7)" />
            <path d="M0 500 L0 360 Q200 310 400 350 Q600 330 800 360 Q1000 340 1200 370 Q1350 350 1440 370 L1440 500 Z" fill="rgba(3, 8, 3, 0.9)" />
            <path d="M0 500 L0 400 Q300 370 600 400 Q900 410 1200 390 Q1350 395 1440 410 L1440 500 Z" fill="rgba(0, 0, 0, 0.95)" />
            <path d="M0 360 Q200 310 400 350 Q600 330 800 360 Q1000 340 1200 370 Q1350 350 1440 370" fill="none" stroke="rgba(57, 255, 20, 0.04)" strokeWidth="1" />
          </svg>
        </div>
        <div className="fog-layer absolute bottom-[20vh] left-0 right-0 h-[15vh] bg-gradient-to-r from-transparent via-accent/[0.03] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[10vh] bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Watermark logo in background */}
      <img src={cognixBg} alt="" className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-auto opacity-[0.08] pointer-events-none z-[5]" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-5 mt-[12vh]">

        {clock.enabled && renderClock()}

        {greeting.enabled && renderGreeting()}

        <img src={logo} alt="Cognix" className="h-7 w-auto mt-1 opacity-60" />

        {searchW.enabled && renderSearch()}

        {quicklinks.enabled && renderQuickLinks()}

        <button
          onClick={() => setCustomizeOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-glow transition-all text-sm tracking-wide"
        >
          <Palette size={15} />
          Customize
        </button>
      </div>

      {weather.enabled && renderWeather()}

      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all">
          <Image size={17} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all">
          <Layers size={17} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
