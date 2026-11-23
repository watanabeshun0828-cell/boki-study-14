import { Plus, Trash2 } from 'lucide-react'
import { accounts, money } from '../data'
import { parseYen, type Response } from '../lib/accounting'
import type { Question } from '../lib/schema'
import type { Draft } from '../lib/study'

export default function AnswerForm({ question, draft, disabled, change }: {
  question: Question; draft: Draft; disabled: boolean; change: (response: Response) => void
}) {
  const response = draft.response
  if (question.format === 'choice') {
    const order = draft.choiceOrder[question.id] ?? question.choices.map(choice => choice.id)
    return <fieldset className="choices" disabled={disabled}><legend>正しいものを1つ選んでください</legend>
      {order.map((id, index) => {
        const choice = question.choices.find(choice => choice.id === id)!
        return <label key={id} className={response.choiceId === id ? 'selected' : ''}>
          <input type="radio" name="choice" checked={response.choiceId === id} onChange={() => change({ ...response, choiceId: id })} />
          <span className="choice-letter">{String.fromCharCode(65 + index)}</span><span>{choice.text}</span>
        </label>
      })}
    </fieldset>
  }
  if (question.format === 'numeric') {
    return <fieldset disabled={disabled} className="numeric-fields"><legend>金額を整数円で入力してください</legend>
      {question.fields.map(field => <label key={field.id}>{field.label}<span>
        <input type="text" inputMode="numeric" autoComplete="off" value={response.values[field.id] ?? ''}
          onChange={event => change({ ...response, values: { ...response.values, [field.id]: event.target.value } })} />
        <span>{field.unit}</span><button type="button" className="sign-button" aria-label={`${field.label}の正負を切り替える`} onClick={() => {
          const value = (response.values[field.id] ?? '').normalize('NFKC').replace(/−/g, '-')
          change({ ...response, values: { ...response.values, [field.id]: value.startsWith('-') ? value.slice(1) : '-' + value } })
        }}>±</button>
      </span></label>)}
    </fieldset>
  }
  const updateLine = (index: number, values: Partial<Response['lines'][number]>) =>
    change({ ...response, lines: response.lines.map((line, position) => position === index ? { ...line, ...values } : line) })
  const inputTotal = (side: 'debit' | 'credit') => response.lines.filter(line => line.side === side).reduce((sum, line) => sum + (parseYen(line.amount) ?? 0), 0)
  return <fieldset disabled={disabled} className="journal-input">
    <legend>仕訳を入力してください。借方・貸方の中の行順は問いません。</legend>
    <div className="journal-sides">{(['debit', 'credit'] as const).map(side => {
      const title = side === 'debit' ? '借方' : '貸方'
      const rows = response.lines.map((line, index) => ({ ...line, index })).filter(line => line.side === side)
      return <section key={side} className={side}><h3>{title}<span>{side === 'debit' ? '左側' : '右側'}</span></h3>
        {rows.map((line, position) => <div className="journal-row" key={line.index}>
          <label><span>科目 {position + 1}</span><select aria-label={`${title} 科目${position + 1}`} value={line.accountId}
            onChange={event => updateLine(line.index, { accountId: event.target.value })}>
            <option value="">科目を選択</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select></label>
          <div className="journal-amount"><label><span>金額（円）</span><input type="text" inputMode="numeric" autoComplete="off"
            aria-label={`${title} 金額${position + 1}`} value={line.amount} onChange={event => updateLine(line.index, { amount: event.target.value })} /></label>
            {rows.length > 1 && <button type="button" className="icon-button" aria-label={`${title}の${position + 1}行目を削除`}
              onClick={() => change({ ...response, lines: response.lines.filter((_, index) => index !== line.index) })}><Trash2 size={16} /></button>}
          </div>
        </div>)}
        {rows.length < 6 && <button type="button" className="add-line" onClick={() => change({
          ...response, lines: [...response.lines, { side, accountId: '', amount: '' }]
        })}><Plus size={15} />{title}の行を追加</button>}
        <div className="journal-total"><span>{title}合計</span><strong>{money(inputTotal(side))}</strong></div>
      </section>
    })}</div>
  </fieldset>
}
