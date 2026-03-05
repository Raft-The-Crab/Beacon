import { Helmet } from 'react-helmet-async'
import { PolicyPage } from '../components/layout/PolicyPage'

export function AboutUs() {
    return (
        <PolicyPage title="About Beacon" lastUpdated="February 16, 2026">
            <Helmet>
                <title>About Us - Beacon</title>
            </Helmet>

            <section>
                <p>
                    Beacon isn't just a messaging app; it's a statement. Born from the need for a truly sovereign, de-centralized, and high-performance communication layer, Beacon represents the next evolution in digital interaction.
                </p>
            </section>

            <section>
                <h2>Our Vision</h2>
                <p>
                    We believe that communication is a fundamental human right. Our vision is to provide the infrastructure where privacy is the default, not an option. We are building a world where your data remains yours, protected by the "Sovereign Protocol"—a custom engine designed for absolute security and sub-100ms global latency.
                </p>
            </section>

            <section>
                <h2>The Beacon Core</h2>
                <p>
                    Driven by the Raft-The-Crab collective, our team consists of elite architects and designers focused on one goal: visual and technical perfection. We don't just write code; we craft experiences.
                </p>
            </section>

            <section>
                <h2>Engine Specifications</h2>
                <p>
                    Beacon is powered by a proprietary stack optimized for "God-Tier" performance:
                </p>
                <ul>
                    <li><strong>Aesthetic:</strong> Glassmorphism 2.0 with mesh shaders and floating orbital orbs.</li>
                    <li><strong>Audio:</strong> Native Opus integration with spatial awareness.</li>
                    <li><strong>Backend:</strong> A 3-way split architecture (Azure/Railway/Render) for extreme redundancy.</li>
                    <li><strong>Intelligence:</strong> An AI-first framework for seamless bot integration.</li>
                </ul>
            </section>
        </PolicyPage>
    )
}
