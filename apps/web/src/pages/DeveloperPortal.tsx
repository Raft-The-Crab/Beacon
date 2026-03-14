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
import { WEB_SDK_ENDPOINTS } from '../lib/beaconSdk'

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

type HealthResponse = {
  status?: string
  services?: {
    postgres?: string
    redis?: string
    mongodb?: string
    postgresLatency?: string
  }
  queue?: {
    waiting?: number
    processing?: number
  }
  timestamp?: string
}

type AiHealthResponse = {
  status?: string
  configured?: boolean
  modelStatus?: string
  latencyMs?: number
}

export function DeveloperPortal() {
  const { show: showToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('apps')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAppName, setNewAppName] = useState('')
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isBotModalOpen, setIsBotModalOpen] = useState(false)
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [aiHealth, setAiHealth] = useState<AiHealthResponse | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  const fetchHealth = async () => {
    setHealthLoading(true)
    try {
      const root = WEB_SDK_ENDPOINTS.apiUrl.replace(/\/?api\/?$/i, '')
      const res = await fetch(`${root}/health`, { method: 'GET', credentials: 'include' })
      const json = await res.json().catch(() => ({}))
      setHealth(json || null)
    } catch {
      setHealth(null)
    } finally {
      setHealthLoading(false)
    }
  }


  const fetchAiHealth = async () => {
    try {
      const { success, data } = await apiClient.request('GET', '/ai/status')
      if (success && data) {
        setAiHealth(data)
      } else {
        setAiHealth(null)
      }
    } catch {
      setAiHealth(null)
    }
  }

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
    void fetchHealth()
    void fetchAiHealth()

    const interval = setInterval(() => {
      void fetchHealth()
      void fetchAiHealth()
    }, 45000)

    return () => clearInterval(interval)
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
      <div className={`${styles.statusCard} ${health?.status === 'healthy' ? styles.statusCardHealthy : styles.statusCardDegraded}`}>
        <div className={styles.statusHeader}>
          <Activity size={18} style={{ color: health?.status === 'healthy' ? '#2ea043' : '#f23f43' }} />
          <span>{healthLoading ? 'Checking...' : (health?.status === 'healthy' ? 'Operational' : 'Degraded')}</span>
        </div>
        <div className={styles.statusDetails}>
          {healthLoading
            ? 'Running a live backend health probe.'
            : health?.status === 'healthy'
              ? 'All core services are responding.'
              : 'One or more backend services are degraded.'}
          <br />Live data from Beacon API health endpoint.
        </div>
      </div>

      <div className={styles.miniStats} style={{ marginTop: 24 }}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{apps.length}</div>
          <div className={styles.miniStatLabel}>Apps</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{health?.services?.postgresLatency || 'N/A'}</div>
          <div className={styles.miniStatLabel}>DB Latency</div>
        </div>
      </div>

      <div className={styles.miniStats}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{aiHealth?.modelStatus === 'reachable' ? 'Live' : aiHealth?.configured ? 'Down' : 'Unset'}</div>
          <div className={styles.miniStatLabel}>AI Model</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{typeof aiHealth?.latencyMs === 'number' ? `${aiHealth.latencyMs}ms` : 'N/A'}</div>
          <div className={styles.miniStatLabel}>AI Latency</div>
        </div>
      </div>

      <div className={styles.miniStats}>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{health?.queue?.waiting ?? 0}</div>
          <div className={styles.miniStatLabel}>Queue Waiting</div>
        </div>
        <div className={styles.miniStatCard}>
          <div className={styles.miniStatValue}>{health?.queue?.processing ?? 0}</div>
          <div className={styles.miniStatLabel}>Queue Processing</div>
        </div>
      </div>
    </div>
  )

  return (
    <WorkspaceLayout showServerRail sidebar={sidebar} rightPanel={rightPanel}>
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
              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Control Plane</div>
                  <div className={styles.overviewValue}>{health?.status === 'healthy' ? 'ONLINE' : 'DEGRADED'}</div>
                  <div className={styles.overviewHint}>Live heartbeat from API health endpoint.</div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>AI Runtime</div>
                  <div className={styles.overviewValue}>{aiHealth?.modelStatus === 'reachable' ? 'REACHABLE' : aiHealth?.configured ? 'UNREACHABLE' : 'NOT SET'}</div>
                  <div className={styles.overviewHint}>Dedicated probe through /api/ai/status.</div>
                </div>
                <div className={styles.overviewCard}>
                  <div className={styles.overviewLabel}>Queue Pressure</div>
                  <div className={styles.overviewValue}>{health?.queue?.waiting ?? 0}</div>
                  <div className={styles.overviewHint}>Messages waiting in moderation queue.</div>
                </div>
              </div>

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

            <div className={styles.analyticsGrid}>
              <div className={styles.miniStatCard}>
                <div className={styles.miniStatValue}>Live</div>
                <div className={styles.miniStatLabel}>Request telemetry unlocks when production traffic is connected.</div>
              </div>
              <div className={styles.miniStatCard}>
                <div className={styles.miniStatValue}>Pending</div>
                <div className={styles.miniStatLabel}>Bandwidth reporting is hidden until verified usage exists.</div>
              </div>
              <div className={styles.miniStatCard}>
                <div className={styles.miniStatValue}>Secure</div>
                <div className={styles.miniStatLabel}>Only non-demo analytics are shown in this dashboard.</div>
              </div>
            </div>

            <div className={styles.analyticsPlaceholder}>
              <div className={styles.analyticsPlaceholderInner}>
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

            <div className={styles.statusGrid}>
              <StatusRow icon={<Server size={18} />} name="API Gateway" status={health?.status === 'healthy' ? 'Healthy' : 'Degraded'} latency="Live" />
              <StatusRow icon={<Database size={18} />} name="Primary Database Cluster" status={(health?.services?.postgres || 'unknown') === 'connected' ? 'Healthy' : 'Degraded'} latency={health?.services?.postgresLatency || 'N/A'} />
              <StatusRow icon={<Cpu size={18} />} name="AI Moderation Pipeline" status={aiHealth?.modelStatus === 'reachable' ? 'Healthy' : aiHealth?.configured ? 'Degraded' : 'Unknown'} latency={typeof aiHealth?.latencyMs === 'number' ? `${aiHealth.latencyMs}ms` : 'N/A'} />
              <StatusRow icon={<Globe size={18} />} name="Redis + Realtime Cache" status={(health?.services?.redis || 'unknown') === 'connected' ? 'Healthy' : 'Degraded'} latency="Live" />
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
  const tone = status.toLowerCase() === 'healthy' ? 'healthy' : status.toLowerCase() === 'unknown' ? 'unknown' : 'degraded'
  return (
    <div className={`${styles.statusRow} glass-card`}>
      <div className={styles.statusPrimary}>
        <div className={styles.statusIcon}>{icon}</div>
        <span className={styles.statusName}>{name}</span>
      </div>
      <div className={styles.statusMeta}>
        <div className={styles.statusLatency}>
          <Clock size={14} className={styles.statusLatencyIcon} />
          <span className={styles.statusLatencyValue}>{latency}</span>
        </div>
        <div className={`${styles.statusSummary} ${tone === 'healthy' ? styles.statusHealthy : tone === 'unknown' ? styles.statusUnknown : styles.statusDegraded}`}>
          <div className={styles.statusDot} />
          <span>{status}</span>
        </div>
      </div>
    </div>
  )
}
