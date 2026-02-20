import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Book, Rocket, Terminal, MoreVertical, Key, Activity, Layout, Database, Layers, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { API_CONFIG } from '../config/api'
import { BotConsole } from '../components/dev/BotConsole'
import { ComponentShowcase } from '../components/dev/ComponentShowcase'
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout'
import { Tooltip } from '../components/ui'
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

type Tab = 'apps' | 'showcase'

export function DeveloperPortal() {
  const { show: showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('apps')
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

  const sidebar = (
    <div className={styles.sidebarContent}>
      <div className={styles.sidebarHeader}>
        <Terminal size={20} className={styles.sidebarIcon} />
        <span>DEVELOPER</span>
      </div>

      <div className={styles.navGroup}>
        <div className={styles.navGroupLabel}>BUILD</div>
        <button
          className={`${styles.navItem} ${activeTab === 'apps' ? styles.active : ''}`}
          onClick={() => setActiveTab('apps')}
        >
          <Rocket size={18} />
          <span>Applications</span>
        </button>
        <button
          className={`${styles.navItem} ${activeTab === 'showcase' ? styles.active : ''}`}
          onClick={() => setActiveTab('showcase')}
        >
          <Zap size={18} />
          <span>SDK Showcase</span>
        </button>
        <button className={styles.navItem} onClick={() => window.open('/docs', '_blank')}>
          <Book size={18} />
          <span>Documentation</span>
        </button>
      </div>

      <div className={styles.navGroup}>
        <div className={styles.navGroupLabel}>RESOURCES</div>
        <button className={styles.navItem}>
          <Layers size={18} />
          <span>SDKs & Libraries</span>
        </button>
        <button className={styles.navItem}>
          <Database size={18} />
          <span>API Reference</span>
        </button>
        <button className={styles.navItem}>
          <Layout size={18} />
          <span>App Directory</span>
        </button>
      </div>

      <div className={styles.newAppCta}>
        <Tooltip content="Launch a new integration" position="top">
          <Button variant="primary" fullWidth onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Application
          </Button>
        </Tooltip>
      </div>
    </div>
  )

  const rightPanel = activeTab === 'apps' ? (
    <div className={styles.metricsPanel}>
      <h3 className={styles.panelTitle}>API Status</h3>
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <Activity size={18} style={{ color: 'var(--status-online)' }} />
          <span>Operational</span>
        </div>
        <div className={styles.statusDetails}>
          All systems are performing normally.
          <br />99.99% uptime this month.
        </div>
      </div>

      <h3 className={styles.panelTitle} style={{ marginTop: 32 }}>Metrics</h3>
      <div className={styles.miniStats}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{apps.length}</div>
          <div className={styles.miniStatLabel}>Applications</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{apps.filter(a => a.bot).length}</div>
          <div className={styles.miniStatLabel}>Active Bots</div>
        </div>
      </div>
    </div>
  ) : (
    <div className={styles.metricsPanel}>
      <h3 className={styles.panelTitle}>Quick Stats</h3>
      <div className={styles.miniStats}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>13</div>
          <div className={styles.miniStatLabel}>SDK Builders</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>v2.4</div>
          <div className={styles.miniStatLabel}>Latest SDK</div>
        </div>
      </div>
      <p style={{ marginTop: 32, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        The Beacon SDK Component Showcase allows you to preview interactive elements before implementing them in your code.
      </p>
    </div>
  )

  return (
    <WorkspaceLayout sidebar={sidebar} rightPanel={rightPanel}>
      <Helmet>
        <title>Developer Portal - Beacon</title>
      </Helmet>

      {activeTab === 'apps' ? (
        <div className={`${styles.contentWrapper} mesh-gradient vista-transition`}>
          <div className="floating-orb" style={{ top: '5%', left: '20%', width: '350px', height: '350px', background: 'var(--beacon-brand)', opacity: 0.15 }} />

          <div className={styles.heroSection}>
            <h1 className={styles.title}>Developer Portal</h1>
            <p className={styles.subtitle}>Build the next generation of social apps on the world's most open messaging platform.</p>
          </div>

          <section className={styles.appsSection}>
            <div className={styles.appsHeader}>
              <h2>My Applications</h2>
              <div className={styles.appCount}>{apps.length}</div>
            </div>

            <div className={styles.appsGrid}>
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                  <span>Syncing Applications...</span>
                </div>
              ) : (
                <>
                  {apps.map(app => (
                    <div key={app.id} className={styles.appCard}>
                      <div className={styles.appBanner} />
                      <div className={styles.appCardContent}>
                        <div className={styles.appIcon}>
                          {app.icon ? <img src={app.icon} alt="" /> : <Rocket size={24} />}
                        </div>
                        <div className={styles.appInfo}>
                          <h3>{app.name}</h3>
                          <p className={styles.appId}>ID: {app.id}</p>
                          {app.bot && (
                            <div className={styles.botBadge}>
                              <div className={styles.botDot} />
                              <span>Bot Enabled</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.appActions}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSelectedApp(app); setIsBotModalOpen(true) }}
                          >
                            <Key size={14} /> Manage
                          </Button>
                          <button className={styles.moreBtn}>
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {apps.length === 0 && (
                    <div className={styles.emptyApps}>
                      <Rocket size={48} className={styles.emptyIcon} />
                      <h3>No applications found</h3>
                      <p>Create your first application to get access to the Beacon API and WebSocket Gateway.</p>
                      <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} /> Create Application
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className={styles.quickStartSection}>
            <div className={styles.quickStartCard}>
              <Terminal size={32} />
              <div className={styles.quickStartText}>
                <h3>Ready to build?</h3>
                <p>Learn how to connect to the Gateway and send your first message in 5 minutes.</p>
                <div className={styles.quickStartActions}>
                  <Button variant="secondary" size="sm" onClick={() => window.open('/docs/getting-started', '_blank')}>
                    Getting Started
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <ComponentShowcase />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Application"
      >
        <div className={styles.modalContent}>
          <p className={styles.modalDesc}>Give your application a name. This is how users will see your integration.</p>
          <Input
            label="APPLICATION NAME"
            value={newAppName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAppName(e.currentTarget.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCreateApp()}
            placeholder="e.g. My Awesome Bot"
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateApp} disabled={!newAppName.trim()}>Create Application</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        title={selectedApp ? `${selectedApp.name} — Bot Settings` : 'Bot Settings'}
        size="lg"
      >
        <div className={styles.botModalContent}>
          {selectedApp && <BotConsole applicationId={selectedApp.id} />}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setIsBotModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </WorkspaceLayout>
  )
}

