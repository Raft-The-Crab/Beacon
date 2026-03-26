import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from '../../styles/modules/ui/SelectDropdown.module.css'

export interface SelectOption {
  label: string
  value: string | number
  icon?: React.ReactNode
  disabled?: boolean
}

interface SelectDropdownProps {
  options: SelectOption[]
  value?: string | number | null
  defaultValue?: string | number | null
  onChange: (value: string | number | null) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  placement?: 'top' | 'bottom'
}

export const SelectDropdown = React.forwardRef<
  HTMLDivElement,
  SelectDropdownProps
>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = 'Select...',
      disabled = false,
      searchable = true,
      clearable = false,
      size = 'md',
      className = '',
      placement = 'bottom',
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const currentValue = value ?? defaultValue
    const selectedOption = options.find((opt) => opt.value === currentValue)

    const filteredOptions = searchable
      ? options.filter((opt) =>
          String(opt.label || '').toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : options

    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen])

    useEffect(() => {
      if (!isOpen) {
        setSearchQuery('')
        setHighlightedIndex(0)
      }
    }, [isOpen])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
          document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, filteredOptions.length - 1),
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredOptions[highlightedIndex]) {
            onChange(filteredOptions[highlightedIndex].value)
            setIsOpen(false)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
        case 'Home':
          e.preventDefault()
          setHighlightedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setHighlightedIndex(Math.max(0, filteredOptions.length - 1))
          break
        default:
          break
      }
    }

    const handleSelect = (opt: SelectOption) => {
      if (!opt.disabled) {
        onChange(opt.value)
        setIsOpen(false)
      }
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(null)
    }

    return (
      <div
        ref={ref || containerRef}
        className={`${styles.container} ${styles[size]} ${styles['placement_' + placement]} ${disabled ? styles.disabled : ''} ${className}`}
      >
        <button
          type="button"
          className={styles.trigger}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className={styles.value}>
            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <span className={styles.icon}>{selectedOption.icon}</span>
                )}
                <span>{selectedOption.label}</span>
              </>
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </div>
          <div className={styles.controls}>
            {clearable && selectedOption && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClear}
                aria-label="Clear selection"
                tabIndex={-1}
              >
                ✕
              </button>
            )}
            <ChevronDown
              size={16}
              className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
              aria-hidden
            />
          </div>
        </button>

        {isOpen && (
          <div className={styles.menu} role="listbox">
            {searchable && (
              <div className={styles.searchContainer}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.search}
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setHighlightedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            <div className={styles.options}>
              {filteredOptions.length === 0 ? (
                <div className={styles.empty}>No options found</div>
              ) : (
                filteredOptions.map((opt, index) => (
                  <button
                    key={`${opt.value}`}
                    type="button"
                    className={`${styles.option} ${
                      opt.value === currentValue ? styles.selected : ''
                    } ${index === highlightedIndex ? styles.highlighted : ''} ${
                      opt.disabled ? styles.disabledOption : ''
                    }`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    disabled={opt.disabled}
                    role="option"
                    aria-selected={opt.value === currentValue}
                  >
                    {opt.icon && <span className={styles.icon}>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
  },
)

SelectDropdown.displayName = 'SelectDropdown'
