import katex from 'katex'

/**
 * Render markdown content (specifically designed for small snippets like headings)
 * using a lightweight approach without heavy dependencies.
 *
 * @param content The markdown string to render
 */
export async function renderMarkdownSnippet(content: string) {
  // 1. Handle LaTeX Math ($...$)
  // We split by the math pattern to handle text and math separately
  // Regex explanation: Matches $...$ but ignores \$ (escaped dollar sign)
  // Group 1 captures the content inside $...$
  const parts = content.split(/(\$(?:\\.|[^$\\])*\$)/g)
  
  return parts.map(part => {
    // Check if this part is a math expression
    if (part.startsWith('$') && part.endsWith('$')) {
      const mathContent = part.slice(1, -1)
      try {
        return katex.renderToString(mathContent, {
          throwOnError: false,
          displayMode: false
        })
      } catch {
        return part // Fallback to raw text on error
      }
    }
    
    // For non-math parts, apply basic markdown formatting and HTML escaping
    // Note: This is a simplified implementation. For full markdown support,
    // we would need a parser, but the goal here is to be lightweight.
    let text = part
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      
    // Basic Markdown Support
    // Bold: **text** or __text__
    text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
    // Italic: *text* or _text_
    text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
    // Code: `text`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
    
    return text
  }).join('')
}

/**
 * Extract headings from markdown content, preserving LaTeX delimiters.
 * This is needed because Astro's default heading extraction strips LaTeX delimiters
 * (e.g. `$E=mc^2$` becomes `E=mc^2`).
 * 
 * @param content The raw markdown content
 */
export function extractHeadings(content: string): { depth: number; text: string }[] {
  const headings: { depth: number; text: string }[] = []
  const lines = content.split('\n')
  let inCodeBlock = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check for code blocks
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    
    if (inCodeBlock) continue
    
    // Match headings (ATX style: # Heading)
    const match = line.match(/^(#{1,6})\s+(.*)$/)
    if (match) {
      headings.push({
        depth: match[1].length,
        text: match[2].trim()
      })
    }
  }

  return headings
}
