import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Book, Rocket, Terminal, Trash2, Activity, Database, Zap, BarChart3, Clock, Cpu, Server, Globe, Layers } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { BotConsole } from '../components/dev/BotConsole'
import { ComponentShowcase } from '../components/dev/ComponentShowcase'
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout'
import { apiClient } from '../services/apiClient'
// Tooltip removed as it was unused
import styles from '../styles/modules/pages/DeveloperPortal.module.css'

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

type Tab = 'apps' | 'analytics' | 'status' | 'showcase'

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
      const { success, data } = await apiClient.request('GET', '/applications')
      if (success && data) {
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
      const { success, data } = await apiClient.request('POST', '/applications', { name: newAppName })
      if (success && data) {
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
        <Terminal size={18} className={styles.sidebarIcon} />
        <span>DEVELOPER HUB</span>
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
          className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          <span>Analytics</span>
        </button>
        <button
          className={`${styles.navItem} ${activeTab === 'status' ? styles.active : ''}`}
          onClick={() => setActiveTab('status')}
        >
          <Activity size={18} />
          <span>System Status</span>
        </button>
        <button
          className={`${styles.navItem} ${activeTab === 'showcase' ? styles.active : ''}`}
          onClick={() => setActiveTab('showcase')}
        >
          <Zap size={18} />
          <span>SDK Showcase</span>
        </button>
      </div>

      <div className={styles.navGroup}>
        <div className={styles.navGroupLabel}>RESOURCES</div>
        <button className={styles.navItem} onClick={() => window.open('/docs', '_blank')}>
          <Book size={18} />
          <span>Documentation</span>
        </button>
        <button className={styles.navItem}>
          <Layers size={18} />
          <span>SDKs & Libraries</span>
        </button>
        <button className={styles.navItem}>
          <Database size={18} />
          <span>API Reference</span>
        </button>
      </div>

      <div className={styles.newAppCta}>
        <Button variant="primary" fullWidth onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> New Application
        </Button>
      </div>
    </div>
  )

  const rightPanel = (
    <div className={styles.metricsPanel}>
      <h3 className={styles.panelTitle}>Platform Health</h3>
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <Activity size={18} style={{ color: '#2ea043' }} />
          <span>Operational</span>
        </div>
        <div className={styles.statusDetails}>
          All systems are performing normally.
          <br />99.98% global uptime.
        </div>
      </div>

      <div className={styles.miniStats} style={{ marginTop: 24 }}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{apps.length}</div>
          <div className={styles.miniStatLabel}>Apps</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>12ms</div>
          <div className={styles.miniStatLabel}>Avg Latency</div>
        </div>
      </div>
    </div>
  )

  return (
    <WorkspaceLayout sidebar={sidebar} rightPanel={rightPanel}>
      <Helmet>
        <title>Developer Portal - Beacon</title>
      </Helmet>

      <div className={`${styles.contentWrapper} animate-fadeIn`}>
        {activeTab === 'apps' && (
          <>
            <div className={styles.heroSection}>
              <h1 className={styles.title}>Developer Portal</h1>
              <p className={styles.subtitle}>Build, manage, and scale your integrations on the Beacon platform.</p>
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
                    <span>Syncing your workbench...</span>
                  </div>
                ) : (
                  <>
                    {apps.map(app => (
                      <div key={app.id} className={styles.appCard} onClick={() => { setSelectedApp(app); setIsBotModalOpen(true) }}>
                        <div className={styles.appBanner} />
                        <div className={styles.appCardContent}>
                          <div className={styles.appIcon}>
                            {app.icon ? <img src={app.icon} alt="" /> : <Rocket size={24} />}
                          </div>
                          <div className={styles.appInfo}>
                            <h3>{app.name}</h3>
                            <p className={styles.appId}>{app.id}</p>
                            {app.bot && (
                              <div className={styles.botBadge}>
                                <div className={styles.botDot} />
                                <span>Bot Active</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.appActions}>
                            <button className={styles.moreBtn} title="Delete Application" onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Delete this application? This will permanently remove all associated bots.')) {
                                try {
                                  await apiClient.request('DELETE', `/applications/${app.id}`)
                                  setApps(apps.filter(a => a.id !== app.id))
                                  showToast(`${app.name} deleted`, 'success')
                                } catch {
                                  showToast('Failed to delete application', 'error')
                                }
                              }
                            }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}


                  </>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fadeIn">
            <div className={styles.heroSection}>
              <h1 className={styles.title}>Analytics</h1>
              <p className={styles.subtitle}>Real-time performance metrics and API usage data across your applications.</p>
            </div>

            <div className={styles.miniStats} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 32 }}>
              <div className={styles.miniStatCard}>
                <div className={styles.miniStatValue}>1.2M</div>
                <div className={styles.miniStatLabel}>Total Requests</div>
              </div>
              <div className={styles.miniStatCard}>
                <div className={styles.miniStatValue}>42.5 GB</div>
                <div className={styles.miniStatLabel}>Data Transferred</div>
              </div>
              <div className={styles.miniStatCard}>
                <div className={styles.miniStatValue}>99.9%</div>
                <div className={styles.miniStatLabel}>Success Rate</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 40, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <BarChart3 size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <h3>Traffic Insights</h3>
                <p>Connect your first bot to start generating traffic data.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="animate-fadeIn">
            <div className={styles.heroSection}>
              <h1 className={styles.title}>System Status</h1>
              <p className={styles.subtitle}>Current health monitoring for Beacon Core and regional infrastructure.</p>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <StatusRow icon={<Server size={18} />} name="Global Gateway (US-East)" status="Healthy" latency="8ms" />
              <StatusRow icon={<Database size={18} />} name="Primary Database Cluster" status="Healthy" latency="4ms" />
              <StatusRow icon={<Cpu size={18} />} name="AI Inference Engine" status="Healthy" latency="124ms" />
              <StatusRow icon={<Globe size={18} />} name="CDN Content Delivery" status="Healthy" latency="2ms" />
            </div>
          </div>
        )}

        {activeTab === 'showcase' && <ComponentShowcase />}
      </div>

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
        title={selectedApp ? `${selectedApp.name} — Infrastructure` : 'Bot Monitoring'}
        size="lg"
      >
        <div className={styles.botModalContent}>
          {selectedApp && <BotConsole applicationId={selectedApp.id} />}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setIsBotModalOpen(false)}>Close Monitor</Button>
          </div>
        </div>
      </Modal>
    </WorkspaceLayout>
  )
}

function StatusRow({ icon, name, status, latency }: { icon: React.ReactNode, name: string, status: string, latency: string }) {
  return (
    <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ color: 'var(--beacon-brand)' }}>{icon}</div>
        <span style={{ fontWeight: 600 }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{latency}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ea043' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2ea043', textTransform: 'uppercase' }}>{status}</span>
        </div>
      </div>
    </div>
  )
}
