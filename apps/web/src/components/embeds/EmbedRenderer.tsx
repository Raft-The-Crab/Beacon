/**
 * Embed Renderer Component
 */

import React from 'react';
import styles from './EmbedRenderer.module.css';

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

interface EmbedRendererProps {
  embed: Embed;
}

export const EmbedRenderer: React.FC<EmbedRendererProps> = ({ embed }) => {
  const borderColor = embed.color 
    ? `#${embed.color.toString(16).padStart(6, '0')}`
    : 'var(--glass-border)';

  return (
    <div className={styles.embed} style={{ borderLeftColor: borderColor }}>
      {embed.author && (
        <div className={styles.author}>
          {embed.author.icon_url && (
            <img src={embed.author.icon_url} alt="" className={styles.authorIcon} />
          )}
          {embed.author.url ? (
            <a href={embed.author.url} className={styles.authorName} target="_blank" rel="noopener noreferrer">
              {embed.author.name}
            </a>
          ) : (
            <span className={styles.authorName}>{embed.author.name}</span>
          )}
        </div>
      )}

      {embed.title && (
        <div className={styles.title}>
          {embed.url ? (
            <a href={embed.url} target="_blank" rel="noopener noreferrer">
              {embed.title}
            </a>
          ) : (
            embed.title
          )}
        </div>
      )}

      {embed.description && (
        <div className={styles.description}>{embed.description}</div>
      )}

      {embed.fields && embed.fields.length > 0 && (
        <div className={styles.fields}>
          {embed.fields.map((field, index) => (
            <div
              key={index}
              className={`${styles.field} ${field.inline ? styles.inline : ''}`}
            >
              <div className={styles.fieldName}>{field.name}</div>
              <div className={styles.fieldValue}>{field.value}</div>
            </div>
          ))}
        </div>
      )}

      {embed.image && (
        <div className={styles.image}>
          <img src={embed.image.url} alt="" />
        </div>
      )}

      {embed.thumbnail && (
        <div className={styles.thumbnail}>
          <img src={embed.thumbnail.url} alt="" />
        </div>
      )}

      {(embed.footer || embed.timestamp) && (
        <div className={styles.footer}>
          {embed.footer?.icon_url && (
            <img src={embed.footer.icon_url} alt="" className={styles.footerIcon} />
          )}
          <span className={styles.footerText}>
            {embed.footer?.text}
            {embed.footer && embed.timestamp && ' • '}
            {embed.timestamp && new Date(embed.timestamp).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
