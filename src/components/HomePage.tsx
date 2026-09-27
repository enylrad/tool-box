import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { groupByCategory } from '../tools/homeSections'
import { TOOL_CATEGORIES, TOOLS } from '../tools/registry'

const SECTIONS = groupByCategory(TOOLS, TOOL_CATEGORIES)

export function HomePage() {
  useDocumentTitle()

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tool Box</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          A collection of handy tools that run entirely on your computer. Nothing is uploaded to a server, and once
          loaded the site keeps working offline.
        </p>
        {SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`category-${section.id}`} className="mt-10">
            <h2
              id={`category-${section.id}`}
              className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
            >
              {section.name}
            </h2>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.tools.map((tool) => (
                <li key={tool.id}>
                  <Link
                    to={tool.path}
                    className="block h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
                  >
                    <h3 className="font-semibold">{tool.name}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{tool.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
