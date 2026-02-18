import { useState } from 'react'
import {
  Shield,
  Crown,
  Star,
  Award,
  Zap,
  Heart,
  Sparkles,
  Flame,
  Trophy,
  Target,
  Sword,
  Hammer,
  Wrench,
  Settings,
  Code,
  Palette,
  Music,
  Video,
  Mic,
  Headphones,
  Camera,
  Image,
  Book,
  Bookmark,
  FileText,
  Briefcase,
  Coffee,
  Rocket,
  PieChart,
  BarChart,
  TrendingUp,
  Users,
  UserCheck,
  UserPlus,
  Mail,
  MessageCircle,
  Send,
  Bell,
  Flag,
  Compass,
  MapPin,
  Navigation,
  Globe,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Info,
  HelpCircle,
  Plus,
  Minus,
  Search
} from 'lucide-react'
import styles from './IconPicker.module.css'

const ROLE_ICONS = [
  { name: 'Shield', icon: Shield, category: 'badges' },
  { name: 'Crown', icon: Crown, category: 'badges' },
  { name: 'Star', icon: Star, category: 'badges' },
  { name: 'Award', icon: Award, category: 'badges' },
  { name: 'Zap', icon: Zap, category: 'badges' },
  { name: 'Heart', icon: Heart, category: 'badges' },
  { name: 'Sparkles', icon: Sparkles, category: 'badges' },
  { name: 'Flame', icon: Flame, category: 'badges' },
  { name: 'Trophy', icon: Trophy, category: 'badges' },
  { name: 'Target', icon: Target, category: 'badges' },
  { name: 'Sword', icon: Sword, category: 'tools' },
  { name: 'Hammer', icon: Hammer, category: 'tools' },
  { name: 'Wrench', icon: Wrench, category: 'tools' },
  { name: 'Settings', icon: Settings, category: 'tools' },
  { name: 'Code', icon: Code, category: 'tools' },
  { name: 'Palette', icon: Palette, category: 'creative' },
  { name: 'Music', icon: Music, category: 'creative' },
  { name: 'Video', icon: Video, category: 'creative' },
  { name: 'Mic', icon: Mic, category: 'creative' },
  { name: 'Headphones', icon: Headphones, category: 'creative' },
  { name: 'Camera', icon: Camera, category: 'creative' },
  { name: 'Image', icon: Image, category: 'creative' },
  { name: 'Book', icon: Book, category: 'education' },
  { name: 'Bookmark', icon: Bookmark, category: 'education' },
  { name: 'FileText', icon: FileText, category: 'education' },
  { name: 'Briefcase', icon: Briefcase, category: 'professional' },
  { name: 'Coffee', icon: Coffee, category: 'professional' },
  { name: 'Rocket', icon: Rocket, category: 'professional' },
  { name: 'PieChart', icon: PieChart, category: 'professional' },
  { name: 'BarChart', icon: BarChart, category: 'professional' },
  { name: 'TrendingUp', icon: TrendingUp, category: 'professional' },
  { name: 'Users', icon: Users, category: 'social' },
  { name: 'UserCheck', icon: UserCheck, category: 'social' },
  { name: 'UserPlus', icon: UserPlus, category: 'social' },
  { name: 'Mail', icon: Mail, category: 'social' },
  { name: 'MessageCircle', icon: MessageCircle, category: 'social' },
  { name: 'Send', icon: Send, category: 'social' },
  { name: 'Bell', icon: Bell, category: 'social' },
  { name: 'Flag', icon: Flag, category: 'navigation' },
  { name: 'Compass', icon: Compass, category: 'navigation' },
  { name: 'MapPin', icon: MapPin, category: 'navigation' },
  { name: 'Navigation', icon: Navigation, category: 'navigation' },
  { name: 'Globe', icon: Globe, category: 'navigation' },
  { name: 'Lock', icon: Lock, category: 'security' },
  { name: 'Unlock', icon: Unlock, category: 'security' },
  { name: 'Key', icon: Key, category: 'security' },
  { name: 'Eye', icon: Eye, category: 'security' },
  { name: 'EyeOff', icon: EyeOff, category: 'security' },
  { name: 'Check', icon: Check, category: 'status' },
  { name: 'X', icon: X, category: 'status' },
  { name: 'AlertCircle', icon: AlertCircle, category: 'status' },
  { name: 'Info', icon: Info, category: 'status' },
  { name: 'HelpCircle', icon: HelpCircle, category: 'status' }
]

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'badges', label: 'Badges' },
  { id: 'tools', label: 'Tools' },
  { id: 'creative', label: 'Creative' },
  { id: 'education', label: 'Education' },
  { id: 'professional', label: 'Professional' },
  { id: 'social', label: 'Social' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'security', label: 'Security' },
  { id: 'status', label: 'Status' }
]

interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  color?: string
}

export function IconPicker({ value, onChange, color = 'var(--text-primary)' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedIcon = ROLE_ICONS.find((icon) => icon.name === value)
  const SelectedIconComponent = selectedIcon?.icon

  const filteredIcons = ROLE_ICONS.filter((icon) => {
    const matchesCategory = selectedCategory === 'all' || icon.category === selectedCategory
    const matchesSearch = icon.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSelect = (iconName: string) => {
    onChange(iconName)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        style={{ color }}
      >
        {SelectedIconComponent ? (
          <SelectedIconComponent size={20} />
        ) : (
          <div className={styles.placeholder}>
            <Plus size={16} />
            <span>Select Icon</span>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.header}>
              <h3>Select Role Icon</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.searchContainer}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.categories}>
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`${styles.categoryButton} ${
                    selectedCategory === category.id ? styles.active : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className={styles.iconGrid}>
              {filteredIcons.length === 0 ? (
                <div className={styles.noResults}>
                  <Info size={24} />
                  <p>No icons found</p>
                </div>
              ) : (
                filteredIcons.map((icon) => {
                  const IconComponent = icon.icon
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      className={`${styles.iconButton} ${
                        value === icon.name ? styles.selected : ''
                      }`}
                      onClick={() => handleSelect(icon.name)}
                      title={icon.name}
                      style={{ color: value === icon.name ? color : undefined }}
                    >
                      <IconComponent size={24} />
                    </button>
                  )
                })
              )}
            </div>

            {value && (
              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => {
                    onChange('')
                    setIsOpen(false)
                  }}
                >
                  <Minus size={16} />
                  Remove Icon
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
