import { useState } from 'react'
import { ChevronRight, Hash, Bell, Sparkles, Palette, MessageSquare, Book, Check } from 'lucide-react'
import styles from '../../styles/modules/features/OnboardingFlow.module.css'

interface OnboardingStep {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    options?: { id: string; label: string; description?: string; icon?: React.ReactNode }[]
}

interface OnboardingFlowProps {
    serverName: string
    isOpen: boolean
    onComplete: (selections: Record<string, string[]>) => void
    onSkip: () => void
}

const STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Welcome!',
        description: 'We\'re glad you\'re here. Let\'s customize your experience.',
        icon: <Sparkles size={32} />,
    },
    {
        id: 'channels',
        title: 'Choose your channels',
        description: 'Select the channels you\'re interested in. You can always change these later.',
        icon: <Hash size={32} />,
        options: [
            { id: 'general', label: '# general', description: 'Main community chat', icon: <MessageSquare size={16} /> },
            { id: 'introductions', label: '# introductions', description: 'Say hello!', icon: <MessageSquare size={16} /> },
            { id: 'announcements', label: '# announcements', description: 'Server news & updates', icon: <Bell size={16} /> },
            { id: 'off-topic', label: '# off-topic', description: 'Anything goes', icon: <MessageSquare size={16} /> },
            { id: 'resources', label: '# resources', description: 'Useful links & tools', icon: <Book size={16} /> },
        ],
    },
    {
        id: 'notifications',
        title: 'Notification preferences',
        description: 'How do you want to be notified?',
        icon: <Bell size={32} />,
        options: [
            { id: 'all', label: 'All Messages', description: 'Get notified for everything' },
            { id: 'mentions', label: 'Only @Mentions', description: 'Only when someone mentions you' },
            { id: 'nothing', label: 'Nothing', description: 'Mute all notifications' },
        ],
    },
    {
        id: 'theme',
        title: 'Pick a vibe',
        description: 'Choose a theme that matches your style.',
        icon: <Palette size={32} />,
        options: [
            { id: 'midnight', label: 'Midnight', description: 'Dark & sleek' },
            { id: 'aurora', label: 'Aurora', description: 'Green & vibrant' },
            { id: 'sunset', label: 'Sunset', description: 'Warm & cozy' },
            { id: 'ocean', label: 'Ocean', description: 'Cool & calm' },
        ],
    },
]

export function OnboardingFlow({ serverName, isOpen, onComplete, onSkip }: OnboardingFlowProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [selections, setSelections] = useState<Record<string, string[]>>({})

    if (!isOpen) return null

    const step = STEPS[currentStep]
    const isLastStep = currentStep === STEPS.length - 1

    const toggleSelection = (stepId: string, optionId: string) => {
        setSelections(prev => {
            const current = prev[stepId] || []
            if (current.includes(optionId)) {
                return { ...prev, [stepId]: current.filter(id => id !== optionId) }
            }
            // For notification/theme, single select
            if (stepId === 'notifications' || stepId === 'theme') {
                return { ...prev, [stepId]: [optionId] }
            }
            return { ...prev, [stepId]: [...current, optionId] }
        })
    }

    const handleNext = () => {
        if (isLastStep) {
            onComplete(selections)
        } else {
            setCurrentStep(s => s + 1)
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Progress bar */}
                <div className={styles.progress}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                <div className={styles.stepContent}>
                    <div className={styles.stepIcon}>{step.icon}</div>
                    <h2 className={styles.stepTitle}>
                        {step.id === 'welcome' ? `Welcome to ${serverName}!` : step.title}
                    </h2>
                    <p className={styles.stepDesc}>{step.description}</p>

                    {step.options && (
                        <div className={styles.options}>
                            {step.options.map(option => {
                                const isSelected = (selections[step.id] || []).includes(option.id)
                                return (
                                    <button
                                        key={option.id}
                                        className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => toggleSelection(step.id, option.id)}
                                    >
                                        <div className={styles.optionInfo}>
                                            {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                                            <div>
                                                <span className={styles.optionLabel}>{option.label}</span>
                                                {option.description && <span className={styles.optionDesc}>{option.description}</span>}
                                            </div>
                                        </div>
                                        {isSelected && <Check size={18} className={styles.checkIcon} />}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.skipBtn} onClick={onSkip}>Skip</button>
                    <button className={styles.nextBtn} onClick={handleNext}>
                        {isLastStep ? 'Finish' : 'Continue'}
                        {!isLastStep && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    )
}
