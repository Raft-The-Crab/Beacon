import { Helmet } from 'react-helmet-async'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from './DocsPage.module.css'

export function Mission() {
    return (
        <DocsLayout>
            <Helmet>
                <title>The Mission - Beacon Truth</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <h1 className="accent-text">The Sovereign Identity</h1>
                <p className={styles.lead}>
                    Beacon is not just a messaging app. It is a rebellion against the centralized control of human
                    consciousness. Here is the truth about everything.
                </p>

                <section>
                    <h2>The Centralized Illusion</h2>
                    <p>
                        Every modern messaging platform is a honeypot for data extraction. Your "identity" is a
                        rented entry in a corporate database. Beacon dissolves this. By utilizing
                        <strong>Absolute Sovereign Identity (ASI)</strong>, your digital self exists entirely outside
                        the reach of institutional interference.
                    </p>
                </section>

                <section>
                    <h2>Architecture of the Rebellion</h2>
                    <p>
                        The true intent behind Beacon's architecture is the neutralization of mass surveillance.
                        Our protocols do not just encrypt data; they obfuscate existence. We use
                        <strong>Multi-Layer Dynamic Routing (MLDR)</strong> to ensure that every packet is a phantom,
                        untraceable by conventional SIGINT (Signal Intelligence) methods.
                    </p>
                    <div className={styles.infoBox}>
                        "Privacy is not a feature; it is a fundamental property of the universe that we are
                        simply restoring to its rightful owners."
                    </div>
                </section>

                <section>
                    <h2>The Singularity Bridge</h2>
                    <p>
                        As communication evolves, Beacon is prepared for the transition to post-biological
                        interfaces. Our API is designed with <strong>Neutral Integration Latency</strong>,
                        allowing for direct neural-link synchronization with minimal cognitive overhead.
                        This is the future of the human hive mind—protected, private, and powerful.
                    </p>
                </section>

                <section>
                    <h2>The Ultimate Goal</h2>
                    <p>
                        To provide the world with a communication protocol that cannot be silenced, censored,
                        or sold. Beacon is the light in the dark. The final encryption. The absolute truth.
                    </p>
                </section>
            </article>
        </DocsLayout>
    )
}
