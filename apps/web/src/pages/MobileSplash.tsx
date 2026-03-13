import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/modules/pages/MobileSplash.module.css'

export function MobileSplash() {
  const navigate = useNavigate()

  return (
    <div className={styles.shell}>
      <Helmet>
        <title>Welcome - Beacon</title>
      </Helmet>

      <div className={styles.backdropGlow} />
      <div className={styles.gridTexture} />

      <main className={styles.card}>
        <div className={styles.brand}>Beacon</div>
        <h1 className={styles.title}>Talk. Build. Belong.</h1>
        <p className={styles.subtitle}>A fast social and developer platform designed for communities that move in real time.</p>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate('/channels/@me')}>
            Open Beacon
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate('/login')}>
            Log In
          </button>
        </div>

        <p className={styles.legal}>By continuing, you agree to Beacon Terms, Privacy Policy, and Community Guidelines.</p>
      </main>
    </div>
  )
}
