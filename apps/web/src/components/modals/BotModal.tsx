import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useUIStore } from '../../stores/useUIStore'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/modals/BotModal.module.css'

export const BotModal: React.FC = () => {
    const { showBotModal, botModalData, setShowBotModal } = useUIStore()
    const [values, setValues] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!showBotModal || !botModalData) return null

    const handleClose = () => {
        if (submitting) return
        setShowBotModal(false)
        setValues({})
        setError(null)
    }

    const handleChange = (customId: string, value: string) => {
        setValues(prev => ({ ...prev, [customId]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            // Build the MODAL_SUBMIT (type 5) payload
            const components = botModalData.components.map((row: any) => ({
                type: 1, // ActionRow
                components: row.components.map((comp: any) => ({
                    type: comp.type || 4, // TextInput
                    custom_id: comp.custom_id,
                    value: values[comp.custom_id] || comp.value || ''
                }))
            }))

            const res = await apiClient.executeInteraction({
                type: 5, // MODAL_SUBMIT
                id: botModalData.id,
                token: botModalData.token,
                applicationId: botModalData.applicationId,
                data: {
                    custom_id: botModalData.customId,
                    components
                }
            })

            if (res.success) {
                setShowBotModal(false)
                setValues({})
            } else {
                setError(res.error || 'Failed to submit modal')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={showBotModal}
            onClose={handleClose}
            title={botModalData.title}
            size="md"
        >
            <form onSubmit={handleSubmit} className={styles.container}>
                <div className={styles.content}>
                    {botModalData.components.map((row: any, i: number) => (
                        <div key={i} className={styles.row}>
                            {row.components.map((comp: any) => (
                                <div key={comp.custom_id} className={styles.field}>
                                    <label className={styles.label}>
                                        {comp.label}
                                        {comp.required !== false && <span className={styles.required}>*</span>}
                                    </label>
                                    
                                    {comp.style === 2 ? (
                                        <textarea
                                            className={styles.textarea}
                                            placeholder={comp.placeholder}
                                            value={values[comp.custom_id] ?? comp.value ?? ''}
                                            onChange={e => handleChange(comp.custom_id, e.target.value)}
                                            required={comp.required !== false}
                                            minLength={comp.min_length}
                                            maxLength={comp.max_length}
                                            rows={5}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder={comp.placeholder}
                                            value={values[comp.custom_id] ?? comp.value ?? ''}
                                            onChange={e => handleChange(comp.custom_id, e.target.value)}
                                            required={comp.required !== false}
                                            minLength={comp.min_length}
                                            maxLength={comp.max_length}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
