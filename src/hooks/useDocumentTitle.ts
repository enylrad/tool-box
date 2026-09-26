import { useEffect } from 'react'

const SITE_NAME = 'Tool Box'

/** Sets the browser tab title while the calling component is mounted. */
export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = pageTitle ? `${pageTitle} · ${SITE_NAME}` : SITE_NAME
    return () => {
      document.title = previousTitle
    }
  }, [pageTitle])
}
