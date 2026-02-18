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
                    Beacon ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Beacon.
                </p>
            </section>

            <section>
                <h2>1. Information Collection</h2>
                <p>
                    <strong>Personal Data:</strong> We collect information that you provide directly to us when you create an account, such as your email address, username, and password.
                </p>
                <p>
                    <strong>Message Content:</strong> We process and store the messages, images, and other content you transmit through the platform to provide the service and features like message history and search.
                </p>
                <p>
                    <strong>Technical Data:</strong> We automatically collect certain information when you visit, use, or navigate the platform. This includes IP address, device identifiers, browser type, and usage patterns.
                </p>
            </section>

            <section>
                <h2>2. Use of Information</h2>
                <p>We use the information we collect for various purposes, including:</p>
                <ul>
                    <li>To provide, operate, and maintain our platform</li>
                    <li>To improve, personalize, and expand our platform</li>
                    <li>To understand and analyze how you use our platform</li>
                    <li>To develop new products, services, features, and functionality</li>
                    <li>To communicate with you, either directly or through one of our partners</li>
                    <li>To find and prevent fraud and abuse</li>
                </ul>
            </section>

            <section>
                <h2>3. Data Sharing and Disclosure</h2>
                <p>
                    We do not sell your personal data. We may share information with third-party service providers that perform services for us, such as hosting providers, customer support tools, and analytics services, but only to the extent necessary for them to provide those services.
                </p>
            </section>

            <section>
                <h2>4. Data Security</h2>
                <p>
                    We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
                </p>
            </section>

            <section>
                <h2>5. Data Retention</h2>
                <p>
                    We retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations and resolve disputes.
                </p>
            </section>

            <section>
                <h2>6. Your Privacy Rights</h2>
                <p>
                    Depending on your location, you may have certain rights regarding your personal data, including the right to access, correct, or delete your data. You can manage your account settings and data exports directly within the Beacon application.
                </p>
            </section>

            <section>
                <h2>7. Contact Information</h2>
                <p>
                    If you have questions or comments about this policy, you may contact our Data Protection Officer at <strong>privacy@beacon.chat</strong>.
                </p>
            </section>
        </PolicyPage>
    )
}
