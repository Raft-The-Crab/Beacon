import { Link } from 'react-router-dom'
import { Shield, Zap, Cpu, Globe, Rocket, MessageCircle, Star, Github, Users, Code } from 'lucide-react'
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout'
import { Tooltip, SelectDropdown } from '../components/ui'
import styles from '../styles/modules/pages/LandingPage.module.css'
import { useTranslationStore } from '../stores/useTranslationStore'

export function LandingPage() {
  const { t } = useTranslationStore()

  const sidebar = (
    <div className={styles.landingNav}>
      <div className={styles.navSection}>
        <div className={styles.navHeader}>NAVIGATION</div>
        <div className={styles.navList}>
          <Link to="/" className={`${styles.navItem} ${styles.active}`}>
            <Rocket size={18} />
            <span>{t('common.introduction')}</span>
          </Link>
          <Link to="/apps" className={styles.navItem}>
            <Zap size={18} />
            <span>{t('common.app_directory')}</span>
            <span className={styles.newBadge}>{t('common.new')}</span>
          </Link>
          <Link to="/docs" className={styles.navItem}>
            <Star size={18} />
            <span>{t('common.documentation')}</span>
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
            <span>{t('common.contact_support')}</span>
          </Link>
        </div>
      </div>

      <div className={styles.ctaIsland}>
        <p>{t('landing.get_started_question', { defaultValue: 'Ready to connect?' })}</p>
        <Link to="/login" className={styles.loginBtn}>{t('common.open_beacon')}</Link>

        <div className={styles.langSelector}>
          <SelectDropdown
            options={[
              { label: 'English', value: 'en' },
              { label: 'Filipino', value: 'fil' },
              { label: '日本語', value: 'ja' },
              { label: '한국어', value: 'ko' },
              { label: '中文', value: 'zh' },
              { label: 'Français', value: 'fr' },
              { label: 'Deutsch', value: 'de' },
              { label: 'Español', value: 'es' },
              { label: 'Italiano', value: 'it' },
              { label: 'Português', value: 'pt' },
              { label: 'Nederlands', value: 'nl' },
              { label: 'Русский', value: 'ru' },
              { label: 'العربية', value: 'ar' },
              { label: 'हिन्दी', value: 'hi' },
              { label: 'Türkçe', value: 'tr' },
              { label: 'ไทย', value: 'th' },
              { label: 'Tiếng Việt', value: 'vi' },
              { label: 'Bahasa Indonesia', value: 'id' },
              { label: 'Polski', value: 'pl' },
              { label: 'Svenska', value: 'sv' },
            ]}
            value={useTranslationStore.getState().language}
            onChange={(val: string | number | null) => val && useTranslationStore.getState().setLanguage(val as string)}
            size="sm"
            searchable={false}
            className={styles.langSelect}
          />
        </div>
      </div>
    </div>
  )

  const rightPanel = null;

  return (
    <WorkspaceLayout sidebar={sidebar} rightPanel={rightPanel}>
      <div className={styles.heroWrapper}>
        <div className={styles.hero}>
          <h1 className={styles.title}>The Future of Communication</h1>
          <p className={styles.subtitle}>
            Secure, Private, and Open. Join the next generation of social networking with Beacon.
          </p>
          <div className={styles.actions}>
            <Link to="/login" className={styles.primaryBtn}>Get Started</Link>
            <Link to="/docs" className={styles.secondaryBtn}>Documentation</Link>
          </div>
        </div>

        <section className={styles.featureGrid}>
          <div className={`${styles.featureCard} ${styles.featureCoreEngine}`}>
            <div className={styles.iconWrapper}>
              <Cpu className={styles.featureIcon} size={32} />
            </div>
            <h3>Core Engine</h3>
            <p>Our distributed architecture ensures that your messages are delivered instantly and securely, across the globe.</p>
          </div>

          <div className={`${styles.featureCard} ${styles.featurePrivacy}`}>
            <div className={styles.iconWrapper}>
              <Shield className={styles.featureIcon} size={32} />
            </div>
            <h3>Privacy First</h3>
            <p>Your data belongs to you. We use end-to-end encryption and Sovereignty protocols to keep your conversations private.</p>
          </div>

          <div className={`${styles.featureCard} ${styles.featureDeveloperAPI}`}>
            <div className={styles.iconWrapper}>
              <Code className={styles.featureIcon} size={32} />
            </div>
            <h3>Developer Friendly</h3>
            <p>Build powerful integrations with our robust SDK and API. Create bots, games, and tools with ease.</p>
          </div>
        </section>

        <article style={{ marginTop: '80px', maxWidth: '800px', marginInline: 'auto', opacity: 0.8, textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Our Mission</h2>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            At Beacon, we believe that everyone deserves a safe and private space to connect with others. 
            Our mission is to build a communication platform that empowers users and fosters meaningful communities 
            through decentralized innovation.
          </p>
        </article>

        <footer className={styles.landingFooter}>
          <div className={styles.footerLinks}>
            <Link to="/docs">Documentation</Link>
            <Link to="/apps">App Directory</Link>
            <Link to="/about">About Us</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
          <p className={styles.copyright}>&copy; {new Date().getFullYear()} Beacon Platform. Crafted with session-based security.</p>
        </footer>
      </div>
    </WorkspaceLayout>
  )
}
