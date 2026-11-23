import { useState, type ChangeEvent } from 'react'
import { Download, ExternalLink, Upload } from 'lucide-react'
import glossary from '../data/glossary.json'
import { accounts, config, lessons, sources } from '../data'
import { exportBackup, importBackup } from '../lib/backup'
import { useStudy } from '../lib/store'
import type { StudyState } from '../lib/study'
import { Dialog, Panel } from './Shared'

export function Glossary() {
  const [query, setQuery] = useState('')
  const items = [...glossary, ...accounts.map(account => ({
    id: 'account-' + account.id, term: account.name, description: account.description, referenceIds: account.referenceIds
  }))]
  const search = query.normalize('NFKC').toLowerCase().trim()
  const matching = items.filter(item => (item.term + item.description).normalize('NFKC').toLowerCase().includes(search))
  return <>
    <div className="page-intro"><p className="eyebrow">SMALL DICTIONARY</p><h1>用語を、すぐ確認。</h1><p>専門語と、この教材で使う勘定科目を調べられます。</p></div>
    <label className="search-label">用語・説明を検索<input type="search" placeholder="例　借方、前払、元帳" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <p className="small muted" role="status">{matching.length}件</p>
    <div className="glossary-list">{matching.map(item => <Panel key={item.id}><h2>{item.term}</h2><p>{item.description}</p></Panel>)}</div>
    {!matching.length && <Panel><p>一致する用語がありません。別の言葉で検索してください。</p></Panel>}
  </>
}
export function Sources() {
  return <>
    <div className="page-intro"><p className="eyebrow">SOURCES & COVERAGE</p><h1>出典と、この教材の範囲。</h1><p>確認日 {config.checkedAt} · 対象 {config.targetYear}</p></div>
    <Panel><h2>非公式の学習補助教材・重点学習教材</h2><p>講義・設問・解説・図・金額・架空証憑は、このアプリのために作成しています。AIが作成し、形式・計算・参照関係の自動検証を行っています。人の専門家による監修は未実施です。</p>
      <p className="notice">{config.scopeNotice}</p>
      <p>日常取引、主要簿、試算表、主な決算整理と財務諸表のつながりを扱います。商品有高帳の連続入力、3伝票の集計、8桁精算表、帳簿締切りの全工程、実際のネット試験画面での時間配分などは、追加練習が必要です。</p>
      <p className="small">外部資料はオンラインで開きます。収録された講義・問題・図解はオフラインで使えます。</p>
    </Panel>
    <div className="source-list">{sources.map(source => <Panel key={source.id}>
      <span className="tag">{source.role}</span><h2>{source.title}</h2>
      <dl><div><dt>確認日</dt><dd>{source.checkedAt}</dd></div><div><dt>適用年度・版</dt><dd>{source.appliesTo}</dd></div><div><dt>参照箇所</dt><dd>{source.location}</dd></div></dl>
      <p>{source.notes}</p>
      {source.url ? <a className="source-link" href={source.url} target="_blank" rel="noopener noreferrer">参照資料を開く<ExternalLink size={14} /></a> : <p className="small muted">アプリ内の独自設例。外部URLはありません。</p>}
    </Panel>)}</div>
    <Panel><h2>画像とライブラリ</h2><p>「副業のススメくん」は、2026年11月23日にユーザーから本アプリへの利用のため提供された画像です。元のPNGを使用しています。第三者の権利の独立調査は未実施です。</p>
      <p>図とアプリアイコンは本制作で作成し、UIアイコンにはLucide（ISCライセンス）を使用しています。公式ロゴ・資格バッジは使用していません。</p>
      <a className="source-link" href={import.meta.env.BASE_URL + 'THIRD_PARTY_NOTICES.txt'} target="_blank" rel="noopener noreferrer">使用ライブラリの版・ライセンス表示<ExternalLink size={14} /></a>
    </Panel>
  </>
}
export function Help() {
  const { state, update, status } = useStudy()
  const [pending, setPending] = useState<StudyState | null>(null)
  const [message, setMessage] = useState('')
  const download = () => {
    const blob = new Blob([exportBackup(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'boki-study-14-' + new Date().toISOString().slice(0, 10) + '.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('バックアップをダウンロードしました。保存先のファイルを確認してください。')
  }
  const read = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setMessage('')
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('20MB以下のファイルを選んでください。')
      const imported = importBackup(await file.text(), lessons, accounts)
      setPending(imported)
    } catch (error) {
      setMessage(error instanceof Error && !('issues' in error) ? error.message : 'このアプリの対応する版のバックアップではありません。形式・版・IDを確認してください。')
    }
  }
  return <>
    <div className="page-intro"><p className="eyebrow">HOW TO USE</p><h1>使い方と、学習記録の保存。</h1><p>学習は、登録なしでこの端末から。</p></div>
    <Panel><h2>基本の使い方</h2><ol><li>ホームで学習する日を選び、講義を読みます。すべての日を自由に選び直せます。</li><li>仕訳は借方・貸方ごとに科目と金額を入力します。「行を追加」で複合仕訳も記録できます。</li><li>回答を確定すると解説が開きます。金額の前提や端数処理も確認します。</li><li>間違えた問題は復習へ集まります。正解すれば復習待ちから外れます。</li><li>図解で同じ取引の仕訳、元帳、試算表、決算書を切り替えます。</li></ol>
      <p>14日は学習を分ける単位です。合格・受注・収益・学習効果を保証するものではありません。</p>
    </Panel>
    <Panel><h2>iPhoneのホーム画面で使う</h2><p>このアプリの公開URLをSafariで開き、共有メニューの「ホーム画面に追加」を選びます。最初はオンラインで開き、画面上の「オフライン利用OK」を確認してください。</p>
      <p>保存済みの教材と進捗はオフラインで使えます。出典の外部サイトはオンラインで開きます。更新の通知が出たら、学習記録の保存完了後に「保存して更新」を選びます。</p>
      <p className="small muted">公開先はGitHub Pagesです。Macの127.0.0.1はMac内の確認用で、iPhoneから同じURLには接続できません。</p>
    </Panel>
    <Panel><h2>学習記録のバックアップ</h2>
      <p>途中回答・誤答・履歴・メモ・表示設定をJSONで書き出せます。読み込みでは、アプリ名、形式の版、教材の版、問題・科目・章のIDを検証します。</p>
      <p className="small">書き出したJSONは端末のファイルとして保管してください。読み込みは現在の学習記録全体を置き換えます。</p>
      <div className="backup-actions"><button className="button" disabled={status !== 'saved'} onClick={download}><Download size={17} />JSONを書き出す</button>
        <label className={`button secondary file-button ${status !== 'saved' ? 'disabled' : ''}`}><Upload size={17} />JSONを読み込む<input type="file" accept=".json,application/json" disabled={status !== 'saved'} onChange={read} aria-label="バックアップJSONを選択" /></label></div>
      {message && <p className="notice" role="status">{message}</p>}
    </Panel>
    <Panel><h2>保存と取り扱い</h2><p>記録はこのアプリ専用のIndexedDBに保存します。端末間の自動同期はありません。サイトデータの削除、保存領域の制限、ブラウザやOSによる回収で失われる可能性があるため、必要に応じてバックアップしてください。</p><p>メモには学習内容を書き、実物の請求書や個人情報は入力しないでください。このアプリは業務用会計ソフトや申告アプリではなく、簿記の学習用です。</p></Panel>
    {pending && <Dialog title="バックアップを読み込みますか" close={() => setPending(null)}>
      <p>現在の記録を、検証済みのバックアップ全体で置き換えます。</p>
      <p>読了 {pending.readSections.length}節 · 完了した練習 {pending.attempts.length}回 · メモ {Object.values(pending.notes).filter(Boolean).length}件</p>
      <div className="dialog-actions"><button className="button secondary" onClick={() => setPending(null)}>キャンセル</button><button className="button" onClick={() => {
        update(() => pending); setPending(null); setMessage('バックアップを読み込みました。')
      }}>検証済みの記録で置き換える</button></div>
    </Dialog>}
  </>
}
