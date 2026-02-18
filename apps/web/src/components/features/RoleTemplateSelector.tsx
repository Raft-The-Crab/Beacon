import { useState } from 'react'
import { Search, X } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { ROLE_TEMPLATES, RoleTemplate, searchRoleTemplates, getRoleTemplatesByCategory } from '../../utils/roleTemplates'
import { Button } from '../ui/Button'
import styles from './RoleTemplateSelector.module.css'

interface RoleTemplateSelectorProps {
  onSelect: (template: RoleTemplate) => void
  onCancel: () => void
}

export function RoleTemplateSelector({ onSelect, onCancel }: RoleTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'management' | 'members' | 'bots'>('all')

  const filteredTemplates = searchQuery
    ? searchRoleTemplates(searchQuery)
    : selectedCategory === 'all'
    ? ROLE_TEMPLATES
    : getRoleTemplatesByCategory(selectedCategory)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Choose Role Template</h3>
        <button type="button" className={styles.closeButton} onClick={onCancel}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.searchContainer}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.categories}>
        <button
          type="button"
          className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`${styles.categoryButton} ${selectedCategory === 'management' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('management')}
        >
          Management
        </button>
        <button
          type="button"
          className={`${styles.categoryButton} ${selectedCategory === 'members' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('members')}
        >
          Members
        </button>
        <button
          type="button"
          className={`${styles.categoryButton} ${selectedCategory === 'bots' ? styles.active : ''}`}
          onClick={() => setSelectedCategory('bots')}
        >
          Bots
        </button>
      </div>

      <div className={styles.templates}>
        {filteredTemplates.map((template) => {
          const IconComponent = template.icon && template.icon in LucideIcons
            ? (LucideIcons as any)[template.icon]
            : null

          return (
            <button
              key={template.id}
              type="button"
              className={styles.templateCard}
              onClick={() => onSelect(template)}
            >
              <div className={styles.templateIcon} style={{ backgroundColor: `${template.color}20` }}>
                {IconComponent && <IconComponent size={24} style={{ color: template.color }} />}
              </div>
              <div className={styles.templateInfo}>
                <h4 className={styles.templateName} style={{ color: template.color }}>
                  {template.name}
                </h4>
                <p className={styles.templateDescription}>{template.description}</p>
                <div className={styles.permissionCount}>
                  {template.permissions.length} permission{template.permissions.length !== 1 ? 's' : ''}
                </div>
              </div>
            </button>
          )
        })}

        {filteredTemplates.length === 0 && (
          <div className={styles.noResults}>
            <p>No templates found</p>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => onSelect({
          id: 'custom',
          name: 'New Role',
          description: 'Custom role',
          icon: 'Shield',
          color: '#99aab5',
          permissions: ['VIEW_CHANNELS', 'SEND_MESSAGES']
        })}>
          Create Custom Role
        </Button>
      </div>
    </div>
  )
}
