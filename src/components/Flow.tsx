import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { accountMap, accounts, money, scenario } from '../data'
import { statements, totals, trialBalance } from '../lib/accounting'
import { EntryTable, Panel, ReferenceLinks } from './Shared'

const stages = ['取引', '仕訳', '元帳', '試算表', '決算書']
export default function Flow() {
  const [stage, setStage] = useState(0)
  const [adjusted, setAdjusted] = useState(false)
  const [selected, setSelected] = useState(scenario.transactions[0].id)
  const [accountId, setAccountId] = useState('bank')
  const transactions = scenario.transactions.filter(transaction => adjusted || !transaction.adjustment)
  const transaction = transactions.find(item => item.id === selected) ?? transactions[0]
  const entries = transactions.flatMap(item => item.entries)
  const rows = trialBalance(entries, accounts)
  const result = statements(entries, accounts)
  const ledgerRows = transactions.flatMap(item => item.entries.filter(entry => entry.accountId === accountId)
    .map(entry => ({ ...entry, transaction: item })))
  let running = 0
  return <>
    <div className="page-intro"><p className="eyebrow">FOLLOW THE SAME TRANSACTIONS</p><h1>取引が、決算書になるまで。</h1><p>架空店舗の同じ仕訳データを、見方を変えて追います。</p></div>
    <Panel>
      <div className="section-head"><h2>{scenario.title}</h2><span className="tag">練習用の仮定</span></div>
      <p className="small">段階を選ぶと、同じ取引を日付順・科目別・残高・財務諸表として見ることができます。</p>
      <div className="flow-steps" role="group" aria-label="帳簿の段階">{stages.map((label, index) => <div key={label}>
        <button aria-pressed={stage === index} onClick={() => setStage(index)}><span>{index + 1}</span>{label}</button>
        {index < 4 && <ArrowRight size={16} aria-hidden="true" />}
      </div>)}</div>
      <label className="check-label"><input type="checkbox" checked={adjusted} onChange={event => setAdjusted(event.target.checked)} />決算整理6件を含める</label>
      <p className="flow-state">{adjusted ? '決算整理後' : '決算整理前'} · {transactions.length}件の仕訳を集計</p>
      <details className="assumptions"><summary>総合設例のすべての前提</summary><ul>{scenario.assumptions.map(item => <li key={item}>{item}</li>)}</ul></details>
    </Panel>
    <Panel className="flow-content">
      {stage === 0 && <><h2>取引を読む</h2><label className="wide-select">取引を選ぶ<select value={transaction.id} onChange={event => setSelected(event.target.value)}>{transactions.map(item => <option key={item.id} value={item.id}>{item.date} · {item.description}</option>)}</select></label><p className="transaction-description">{transaction.description}</p><EntryTable entries={transaction.entries} /><p className="small muted">記録する原因を、日付とともに仕訳へ結び付けます。</p></>}
      {stage === 1 && <><h2>仕訳帳・日付順の記録</h2><div className="journal-book">{transactions.map(item => <article key={item.id}><p className="small muted">{item.date}{item.adjustment && ' · 決算整理'}</p><h3>{item.description}</h3><EntryTable entries={item.entries} /><p className="check-line"><CheckCircle2 size={14} />借方・貸方 ともに{money(totals(item.entries).debit)}</p></article>)}</div></>}
      {stage === 2 && <><h2>総勘定元帳・科目別の記録</h2><label className="wide-select">元帳の科目<select value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.filter(account => entries.some(entry => entry.accountId === account.id)).map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>
        <div className="table-wrap"><table><caption>{accountMap.get(accountId)?.name} 元帳（円）</caption><thead><tr><th>日付・取引</th><th>借方</th><th>貸方</th><th>残高</th></tr></thead>
          <tbody>{ledgerRows.map((row, index) => {
            running += row.side === 'debit' ? row.amount : -row.amount
            return <tr key={index}><th scope="row"><span>{row.transaction.date}</span><small>{row.transaction.description}</small></th><td>{row.side === 'debit' ? row.amount.toLocaleString('ja-JP') : '—'}</td><td>{row.side === 'credit' ? row.amount.toLocaleString('ja-JP') : '—'}</td><td>{running >= 0 ? '借' : '貸'} {Math.abs(running).toLocaleString('ja-JP')}</td></tr>
          })}</tbody>
        </table></div><p className="small muted">仕訳と同じ側へ転記し、借方合計と貸方合計の差を残高として追っています。</p>
      </>}
      {stage === 3 && <><h2>残高試算表</h2><div className="table-wrap"><table><caption>{adjusted ? '決算整理後' : '決算整理前'}の残高（円）</caption><thead><tr><th>科目</th><th>借方残高</th><th>貸方残高</th></tr></thead><tbody>{rows.filter(row => row.net !== 0).map(row => <tr key={row.id}><th scope="row">{row.name}</th><td>{row.debit ? row.debit.toLocaleString('ja-JP') : '—'}</td><td>{row.credit ? row.credit.toLocaleString('ja-JP') : '—'}</td></tr>)}</tbody>
        <tfoot><tr><th>合計</th><td>{rows.reduce((sum, row) => sum + row.debit, 0).toLocaleString('ja-JP')}</td><td>{rows.reduce((sum, row) => sum + row.credit, 0).toLocaleString('ja-JP')}</td></tr></tfoot>
      </table></div><p className="check-line"><CheckCircle2 size={16} />貸借合計が一致。科目や記帳漏れは別に確認します。</p></>}
      {stage === 4 && <><h2>{adjusted ? '決算整理後の財務諸表' : '整理前の残高で見た暫定集計'}</h2>
        {!adjusted && <p className="notice">決算書を完成させるには、上の「決算整理6件を含める」を選んでください。整理前との金額の違いも比べられます。</p>}
        <div className="statements">
          <section><h3>損益計算書</h3><p className="small muted">2026年1月1日〜12月31日</p>
            <dl>{rows.filter(row => row.type === 'revenue' || row.type === 'expense').map(row => <div key={row.id}><dt>{row.id === 'purchase' ? '売上原価' : row.name}</dt><dd>{money(row.type === 'revenue' ? -row.net : row.net)}</dd></div>)}
              <div className="subtotal"><dt>収益合計</dt><dd>{money(result.revenue)}</dd></div><div className="subtotal"><dt>費用合計</dt><dd>{money(result.expenses)}</dd></div><div className="grand-total"><dt>当期利益</dt><dd>{money(result.profit)}</dd></div>
            </dl>
          </section>
          <section><h3>貸借対照表</h3><p className="small muted">2026年12月31日現在</p>
            <dl>{rows.filter(row => ['asset', 'contraAsset', 'liability'].includes(row.type) && row.net !== 0).map(row => <div key={row.id}><dt>{row.name}{row.type === 'contraAsset' && '（控除）'}</dt><dd>{money(row.type === 'liability' ? -row.net : row.net)}</dd></div>)}
              <div className="subtotal"><dt>純額資産 合計</dt><dd>{money(result.assets)}</dd></div><div className="subtotal"><dt>負債 合計</dt><dd>{money(result.liabilities)}</dd></div>
              <div><dt>資本金</dt><dd>{money(scenario.initialEquity)}</dd></div><div><dt>当期利益の持越し</dt><dd>{money(result.profit)}</dd></div><div className="grand-total"><dt>純資産 合計</dt><dd>{money(result.endingEquity)}</dd></div>
            </dl>
          </section>
        </div><div className="audit-result"><h3><CheckCircle2 size={19} />つながりを検算</h3><p>資産 {money(result.assets)} ＝ 負債 {money(result.liabilities)} ＋ 純資産 {money(result.endingEquity)}</p><p>純資産 {money(result.endingEquity)} − 設立時 {money(scenario.initialEquity)} ＝ 当期利益 {money(result.profit)}</p><p className="small">この設例は、設立後の増資・配当などがない条件です。</p></div>
      </>}
      <ReferenceLinks ids={scenario.referenceIds} />
    </Panel>
  </>
}
