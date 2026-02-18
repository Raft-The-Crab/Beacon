import React, { useState } from 'react';
import styles from './SlowmodeControl.module.css';

interface SlowmodeControlProps {
  channelId: string;
  currentSlowmode?: number; // seconds
  onUpdate?: (newValue: number) => void;
}

const SLOWMODE_PRESETS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
  { label: '15m', value: 900 },
  { label: '30m', value: 1800 },
  { label: '1h', value: 3600 },
  { label: '2h', value: 7200 },
  { label: '6h', value: 21600 },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return 'Off';
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''}`;
  return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''}`;
}

const SlowmodeControl: React.FC<SlowmodeControlProps> = ({
  channelId,
  currentSlowmode = 0,
  onUpdate,
}) => {
  const [value, setValue] = useState(currentSlowmode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (newVal: number) => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/channels/${channelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ slowmode: newVal }),
      });
      if (!res.ok) throw new Error(await res.text());
      setValue(newVal);
      setSaved(true);
      onUpdate?.(newVal);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Failed to update slowmode');
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = (preset: number) => {
    setValue(preset);
    handleSave(preset);
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
  };

  const handleSliderCommit = (_e: React.MouseEvent | React.KeyboardEvent) => {
    handleSave(value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>🐌</span>
        <div>
          <div className={styles.title}>Slowmode</div>
          <div className={styles.subtitle}>
            Limit how often users can send messages
          </div>
        </div>
        <div className={`${styles.badge} ${value > 0 ? styles.badgeActive : ''}`}>
          {value > 0 ? formatDuration(value) : 'Off'}
        </div>
      </div>

      {/* Preset chips */}
      <div className={styles.presets}>
        {SLOWMODE_PRESETS.map(p => (
          <button
            key={p.value}
            className={`${styles.preset} ${value === p.value ? styles.presetActive : ''}`}
            onClick={() => handlePreset(p.value)}
            disabled={saving}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className={styles.sliderSection}>
        <span className={styles.sliderLabel}>Off</span>
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={21600}
          step={5}
          value={value}
          onChange={handleSlider}
          onMouseUp={handleSliderCommit}
          onKeyUp={handleSliderCommit}
          disabled={saving}
        />
        <span className={styles.sliderLabel}>6h</span>
      </div>

      <div className={styles.sliderValue}>
        {value === 0 ? 'No slowmode' : `Users can send a message every ${formatDuration(value)}`}
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}
      {saved && <div className={styles.success}>✓ Slowmode updated</div>}
      {saving && <div className={styles.saving}>Saving…</div>}
    </div>
  );
};

export default SlowmodeControl;
