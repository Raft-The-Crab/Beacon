/**
 * Server Insights Dashboard — Pillar IV: The Council
 * Visual analytics for server health, member growth, and engagement metrics.
 */

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart2, Users, MessageCircle,
    Activity, Hash, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import styles from '../../styles/modules/admin/ServerInsights.module.css'

interface InsightCard {
    label: string
    value: string | number
    change: number      // % change
    icon: React.ReactNode
    color: string
}

interface ServerInsightsProps {
    guildId: string
    memberCount: number
    channelCount: number
    messageCountToday?: number
    activeMembers?: number
}

export function ServerInsights({ memberCount, channelCount, messageCountToday = 0, activeMembers = 0 }: ServerInsightsProps) {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

    const cards: InsightCard[] = useMemo(() => [
        {
            label: 'Total Members',
            value: memberCount.toLocaleString(),
            change: 12.5,
            icon: <Users size={18} />,
            color: 'var(--beacon-brand)',
        },
        {
            label: 'Messages Today',
            value: messageCountToday.toLocaleString(),
            change: -3.2,
            icon: <MessageCircle size={18} />,
            color: '#3ba55d',
        },
        {
            label: 'Active Members',
            value: activeMembers.toLocaleString(),
            change: 8.1,
            icon: <Activity size={18} />,
            color: 'var(--status-warning)',
        },
        {
            label: 'Channels',
            value: channelCount.toLocaleString(),
            change: 0,
            icon: <Hash size={18} />,
            color: '#eb459e',
        },
    ], [memberCount, messageCountToday, activeMembers, channelCount])

    // Mock chart data
    const chartData = useMemo(() => {
        const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30
        return Array.from({ length: days }, (_, i) => ({
            label: timeRange === '24h' ? `${i}:00` : `Day ${i + 1}`,
            messages: Math.floor(Math.random() * 200 + 50),
            members: Math.floor(Math.random() * 20 + memberCount - 10),
        }))
    }, [timeRange, memberCount])

    const maxMessages = Math.max(...chartData.map(d => d.messages))

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <BarChart2 size={20} />
                    <h3>Server Insights</h3>
                </div>
                <div className={styles.timeSelector}>
                    {(['24h', '7d', '30d'] as const).map(range => (
                        <button
                            key={range}
                            className={`${styles.timeBtn} ${timeRange === range ? styles.active : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className={styles.cardGrid}>
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        className={styles.metricCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <div className={styles.cardIcon} style={{ background: `${card.color}20`, color: card.color }}>
                            {card.icon}
                        </div>
                        <div className={styles.cardContent}>
                            <span className={styles.cardLabel}>{card.label}</span>
                            <span className={styles.cardValue}>{card.value}</span>
                            {card.change !== 0 && (
                                <span className={`${styles.cardChange} ${card.change > 0 ? styles.positive : styles.negative}`}>
                                    {card.change > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(card.change)}%
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Message Activity Chart */}
            <div className={styles.chartSection}>
                <h4>Message Activity</h4>
                <div className={styles.chart}>
                    {chartData.map((d, i) => (
                        <div key={i} className={styles.barGroup}>
                            <div
                                className={styles.bar}
                                style={{
                                    height: `${(d.messages / maxMessages) * 100}%`,
                                    background: `linear-gradient(to top, ${d.messages > maxMessages * 0.7 ? '#3ba55d' : 'var(--beacon-brand)'}, ${d.messages > maxMessages * 0.7 ? 'var(--status-success)' : '#7289da'})`,
                                }}
                            />
                            <span className={styles.barLabel}>{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.activitySection}>
                <h4>Peak Hours</h4>
                <div className={styles.peakHours}>
                    {['12pm', '2pm', '6pm', '8pm', '10pm'].map((hour, i) => (
                        <div key={hour} className={styles.peakItem}>
                            <Clock size={12} />
                            <span>{hour}</span>
                            <div className={styles.peakBar}>
                                <div className={styles.peakFill} style={{ width: `${80 - i * 10}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
