import React, { useState } from 'react';
import { Edit3, Save, Palette, Globe, Shield, Activity } from 'lucide-react';
import { Button, Badge, useToast } from '../ui';
import { UserPresenceWidget } from './UserPresenceWidget';
import { apiClient } from '../../services/apiClient';
import styles from '../../styles/modules/features/ProfileEnhanced.module.css';

interface ProfileTheme {
  accentColor: string;
}

export const ProfileEnhanced: React.FC<{ user: any; isOwn?: boolean }> = ({ user, isOwn }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || "No bio set yet. It's quiet here...");
  const [avatar, setAvatar] = useState(user.avatar);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [customTheme, setCustomTheme] = useState<ProfileTheme>({
    accentColor: user.accentColor || 'var(--beacon-brand)'
  });

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.request('POST', '/upload/avatar', formData);
      if (response.url) {
        setAvatar(response.url);
        toast.success('Avatar uploaded! Save changes to finalize.');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.request('PATCH', '/users/profile', {
        bio,
        avatar,
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
      <div className={styles.banner} />

      {/* Profile Info Overlay */}
      <div className={styles.content}>
        <div className={styles.header}>
          <div 
            className={`${styles.avatarWrapper} ${isEditing ? styles.editable : ''}`}
            onClick={handleAvatarClick}
          >
            <img src={avatar || user.avatar} alt={user.username} className={styles.avatar} />
            <div className={`${styles.statusDot} ${styles[user.status || 'online']}`} />
            {isEditing && (
              <div className={styles.avatarOverlay}>
                <Edit3 size={20} />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
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

          {user.customStatus && (
            <div className={styles.customStatus}>
              <Activity size={14} className={styles.statusIcon} />
              <span>{user.customStatus}</span>
            </div>
          )}

          {/* Activity Section - Titan V High-Fidelity */}
          {user.activities && user.activities.length > 0 && (
            <div className={styles.activitySection}>
              <h3>CURRENTLY DOING</h3>
              <UserPresenceWidget activities={user.activities} />
            </div>
          )}

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
              value={customTheme.accentColor}
              onChange={(e) => setCustomTheme({ ...customTheme, accentColor: e.target.value })}
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
