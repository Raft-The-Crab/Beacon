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
                <h1 className="accent-text">Beacon Software License</h1>
                <p className={styles.lead}>
                    Standard Licensing Agreement for the Beacon Platform and associated SDKs.
                </p>

                <section>
                    <h2>MIT License</h2>
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
