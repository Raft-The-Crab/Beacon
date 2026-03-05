import { Helmet } from 'react-helmet-async'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

export function Terms() {
    return (
        <DocsLayout>
            <Helmet>
                <title>Terms of Service - Beacon</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <h1 className="accent-text">Terms of Service</h1>
                <p className={styles.lead}>
                    Last updated: February 17, 2026
                </p>

                <section>
                    <p>
                        Greetings, user. By interacting with the Beacon ecosystem, you entering into a legally binding agreement. These Terms of Service ("Terms") govern your access to and use of the Beacon platform.
                    </p>
                </section>

                <section>
                    <h2>1. The Sovereign Protocol</h2>
                    <p>
                        Beacon is designed as a sovereign communication layer. By using this Service, you acknowledge that while we provide the interface, you are responsible for your own data security and interactions.
                    </p>
                </section>

                <section>
                    <h2>2. User Conduct</h2>
                    <p>
                        We maintain a standard of excellence. You agree not to:
                    </p>
                    <ul>
                        <li>Reverse engineer the proprietary Beacon engine.</li>
                        <li>Utilize automated scripts to interfere with gateway performance.</li>
                        <li>Distribute malware or conduct phishing operations.</li>
                        <li>Impersonate Beacon staff or authorized moderators.</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Intellectual Property</h2>
                    <p>
                        The "God-Tier" UI, mesh gradients, and underlying protocol logic are the exclusive intellectual property of the Beacon Development Group.
                    </p>
                </section>

                <section>
                    <h2>4. Service Availability</h2>
                    <p>
                        We strive for high uptime, but Service is provided "as is". Certain features, such as "Advanced Music Notes" and custom themes, may require a "Beacon Pro" subscription.
                    </p>
                </section>

                <div className={styles.infoBox}>
                    Contact our legal team at
                    <a href="mailto:legal@beacon-app.com" style={{ marginLeft: 4 }}>legal@beacon-app.com</a>.
                </div>
            </article>
        </DocsLayout>
    )
}
