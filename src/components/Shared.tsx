import { useEffect, useRef, type ReactNode } from 'react'
import { X, Check, ExternalLink } from 'lucide-react'
import { accountMap, config, money, sourceMap } from '../data'
import type { Entry } from '../lib/schema'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}
export function Progress({ value, label }: { value: number; label: string }) {
  return <div className="progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: value + '%' }} />
  </div>
}
export function Guide({ children }: { children: ReactNode }) {
  return <aside className="guide">
    {config.guideCharacterUrl && <img src={import.meta.env.BASE_URL + config.guideCharacterUrl} alt="副業のススメくん" width="90" height="90" />}
    <div><span className="guide-name">副業のススメくん</span><p>{children}</p></div>
  </aside>
}
export function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={close}
    onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={close} aria-label="閉じる"><X size={20} /></button></div>
    {children}
  </dialog>
}
export function ReferenceLinks({ ids }: { ids: string[] }) {
  return <details className="references"><summary>この内容の出典・前提</summary>
    <ul>{[...new Set(ids)].map(id => {
      const source = sourceMap.get(id)
      if (!source) return null
      return <li key={id}>
        {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink size={12} /></a> : <strong>{source.title}</strong>}
        <p>{source.location}</p><span>{source.role} · 確認日 {source.checkedAt}</span>
      </li>
    })}</ul>
  </details>
}
export function EntryTable({ entries }: { entries: Entry[] }) {
  const debit = entries.filter(entry => entry.side === 'debit')
  const credit = entries.filter(entry => entry.side === 'credit')
  return <div className="entry-table" aria-label="仕訳">
    <div><h4>借方（左）</h4>{debit.map((entry, index) => <p key={index}><span>{accountMap.get(entry.accountId)?.name}</span><strong>{money(entry.amount)}</strong></p>)}</div>
    <div><h4>貸方（右）</h4>{credit.map((entry, index) => <p key={index}><span>{accountMap.get(entry.accountId)?.name}</span><strong>{money(entry.amount)}</strong></p>)}</div>
  </div>
}
export function ReadBadge({ read }: { read: boolean }) {
  return <span className={`tag ${read ? 'success' : ''}`}>{read && <Check size={12} />}{read ? '読了' : '未読'}</span>
}
