import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-6" />
          Tool Box
        </Link>
        <span className="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
          Runs 100% in your browser — your data never leaves your device
        </span>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
