import { ButtonHTMLAttributes, forwardRef } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, loading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${loading ? styles.loading : ''} ${className || ''}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
