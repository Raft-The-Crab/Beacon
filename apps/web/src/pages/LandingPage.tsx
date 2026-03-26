import { Link } from 'react-router-dom'
import { Shield, Zap, Cpu, Globe, Rocket, MessageCircle, Star, Github, Users } from 'lucide-react'
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
          <h1 className={`${styles.title} premium-hero-heading`}>
            Beacon
          </h1>
          <p className={styles.subtitle}>
            {t('landing.subtitle')}
          </p>
          <div className={styles.actions}>
            <Tooltip content={t('common.join_revolution', { defaultValue: 'Join the revolution' })} position="top">
              <Link to="/login" className={styles.primaryBtn}>{t('landing.get_started')}</Link>
            </Tooltip>
            <Tooltip content={t('common.learn_how', { defaultValue: 'Learn how it works' })} position="top">
              <Link to="/docs" className={styles.secondaryBtn}>{t('landing.read_docs')}</Link>
            </Tooltip>
          </div>
        </div>

        <section className={styles.features}>
          <div className={styles.featureGrid}>
            <div className={`${styles.featureCard} ${styles.featureCoreEngine}`}>
              <div className={styles.iconWrapper}>
                <Cpu className={styles.featureIcon} size={32} />
              </div>
              <h3>Core Engine</h3>
              <p>Ultra-low latency infrastructure engineered for instantaneous global synchronization of voice and state data.</p>
            </div>

            <div className={`${styles.featureCard} ${styles.featurePrivacy}`}>
              <div className={styles.iconWrapper}>
                <Shield className={styles.featureIcon} size={32} />
              </div>
              <h3>Privacy Architecture</h3>
              <p>Encrypted tunnels for every interaction, featuring metadata stripping and user-governed identity control by default.</p>
            </div>

            <div className={`${styles.featureCard} ${styles.featureDeveloperAPI}`}>
              <div className={styles.iconWrapper}>
                <Zap className={styles.featureIcon} size={32} />
              </div>
              <h3>Developer Ecosystem</h3>
              <p>Advanced platform featuring programmable bot hooks, extensible JSON schemas, and industrial-grade throughput protection.</p>
            </div>
          </div>
        </section>

        <footer className={styles.landingFooter}>
          <div className={styles.footerLinks}>
            <Link to="/terms">{t('landing.footer.tos')}</Link>
            <Link to="/privacy">{t('landing.footer.privacy')}</Link>
            <Link to="/license">License</Link>
            <Link to="/safety">Safety Hub</Link>
            <Link to="/about">{t('landing.footer.about')}</Link>
            <Link to="/contact">{t('landing.footer.support')}</Link>
          </div>
          <p className={styles.copyright}>{t('landing.footer.copyright')}</p>
        </footer>
      </div>
    </WorkspaceLayout>
  )
}
