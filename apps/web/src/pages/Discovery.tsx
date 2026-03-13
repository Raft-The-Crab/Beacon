import { ServerDiscovery } from '../components/features/ServerDiscovery'
import styles from '../styles/modules/pages/DiscoveryShell.module.css'

export function Discovery() {
    return (
        <div className={styles.pageShell}>
            <div className={styles.modalFrame}>
                <ServerDiscovery />
            </div>
        </div>
    )
}
