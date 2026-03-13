import { Link } from 'react-router-dom'
import { Shield, Zap, Cpu, Globe, Rocket, MessageCircle, Star, Github, Users } from 'lucide-react'
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout'
import { Tooltip } from '../components/ui'
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
          <Link to="/discovery" className={styles.navItem}>
            <Globe size={18} />
            <span>{t('common.discovery')}</span>
          </Link>
          <Link to="/apps" className={styles.navItem}>
            <Rocket size={18} />
            <span>{t('common.app_directory')}</span>
            <span className={styles.newBadge}>{t('common.new')}</span>
          </Link>
          <Link to="/community" className={styles.navItem}>
            <Users size={18} />
            <span>{t('common.community_hub')}</span>
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
          <Globe size={14} />
          <select
            value={useTranslationStore.getState().language}
            onChange={(e) => useTranslationStore.getState().setLanguage(e.target.value)}
            className={styles.langSelect}
          >
            <option value="en">English</option>
            <option value="fil">Filipino</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="zh">中文</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
            <option value="nl">Nederlands</option>
            <option value="ru">Русский</option>
            <option value="ar">العربية</option>
            <option value="hi">हिन्दी</option>
            <option value="tr">Türkçe</option>
            <option value="th">ไทย</option>
            <option value="vi">Tiếng Việt</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="pl">Polski</option>
            <option value="sv">Svenska</option>
          </select>
        </div>
      </div>
    </div>
  )

  const rightPanel = (
    <div className={styles.statusIsland}>
      <h3 className={styles.islandTitle}>{t('landing.status.header')}</h3>
      <div className={styles.statusList}>
        <div className={styles.statusItem}>
          <div className={styles.statusDot} style={{ background: 'var(--status-online)' }} />
          <span>{t('landing.status.gateway')}</span>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusDot} style={{ background: 'var(--status-online)' }} />
          <span>{t('landing.status.api')}</span>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusDot} style={{ background: 'var(--status-online)' }} />
          <span>{t('landing.status.voice')}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statValue}>LIVE</div>
        <div className={styles.statLabel}>Network telemetry is shown only when live metrics are available.</div>
      </div>
    </div>
  )

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
            <div className={styles.featureCard}>
              <Cpu className={styles.featureIcon} size={28} />
              <h3>{t('landing.features.native')}</h3>
              <p>{t('landing.features.native_desc')}</p>
            </div>
            <div className={styles.featureCard}>
              <Shield className={styles.featureIcon} size={28} />
              <h3>{t('landing.features.security')}</h3>
              <p>{t('landing.features.security_desc')}</p>
            </div>
            <div className={styles.featureCard}>
              <Zap className={styles.featureIcon} size={28} />
              <h3>{t('landing.features.sdk')}</h3>
              <p>{t('landing.features.sdk_desc')}</p>
            </div>
          </div>
        </section>

        <footer className={styles.landingFooter}>
          <div className={styles.footerLinks}>
            <Link to="/terms">{t('landing.footer.tos')}</Link>
            <Link to="/privacy">{t('landing.footer.privacy')}</Link>
            <Link to="/about">{t('landing.footer.about')}</Link>
            <Link to="/contact">{t('landing.footer.support')}</Link>
          </div>
          <p className={styles.copyright}>{t('landing.footer.copyright')}</p>
        </footer>
      </div>
    </WorkspaceLayout>
  )
}
