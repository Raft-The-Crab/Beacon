import { Helmet } from 'react-helmet-async'
import { Compass } from 'lucide-react'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

export function Mission() {
    return (
        <DocsLayout>
            <Helmet>
                <title>The Mission - Beacon Truth</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <header className={`${styles.header}`} style={{ padding: '64px 0', textAlign: 'left', background: 'transparent' }}>
                    <h1 style={{ fontSize: 48, color: 'var(--beacon-brand)' }}>Our Mission</h1>
                    <p style={{ margin: 0, fontSize: 18, color: 'var(--text-muted)' }}>
                        Building the future of secure, private, and open communication for everyone.
                    </p>
                </header>

                <section>
                    <h2>Privacy First</h2>
                    <p>
                        We believe that privacy is a fundamental human right. Beacon is built from the ground up 
                        to ensure that your conversations remain yours alone. No data mining, no tracking, 
                        and no compromises.
                    </p>
                </section>

                <section>
                    <h2>Secure by Design</h2>
                    <p>
                        Our platform uses industry-leading encryption and decentralized principles to protect 
                        your identity and your data. We don't just secure your messages; we protect your 
                        digital footprint.
                    </p>
                </section>

                <section>
                    <h2>Open Communication</h2>
                    <p>
                        Beacon is designed to be an open platform where communities can thrive without 
                        fear of censorship or surveillance. We provide the tools for you to connect, 
                        collaborate, and communicate freely.
                    </p>
                </section>

                <section>
                    <h2>Our Goal</h2>
                    <p>
                        To provide a reliable, beautiful, and secure ecosystem for global communication. 
                        Beacon is a place for everyone to feel safe and connected.
                    </p>
                </section>
            </article>
        </DocsLayout>
    )
}
