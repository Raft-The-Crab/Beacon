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
                    Beacon was born from a simple idea: that digital communication should be as natural and fluid as a face-to-face conversation, yet powerful enough to span the globe.
                </p>
            </section>

            <section>
                <h2>Our Mission</h2>
                <p>
                    Our mission is to build reliable communication infrastructure that is easy to use and secure. We believe that when people can talk freely and securely, it strengthens communities and fosters collaboration.
                </p>
            </section>

            <section>
                <h2>The Team</h2>
                <p>
                    We are a distributed team of engineers and designers based globally. We work to ensure Beacon remains a stable and reliable tool for communication.
                </p>
            </section>

            <section>
                <h2>Our Technology</h2>
                <p>
                    Built on cutting-edge technologies like React, Node.js, and high-performance WebSockets, Beacon is engineered for speed. Our infrastructure is designed to handle millions of simultaneous connections with sub-100ms latency.
                </p>
            </section>
        </PolicyPage>
    )
}
