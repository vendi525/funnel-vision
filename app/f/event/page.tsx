'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventFunnelData = {
  bgColor: string
  textColor: string
  accentColor: string
  fontHeading: string
  fontBody: string
  heroHeadline: string
  heroSubheadline: string
  heroCopy: string
  heroBgImage: string
  heroFontSize?: number
  mediaUrl: string
  mediaType: 'video' | 'image'
  // Permanent overlay on card 2
  eventDate: string
  eventTime: string
  eventLocation: string
  // Card 3 offer
  offerTitle: string
  offerPrice: string
  offerBenefits: [string, string, string]
  ctaText: string
  trustLine: string
  // Capacity indicator
  spotsTotal: number
  spotsTaken: number
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const defaultEventFunnelData: EventFunnelData = {
  bgColor: '#080b12',
  textColor: '#ffffff',
  accentColor: '#60a5fa',
  fontHeading: 'Inter',
  fontBody: 'Inter',
  heroHeadline: 'One Night Only',
  heroSubheadline: 'The event everyone will be talking about. Be there.',
  heroCopy: "An intimate evening of music, art, and unexpected moments. Limited capacity — this one sells out every time.",
  heroBgImage: '',
  mediaUrl: '',
  mediaType: 'video',
  eventDate: 'Jun 12',
  eventTime: '8:00 PM',
  eventLocation: 'Rooftop 23',
  offerTitle: 'Reserve your spot',
  offerPrice: '$35',
  offerBenefits: [
    'Live performance + open bar',
    'Rooftop terrace with city views',
    'Strictly 120 guests',
  ],
  ctaText: 'Register now',
  trustLine: 'Free cancellation up to 48 hours before',
  spotsTotal: 120,
  spotsTaken: 97,
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .fv-outer {
    position: fixed; inset: 0;
    display: flex; justify-content: center; align-items: stretch;
    background: #000;
  }
  .fv-inner { position: relative; width: 100%; max-width: 430px; height: 100dvh; overflow: hidden; }
  .fv-peek  { position: absolute; bottom: 0; left: 0; right: 0; height: 220px; background: #000; z-index: 0; }
  .fv-scroll {
    position: absolute; inset: 0; scroll-snap-type: y mandatory; overflow-y: scroll;
    overscroll-behavior: none; scrollbar-width: none; z-index: 1;
    background: var(--fv-bg); color: var(--fv-text);
    font-family: var(--fv-font-body), Inter, sans-serif;
  }
  .fv-scroll::-webkit-scrollbar { display: none; }
  .fv-card { height: 100dvh; scroll-snap-align: start; position: relative; overflow: hidden; }
  .fv-heading { font-family: var(--fv-font-heading), Inter, sans-serif; }
  .fv-bounce-up     { transform: translateY(-220px); transition: none; }
  .fv-bounce-spring { transform: translateY(0); transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes fv-bob {
    0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.5; }
    50%       { transform: translateX(-50%) translateY(8px); opacity: 0.85; }
  }
  @keyframes fv-fade-in  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fv-fade-out { from { opacity: 1 } to { opacity: 0 } }
  .fv-chevron-in  { animation: fv-fade-in 0.4s ease forwards, fv-bob 1.6s 0.4s ease-in-out infinite; }
  .fv-chevron-out { animation: fv-fade-out 0.5s ease forwards; }
  .fv-consent-backdrop {
    position: fixed; inset: 0; z-index: 500;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px); padding: 1.5rem;
  }
  .fv-consent-card {
    width: 100%; max-width: 340px;
    background: rgba(18,18,18,0.97); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 1.5rem; padding: 2rem 1.75rem 1.75rem; text-align: center;
  }
  .fv-form-input {
    width: 100%; padding: 0.9rem 1rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 0.65rem;
    color: var(--fv-text);
    font-family: var(--fv-font-body), Inter, sans-serif;
    font-size: 0.95rem;
    outline: none;
    box-sizing: border-box;
    -webkit-appearance: none;
    transition: border-color 0.15s;
  }
  .fv-form-input::placeholder { color: rgba(128,128,128,0.55); }
  .fv-form-input:focus { border-color: rgba(255,255,255,0.25); }
`

// ─── useFitText ───────────────────────────────────────────────────────────────

function useFitText(
  text: string,
  ref: React.RefObject<HTMLHeadingElement | null>,
  maxPx: number,
  minPx: number,
): number {
  const [size, setSize] = useState(maxPx)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const maxHeight = window.innerHeight * 0.50
    let lo = minPx, hi = maxPx
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2)
      el.style.fontSize = `${mid}px`
      if (el.scrollHeight > maxHeight) { hi = mid } else { lo = mid }
    }
    setSize(lo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, maxPx, minPx])
  return size
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  funnelData?: Partial<EventFunnelData>
  previewMode?: boolean
}

export default function EventFunnelPage({ funnelData: overrides, previewMode }: Props) {
  const data: EventFunnelData = { ...defaultEventFunnelData, ...overrides }

  type BounceState = '' | 'up' | 'spring'
  const [bounce, setBounce]           = useState<BounceState>('')
  const [chevron, setChevron]         = useState<'hidden' | 'in' | 'out'>('hidden')
  const [showConsent, setShowConsent] = useState(false)
  const [isMuted, setIsMuted]         = useState(true)
  const [leadName, setLeadName]       = useState('')
  const [leadEmail, setLeadEmail]     = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)

  const videoRef    = useRef<HTMLVideoElement>(null)
  const scrollRef   = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const fitFontSize = useFitText(data.heroHeadline, headlineRef, 80, 28)

  const isVideo = data.mediaType === 'video'

  const toggleSound = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }

  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--fv-bg',           data.bgColor)
    r.style.setProperty('--fv-text',         data.textColor)
    r.style.setProperty('--fv-accent',       data.accentColor)
    r.style.setProperty('--fv-font-heading', data.fontHeading)
    r.style.setProperty('--fv-font-body',    data.fontBody)
  }, [data.bgColor, data.textColor, data.accentColor, data.fontHeading, data.fontBody])

  const triggerBounce = useCallback(() => {
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>
    setBounce('up')
    t2 = setTimeout(() => {
      setBounce('spring')
      t3 = setTimeout(() => setBounce(''), 700)
    }, 80)
    return () => { clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const scrollToCard3 = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const start  = el.scrollTop
    const target = 2 * window.innerHeight
    const t0     = performance.now()
    el.style.scrollSnapType = 'none'
    const tick = (now: number) => {
      const t     = Math.min((now - t0) / 500, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      el.scrollTop = start + (target - start) * eased
      if (t < 1) requestAnimationFrame(tick)
      else        el.style.scrollSnapType = 'y mandatory'
    }
    requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (previewMode) return
    const decided = localStorage.getItem('fv_consent_decided')
    if (decided) {
      const t1 = setTimeout(() => setChevron('in'), 1500)
      const t2 = setTimeout(() => setChevron('out'), 3500)
      const t3 = setTimeout(() => setChevron('hidden'), 4000)
      const t4 = setTimeout(triggerBounce, 2500)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
    } else {
      setShowConsent(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem('fv_consent_decided', accepted ? 'accepted' : 'declined')
    setShowConsent(false)
    const t1 = setTimeout(() => setChevron('in'), 800)
    const t2 = setTimeout(() => setChevron('out'), 2800)
    const t3 = setTimeout(() => setChevron('hidden'), 3300)
    const t4 = setTimeout(triggerBounce, 1800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }

  const handleRegister = async () => {
    if (!leadName.trim() || !leadEmail.trim()) return
    setSubmitting(true)

    // TODO: insert lead into Supabase
    // const { error } = await supabase.from('event_leads').insert({
    //   funnel_slug: /* slug from route params */,
    //   name: leadName,
    //   email: leadEmail,
    //   registered_at: new Date().toISOString(),
    // })

    await new Promise(r => setTimeout(r, 900))  // simulate network
    setSubmitted(true)
    setSubmitting(false)
  }

  const scrollClass =
    bounce === 'up'     ? 'fv-scroll fv-bounce-up'     :
    bounce === 'spring' ? 'fv-scroll fv-bounce-spring' :
                          'fv-scroll'

  const heroBg = data.heroBgImage
    ? `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%), url(${data.heroBgImage}) center/cover no-repeat`
    : 'linear-gradient(155deg, #0d1526 0%, #080b12 70%)'

  const spotsRemaining = Math.max(data.spotsTotal - data.spotsTaken, 0)
  const fillPct        = data.spotsTotal > 0
    ? Math.min((data.spotsTaken / data.spotsTotal) * 100, 100)
    : 0

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="fv-outer">
        <div className="fv-inner">
          <div className="fv-peek" />

          <div ref={scrollRef} className={scrollClass}>

            {/* ══ Card 1: Hero ═════════════════════════════════════════════════ */}
            <div className="fv-card" style={{ background: heroBg }}>
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-start',
                padding: 'max(3.25rem, env(safe-area-inset-top)) 1.75rem 2rem',
              }}>
                <h1
                  ref={headlineRef}
                  className="fv-heading"
                  style={{
                    fontSize: `${data.heroFontSize ?? fitFontSize}px`,
                    fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em',
                    color: 'var(--fv-text)', textTransform: 'uppercase',
                    marginBottom: '1.25rem', wordBreak: 'break-word', overflowWrap: 'break-word',
                  }}
                >
                  {data.heroHeadline}
                </h1>
                <p className="fv-heading" style={{
                  fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35,
                  color: 'var(--fv-text)', textTransform: 'uppercase',
                  letterSpacing: '0.01em', marginBottom: '1rem',
                }}>
                  {data.heroSubheadline}
                </p>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6,
                  color: 'var(--fv-text)', opacity: 0.6, maxWidth: '36ch',
                }}>
                  {data.heroCopy}
                </p>
              </div>

              {chevron !== 'hidden' && (
                <div
                  className={chevron === 'in' ? 'fv-chevron-in' : 'fv-chevron-out'}
                  style={{ position: 'absolute', bottom: '2.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2, lineHeight: 0 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M6 10l6 6 6-6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* ══ Card 2: Media with event info overlay ═════════════════════════ */}
            <div className="fv-card" style={{ background: '#000' }}>
              {/* Media layer */}
              {data.mediaUrl ? (
                isVideo ? (
                  <video
                    ref={videoRef}
                    src={data.mediaUrl}
                    autoPlay muted playsInline
                    onEnded={scrollToCard3}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={data.mediaUrl}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(160deg, #0d1a2e 0%, #080b12 100%)',
                }} />
              )}

              {/* Transparency overlay — darkens media so it reads as background */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.65) 100%)',
                zIndex: 1,
              }} />

              {/* Date / time / location pill — always visible */}
              <div style={{
                position: 'absolute', bottom: '2.5rem', left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2,
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 1.2rem',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '3rem',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--fv-accent)', letterSpacing: '0.01em' }}>
                  {data.eventDate}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                  {data.eventTime}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                  {data.eventLocation}
                </span>
              </div>

              {/* Sound toggle — video only */}
              {data.mediaUrl && isVideo && (
                <button
                  onClick={toggleSound}
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  style={{
                    position: 'absolute', bottom: '1.75rem', right: '1.25rem',
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 3, padding: 0,
                  }}
                >
                  {isMuted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" fill="rgba(255,255,255,0.8)" />
                      <line x1="23" y1="9" x2="17" y2="15" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
                      <line x1="17" y1="9" x2="23" y2="15" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" fill="rgba(255,255,255,0.8)" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* ══ Card 3: Registration ══════════════════════════════════════════ */}
            <div
              className="fv-card"
              style={{
                background: 'var(--fv-bg)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '2.5rem 1.75rem max(5rem, env(safe-area-inset-bottom, 2.5rem))',
                textAlign: 'center',
              }}
            >
              {data.offerPrice && (
                <p className="fv-heading" style={{
                  fontSize: 'clamp(2.75rem, 14vw, 4rem)', fontWeight: 900, lineHeight: 1,
                  color: 'var(--fv-accent)', letterSpacing: '-0.02em', marginBottom: '0.5rem',
                }}>
                  {data.offerPrice}
                </p>
              )}

              <h2 className="fv-heading" style={{
                fontSize: 'clamp(2.5rem, 13vw, 3.75rem)', fontWeight: 900, lineHeight: 0.97,
                letterSpacing: '-0.025em', color: 'var(--fv-text)', textTransform: 'uppercase',
                marginBottom: '2rem',
              }}>
                {data.offerTitle}
              </h2>

              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 2.25rem',
                display: 'flex', flexDirection: 'column', gap: '0.9rem',
                width: '100%', maxWidth: 280,
              }}>
                {data.offerBenefits.map((benefit, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', textAlign: 'left' }}>
                    <span aria-hidden="true" style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--fv-accent)', marginTop: '0.45em', flexShrink: 0,
                    }} />
                    <span style={{ color: 'var(--fv-text)', opacity: 0.8, lineHeight: 1.5, fontSize: '0.9rem' }}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Spots progress bar */}
              {data.spotsTotal > 0 && (
                <div style={{ width: '100%', maxWidth: 280, marginBottom: '1.5rem' }}>
                  <div style={{
                    height: 3, borderRadius: 2,
                    background: 'rgba(255,255,255,0.1)',
                    overflow: 'hidden', marginBottom: '0.5rem',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${fillPct}%`,
                      background: 'var(--fv-accent)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--fv-text)', opacity: 0.45, margin: 0 }}>
                    {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
                  </p>
                </div>
              )}

              {/* Lead capture form / success state */}
              {submitted ? (
                <div style={{ width: '100%', maxWidth: 280, textAlign: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    margin: '0 auto 1rem',
                    background: 'rgba(34,197,94,0.12)',
                    border: '1.5px solid rgba(34,197,94,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}>
                    ✓
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fv-text)', margin: '0 0 0.4rem' }}>
                    You&apos;re on the list
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--fv-text)', opacity: 0.45, lineHeight: 1.55, margin: 0 }}>
                    We&apos;ll send details to {leadEmail}
                  </p>
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <input
                    className="fv-form-input"
                    type="text"
                    placeholder="Your name"
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                  />
                  <input
                    className="fv-form-input"
                    type="email"
                    placeholder="Email address"
                    value={leadEmail}
                    onChange={e => setLeadEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  />
                  <button
                    onClick={handleRegister}
                    disabled={submitting}
                    style={{
                      padding: '1.05rem',
                      background: submitting ? `${data.accentColor}99` : 'var(--fv-accent)',
                      color: '#000',
                      fontFamily: 'var(--fv-font-heading), Inter, sans-serif',
                      fontWeight: 800, fontSize: '1rem', border: 'none',
                      borderRadius: '0.75rem',
                      cursor: submitting ? 'default' : 'pointer',
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      transition: 'background 0.2s',
                    }}
                  >
                    {submitting ? 'Registering…' : data.ctaText}
                  </button>
                </div>
              )}

              {!submitted && (
                <p style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'var(--fv-text)', opacity: 0.3, letterSpacing: '0.02em' }}>
                  {data.trustLine}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ══ Consent overlay ══════════════════════════════════════════════════════ */}
      {showConsent && (
        <div className="fv-consent-backdrop">
          <div className="fv-consent-card">
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15h-1v-5h1v5zm0-7h-1V8h1v2z" fill="rgba(255,255,255,0.45)" />
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--fv-font-heading), Inter, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--fv-text)', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
              We use cookies
            </p>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.5)', marginBottom: '1.75rem' }}>
              We use cookies to improve your experience and personalise content.
            </p>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={() => handleConsent(false)}
                style={{
                  flex: 1, padding: '0.75rem 0', background: 'transparent',
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--fv-font-heading), Inter, sans-serif',
                  fontWeight: 700, fontSize: '0.8rem',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '0.5rem', cursor: 'pointer',
                  letterSpacing: '0.03em', textTransform: 'uppercase',
                }}
              >
                Decline
              </button>
              <button
                onClick={() => handleConsent(true)}
                style={{
                  flex: 1, padding: '0.75rem 0', background: 'var(--fv-accent)',
                  color: '#000', fontFamily: 'var(--fv-font-heading), Inter, sans-serif',
                  fontWeight: 800, fontSize: '0.8rem', border: 'none',
                  borderRadius: '0.5rem', cursor: 'pointer',
                  letterSpacing: '0.03em', textTransform: 'uppercase',
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
