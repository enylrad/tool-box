export const SAMPLE_MARKDOWN = `# Welcome to the Markdown Converter

Write **Markdown** on the left and see the result on the right.
Everything runs *locally in your browser* — nothing is uploaded anywhere.

## Features

- Live preview with GitHub-flavored Markdown
- Syntax highlighting for code blocks
- Export to **PDF** or a clean, standalone **HTML** file
- Your text is saved automatically in this browser

## Code

\`\`\`kotlin
data class Tool(val name: String, val offline: Boolean = true)

fun main() {
    val tools = listOf(Tool("Markdown to PDF"))
    tools.forEach { println("\${it.name} runs offline: \${it.offline}") }
}
\`\`\`

\`\`\`ts
const greet = (name: string): string => \`Hello, \${name}!\`
\`\`\`

## Table

| Format | Extension | Offline |
| ------ | --------- | :-----: |
| PDF    | \`.pdf\`    | ✅      |
| HTML   | \`.html\`   | ✅      |

## Task list

- [x] Write some Markdown
- [ ] Export it

> **Tip:** start the document with a \`# Heading\` — it is used as the file name when exporting.

---

Made with [marked](https://marked.js.org) and [highlight.js](https://highlightjs.org).
`
