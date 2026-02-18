import { useState, useEffect } from 'react'
import { Coins, ArrowUpRight, ArrowDownLeft, Send, X, TrendingUp, Gift, Plus } from 'lucide-react'
import { useBeacoinStore, BeacoinTransaction } from '../../stores/useBeacoinStore'
import { useAuthStore } from '../../stores/useAuthStore'
import styles from './BeacoinWallet.module.css'

function txIcon(type: BeacoinTransaction['type']) {
  switch (type) {
    case 'earn': return <TrendingUp size={16} />
    case 'bonus': return <Gift size={16} />
    case 'transfer_in': return <ArrowDownLeft size={16} />
    case 'transfer_out': return <ArrowUpRight size={16} />
    case 'spend': return <Coins size={16} />
    default: return <Coins size={16} />
  }
}

function txColor(type: BeacoinTransaction['type']) {
  if (type === 'earn' || type === 'transfer_in' || type === 'bonus') return 'income'
  return 'outgoing'
}

function txSign(type: BeacoinTransaction['type']) {
  if (type === 'earn' || type === 'transfer_in' || type === 'bonus') return '+'
  return '-'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

interface BeacoinWalletProps {
  onClose: () => void
}

export function BeacoinWallet({ onClose }: BeacoinWalletProps) {
  const { balance, transactions, isLoading, fetchWallet, sendCoins } = useBeacoinStore()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<'wallet' | 'send'>('wallet')
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState(false)

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  const handleSend = async () => {
    setSendError('')
    const amt = Number(sendAmount)
    if (!sendTo.trim()) return setSendError('Enter a username or user ID.')
    if (!amt || amt <= 0) return setSendError('Enter a valid amount.')
    if (amt > balance) return setSendError("You don't have enough Beacoins.")
    setSending(true)
    try {
      await sendCoins(sendTo.trim(), amt, sendNote.trim() || undefined)
      setSendSuccess(true)
      setSendTo('')
      setSendAmount('')
      setSendNote('')
      setTimeout(() => setSendSuccess(false), 3000)
    } catch (err: any) {
      setSendError(err?.message || 'Transfer failed. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.wallet} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.coinIcon}>
              <Coins size={22} />
            </div>
            <div>
              <div className={styles.headerTitle}>Beacoin Wallet</div>
              <div className={styles.headerSub}>@{user?.username}</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {/* Balance card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabelRow}>
            <span className={styles.balanceLabel}>Your Balance</span>
          </div>
          <div className={styles.balanceAmount}>
            <Coins size={28} className={styles.balanceCoinIcon} />
            <span>{isLoading ? '---' : balance.toLocaleString()}</span>
          </div>
          <div className={styles.balanceActions}>
            <button
              className={`${styles.actionBtn} ${tab === 'send' ? styles.actionBtnActive : ''}`}
              onClick={() => setTab('send')}
            >
              <Send size={15} />
              Send
            </button>
            <button className={styles.actionBtnSecondary} disabled title="Coming soon">
              <Plus size={15} />
              Earn More
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'wallet' ? styles.tabActive : ''}`}
            onClick={() => setTab('wallet')}
          >
            Transactions
          </button>
          <button
            className={`${styles.tab} ${tab === 'send' ? styles.tabActive : ''}`}
            onClick={() => setTab('send')}
          >
            Send Coins
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {tab === 'wallet' && (
            <div className={styles.txList}>
              {isLoading && <div className={styles.loading}><div className={styles.spinner} /></div>}
              {!isLoading && transactions.length === 0 && (
                <div className={styles.empty}>
                  <Coins size={40} className={styles.emptyIcon} />
                  <p>No transactions yet</p>
                  <span>Your Beacoin activity will show up here.</span>
                </div>
              )}
              {transactions.map((tx) => (
                <div key={tx.id} className={styles.txItem}>
                  <div className={`${styles.txIcon} ${styles[txColor(tx.type)]}`}>
                    {txIcon(tx.type)}
                  </div>
                  <div className={styles.txInfo}>
                    <div className={styles.txDesc}>{tx.description}</div>
                    <div className={styles.txTime}>{timeAgo(tx.timestamp)}</div>
                  </div>
                  <div className={`${styles.txAmount} ${styles[txColor(tx.type)]}`}>
                    {txSign(tx.type)}{tx.amount.toLocaleString()}
                    <Coins size={12} className={styles.txCoin} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'send' && (
            <div className={styles.sendForm}>
              {sendSuccess && (
                <div className={styles.successBanner}>
                  ✓ Coins sent successfully!
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label}>Recipient (username or ID)</label>
                <input
                  className={styles.input}
                  placeholder="e.g. alex or user ID"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Amount</label>
                <div className={styles.amountRow}>
                  <Coins size={16} className={styles.inputIcon} />
                  <input
                    className={`${styles.input} ${styles.amountInput}`}
                    type="number"
                    min="1"
                    placeholder="0"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                </div>
                <span className={styles.balanceHint}>
                  You have <strong>{balance.toLocaleString()}</strong> Beacoins
                </span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Note (optional)</label>
                <input
                  className={styles.input}
                  placeholder="What's this for?"
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                  maxLength={100}
                />
              </div>
              {sendError && <div className={styles.errorBanner}>{sendError}</div>}
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? <div className={styles.spinnerSm} /> : <Send size={16} />}
                {sending ? 'Sending...' : 'Send Beacoins'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
