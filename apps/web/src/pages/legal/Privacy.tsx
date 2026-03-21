import { Helmet } from 'react-helmet-async'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

export function Privacy() {
    return (
        <DocsLayout>
            <Helmet>
                <title>Privacy Policy - Beacon</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
            <header className={`${styles.header} premium-hero-section`} style={{ padding: '64px 0', textAlign: 'left', background: 'transparent' }}>
                <h1 className="premium-hero-heading accent-text" style={{ fontSize: 48, marginBottom: 16 }}>Privacy Policy</h1>
                <p className="premium-hero-subtitle" style={{ margin: 0, fontSize: 16 }}>
                    Last updated: March 21, 2026 — Version 3.0.2
                </p>
            </header>

                <section>
                    <p>
                        At Beacon, privacy isn't just a feature—it's the core of our protocol. We are committed to transparency regarding the data we collect.
                    </p>
                </section>

                <section>
                    <h2>1. Data Collection</h2>
                    <p>
                        <strong>Identity:</strong> We collect your email and username to establish your node identity.
                    </p>
                    <p>
                        <strong>Metadata:</strong> To ensure performance, we process temporary metadata such as IP addresses for routing.
                    </p>
                </section>

                <section>
                    <h2>2. Encryption</h2>
                    <p>
                        Your messages are treated with the highest priority. We utilize industry-standard encryption for data at rest and in transit.
                    </p>
                </section>

                <section>
                    <h2>3. No-Sale Guarantee</h2>
                    <p>
                        Beacon does not, and will never, sell your personal data to third-party advertisers.
                    </p>
                </section>

                <section>
                    <h2>4. Right to Erasure</h2>
                    <p>
                        You have total control over your data. You may request account deletion at any time via the Settings panel.
                    </p>
                </section>

                <div className="premium-glass-card" style={{ padding: 24, marginTop: 48, border: '1px solid var(--beacon-brand-muted)' }}>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>Privacy Questions?</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Contact our privacy team at 
                        <a href="mailto:privacy@beacon-app.com" style={{ color: 'var(--beacon-brand)', marginLeft: 6 }}>privacy@beacon-app.com</a>
                    </p>
                </div>
            </article>
        </DocsLayout>
    )
}
