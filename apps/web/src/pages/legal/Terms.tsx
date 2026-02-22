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
                    Greetings, user. By interacting with the Beacon ecosystem, you entering into a legally binding agreement. These Terms of Service ("Terms") govern your access to and use of the Beacon platform, including our website, APIs, and applications (the "Service").
                </p>
            </section>

            <section>
                <h2>1. The Sovereign Protocol</h2>
                <p>
                    Beacon is designed as a sovereign communication layer. By using this Service, you acknowledge that while we provide the interface, you are responsible for your own data security and interactions. You must be at least 13 years old to create an account.
                </p>
            </section>

            <section>
                <h2>2. Advanced User Conduct</h2>
                <p>
                    We maintain a standard of excellence. You agree not to:
                </p>
                <ul>
                    <li>Reverse engineer the proprietary Beacon engine.</li>
                    <li>Utilize automated scripts to scrape user data or interfere with gateway performance.</li>
                    <li>Distribute malware or conduct phishing operations within the ecosystem.</li>
                    <li>Impersonate Beacon staff or authorized moderators.</li>
                </ul>
            </section>

            <section>
                <h2>3. Intellectual Property</h2>
                <p>
                    The "God-Tier" UI, mesh gradients, custom shaders, and underlying protocol logic are the exclusive intellectual property of the Beacon Development Group. Unauthorized reproduction of our aesthetic or codebase is strictly prohibited.
                </p>
            </section>

            <section>
                <h2>4. Service Availability & "Pro" Features</h2>
                <p>
                    We strive for 99.9% uptime, but Service is provided "as is". Certain features, such as "Advanced Music Notes" and custom themes, may require a "Beacon Pro" subscription. These are governed by our billing policy.
                </p>
            </section>

            <section>
                <h2>5. Disclaimer of Warranties</h2>
                <p>
                    Beacon is provided without any warranties, express or implied. We do not guarantee that the platform will meet your requirements or that it will be uninterrupted, timely, secure, or error-free.
                </p>
            </section>

            <section>
                <h2>6. Termination of Access</h2>
                <p>
                    We reserve the right to terminate access to any node or user account that violates these terms or poses a threat to the stability of the platform, without prior notice.
                </p>
            </section>
        </PolicyPage>
    )
}
