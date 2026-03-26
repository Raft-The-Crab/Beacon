import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Maximize, Loader2 } from 'lucide-react';
import styles from '../../styles/modules/features/MessageItem.module.css';

interface CustomPlayerProps {
  src: string;
  filename?: string;
}

export const CustomVideoPlayer: React.FC<CustomPlayerProps> = ({ src, filename }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      className={styles.customVideoContainer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isLoading && (
        <div className={styles.playerLoader}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        className={styles.videoElement}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        onClick={togglePlay}
      />
      
      <div className={`${styles.videoControls} ${showControls || !isPlaying ? styles.visible : ''}`}>
        <div className={styles.progressArea}>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className={styles.progressBar}
          />
        </div>
        
        <div className={styles.controlsRow}>
          <div className={styles.leftControls}>
            <button onClick={togglePlay} className={styles.controlBtn}>
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button onClick={toggleMute} className={styles.controlBtn}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
          
          <div className={styles.rightControls}>
            <a href={src} download={filename || 'video.mp4'} className={styles.controlBtn} title="Download">
              <Download size={18} />
            </a>
            <button onClick={handleFullscreen} className={styles.controlBtn}>
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomAudioPlayer: React.FC<CustomPlayerProps> = ({ src, filename }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  return (
    <div className={styles.customAudioPlayer}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      
      <button onClick={togglePlay} className={styles.audioPlayBtnPrimary}>
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>
      
      <div className={styles.audioMainContent}>
        <div className={styles.audioHeader}>
          <span className={styles.audioTitle}>{filename || 'Audio Attachment'}</span>
          <a href={src} download={filename || 'audio.mp3'} className={styles.audioDownloadSmall}>
            <Download size={14} />
          </a>
        </div>
        
        <div className={styles.audioProgressContainer}>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className={styles.audioProgressBar}
          />
        </div>
      </div>
    </div>
  );
};
