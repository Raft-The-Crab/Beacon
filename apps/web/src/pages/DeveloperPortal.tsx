import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Book, Rocket, Shield, Terminal, MoreVertical, Key } from 'lucide-react'
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
    } catch (err) {
      showToast('API Connection error', 'error')
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
        showToast(`${newAppName} has been created successfully`, 'success')
      } else {
        showToast(data.error || 'Failed to create application', 'error')
      }
    } catch (err) {
      showToast('Failed to create application', 'error')
    }
  }


  return (
    <div className={styles.container}>
      <Helmet>
        <title>Developer Portal - Beacon</title>
      </Helmet>

      {/* High-end Cinematic Atmosphere */}
      <div className={styles.atmosGlow} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>Developer Portal</h1>
            <p>Assemble the next generation of communication protocols on the Beacon neural core.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statusIndicator}>
              <div className={styles.statusDot} />
              <span className={styles.statusText}>Neural Gateway: Online</span>
            </div>
            <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} />
              Create Neural Node
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Dashboard Metrics */}
        <section className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Instances</span>
            <div className={styles.metricValue}>
              {apps.length}
              <span className={styles.metricUnit}>active units</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Network Compute</span>
            <div className={styles.metricValue}>
              12.4
              <span className={styles.metricUnit}>TFLOP/s</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Memory Index</span>
            <div className={styles.metricValue}>
              842
              <span className={styles.metricUnit}>GB/sec</span>
            </div>
          </div>
        </section>

        {/* Resource Links */}
        <section className={styles.resourceGrid}>
          <ResourceCard
            icon={<Book size={24} />}
            title="Sovereign Docs"
            href="/docs"
          />
          <ResourceCard
            icon={<Shield size={24} />}
            title="Privacy Protocols"
            href="/safety"
          />
          <ResourceCard
            icon={<Terminal size={24} />}
            title="Neural API Status"
            href="/docs"
          />
        </section>

        {/* Applications List */}
        <section className={styles.appsSection}>
          <div className={styles.sectionHeader}>
            <h2>My Applications</h2>
            <span>{apps.length} Total</span>
          </div>

          <div className={styles.appsGrid}>
            {loading ? (
              <div className={styles.loading}>Loading applications...</div>
            ) : (
              <>
                {apps.map(app => (
                  <div key={app.id} className={styles.appCard}>
                    <div className={styles.appIcon}>
                      {app.icon ? <img src={app.icon} alt="" /> : <Rocket size={24} />}
                    </div>
                    <div className={styles.appInfo}>
                      <h3>{app.name}</h3>
                      <p>ID: {app.id}</p>
                    </div>
                    <div className={styles.appActions}>
                      <button
                        className={styles.botBtn}
                        onClick={() => { setSelectedApp(app); setIsBotModalOpen(true); }}
                        title="Manage Bot"
                      >
                        <Key size={18} />
                      </button>
                      <button className={styles.moreBtn}>
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <button className={styles.addAppCard} onClick={() => setIsModalOpen(true)}>
                  <Plus size={24} />
                  <span>New App</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Getting Started Guide */}
        <section className={styles.bottomSection}>
          <div className={styles.bottomCard}>
            <div className={styles.atmosGlow} />
            <Terminal size={32} className={styles.bottomIcon} />
            <div className={styles.bottomText}>
              <h3>Quick Start Guide</h3>
              <p>Learn how to authenticate and start sending real-time messages using our SDK.</p>
              <div className={styles.bottomActions}>
                <Button variant="secondary" size="sm">Read Guide</Button>
                <Button variant="ghost" size="sm">API Reference</Button>
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
            <a href="/about">Support</a>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Application"
      >
        <div className={styles.modalContent}>
          <p>Applications allow you to interact with the Beacon API. You can manage bots and OAuth2 settings here.</p>
          <Input
            label="Application Name"
            value={newAppName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAppName(e.currentTarget.value)}
            placeholder="Name your application"
            autoFocus
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateApp}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        title={`Manage ${selectedApp?.name} Bot`}
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

function ResourceCard({ icon, title, href }: { icon: React.ReactNode, title: string, href: string }) {
  return (
    <a href={href} className={styles.resourceCard}>
      <div className={styles.resourceIcon}>{icon}</div>
      <span>{title}</span>
    </a>
  )
}
