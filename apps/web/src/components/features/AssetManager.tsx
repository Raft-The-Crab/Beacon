import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { useToast, Spinner } from '../ui';
import { Smile, Sticker, Trash2, Plus } from 'lucide-react';
import styles from '../../styles/modules/features/AssetManager.module.css';

interface Emoji {
    id: string;
    name: string;
    imageUrl: string;
    animated: boolean;
}

interface Sticker {
    id: string;
    name: string;
    imageUrl: string;
}

interface AssetManagerProps {
    guildId: string;
}

const AssetManager: React.FC<AssetManagerProps> = ({ guildId }) => {
    const [activeTab, setActiveTab] = useState<'emojis' | 'stickers'>('emojis');
    const [emojis, setEmojis] = useState<Emoji[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const toast = useToast();

    const loadAssets = useCallback(async () => {
        setLoading(true);
        const res = await apiClient.getEmojis(guildId);
        if (res.success) {
            setEmojis(res.data);
        } else {
            toast.error('Failed to load emojis');
        }
        setLoading(false);
    }, [guildId, toast]);

    useEffect(() => { loadAssets(); }, [loadAssets]);

    const handleUploadEmoji = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, upload to S3/CDN first. 
        // Here we'll mock it by using a local URL or placeholder.
        setUploading(true);
        const name = file.name.split('.')[0].substring(0, 32);

        // Mocking API call with data
        const res = await apiClient.createEmoji(guildId, {
            name,
            imageUrl: URL.createObjectURL(file), // Mocking local preview
            animated: file.type === 'image/gif'
        });

        if (res.success) {
            setEmojis((prev: Emoji[]) => [...prev, res.data]);
            toast.success('Emoji uploaded successfully');
        } else {
            toast.error(res.error || 'Failed to upload emoji');
        }
        setUploading(false);
    };

    const handleDeleteEmoji = async (emojiId: string) => {
        const res = await apiClient.deleteEmoji(guildId, emojiId);
        if (res.success) {
            setEmojis((prev: Emoji[]) => prev.filter((e: Emoji) => e.id !== emojiId));
            toast.success('Emoji deleted');
        } else {
            toast.error('Failed to delete emoji');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'emojis' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('emojis')}
                    >
                        <Smile size={18} />
                        <span>Emojis</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'stickers' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('stickers')}
                    >
                        <Sticker size={18} />
                        <span>Stickers</span>
                    </button>
                </div>

                <div className={styles.uploadArea}>
                    <label className={styles.uploadBtn}>
                        <input type="file" accept="image/*" onChange={handleUploadEmoji} style={{ display: 'none' }} disabled={uploading} />
                        {uploading ? <Spinner size="sm" /> : <Plus size={18} />}
                        <span>Upload {activeTab === 'emojis' ? 'Emoji' : 'Sticker'}</span>
                    </label>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.description}>
                    {activeTab === 'emojis'
                        ? "Upload custom emojis that anyone in this server can use."
                        : "Custom stickers for high-quality expressions."}
                    <span className={styles.limitInfo}>Limit: {emojis.length}/50</span>
                </div>

                {loading ? (
                    <div className={styles.loadingState}>
                        <Spinner size="lg" />
                        <p>Gathering assets...</p>
                    </div>
                ) : activeTab === 'emojis' ? (
                    <div className={styles.grid}>
                        {emojis.map(emoji => (
                            <div key={emoji.id} className={styles.assetCard}>
                                <div className={styles.assetPreview}>
                                    <img src={emoji.imageUrl} alt={emoji.name} />
                                </div>
                                <div className={styles.assetInfo}>
                                    <span className={styles.assetName}>:{emoji.name}:</span>
                                    <button className={styles.deleteBtn} onClick={() => handleDeleteEmoji(emoji.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {emojis.length === 0 && (
                            <div className={styles.empty}>
                                <Smile size={48} className={styles.emptyIcon} />
                                <p>No custom emojis yet.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.comingSoon}>
                        <Sticker size={48} className={styles.emptyIcon} />
                        <p>Sticker management is being finalized.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetManager;
