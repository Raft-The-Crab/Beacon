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
                <h1 className="accent-text">Privacy Policy</h1>
                <p className={styles.lead}>
                    Last updated: February 17, 2026
                </p>

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

                <div className={styles.infoBox}>
                    For privacy concerns, reach out to
                    <a href="mailto:privacy@beacon-app.com" style={{ marginLeft: 4 }}>privacy@beacon-app.com</a>.
                </div>
            </article>
        </DocsLayout>
    )
}
