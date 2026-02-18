import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  /** Render a <textarea> instead of <input> */
  multiline?: boolean
  rows?: number
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, icon, className, multiline, rows = 3, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              className={`${styles.input} ${styles.textarea} ${icon ? styles.hasIcon : ''} ${className || ''}`}
              rows={rows}
              value={props.value as string | undefined}
              onChange={props.onChange as React.ChangeEventHandler<HTMLTextAreaElement> | undefined}
              placeholder={props.placeholder}
              disabled={props.disabled}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              className={`${styles.input} ${icon ? styles.hasIcon : ''} ${className || ''}`}
              {...props}
            />
          )}
        </div>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
