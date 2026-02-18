import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Rocket, Shield, Zap, Globe, Cpu, Lock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'; // Import ThemeToggle
import styles from './LandingPage.module.css'

export function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const featuresRef = useRef<HTMLElement>(null)
  const [featuresVisible, setFeaturesVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (featuresRef.current) {
      observer.observe(featuresRef.current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Beacon - Communication Refined</title>
        <meta name="description" content="A minimalist, secure, and lightning-fast communication platform built for modern communities and developers." />
      </Helmet>

      {/* God-Tier Atmosphere */}
      <div className={styles.atmosContainer}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>B</div>
            <span className={styles.logoName}>Beacon</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="/docs">Developers</a>
            <a href="/about">About Us</a>
          </div>
          {/* Place ThemeToggle here */}
          <ThemeToggle />
          <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
            Open App
          </Button>
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className="accent-text">Communication refined.</h1>
            <p>
              A minimalist, secure, and lightning-fast communication platform
              built for modern communities and developers.
            </p>
            <div className={styles.heroActions}>
              <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
                Get Started
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/developer')}>
                Build with Beacon
              </Button>
            </div>
          </div>
        </section>

        <section
          id="features"
          ref={featuresRef}
          className={`${styles.features} ${featuresVisible ? styles.visible : ''}`}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.tagline}>Infrastructure</span>
            <h2 className="accent-text">Engineered for Sovereignty</h2>
            <p>Every layer of the Beacon stack is designed to preserve the integrity of your digital identity.</p>
          </div>

          <div className={styles.featureGrid}>
            <FeatureCard
              icon={<Shield size={32} />}
              title="State-Level Encryption"
              description="End-to-end encryption protocols that exceed modern regulatory standards."
              delay={0}
            />
            <FeatureCard
              icon={<Zap size={32} />}
              title="Neural Latency"
              description="Proprietary synchronization engines ensuring sub-ms delivery across the globe."
              delay={100}
            />
            <FeatureCard
              icon={<Globe size={32} />}
              title="Distributed Core"
              description="A resilient, decentralized architecture that remains online even under heavy containment."
              delay={200}
            />
            <FeatureCard
              icon={<Cpu size={32} />}
              title="Open Compute"
              description="Built on transparent, verifiable primitives for maximum architectural trust."
              delay={300}
            />
            <FeatureCard
              icon={<Lock size={32} />}
              title="Private Guilds"
              description="Complete autonomy over your communities with hardware-level security."
              delay={400}
            />
            <FeatureCard
              icon={<Rocket size={32} />}
              title="Developer Ready"
              description="Powerful SDKs and REST APIs to build the next generation of neural apps."
              delay={500}
            />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span>Beacon</span>
            <p>Simpler communication for everyone.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkGroup}>
              <h4>Product</h4>
              <a href="/docs">Download</a>
              <a href="/docs">Status</a>
            </div>
            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <a href="/about">About</a>
              <a href="/about">Jobs</a>
            </div>
            <div className={styles.linkGroup}>
              <h4>Resources</h4>
              <a href="/docs">Support</a>
              <a href="/docs">Developers</a>
              <a href="/safety">Safety</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, delay = 0 }: { icon: React.ReactNode, title: string, description: string, delay?: number }) {
  return (
    <div className={styles.featureCard} style={{ transitionDelay: `${delay}ms` }}>
      <div className={styles.iconWrapper}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
