import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from '../../styles/modules/ui/Select.module.css'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, containerClassName, className, children, ...props }, ref) => {
    return (
      <div className={`${styles.wrapper} ${containerClassName || ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={`${styles.selectWrapper} ${error ? styles.hasError : ''}`}>
          <select
            ref={ref}
            className={`${styles.select} ${className || ''}`}
            {...props}
          >
            {children}
          </select>
          <div className={styles.chevron}>
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
