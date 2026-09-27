import { useMemo, useState } from 'react'
import { Button } from '../../../components/Button'
import { Panel } from '../../../components/Panel'
import { useClipboard } from '../../../hooks/useClipboard'
import { downloadBlob } from '../../../lib/download'
import { countLeaves, filterTree, treeToJson, type TreeNode } from '../lib/rawTree'

function TreeLeaf({ node }: { node: TreeNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 py-1 sm:grid-cols-[minmax(10rem,16rem)_1fr]">
      <span className="font-mono text-xs break-all text-slate-500 dark:text-slate-400">{node.key}</span>
      <span className="min-w-0 text-xs break-words whitespace-pre-wrap">
        {node.value}
        {node.raw && <span className="ml-2 font-mono text-slate-400 dark:text-slate-500">({node.raw})</span>}
      </span>
    </div>
  )
}

function TreeBranch({ node, depth, open }: { node: TreeNode; depth: number; open: boolean }) {
  const children = node.children ?? []
  return (
    <details open={open} className={depth === 0 ? 'rounded-lg border border-slate-200 dark:border-slate-800' : 'pl-3'}>
      <summary
        className={`cursor-pointer select-none ${depth === 0 ? 'px-3 py-2 text-sm font-semibold' : 'py-1 font-mono text-xs text-slate-600 dark:text-slate-300'}`}
      >
        {node.key}
        <span className="ml-2 font-sans text-xs font-normal text-slate-400">{countLeaves(children)}</span>
        {node.value && <span className="ml-2 font-sans text-xs font-normal">{node.value}</span>}
      </summary>
      <div className={depth === 0 ? 'divide-y divide-slate-100 border-t border-slate-200 px-3 pb-2 dark:divide-slate-800 dark:border-slate-800' : 'border-l border-slate-200 dark:border-slate-700'}>
        <TreeNodes nodes={children} depth={depth + 1} open={open} />
      </div>
    </details>
  )
}

function TreeNodes({ nodes, depth, open }: { nodes: TreeNode[]; depth: number; open: boolean }) {
  return nodes.map((node, index) =>
    node.children ? <TreeBranch key={`${node.key}-${index}`} node={node} depth={depth} open={open} /> : <TreeLeaf key={`${node.key}-${index}`} node={node} />,
  )
}

interface RawMetadataTreeProps {
  tree: TreeNode[]
  rawXmp?: string
  fileName: string
}

/** "Expert mode": every tag of every metadata block, as stored in the file. */
export function RawMetadataTree({ tree, rawXmp, fileName }: RawMetadataTreeProps) {
  const [query, setQuery] = useState('')
  const { copy, copied } = useClipboard()
  const visible = useMemo(() => filterTree(tree, query), [tree, query])
  const json = () => JSON.stringify(treeToJson(tree), null, 2)
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'photo'

  return (
    <Panel
      title="All metadata (expert mode)"
      description={`${countLeaves(tree)} values in ${tree.length} blocks: ${tree.map((node) => node.key).join(', ')}.`}
    >
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter tags or values…"
          aria-label="Filter metadata"
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <Button onClick={() => copy(json())}>{copied ? 'Copied!' : 'Copy JSON'}</Button>
        <Button onClick={() => downloadBlob(new Blob([json()], { type: 'application/json' }), `${baseName}-metadata.json`)}>
          Download JSON
        </Button>
      </div>
      {tree.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">This file contains no metadata.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nothing matches “{query}”.</p>
      ) : (
        // Remount when filtering so matching branches open automatically.
        <div key={query ? 'filtered' : 'all'} className="space-y-2">
          <TreeNodes nodes={visible} depth={0} open={Boolean(query.trim())} />
        </div>
      )}
      {rawXmp && (
        <details className="rounded-lg border border-slate-200 dark:border-slate-800">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Raw XMP packet</summary>
          <pre className="max-h-96 overflow-auto border-t border-slate-200 p-3 text-xs break-all whitespace-pre-wrap dark:border-slate-800">
            {rawXmp}
          </pre>
        </details>
      )}
    </Panel>
  )
}
