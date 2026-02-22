import { Link } from 'react-router-dom'
import { Shield, Zap, Cpu, Globe, Rocket, MessageCircle, Star, Github } from 'lucide-react'
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout'
import { Tooltip } from '../components/ui'
import styles from './LandingPage.module.css'

export function LandingPage() {
  const sidebar = (
    <div className={styles.landingNav}>
      <div className={styles.navSection}>
        <div className={styles.navHeader}>NAVIGATION</div>
        <div className={styles.navList}>
          <Link to="/" className={`${styles.navItem} ${styles.active}`}>
            <Rocket size={18} />
            <span>Introduction</span>
          </Link>
          <Link to="/about" className={styles.navItem}>
            <Globe size={18} />
            <span>About Us</span>
          </Link>
          <Link to="/docs" className={styles.navItem}>
            <Star size={18} />
            <span>Documentation</span>
          </Link>
        </div>
      </div>

      <div className={styles.navSection}>
        <div className={styles.navHeader}>COMMUNITY</div>
        <div className={styles.navList}>
          <a href="https://github.com/Raft-The-Crab/Beacon" target="_blank" rel="noreferrer" className={styles.navItem}>
            <Github size={18} />
            <span>GitHub</span>
          </a>
          <Link to="/contact" className={styles.navItem}>
            <MessageCircle size={18} />
            <span>Contact Support</span>
          </Link>
        </div>
      </div>

      <div className={styles.ctaIsland}>
        <p>Ready to communicate?</p>
        <Link to="/login" className={styles.loginBtn}>Open Beacon</Link>
      </div>
    </div>
  )

  const rightPanel = (
    <div className={styles.statusIsland}>
      <h3 className={styles.islandTitle}>Platform Status</h3>
      <div className={styles.statusList}>
        <div className={styles.statusItem}>
          <div className={styles.statusDot} style={{ background: 'var(--status-online)' }} />
          <span>Gateway: Online</span>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusDot} style={{ background: 'var(--status-online)' }} />
          <span>API: Online</span>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusDot} style={{ background: 'var(--status-online)' }} />
          <span>Voice Clusters: Online</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statValue}>1.2M</div>
        <div className={styles.statLabel}>Active Nodes</div>
      </div>
    </div>
  )

  return (
    <WorkspaceLayout sidebar={sidebar} rightPanel={rightPanel}>
      <div className={`${styles.heroWrapper} mesh-gradient`}>
        <div className="floating-orb" style={{ top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--beacon-brand)' }} />
        <div className="floating-orb" style={{ bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'var(--status-dnd)', animationDelay: '-5s' }} />

        <div className={styles.hero}>
          <h1 className={styles.title}>
            Communication, <br />
            <span className={styles.gradientText}>Sovereign.</span>
          </h1>
          <p className={styles.subtitle}>
            The world's most advanced de-centralized communication platform.
            Native Opus audio, E2EE, and an AI-first bot framework.
          </p>
          <div className={styles.actions}>
            <Tooltip content="Join the revolution" position="top">
              <Link to="/login" className={styles.primaryBtn}>Get Started</Link>
            </Tooltip>
            <Tooltip content="Learn how it works" position="top">
              <Link to="/docs" className={styles.secondaryBtn}>Read the Docs</Link>
            </Tooltip>
          </div>
        </div>

        <section className={styles.features}>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <Cpu className={styles.featureIcon} size={28} />
              <h3>Native Engine</h3>
              <p>Built for speed. Zero external dependencies for voice.</p>
            </div>
            <div className={styles.featureCard}>
              <Shield className={styles.featureIcon} size={28} />
              <h3>E2EE Security</h3>
              <p>Your messages, your keys. Privacy is a right.</p>
            </div>
            <div className={styles.featureCard}>
              <Zap className={styles.featureIcon} size={28} />
              <h3>God-Tier SDK</h3>
              <p>Unprecedented control over your bots.</p>
            </div>
          </div>
        </section>

        <footer className={styles.landingFooter}>
          <div className={styles.footerLinks}>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Support</Link>
          </div>
          <p className={styles.copyright}>© 2026 Beacon Communication Platform. Proprietary Engine.</p>
        </footer>
      </div>
    </WorkspaceLayout>
  )
}
