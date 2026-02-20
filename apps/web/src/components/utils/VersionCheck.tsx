import { useEffect, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { API_CONFIG } from '../../config/api'

export function VersionCheck() {
    const [hasUpdate, setHasUpdate] = useState(false)

    useEffect(() => {
        // Grab current version from manifest/package
        const version = '2.4.0' // This would ideally be injected by Vite

        const checkVersion = async () => {
            try {
                const res = await fetch(`${API_CONFIG.BASE_URL}/api/version`)
                const data = await res.json()

                if (data.version && data.version !== version) {
                    setHasUpdate(true)
                }
            } catch (err) {
                console.warn('Version check failed', err)
            }
        }

        const interval = setInterval(checkVersion, 1000 * 60 * 15) // Check every 15 mins
        checkVersion()

        return () => clearInterval(interval)
    }, [])

    if (!hasUpdate) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--accent-gradient)',
            padding: '16px 24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideUp 0.5s ease-out'
        }}>
            <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>New Update Available</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>A newer version of Beacon is ready.</div>
            </div>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                style={{ background: 'white', color: 'black' }}
            >
                <RefreshCcw size={14} /> Refresh
            </Button>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div >
    )
}
