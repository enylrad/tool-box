import highlightThemeCss from 'highlight.js/styles/github.css?raw'
import documentCss from '../styles/document.css?raw'

/** The same styles used by the live preview, inlined into exported files. */
export const EXPORT_CSS = `${documentCss}\n${highlightThemeCss}`
