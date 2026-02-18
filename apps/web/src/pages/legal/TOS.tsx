import { Helmet } from 'react-helmet-async'
import { PolicyPage } from '../../components/layout/PolicyPage'

export function TOS() {
    return (
        <PolicyPage title="Community Guidelines" lastUpdated="February 17, 2026">
            <Helmet>
                <title>Community Guidelines - Beacon</title>
            </Helmet>

            <section>
                <p>
                    Beacon is a place for everyone to build community and connect. To keep our platform safe and enjoyable, we expect all users to follow these Community Guidelines.
                </p>
            </section>

            <section>
                <h2>1. Be Respectful</h2>
                <p>
                    Treat others with kindness and respect. We do not tolerate harassment, hate speech, or content that promotes violence or discrimination against individuals or groups based on race, religion, gender, or orientation.
                </p>
            </section>

            <section>
                <h2>2. No Illegal Content</h2>
                <p>
                    Do not use Beacon to share illegal content or coordinate illegal activities. This includes, but is not limited to, child sexual abuse material (CSAM), promotion of self-harm, and distribution of malware.
                </p>
            </section>

            <section>
                <h2>3. Respect Intellectual Property</h2>
                <p>
                    Only share content that you have the right to share. Respect the copyrights and trademarks of others.
                </p>
            </section>

            <section>
                <h2>4. Stay Secure</h2>
                <p>
                    Do not attempt to compromise the security of Beacon or its users. This includes phishing, account hijacking, and distributing viruses or other harmful code.
                </p>
            </section>

            <section>
                <h2>5. Reporting and Enforcement</h2>
                <p>
                    If you see something that violates these guidelines, please report it using the in-app reporting features or by emailing <strong>safety@beacon.chat</strong>. We investigate all reports and take appropriate action, which may include content removal or account suspension.
                </p>
            </section>

            <section>
                <p style={{ marginTop: 'var(--space-2xl)', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    These guidelines are part of our <a href="/terms">Terms of Service</a>. Failure to follow them may result in permanent loss of access to Beacon.
                </p>
            </section>
        </PolicyPage>
    )
}
