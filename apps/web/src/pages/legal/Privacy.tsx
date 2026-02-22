import { Helmet } from 'react-helmet-async'
import { PolicyPage } from '../../components/layout/PolicyPage'

export function Privacy() {
    return (
        <PolicyPage title="Privacy Policy" lastUpdated="February 17, 2026">
            <Helmet>
                <title>Privacy Policy - Beacon</title>
            </Helmet>

            <section>
                <p>
                    At Beacon, privacy isn't just a feature—it's the core of our protocol. We are committed to transparency regarding the data we collect and how we utilize it to power your communication experience.
                </p>
            </section>

            <section>
                <h2>1. Data Collection Protocol</h2>
                <p>
                    <strong>Identity:</strong> We collect your email address and username to establish your node identity.
                </p>
                <p>
                    <strong>Metadata:</strong> To ensure high-performance delivery, we process temporary metadata such as IP addresses for latency routing. This is purged periodically.
                </p>
                <p>
                    <strong>Music Analytics:</strong> If you use "Music Status Pro", we may temporarily cache track metadata (Title/Artist) to improve loading speeds for other users viewing your profile.
                </p>
            </section>

            <section>
                <h2>2. Advanced Encryption</h2>
                <p>
                    Your messages are treated with the highest priority. We utilize industry-standard encryption for data at rest and in transit. Private communications remain private.
                </p>
            </section>

            <section>
                <h2>3. No-Sale Guarantee</h2>
                <p>
                    Beacon does not, and will never, sell your personal data to third-party advertisers. Our business model is based on premium features (Beacon Pro), not on the exploitation of user information.
                </p>
            </section>

            <section>
                <h2>4. Third-Party Integrations</h2>
                <p>
                    When you link a Spotify or YouTube account for music status, we interact with their respective APIs. These interactions are governed by their privacy policies. We only request the minimum data necessary for the feature.
                </p>
            </section>

            <section>
                <h2>5. Right to Erasure</h2>
                <p>
                    You have total control over your data. You may request account deletion at any time via the Settings panel, which will trigger a cascade purge of your associated data from our active clusters.
                </p>
            </section>

            <section>
                <h2>6. Security Incident Protocol</h2>
                <p>
                    In the unlikely event of a security breach, we maintain a rapid-response team to mitigate risks and notify affected users within 72 hours of verification.
                </p>
            </section>
        </PolicyPage>
    )
}
