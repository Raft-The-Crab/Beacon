import React from 'react';
import { BarChart2, Check, User, Info } from 'lucide-react';
import styles from './Poll.module.css';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedBy: string[]; // User IDs
}

interface PollProps {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  isAnonymous?: boolean;
  allowMultiple?: boolean;
  onVote: (pollId: string, optionId: string) => void;
  currentUserVoted?: string[]; // Array of option IDs
}

export const PollRenderer: React.FC<PollProps> = ({
  id,
  question,
  options,
  totalVotes,
  endsAt,
  isAnonymous = false,
  allowMultiple = false,
  onVote,
  currentUserVoted = []
}) => {
  const isExpired = new Date(endsAt) < new Date();

  return (
    <div className={styles.pollContainer}>
      <div className={styles.pollHeader}>
        <div className={styles.pollIcon}>
          <BarChart2 size={20} />
        </div>
        <div className={styles.pollInfo}>
          <h3 className={styles.question}>{question}</h3>
          <p className={styles.meta}>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • {isExpired ? 'Final Results' : `Ends ${new Date(endsAt).toLocaleString()}`}
            {isAnonymous && ' • Anonymous'}
          </p>
        </div>
      </div>

      <div className={styles.optionsList}>
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const hasVoted = currentUserVoted.includes(option.id);

          return (
            <button
              key={option.id}
              className={`${styles.optionButton} ${hasVoted ? styles.voted : ''} ${isExpired ? styles.disabled : ''}`}
              onClick={() => !isExpired && onVote(id, option.id)}
              disabled={isExpired}
            >
              <div 
                className={styles.progressBackground} 
                style={{ width: `${percentage}%` }} 
              />
              <div className={styles.optionContent}>
                <span className={styles.optionText}>{option.text}</span>
                <div className={styles.resultInfo}>
                  {hasVoted && <Check size={16} className={styles.checkIcon} />}
                  <span className={styles.percentage}>{Math.round(percentage)}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!isAnonymous && totalVotes > 0 && (
        <div className={styles.votersPreview}>
          <div className={styles.avatars}>
            {/* Show top 3 voters' avatars */}
            <div className={styles.avatarPlaceholder}><User size={12} /></div>
          </div>
          <span className={styles.votersText}>
            {isExpired ? 'See who voted' : 'Voting is public for this poll'}
          </span>
        </div>
      )}

      <div className={styles.pollFooter}>
        <Info size={14} />
        <span>{allowMultiple ? 'Multiple choices allowed' : 'Select one choice'}</span>
      </div>
    </div>
  );
};
