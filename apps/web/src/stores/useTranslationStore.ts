import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const localeModules = import.meta.glob('../locales/*.json', { eager: true, import: 'default' }) as Record<string, any>
const defaultLocale = localeModules['../locales/en.json'] || {}

interface TranslationState {
    language: string
    locales: Record<string, any>
    setLanguage: (lang: string) => void
    t: (key: string, variables?: Record<string, any>) => string
}

export const useTranslationStore = create<TranslationState>()(
    persist(
        (set, get) => ({
            language: 'en',
            locales: Object.fromEntries(
                Object.entries(localeModules).map(([path, locale]) => {
                    const match = path.match(/\.\.\/locales\/(.+)\.json$/)
                    return [match?.[1] || path, locale]
                })
            ),

            setLanguage: async (lang: string) => {
                const currentLocales = get().locales
                if (currentLocales[lang]) {
                    set({ language: lang })
                } else {
                    console.warn(`Local file for ${lang} not found, using English fallback`)
                    set({ language: 'en' })
                }
            },

            t: (key: string, variables?: Record<string, any>) => {
                const { language, locales } = get()
                const data = locales[language] || locales['en'] || defaultLocale
                const english = locales['en'] || defaultLocale

                const resolvePath = (source: any): string | undefined => {
                    const keys = key.split('.')
                    let value = source
                    for (const k of keys) {
                        value = value?.[k]
                        if (value === undefined || value === null) break
                    }
                    return typeof value === 'string' ? value : undefined
                }

                // First try active language, then fallback to English per key.
                let value = resolvePath(data) ?? resolvePath(english)

                if (typeof value !== 'string') return variables?.defaultValue || key

                // Handle placeholders: "Welcome, {name}"
                if (variables) {
                    Object.entries(variables).forEach(([k, v]) => {
                        if (k === 'defaultValue') return
                        value = (value as string).replace(new RegExp(`{${k}}`, 'g'), String(v))
                    })
                }

                return value
            }
        }),
        {
            name: 'beacon-language-storage',
            partialize: (state) => ({ language: state.language })
        }
    )
)
