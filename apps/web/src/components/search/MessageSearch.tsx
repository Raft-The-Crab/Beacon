/**
 * Message Search Component
 */

import React, { useState } from 'react';
import styles from './MessageSearch.module.css';

interface SearchResult {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  channelId: string;
  channelName: string;
  guildId?: string;
  timestamp: string;
}

export const MessageSearch: React.FC<{ guildId?: string }> = ({ guildId: _guildId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    from: '',
    mentions: '',
    has: [] as string[],
    before: '',
    after: '',
    in: ''
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // Build search query
      let searchQuery = query;
      
      if (filters.from) searchQuery += ` from:${filters.from}`;
      if (filters.mentions) searchQuery += ` mentions:${filters.mentions}`;
      if (filters.has.length > 0) searchQuery += ` has:${filters.has.join(',')}`;
      if (filters.before) searchQuery += ` before:${filters.before}`;
      if (filters.after) searchQuery += ` after:${filters.after}`;
      if (filters.in) searchQuery += ` in:${filters.in}`;

      // TODO: API call
      // const results = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&guild=${guildId}`);
      
      // Mock results
      setResults([]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleHasFilter = (filter: string) => {
    setFilters(prev => ({
      ...prev,
      has: prev.has.includes(filter)
        ? prev.has.filter(f => f !== filter)
        : [...prev.has, filter]
    }));
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn} disabled={isSearching}>
            {isSearching ? '🔄' : '🔍'}
          </button>
        </form>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>From User</label>
            <input
              type="text"
              placeholder="@username"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Mentions</label>
            <input
              type="text"
              placeholder="@username"
              value={filters.mentions}
              onChange={(e) => setFilters({ ...filters, mentions: e.target.value })}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Has</label>
            <div className={styles.checkboxGroup}>
              {['link', 'embed', 'file', 'image', 'video', 'sound'].map(type => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={filters.has.includes(type)}
                    onChange={() => toggleHasFilter(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Before Date</label>
            <input
              type="date"
              value={filters.before}
              onChange={(e) => setFilters({ ...filters, before: e.target.value })}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>After Date</label>
            <input
              type="date"
              value={filters.after}
              onChange={(e) => setFilters({ ...filters, after: e.target.value })}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>In Channel</label>
            <input
              type="text"
              placeholder="#channel-name"
              value={filters.in}
              onChange={(e) => setFilters({ ...filters, in: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className={styles.results}>
        {results.length === 0 ? (
          <div className={styles.emptyState}>
            {isSearching ? (
              <p>Searching...</p>
            ) : query ? (
              <p>No results found</p>
            ) : (
              <p>Enter a search query to find messages</p>
            )}
          </div>
        ) : (
          results.map(result => (
            <div key={result.id} className={styles.resultItem}>
              <div className={styles.resultHeader}>
                <div className={styles.avatar}>
                  {result.author.avatar ? (
                    <img src={result.author.avatar} alt={result.author.username} />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      {result.author.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.authorInfo}>
                  <span className={styles.username}>{result.author.username}</span>
                  <span className={styles.timestamp}>
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                  <span className={styles.channel}>#{result.channelName}</span>
                </div>
              </div>
              <div className={styles.content}>{result.content}</div>
              <button className={styles.jumpBtn}>Jump to Message</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
