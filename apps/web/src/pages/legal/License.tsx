import { Helmet } from 'react-helmet-async'
import { DocsLayout } from '../../components/layout/DocsLayout'
import styles from '../../styles/modules/pages/DocsPage.module.css'

export function License() {
    const currentYear = new Date().getFullYear()

    return (
        <DocsLayout>
            <Helmet>
                <title>License - Beacon</title>
            </Helmet>

            <article className={`${styles.article} animate-fadeIn`}>
                <header className={`${styles.header} premium-hero-section`} style={{ padding: '64px 0', textAlign: 'left', background: 'transparent' }}>
                    <h1 className="premium-hero-heading accent-text" style={{ fontSize: 48, marginBottom: 16 }}>Beacon Licensing</h1>
                    <p className="premium-hero-subtitle" style={{ margin: 0, fontSize: 16 }}>
                        Version 2.2 — Proprietary Chat Application & MIT Licensed SDKs
                    </p>
                </header>
                
                <section>
                    <h2>1. Beacon Chat Application</h2>
                    <p>
                        The Beacon Chat Application (including the web client, desktop client, and mobile apps)
                        is <strong>Proprietary Software</strong>. All rights are reserved by Beacon Platform. 
                        Users are granted a non-exclusive, non-transferable license to use the application 
                        for personal or commercial communication through our official services.
                    </p>
                    <p>
                        You may not decompile, reverse engineer, or redistribute the source code of the 
                        application without explicit written consent.
                    </p>
                </section>

                <section>
                    <h2>2. Beacon SDKs & Open Source</h2>
                    <p>
                        The official Beacon SDKs, including <code>beacon-sdk</code> and associated helper
                        libraries, are licensed under the <strong>MIT License</strong> to encourage 
                        developer innovation and ecosystem growth.
                    </p>
                </section>

                <section>
                    <h3>MIT License (SDKs)</h3>
                    <p>Copyright (c) {currentYear} Beacon Platform</p>

                    <p>
                        Permission is hereby granted, free of charge, to any person obtaining a copy
                        of this software and associated documentation files (the "Software"), to deal
                        in the Software without restriction, including without limitation the rights
                        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                        copies of the Software, and to permit persons to whom the Software is
                        furnished to do so, subject to the following conditions:
                    </p>

                    <p>
                        The above copyright notice and this permission notice shall be included in all
                        copies or substantial portions of the Software.
                    </p>

                    <p style={{ fontWeight: 600, marginTop: 24 }}>
                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                        SOFTWARE.
                    </p>
                </section>

                <section>
                    <h2>Brand Usage</h2>
                    <p>
                        While the SDK is licensed under MIT, the "Beacon" name, logo, and associated brands
                        are trademarks of Beacon Platform. Use of these marks requires explicit written
                        permission or must follow our Brand Guidelines.
                    </p>
                </section>

                <div className={styles.infoBox}>
                    For commercial inquiries or custom licensing, please contact
                    <a href="mailto:legal@beacon-app.com" style={{ marginLeft: 4 }}>legal@beacon-app.com</a>.
                </div>
            </article>
        </DocsLayout>
    )
}
