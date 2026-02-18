import { Helmet } from 'react-helmet-async'
import { PolicyPage } from '../components/layout/PolicyPage'
import { Mail, MessageSquare, Globe } from 'lucide-react'
import styles from './Contact.module.css'

export function Contact() {
    return (
        <PolicyPage title="Contact Us" lastUpdated="February 16, 2026">
            <Helmet>
                <title>Contact Us - Beacon</title>
            </Helmet>

            <section>
                <p>
                    Need help? Have feedback? We'd love to hear from you. The Beacon team is committed to providing the best support in the industry.
                </p>
            </section>

            <section>
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.iconWrapper} style={{ color: 'var(--beacon-brand)' }}><Mail size={32} /></div>
                        <h3>Email Support</h3>
                        <p>For general inquiries and technical support.</p>
                        <span className={styles.contactValue}>support@beacon.app</span>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.iconWrapper} style={{ color: 'var(--accent-green)' }}><MessageSquare size={32} /></div>
                        <h3>Community</h3>
                        <p>Join our Beacon server for real-time help.</p>
                        <span className={styles.contactValue}>beacon.app/community</span>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.iconWrapper} style={{ color: '#a855f7' }}><Globe size={32} /></div>
                        <h3>Press</h3>
                        <p>For media inquiries and brand assets.</p>
                        <span className={styles.contactValue}>press@beacon.app</span>
                    </div>
                </div>
            </section>

            <section style={{ marginTop: '4rem' }}>
                <h2>Business Address</h2>
                <div className={styles.addressBox}>
                    <p>
                        <strong>Beacon International Inc.</strong><br />
                        123 Communication Way, Suite 404<br />
                        San Francisco, CA 94103<br />
                        United States
                    </p>
                </div>
            </section>
        </PolicyPage>
    )
}
