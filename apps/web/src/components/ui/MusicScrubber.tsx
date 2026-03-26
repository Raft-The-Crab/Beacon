import React, { useState, useRef } from 'react';
import { Play, Pause, Clock } from 'lucide-react';
import styles from '../../styles/modules/ui/MusicScrubber.module.css';

interface MusicScrubberProps {
    durationLimit: 15 | 30;
    onSeek: (seconds: number) => void;
    initialOffset?: number;
}

export function MusicScrubber({ durationLimit, onSeek, initialOffset = 0 }: MusicScrubberProps) {
    const [offset, setOffset] = useState(initialOffset);
    const [isPlaying, setIsPlaying] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const newOffset = Math.floor(percentage * 600); // 10 minute range for scrubbing scale
        setOffset(newOffset);
        onSeek(newOffset);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        handleMouseMove(e);
        const onMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove as any);
            window.removeEventListener('mouseup', onMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove as any);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.timeInfo}>
                    <Clock size={14} />
                    <span>Clip starts at: <strong>{formatTime(offset)}</strong></span>
                </div>
                <div className={styles.limitBadge}>
                    {durationLimit}s Clip
                </div>
            </div>

            <div
                className={styles.timelineWrapper}
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                <div className={styles.timeline}>
                    {/* Tick marks every minute */}
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className={styles.tick} style={{ left: `${(i / 10) * 100}%` }}>
                            <span>{i}m</span>
                        </div>
                    ))}

                    {/* The Playhead */}
                    <div
                        className={styles.playhead}
                        style={{ left: `${(offset / 600) * 100}%` }}
                    >
                        <div className={styles.playheadLine} />
                        <div className={styles.playheadKnob} />

                        {/* The Window indicator (15/30s) */}
                        <div
                            className={styles.window}
                            style={{ width: `${(durationLimit / 600) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.controls}>
                <button
                    className={styles.previewBtn}
                    onClick={() => setIsPlaying(!isPlaying)}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    <span>Preview Selection</span>
                </button>
                <p className={styles.hint}>Drag to change start time</p>
            </div>
        </div>
    );
}
