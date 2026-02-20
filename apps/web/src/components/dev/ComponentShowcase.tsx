import { useState } from 'react'
import { Code, Eye, Layers, Type, CreditCard, List, Layout, Activity, Zap } from 'lucide-react'
import { Button } from '../ui/Button'
import styles from './ComponentShowcase.module.css'

// Mocking some behavior similar to the SDK builders for the preview
const builders = [
    { id: 'embed', name: 'Embed Builder', icon: <CreditCard size={18} />, description: 'Rich content with images, fields, and footers.' },
    { id: 'button', name: 'Button Builder', icon: <Layers size={18} />, description: 'Interactive components for messages.' },
    { id: 'dropdown', name: 'Dropdown Builder', icon: <List size={18} />, description: 'Select menus for complex user input.' },
    { id: 'form', name: 'Form Builder', icon: <Type size={18} />, description: 'Standardized forms for application data.' },
    { id: 'timeline', name: 'Timeline Builder', icon: <Activity size={18} />, description: 'Dynamic event tracking and visualization.' }
]

export function ComponentShowcase() {
    const [selectedBuilder, setSelectedBuilder] = useState(builders[0])
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')

    return (
        <div className={styles.showcase}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>SDK BUILDERS</div>
                <div className={styles.builderList}>
                    {builders.map(builder => (
                        <button
                            key={builder.id}
                            className={`${styles.builderItem} ${selectedBuilder.id === builder.id ? styles.active : ''}`}
                            onClick={() => setSelectedBuilder(builder)}
                        >
                            {builder.icon}
                            <span>{builder.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.content}>
                <header className={styles.contentHeader}>
                    <div className={styles.headerInfo}>
                        <div className={styles.builderIcon}>{selectedBuilder.icon}</div>
                        <div>
                            <h2>{selectedBuilder.name}</h2>
                            <p>{selectedBuilder.description}</p>
                        </div>
                    </div>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === 'preview' ? styles.toggleActive : ''}`}
                            onClick={() => setViewMode('preview')}
                        >
                            <Eye size={16} /> Preview
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === 'code' ? styles.toggleActive : ''}`}
                            onClick={() => setViewMode('code')}
                        >
                            <Code size={16} /> JSON
                        </button>
                    </div>
                </header>

                <div className={styles.viewport}>
                    {viewMode === 'preview' ? (
                        <div className={styles.previewArea}>
                            <div className={styles.previewContainer}>
                                {selectedBuilder.id === 'embed' && (
                                    <div className={styles.mockEmbed}>
                                        <div className={styles.embedColor} />
                                        <div className={styles.embedContent}>
                                            <div className={styles.embedAuthor}>Beacon SDK</div>
                                            <div className={styles.embedTitle}>New Message from Gateway</div>
                                            <div className={styles.embedDesc}>
                                                The SDK allows you to construct complex, rich embeds with multiple fields,
                                                images, and custom formatting.
                                            </div>
                                            <div className={styles.embedFields}>
                                                <div className={styles.field}>
                                                    <div className={styles.fieldName}>RESOURCES</div>
                                                    <div className={styles.fieldValue}>99.9% Connectivity</div>
                                                </div>
                                                <div className={styles.field}>
                                                    <div className={styles.fieldName}>LATENCY</div>
                                                    <div className={styles.fieldValue}>12ms (avg)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedBuilder.id === 'button' && (
                                    <div className={styles.mockButtons}>
                                        <Button variant="primary">Accept Integration</Button>
                                        <Button variant="secondary">Decline</Button>
                                        <Button variant="ghost">Learn More</Button>
                                    </div>
                                )}

                                {selectedBuilder.id === 'dropdown' && (
                                    <div className={styles.mockDropdown}>
                                        <div className={styles.dropdownHeader}>Select an Environment</div>
                                        <div className={styles.dropdownOption}>
                                            <Zap size={14} style={{ color: 'var(--status-online)' }} />
                                            <span>Production (us-east-1)</span>
                                        </div>
                                        <div className={styles.dropdownOption}>
                                            <Activity size={14} style={{ color: 'var(--status-warning)' }} />
                                            <span>Staging (eu-central-1)</span>
                                        </div>
                                    </div>
                                )}

                                {(selectedBuilder.id === 'form' || selectedBuilder.id === 'timeline') && (
                                    <div className={styles.placeholderPreview}>
                                        <Layout size={48} className={styles.placeholderIcon} />
                                        <h3>Preview not available</h3>
                                        <p>This component requires a live socket connection to render in real-time.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.codeArea}>
                            <pre className={styles.code}>
                                {`{
  "type": "component",
  "builder": "${selectedBuilder.id}",
  "id": "sdk_${selectedBuilder.id}_${Math.random().toString(36).substr(2, 9)}",
  "content": {
    "title": "Generated from Beacon-JS SDK",
    "timestamp": "${new Date().toISOString()}",
    "version": "2.4.0-stable"
  }
}`}
                            </pre>
                        </div>
                    )}
                </div>

                <footer className={styles.contentFooter}>
                    <Button variant="secondary" onClick={() => window.open('/docs/sdk/builders', '_blank')}>
                        View SDK Docs
                    </Button>
                    <Button variant="primary">
                        Copy Code
                    </Button>
                </footer>
            </div>
        </div>
    )
}
