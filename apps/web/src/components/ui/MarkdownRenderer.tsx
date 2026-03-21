import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-sql'

import styles from '../../styles/modules/ui/MarkdownRenderer.module.css'

interface MarkdownRendererProps {
  content: string
}

// ── Singularity Tag Processor ────────────────────────────────────────
// Processes custom tags BEFORE ReactMarkdown sees them.

function processSingularityTags(raw: string): string {
  let processed = raw

  // Spoilers: ||text|| → __SPOILER_START__text__SPOILER_END__
  processed = processed.replace(/\|\|(.*?)\|\|/g, '__SPOILER_START__$1__SPOILER_END__')

  // v3 Easter egg shorthands — inline syntax sugar
  // --text-- → glitch effect
  processed = processed.replace(/--([^-]+)--/g, '[glitch]$1[/glitch]')
  // ^^text^^ → bounce effect
  processed = processed.replace(/\^\^([^^]+)\^\^/g, '[bounce]$1[/bounce]')
  // %%text%% → flip effect
  processed = processed.replace(/%%([^%]+)%%/g, '[flip]$1[/flip]')
  // >>text<< → typing animation
  processed = processed.replace(/>>([^<]+)<</g, '[type]$1[/type]')

  return processed
}

// ── Singularity Tag Components ───────────────────────────────────────

function GhostText({ children }: { children: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <span
      className={`${styles.ghostText} ${revealed ? styles.ghostRevealed : ''}`}
      onMouseDown={() => setRevealed(true)}
      onMouseUp={() => setRevealed(false)}
      onMouseLeave={() => setRevealed(false)}
    >
      {children}
    </span>
  )
}

function RainbowText({ children }: { children: string }) {
  return <span className={styles.rainbowText}>{children}</span>
}

function ShakeText({ children }: { children: string }) {
  return <span className={styles.shakeText}>{children}</span>
}

function BlurText({ children }: { children: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <span
      className={`${styles.blurText} ${revealed ? styles.blurRevealed : ''}`}
      onClick={() => setRevealed(!revealed)}
    >
      {children}
    </span>
  )
}

function SystemText({ children }: { children: string }) {
  const [displayText, setDisplayText] = useState('')
  const fullText = children

  useEffect(() => {
    let i = 0
    setDisplayText('')
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1))
      i++
      if (i >= fullText.length) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [fullText])

  return (
    <span className={styles.systemText}>
      <span className={styles.systemPrefix}>[SYSTEM]</span> {displayText}
      <span className={styles.systemCursor}>▌</span>
    </span>
  )
}

function NeonGlowText({ children }: { children: string }) {
  return <span className={styles.neonGlow}>{children}</span>
}

// v3: Easter egg text components

function GlitchText({ children }: { children: string }) {
  return (
    <span className={styles.glitchText} data-text={children}>
      {children}
    </span>
  )
}

function BounceText({ children }: { children: string }) {
  return (
    <span className={styles.bounceText}>
      {children.split('').map((char, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.05}s` }}>{char}</span>
      ))}
    </span>
  )
}

function FlipText({ children }: { children: string }) {
  return <span className={styles.flipText}>{children}</span>
}

function TypewriterText({ children }: { children: string }) {
  const [displayText, setDisplayText] = useState('')
  const fullText = children

  useEffect(() => {
    let i = 0
    setDisplayText('')
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i + 1))
      i++
      if (i >= fullText.length) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [fullText])

  return (
    <span className={styles.typewriterText}>
      {displayText}
      <span className={styles.typewriterCursor}>|</span>
    </span>
  )
}

// ── Inline Tag Renderer ──────────────────────────────────────────────
// Renders a string that may contain custom tags into JSX elements.

function renderCustomInline(text: string): React.ReactNode[] {
  const tagRegex = /\[(ghost|rainbow|shake|blur|system|glitch|bounce|flip|type)\](.*?)\[\/\1\]/g
  const neonRegex = /\*\*(.*?)\*\*\s*-\*/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Merge both regex patterns into a single pass
  const combined = new RegExp(`${tagRegex.source}|${neonRegex.source}`, 'g')

  while ((match = combined.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // Custom tag match: [tag]text[/tag]
      const tag = match[1]
      const inner = match[2]
      switch (tag) {
        case 'ghost': parts.push(<GhostText key={match.index}>{inner}</GhostText>); break
        case 'rainbow': parts.push(<RainbowText key={match.index}>{inner}</RainbowText>); break
        case 'shake': parts.push(<ShakeText key={match.index}>{inner}</ShakeText>); break
        case 'blur': parts.push(<BlurText key={match.index}>{inner}</BlurText>); break
        case 'system': parts.push(<SystemText key={match.index}>{inner}</SystemText>); break
        case 'glitch': parts.push(<GlitchText key={match.index}>{inner}</GlitchText>); break
        case 'bounce': parts.push(<BounceText key={match.index}>{inner}</BounceText>); break
        case 'flip': parts.push(<FlipText key={match.index}>{inner}</FlipText>); break
        case 'type': parts.push(<TypewriterText key={match.index}>{inner}</TypewriterText>); break
      }
    } else if (match[3]) {
      // Neon glow match: **text** -*
      parts.push(<NeonGlowText key={match.index}>{match[3]}</NeonGlowText>)
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

// ── Main Component ───────────────────────────────────────────────────

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderContent = processSingularityTags(content)

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const codeRef = useRef<HTMLElement>(null)

      useEffect(() => {
        if (codeRef.current && match) {
          Prism.highlightElement(codeRef.current)
        }
      }, [children, match])

      return !inline && match ? (
        <div className={styles.codeBlockWrapper}>
          <div className={styles.codeHeader}>
            <span>{match[1].toUpperCase()}</span>
          </div>
          <pre className={className}>
            <code ref={codeRef} className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className={inline ? styles.inlineCode : className} {...props}>
          {children}
        </code>
      )
    },
    // Override paragraph to intercept custom tags in text nodes
    p({ children, ...props }: any) {
      const processed = Array.isArray(children)
        ? children.map((child: any, i: number) =>
          typeof child === 'string'
            ? <span key={i}>{renderCustomInline(child)}</span>
            : child
        )
        : typeof children === 'string'
          ? renderCustomInline(children)
          : children

      return <p {...props}>{processed}</p>
    }
  }

  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...(components as any),
          text({ value }: any) {
            if (value.includes('__SPOILER_START__')) {
              const parts = value.split(/__SPOILER_START__|__SPOILER_END__/);
              return (
                <>
                  {parts.map((part: string, i: number) =>
                    i % 2 === 1 ? (
                      <span key={i} className={styles.spoiler} onClick={(e) => e.currentTarget.classList.toggle(styles.revealed)}>
                        {part}
                      </span>
                    ) : part
                  )}
                </>
              );
            }
            // Process custom inline tags in all text
            const inlineElements = renderCustomInline(value)
            return <>{inlineElements}</>
          }
        }}
      >
        {renderContent}
      </ReactMarkdown>
    </div>
  )
}
