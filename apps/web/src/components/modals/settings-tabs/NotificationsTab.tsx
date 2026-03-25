import React, { useState } from 'react'
import { Switch } from '../../ui'
import styles from '../../../styles/modules/modals/SettingsModal.module.css'

const DEFAULT_NOTIF_PREFS = {
    allMessages: true,
    friendRequests: true,
    serverInvites: true,
    desktopNotifications: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
    mentions: true,
    sounds: true,
}

export const NotificationsTab: React.FC = () => {
    const [notifPrefs, setNotifPrefs] = useState(() => {
        try {
            const saved = localStorage.getItem('beacon_notif_prefs')
            return saved ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) } : DEFAULT_NOTIF_PREFS
        } catch { return DEFAULT_NOTIF_PREFS }
    })

    const setNotifPref = (key: keyof typeof DEFAULT_NOTIF_PREFS) => (val: boolean) => {
        if (key === 'desktopNotifications' && val && typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
                const next = { ...notifPrefs, [key]: permission === 'granted' }
                setNotifPrefs(next)
                localStorage.setItem('beacon_notif_prefs', JSON.stringify(next))
            })
            return
        }
        const next = { ...notifPrefs, [key]: val }
        setNotifPrefs(next)
        localStorage.setItem('beacon_notif_prefs', JSON.stringify(next))
    }

    return (
        <div className={styles.tabContent}>
            <p className={styles.muted} style={{ marginBottom: 16 }}>
                Control what notifications Beacon sends you. Changes are saved automatically.
            </p>
            <div className={styles.notificationItem}>
                <div>
                    <span>All Messages</span>
                    <p className={styles.muted}>Notify for every message in channels</p>
                </div>
                <Switch checked={notifPrefs.allMessages} onChange={setNotifPref('allMessages')} />
            </div>
            <div className={styles.notificationItem}>
                <div>
                    <span>Mentions Only</span>
                    <p className={styles.muted}>Only notify when you're @mentioned</p>
                </div>
                <Switch checked={notifPrefs.mentions} onChange={setNotifPref('mentions')} />
            </div>
            <div className={styles.notificationItem}>
                <div>
                    <span>Friend Requests</span>
                    <p className={styles.muted}>When someone sends you a friend request</p>
                </div>
                <Switch checked={notifPrefs.friendRequests} onChange={setNotifPref('friendRequests')} />
            </div>
            <div className={styles.notificationItem}>
                <div>
                    <span>Server Invites</span>
                    <p className={styles.muted}>When someone invites you to a server</p>
                </div>
                <Switch checked={notifPrefs.serverInvites} onChange={setNotifPref('serverInvites')} />
            </div>
            <div className={styles.notificationItem}>
                <div>
                    <span>Desktop Notifications</span>
                    <p className={styles.muted}>Show system popups (requires browser permission)</p>
                </div>
                <Switch checked={notifPrefs.desktopNotifications} onChange={setNotifPref('desktopNotifications')} />
            </div>
            <div className={styles.notificationItem}>
                <div>
                    <span>Notification Sounds</span>
                    <p className={styles.muted}>Play a sound when you receive a notification</p>
                </div>
                <Switch checked={notifPrefs.sounds} onChange={setNotifPref('sounds')} />
            </div>
        </div>
    )
}
