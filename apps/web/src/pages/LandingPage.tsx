import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Shield, Zap, Globe, Cpu, Lock, Rocket, ArrowRight,
  MessageSquare, Users, Mic, Code2, Check, Star,
  ChevronRight, Github, Twitter
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import styles from './LandingPage.module.css'

export function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const comparisonRef = useRef<HTMLElement>(null)
  const [featuresVisible, setFeaturesVisible] = useState(false)
  const [comparisonVisible, setComparisonVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)

    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.target === featuresRef.current && e.isIntersecting) setFeaturesVisible(true)
        if (e.target === comparisonRef.current && e.isIntersecting) setComparisonVisible(true)
      }),
      { threshold: 0.08 }
    )
    if (featuresRef.current) io.observe(featuresRef.current)
    if (comparisonRef.current) io.observe(comparisonRef.current)

    return () => { window.removeEventListener('scroll', handleScroll); io.disconnect() }
  }, [])

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Beacon — Communication Refined</title>
        <meta name="description" content="Beacon is the next evolution in community communication. Faster, safer, more beautiful than anything you've used before." />
      </Helmet>

      {/* Ambient background */}
      <div className={styles.ambience}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.grid} />
      </div>

      {/* Nav */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logo}>
            <div className={styles.logoMark}>B</div>
            <span className={styles.logoText}>Beacon</span>
          </a>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#compare">vs Discord</a>
            <a href="/docs">Developers</a>
            <a href="/about">About</a>
          </div>
          <div className={styles.navActions}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
              Get Started <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <Star size={12} fill="currentColor" />
            <span>The Discord Alternative you've been waiting for</span>
          </div>
          <h1 className={styles.heroTitle}>
            Communication<br />
            <span className={styles.heroGradient}>Refined.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Beacon is built from the ground up to be faster, more private,
            and more beautiful than anything you've used before.
            No dark patterns. No data selling. Just pure communication.
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              Open App Free <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/docs')}>
              <Code2 size={18} /> Read the Docs
            </Button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>0ms</span>
              <span className={styles.statLabel}>Avg. latency</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>E2E</span>
              <span className={styles.statLabel}>Encrypted DMs</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>100%</span>
              <span className={styles.statLabel}>Open source</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNum}>Free</span>
              <span className={styles.statLabel}>Always & forever</span>
            </div>
          </div>
        </div>

        {/* App Preview */}
        <div className={styles.heroPreview}>
          <div className={styles.previewWindow}>
            <div className={styles.previewBar}>
              <div className={styles.previewDot} style={{ background: '#ff5f56' }} />
              <div className={styles.previewDot} style={{ background: '#ffbd2e' }} />
              <div className={styles.previewDot} style={{ background: '#27c93f' }} />
              <span className={styles.previewTitle}>Beacon — #general</span>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewSidebar}>
                <div className={styles.previewServer} style={{ background: 'var(--beacon-brand)' }}>B</div>
                <div className={styles.previewServer}>G</div>
                <div className={styles.previewServer}>D</div>
              </div>
              <div className={styles.previewMain}>
                <div className={styles.previewMsg}>
                  <div className={styles.previewAvatar} style={{ background: '#7289da' }} />
                  <div>
                    <div className={styles.previewName}>alex</div>
                    <div className={styles.previewText}>this is genuinely so much better than discord lmao</div>
                  </div>
                </div>
                <div className={styles.previewMsg}>
                  <div className={styles.previewAvatar} style={{ background: '#23a559' }} />
                  <div>
                    <div className={styles.previewName}>sam</div>
                    <div className={styles.previewText}>the latency is actually insane 🚀</div>
                  </div>
                </div>
                <div className={styles.previewMsg}>
                  <div className={styles.previewAvatar} style={{ background: '#f0b232' }} />
                  <div>
                    <div className={styles.previewName}>mx</div>
                    <div className={styles.previewText}>and NO ads??? what is this magic</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        ref={featuresRef}
        className={`${styles.features} ${featuresVisible ? styles.sectionVisible : ''}`}
      >
        <div className={styles.sectionHead}>
          <span className={styles.pill}>Features</span>
          <h2>Everything you love.<br />Nothing you don't.</h2>
          <p>We took everything that works in modern chat apps and rebuilt it properly — cleaner, faster, and with your privacy front and center.</p>
        </div>

        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className={styles.featureCard} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section
        id="compare"
        ref={comparisonRef}
        className={`${styles.comparison} ${comparisonVisible ? styles.sectionVisible : ''}`}
      >
        <div className={styles.sectionHead}>
          <span className={styles.pill}>Comparison</span>
          <h2>Why not just use Discord?</h2>
          <p>We love Discord for what it built. But we believe you deserve better.</p>
        </div>

        <div className={styles.compareTable}>
          <div className={styles.compareHeader}>
            <div />
            <div className={styles.compareCol}>
              <div className={styles.compareLogoWrap}>
                <div className={styles.beaconBadge}>B</div>
                <span>Beacon</span>
              </div>
            </div>
            <div className={styles.compareCol}>
              <span className={styles.discordLabel}>Discord</span>
            </div>
          </div>
          {COMPARE_ROWS.map(row => (
            <div key={row.feature} className={styles.compareRow}>
              <div className={styles.compareFeature}>{row.feature}</div>
              <div className={styles.compareCell}>
                {row.beacon ? <Check size={18} className={styles.checkYes} /> : <span className={styles.checkNo}>—</span>}
                {row.beaconNote && <span className={styles.compareNote}>{row.beaconNote}</span>}
              </div>
              <div className={styles.compareCell}>
                {row.discord ? <Check size={18} className={styles.checkMuted} /> : <span className={styles.checkNo}>—</span>}
                {row.discordNote && <span className={styles.compareNote}>{row.discordNote}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Built for Everyone */}
      <section className={`${styles.builtFor} ${featuresVisible ? styles.sectionVisible : ''}`}>
        <div className={styles.sectionHead}>
          <span className={styles.pill}>For Everyone</span>
          <h2>Built for how you actually communicate.</h2>
        </div>
        <div className={styles.builtForGrid}>
          {BUILT_FOR.map(b => (
            <div key={b.title} className={styles.builtForCard}>
              <div className={styles.builtForIcon}>{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
              <ul className={styles.builtForList}>
                {b.points.map(p => (
                  <li key={p}><Check size={14} className={styles.checkYes} />{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaOrb} />
          <h2>Ready to switch?</h2>
          <p>Join the waitlist or dive straight in. It's free, always.</p>
          <div className={styles.ctaActions}>
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              Open Beacon <ArrowRight size={18} />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => window.open('https://github.com/Raft-The-Crab/Beacon', '_blank')}>
              <Github size={18} /> Star on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <div className={styles.logoMark} style={{ width: 36, height: 36, fontSize: 18 }}>B</div>
              <span>Beacon</span>
            </div>
            <p>Communication refined.<br />Open source. Free forever.</p>
            <div className={styles.footerSocials}>
              <a href="https://github.com/Raft-The-Crab/Beacon" target="_blank" rel="noreferrer" title="GitHub">
                <Github size={20} />
              </a>
              <a href="#" title="Twitter/X">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="/docs">Documentation</a>
              <a href="/developer">Developer API</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Company</h4>
              <a href="/about">About Us</a>
              <a href="/contact">Contact</a>
              <a href="/docs/mission">Our Mission</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Legal</h4>
              <a href="/terms">Terms of Service</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/safety">Safety</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Beacon. All rights reserved.</span>
          <span>Made with care, not corporate BS.</span>
        </div>
      </footer>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────
const FEATURES = [
  { icon: <Zap size={28} />, title: 'Lightning Fast', desc: 'Messages arrive in milliseconds. Our custom WebSocket protocol is engineered for sub-10ms delivery globally.' },
  { icon: <Shield size={28} />, title: 'Private by Default', desc: 'E2E encrypted DMs. Zero data brokering. Zero ads. Your conversations are yours alone.' },
  { icon: <MessageSquare size={28} />, title: 'Rich Messaging', desc: 'Threads, reactions, polls, voice messages, embeds, code blocks with syntax highlighting. Everything you need.' },
  { icon: <Globe size={28} />, title: 'Communities First', desc: 'Servers, roles, channels, categories — fully featured community tools with a modern twist.' },
  { icon: <Cpu size={28} />, title: 'Developer Platform', desc: 'First-class bot SDK, REST API, Gateway WebSocket events, webhooks, and OAuth2. Build anything.' },
  { icon: <Users size={28} />, title: 'Cross-Platform', desc: 'Web, desktop (Windows/Mac/Linux via Tauri), and mobile (Android/iOS via Capacitor). One codebase.' },
  { icon: <Mic size={28} />, title: 'Crystal Voice', desc: 'High-quality voice channels with noise suppression, screen sharing, and stage channels.' },
  { icon: <Lock size={28} />, title: 'Open Source', desc: 'Fully auditable code. No black boxes. Self-hostable. Your data lives where you want it.' },
  { icon: <Rocket size={28} />, title: 'Always Free', desc: 'No nitro. No pay-to-customize. No paywalled features. Beacon is and always will be free.' },
]

const COMPARE_ROWS = [
  { feature: 'End-to-end encrypted DMs', beacon: true, discord: false, discordNote: 'Server-side only' },
  { feature: 'No ads, ever', beacon: true, discord: false, discordNote: 'Ad targeting in place' },
  { feature: 'Open source', beacon: true, discord: false },
  { feature: 'Self-hostable', beacon: true, discord: false },
  { feature: 'Custom emoji (free)', beacon: true, discord: false, discordNote: 'Requires Nitro' },
  { feature: 'Animated avatars (free)', beacon: true, discord: false, discordNote: 'Requires Nitro' },
  { feature: 'Voice channels', beacon: true, discord: true },
  { feature: 'Screen sharing', beacon: true, discord: true },
  { feature: 'Bot / developer API', beacon: true, discord: true },
  { feature: 'Mobile app', beacon: true, discord: true },
  { feature: 'No data selling', beacon: true, discord: false, discordNote: 'ToS allows data use' },
  { feature: 'Stage channels', beacon: true, discord: true },
  { feature: 'Forum channels', beacon: true, discord: true },
  { feature: 'Free forever', beacon: true, discord: false, discordNote: 'Core free, premium push' },
]

const BUILT_FOR = [
  {
    icon: <Users size={32} />,
    title: 'Communities',
    desc: 'Build and grow your community with all the tools you need.',
    points: ['Roles & permissions', 'Custom channels', 'Moderation tools', 'Audit logs'],
  },
  {
    icon: <Code2 size={32} />,
    title: 'Developers',
    desc: 'A first-class API and SDK to build bots and integrations.',
    points: ['REST API', 'WebSocket gateway', 'bot.js SDK', 'OAuth2 scopes'],
  },
  {
    icon: <MessageSquare size={32} />,
    title: 'Friends',
    desc: 'Stay close with the people you care about.',
    points: ['DMs & group chats', 'Voice calls', 'Rich presence', 'Custom status'],
  },
]
