import { SelectHTMLAttributes, forwardRef } from 'react'
import React from 'react'
import { SelectDropdown, SelectOption } from './SelectDropdown'
import styles from '../../styles/modules/ui/Select.module.css'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  containerClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, containerClassName, className, children, value, defaultValue, size = 'md', ...props }, ref) => {
    
    // Parse options from children (<option> tags)
    const options: SelectOption[] = []
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const element = child as React.ReactElement<any>
        const val = element.props.value !== undefined ? element.props.value : element.props.children
        const lbl = element.props.children
        const disabled = element.props.disabled
        
        // Skip rendering hidden or blank placeholder options if they have no explicit value, 
        // as SelectDropdown has its own placeholder logic.
        if (val !== undefined && val !== null) {
          options.push({
            value: String(val),
            label: String(lbl),
            disabled: !!disabled
          })
        }
      }
    })

    const handleChange = (val: string | number | null) => {
      if (props.onChange) {
        // Create a synthetic event that mimics a native select onChange
        const synthEvent = {
          target: { value: String(val ?? '') },
          currentTarget: { value: String(val ?? '') },
          preventDefault: () => {},
          stopPropagation: () => {}
        } as unknown as React.ChangeEvent<HTMLSelectElement>
        
        props.onChange(synthEvent)
      }
    }

    return (
      <div className={`${styles.wrapper} ${containerClassName || ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        
        {/* Hidden but focusable native select for form libraries (like react-hook-form) */}
        <select
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          {...props}
          style={{ 
            opacity: 0, 
            position: 'absolute', 
            width: 0, 
            height: 0, 
            pointerEvents: 'none', 
            zIndex: -1 
          }}
        >
          {children}
        </select>
        
        <SelectDropdown
          options={options}
          value={value as string | number}
          defaultValue={defaultValue as string | number}
          onChange={handleChange}
          disabled={props.disabled}
          searchable={false}
          size={size}
          className={`${error ? styles.hasError : ''} ${className || ''}`}
        />
        
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
