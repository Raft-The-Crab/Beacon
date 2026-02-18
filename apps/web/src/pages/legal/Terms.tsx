import { Helmet } from 'react-helmet-async'
import { PolicyPage } from '../../components/layout/PolicyPage'

export function Terms() {
    return (
        <PolicyPage title="Terms of Service" lastUpdated="February 17, 2026">
            <Helmet>
                <title>Terms of Service - Beacon</title>
            </Helmet>

            <section>
                <p>
                    By accessing or using Beacon, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
                </p>
            </section>

            <section>
                <h2>1. Account Registration</h2>
                <p>
                    To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password.
                </p>
            </section>

            <section>
                <h2>2. User Content & Conduct</h2>
                <p>
                    You are solely responsible for all content that you post, upload, or otherwise transmit via the Service. You agree not to engage in any of the following prohibited activities:
                </p>
                <ul>
                    <li>Illegal or unauthorized use of the Service</li>
                    <li>Harassment, bullying, or intimidation of other users</li>
                    <li>Posting content that is defamatory, obscene, or promotes discrimination</li>
                    <li>Interfering with or disrupting the integrity or performance of the Service</li>
                    <li>Attempting to gain unauthorized access to the Service or related systems</li>
                </ul>
            </section>

            <section>
                <h2>3. Intellectual Property Rights</h2>
                <p>
                    The Service and its original content, features, and functionality are and will remain the exclusive property of Beacon and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Beacon.
                </p>
            </section>

            <section>
                <h2>4. Third-Party Links</h2>
                <p>
                    Our Service may contain links to third-party web sites or services that are not owned or controlled by Beacon. Beacon has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.
                </p>
            </section>

            <section>
                <h2>5. Termination</h2>
                <p>
                    We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
            </section>

            <section>
                <h2>6. Limitation of Liability</h2>
                <p>
                    In no event shall Beacon, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
            </section>

            <section>
                <h2>7. Governing Law</h2>
                <p>
                    These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which Beacon operates, without regard to its conflict of law provisions.
                </p>
            </section>

            <section>
                <h2>8. Changes to Terms</h2>
                <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                </p>
            </section>
        </PolicyPage>
    )
}
