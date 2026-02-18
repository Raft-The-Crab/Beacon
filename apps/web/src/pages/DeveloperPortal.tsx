import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Book, Rocket, Shield, Terminal, MoreVertical, Key, Activity, Code, ExternalLink } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { API_CONFIG } from '../config/api'
import { BotConsole } from '../components/dev/BotConsole'
import styles from './DeveloperPortal.module.css'

interface Application {
  id: string
  name: string
  description?: string
  ownerId: string
  bot?: {
    id: string
    token: string
  }
  createdAt: string
  icon?: string
}

export function DeveloperPortal() {
  const { show: showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isBotModalOpen, setIsBotModalOpen] = useState(false)

  const fetchApps = async () => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        setApps(data)
      } else {
        showToast(data.error || 'Failed to fetch applications', 'error')
      }
    } catch {
      showToast('Could not connect to the API. Is the server running?', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  const handleCreateApp = async () => {
    if (!newAppName.trim()) {
      showToast('Please enter an application name', 'error')
      return
    }

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newAppName })
      })
      const data = await res.json()
      if (res.ok) {
        setApps([...apps, data])
        setNewAppName('')
        setIsModalOpen(false)
        showToast(`${newAppName} created!`, 'success')
      } else {
        showToast(data.error || 'Failed to create application', 'error')
      }
    } catch {
      showToast('Failed to create application', 'error')
    }
  }

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Developer Portal - Beacon</title>
      </Helmet>

      <div className={styles.atmosGlow} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>Developer Portal</h1>
            <p>Build bots, integrations, and apps on Beacon. Create an application to get started.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statusIndicator}>
              <div className={styles.statusDot} />
              <span className={styles.statusText}>API: Online</span>
            </div>
            <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} />
              New Application
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats */}
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>My Apps</span>
            <div className={styles.metricValue}>
              {loading ? '—' : apps.length}
              <span className={styles.metricUnit}>total</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Active Bots</span>
            <div className={styles.metricValue}>
              {loading ? '—' : apps.filter(a => a.bot).length}
              <span className={styles.metricUnit}>online</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>API Status</span>
            <div className={styles.metricValue} style={{ color: 'var(--status-online)', fontSize: 18 }}>
              <Activity size={18} style={{ display: 'inline', marginRight: 6 }} />
              Operational
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className={styles.resourceGrid}>
          <ResourceCard
            icon={<Book size={24} />}
            title="Documentation"
            description="Guides, API reference, and examples"
            href="/docs"
          />
          <ResourceCard
            icon={<Code size={24} />}
            title="API Reference"
            description="Every endpoint, object, and event"
            href="/docs/api-reference"
          />
          <ResourceCard
            icon={<Shield size={24} />}
            title="Bot Policies"
            description="What bots can and can't do"
            href="/terms"
          />
        </section>

        {/* Applications */}
        <section className={styles.appsSection}>
          <div className={styles.sectionHeader}>
            <h2>My Applications</h2>
            <span>{apps.length} total</span>
          </div>

          <div className={styles.appsGrid}>
            {loading ? (
              <div className={styles.loading}>Loading your applications…</div>
            ) : (
              <>
                {apps.map(app => (
                  <div key={app.id} className={styles.appCard}>
                    <div className={styles.appIcon}>
                      {app.icon ? <img src={app.icon} alt="" /> : <Rocket size={24} />}
                    </div>
                    <div className={styles.appInfo}>
                      <h3>{app.name}</h3>
                      <p className={styles.appId}>ID: {app.id}</p>
                      {app.bot && (
                        <span style={{ fontSize: 12, color: 'var(--status-online)', fontWeight: 600 }}>
                          ● Bot enabled
                        </span>
                      )}
                    </div>
                    <div className={styles.appActions}>
                      <button
                        className={styles.botBtn}
                        onClick={() => { setSelectedApp(app); setIsBotModalOpen(true) }}
                        title="Manage Bot"
                      >
                        <Key size={18} />
                      </button>
                      <button className={styles.moreBtn} title="More options">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {apps.length === 0 && (
                  <div style={{
                    gridColumn: '1 / -1',
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--glass-border)',
                  }}>
                    <Rocket size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                      No apps yet
                    </p>
                    <p style={{ fontSize: 14, marginBottom: 20 }}>
                      Create your first application to get a bot token and start building.
                    </p>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                      <Plus size={16} /> Create Application
                    </Button>
                  </div>
                )}

                {apps.length > 0 && (
                  <button className={styles.addAppCard} onClick={() => setIsModalOpen(true)}>
                    <Plus size={24} />
                    <span>New App</span>
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* Quick Start */}
        <section className={styles.bottomSection}>
          <div className={styles.bottomCard}>
            <div className={styles.atmosGlow} />
            <Terminal size={32} className={styles.bottomIcon} />
            <div className={styles.bottomText}>
              <h3>Ready to build?</h3>
              <p>Check out the getting started guide to have a working bot in under 5 minutes.</p>
              <div className={styles.bottomActions}>
                <Button variant="secondary" size="sm" onClick={() => window.open('/docs/getting-started', '_blank')}>
                  <ExternalLink size={14} /> Getting Started
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open('/docs/api-reference', '_blank')}>
                  API Reference
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>B</div>
          <div className={styles.footerLinks}>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/contact">Support</a>
          </div>
        </div>
      </footer>

      {/* Create App Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Application"
      >
        <div className={styles.modalContent}>
          <p>Give your app a name. You can always change it later.</p>
          <Input
            label="Application Name"
            value={newAppName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAppName(e.currentTarget.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCreateApp()}
            placeholder="My Awesome Bot"
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateApp} disabled={!newAppName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Bot Management Modal */}
      <Modal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        title={selectedApp ? `${selectedApp.name} — Bot Settings` : 'Bot Settings'}
      >
        <div className={styles.modalContent} style={{ padding: 0 }}>
          {selectedApp && <BotConsole applicationId={selectedApp.id} />}
          <div className={styles.modalActions} style={{ padding: '16px' }}>
            <Button variant="secondary" onClick={() => setIsBotModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ResourceCard({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) {
  return (
    <a href={href} className={styles.resourceCard}>
      <div className={styles.resourceIcon}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</div>
      </div>
    </a>
  )
}
