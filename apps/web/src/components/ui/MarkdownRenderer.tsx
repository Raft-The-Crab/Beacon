import React from 'react'
import styles from './MarkdownRenderer.module.css'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseMarkdown = (_text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    let keyCounter = 0

    // Regex patterns
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)```/g
    const inlineCodePattern = /`([^`]+)`/g
    const boldPattern = /\*\*(.+?)\*\*/g
    const italicPattern = /\*(.+?)\*/g
    const strikethroughPattern = /~~(.+?)~~/g
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
    const mentionPattern = /@(\w+)/g
    const channelPattern = /#([\w-]+)/g
    const spoilerPattern = /\|\|(.+?)\|\|/g

    const processText = (str: string, startKey: number): [React.ReactNode[], number] => {
      const parts: React.ReactNode[] = []
      let lastIndex = 0
      let key = startKey

      // Code blocks (must be processed first)
      let match
      const codeBlocks: { index: number; length: number; element: React.ReactNode }[] = []
      
      while ((match = codeBlockPattern.exec(str)) !== null) {
        const language = match[1] || 'text'
        const code = match[2]
        if (match.index > lastIndex) {
          parts.push(str.slice(lastIndex, match.index))
        }
        codeBlocks.push({
          index: match.index,
          length: match[0].length,
          element: (
            <pre key={key++} className={styles.codeBlock}>
              <code className={`language-${language}`}>{code}</code>
            </pre>
          ),
        })
        lastIndex = match.index + match[0].length
      }

      if (codeBlocks.length > 0) {
        // Process text between code blocks
        lastIndex = 0
        codeBlocks.forEach((block) => {
          if (block.index > lastIndex) {
            const textSegment = str.slice(lastIndex, block.index)
            parts.push(...processInlineMarkdown(textSegment, key))
            key += textSegment.length
          }
          parts.push(block.element)
          lastIndex = block.index + block.length
        })
        if (lastIndex < str.length) {
          const textSegment = str.slice(lastIndex)
          parts.push(...processInlineMarkdown(textSegment, key))
          key += textSegment.length
        }
      } else {
        parts.push(...processInlineMarkdown(str, key))
        key += str.length
      }

      return [parts, key]
    }

    const processInlineMarkdown = (str: string, startKey: number): React.ReactNode[] => {
      let result = str

      // Inline code
      result = result.replace(inlineCodePattern, (_match, code) => {
        return `<code class="${styles.inlineCode}">${code}</code>`
      })

      // Bold
      result = result.replace(boldPattern, (_match, text) => {
        return `<strong>${text}</strong>`
      })

      // Italic
      result = result.replace(italicPattern, (_match, text) => {
        return `<em>${text}</em>`
      })

      // Strikethrough
      result = result.replace(strikethroughPattern, (_match, text) => {
        return `<s>${text}</s>`
      })

      // Spoiler
      result = result.replace(spoilerPattern, (_match, text) => {
        return `<span class="${styles.spoiler}">${text}</span>`
      })

      // Links
      result = result.replace(linkPattern, (_match, text, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${styles.link}">${text}</a>`
      })

      // Mentions
      result = result.replace(mentionPattern, (_match, username) => {
        return `<span class="${styles.mention}">@${username}</span>`
      })

      // Channels
      result = result.replace(channelPattern, (_match, channel) => {
        return `<span class="${styles.channel}">#${channel}</span>`
      })

      // Return as dangerouslySetInnerHTML (safe because we control the HTML)
      return [<span key={startKey} dangerouslySetInnerHTML={{ __html: result }} />]
    }

    const [parsed, _finalKey] = processText(content, keyCounter)
    elements.push(...parsed)

    return elements
  }

  return <div className={styles.markdown}>{parseMarkdown(content)}</div>
}
