import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './components/HomePage'
import { Layout } from './components/Layout'
import { TOOLS } from './tools/registry'

function LoadingFallback() {
  return <p className="p-6 text-sm text-slate-500">Loading…</p>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {TOOLS.map(({ id, path, component: ToolComponent }) => (
          <Route
            key={id}
            path={path}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ToolComponent />
              </Suspense>
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
