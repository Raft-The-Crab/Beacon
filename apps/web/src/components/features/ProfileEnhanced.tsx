import React, { useState } from 'react';
import { Camera, Edit3, Save, Palette, Globe, Shield, Activity } from 'lucide-react';
import { Button, Badge, useToast } from '../ui';
import { api } from '../../lib/api';
import styles from './ProfileEnhanced.module.css';

interface ProfileTheme {
  bannerColor: string;
  accentColor: string;
  bannerUrl?: string;
}

export const ProfileEnhanced: React.FC<{ user: any; isOwn?: boolean }> = ({ user, isOwn }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || "No bio set yet. It's quiet here...");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [customTheme, setCustomTheme] = useState<ProfileTheme>({
    bannerColor: user.bannerColor || '#7289da',
    accentColor: user.accentColor || '#5865f2'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch('/users/profile', {
        bio,
        bannerColor: customTheme.bannerColor,
        accentColor: customTheme.accentColor
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
       toast.error('Failed to update profile');
    } finally {
       setLoading(false);
    }
  };


  return (
    <div className={styles.profileCard}>
      {/* Banner */}
      <div 
        className={styles.banner} 
        style={{ backgroundColor: customTheme.bannerColor, backgroundImage: customTheme.bannerUrl ? `url(${customTheme.bannerUrl})` : 'none' }}
      >
        {isOwn && (
          <button className={styles.editBannerBtn}>
            <Camera size={18} />
          </button>
        )}
      </div>

      {/* Profile Info Overlay */}
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.avatarWrapper}>
            <img src={user.avatar} alt={user.username} className={styles.avatar} />
            <div className={`${styles.statusDot} ${styles[user.status || 'online']}`} />
          </div>
          
          <div className={styles.actions}>
            {isOwn ? (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 size={16} />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="primary" size="sm">Add Friend</Button>
                <Button variant="secondary" size="sm">Message</Button>
              </>
            )}
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.names}>
            <h2 className={styles.username}>{user.username}</h2>
            <span className={styles.discriminator}>#{user.discriminator || '0000'}</span>
            {user.bot && <Badge variant="info" className={styles.botBadge}>BOT</Badge>}
          </div>

          <div className={styles.customStatus}>
             <Activity size={14} className={styles.statusIcon} />
             <span>{user.customStatus || "Listening to the void..."}</span>
          </div>

          <div className={styles.section}>
            <h3>ABOUT ME</h3>
            {isEditing ? (
              <textarea 
                className={styles.bioEdit} 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                maxLength={190}
              />
            ) : (
              <p className={styles.bioText}>{bio}</p>
            )}
          </div>

          <div className={styles.section}>
            <h3>BEACON MEMBER SINCE</h3>
            <p className={styles.date}>{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Social Links - Beyond Discord */}
          <div className={styles.section}>
            <h3>CONNECTED ACCOUNTS</h3>
            <div className={styles.socials}>
              <Globe size={18} className={styles.socialIcon} />
              <Shield size={18} className={styles.socialIcon} />
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className={styles.editControls}>
           <div className={styles.colorPicker}>
              <Palette size={16} />
              <input 
                type="color" 
                value={customTheme.bannerColor} 
                onChange={(e) => setCustomTheme({...customTheme, bannerColor: e.target.value})} 
              />
           </div>
           <Button variant="primary" size="sm" onClick={handleSave} loading={loading}>
              <Save size={16} /> Save Changes
           </Button>
        </div>
      )}
    </div>
  );
};
