# BOKI STUDY 14｜副業のススメ

日商簿記3級を学ぶ成人初心者のための、非公式の学習補助PWAです。**2026年度（2027年3月31日まで）対象の重点学習教材**。14日は学習を分ける単位で、必要学習期間ではありません。合格・受注・収益・学習効果を保証しません。認定団体の提供・公認・監修教材ではありません。

公開URL：https://watanabeshun0828-cell.github.io/boki-study-14/

2026年11月23日のユーザーの公開指示に基づき、GitHub Pages向けの公開設定を追加しました。

## 収録と使い方

- 14日・30節の講義、独自問題120問（仕訳入力62問、数値入力32問、4択26問）。各日8問、最終日16問。
- ホーム、講義とメモ、確認練習、誤答復習、分野別/日別成績、用語集、出典、使い方・保存。
- 科目・借貸・金額で採点する複数行仕訳。行順だけの違いは不正解にしません。同じ側の同じ科目は1行にまとめます。
- 同じ架空店舗の19件の取引・決算整理を「取引→仕訳→元帳→試算表→決算書」で追うHTML図解。
- すべての日・節を自由に選べます。練習の途中でも「別の日の練習を選ぶ」から選び直せます。新しく開始することを確認するまでは、今の入力を保ちます。全節読了と通常練習80%以上をアプリ内の学習達成とします。本試験の合否判定とは別です。
- ユーザー提供の「副業のススメくん」がホームと講義を案内します。
- 端末内IndexedDB、途中回答・選択肢順・確定回答・誤答・履歴・メモ・テーマを保存。登録、課金、広告、生成AI API、学習記録の外部送信、端末間の自動同期はありません。

業務用の会計ソフトや申告アプリではありません。本教材や簿記資格の取得だけで税務相談・申告代行ができるとは扱いません。実物の請求書・個人情報は入力しないでください。

## ローカル起動

Node.js **22.12以上**とnpmが必要です。Macのターミナルで実行します。

```sh
cd "/Users/watanabeshun/Desktop/資格取得/boki-study-14"
npm ci
npm run dev -- --port 4185
```

表示された `http://127.0.0.1:4185/` をMacのブラウザーで開きます。終了はターミナルで **Control + C**。開発用4185番と本番プレビュー用4180番は、古いキャッシュが開発表示へ影響しないよう分けています。開発サーバーではService Workerを登録しないため、オフライン機能は下記の本番プレビューで確認してください。

```sh
npm run validate:content
npm test
npm run build
npm run preview -- --port 4180
```

### サブディレクトリへの対応

GitHub Pagesでは `/boki-study-14/` を使います。別の `/study/boki/` などへ配信する場合は、先頭・末尾の `/` を含む同じパスをビルドとプレビュー両方へ渡します。

```sh
VITE_BASE_PATH=/study/boki/ npm run build
VITE_BASE_PATH=/study/boki/ npm run preview -- --port 4180
```

確認URLは `http://127.0.0.1:4180/study/boki/` です。画面遷移はハッシュ方式なので、画面ごとのサーバー書換えは不要です。Service Worker・manifest・画像・ライセンス表示も同じbaseを使います。配信パスやドメインを変えると、以前の記録を自動参照できない場合があります。移動前にJSONバックアップを取ってください。

## iPhoneとオフライン

上記の公開HTTPS URLを **iPhoneのSafari** でオンラインで開き、キャッシュ完了後の「オフライン利用OK」を確認します。共有ボタンから「ホーム画面に追加」を選びます。初回オンライン読込み後は、保存済みの収録講義・問題・図解・案内画像・学習記録をオフラインで利用できます。出典の外部ページは対象外です。

現在の127.0.0.1はMac自身のアドレスです。iPhoneで同じ文字列を開いてもMacのアプリには接続できません。実機テストには別途HTTPSの配信環境が必要です。**iPhone実機のSafari/ホーム画面は未検証**。ChromiumのiPhone相当の画面幅での確認と区別します。

更新は通知から「保存して更新」を選びます。保存未完了時は更新ボタンを無効にしています。新しいService Workerへ切り替えても専用DBは消しません。

## 記録の保存とバックアップ

DB名は `boki-study-14`、DB構造版は1、保存データ版は2です。AI・FP・SESとは別名で保存します。保存中/保存済み/エラーを画面下に表示し、失敗時は再試行できます。サイトデータの削除、ブラウザーやOSによる保存領域の制限・回収で記録を失う可能性があります。

「使い方・保存」でJSONを書き出し、端末のファイルとして保管してください。読み込みは20MB以下、アプリID・形式版・教材版・問題/章/科目/選択肢/入力欄のID・履歴の採点結果・途中位置などを検証し、件数の表示と確認後に現在の記録全体を置き換えます。不正なファイルやキャンセルでは記録を変更しません。DBを開けない場合も、復旧画面で同じ検証を通したバックアップを確認して復元できます。

現行バックアップ形式は `app: boki-study-14 / formatVersion: 1 / contentVersion: 2026.1`。アプリ内部の試作データ版1（メモ追加前）の移行だけを `migrateState` で用意し、自動テストしています。これは本制作中の旧形式で、既に公開されていた簿記アプリの版ではありません。他アプリのバックアップは受け付けません。

## 教材と出典の編集

```text
src/data/
  config.json          名称・対象年度・画像差し替え口
  day01.json〜day14.json 講義・図解・問題・解答・解説・referenceIds
  accounts.json        安定した科目IDと名称・説明
  scenario.json        同じ架空店舗の全取引・期待する検算値
  glossary.json        用語
  sources.json         実際に開いたURL・確認日・適用版・参照箇所・役割
src/lib/schema.ts      実行時データ検証
src/lib/accounting.ts  採点・残高・財務諸表・計算
src/lib/study.ts       途中進行・誤答・保存形式と移行
src/lib/backup.ts      バックアップの検証
src/lib/db.ts          専用IndexedDB
scripts/validate-content.ts  教材全体のID/出典/計算/貸借検証
```

新しい問題形式は `format` のスキーマ、入力画面、採点、バックアップ検証、テストへ同時に追加します。講義・問題・節・科目IDを既存版から変更しないでください。変更が必要な場合は、旧ID→新IDの明示的な対応表と状態/バックアップ移行を実装・検証してから教材版を上げます。未知の版やIDを黙って読み飛ばしません。

計算問題には式・演算・入力値・結果・単位・端数処理を記録し、架空の金額や率は「練習用の仮定」と明記します。出題範囲は数値の根拠として使いません。`npm run validate:content`、`npm test`、`npm run schema`を実行してJSONスキーマも更新してください。

- [収録範囲と不足する練習](docs/coverage.md)
- [教材・画像の作成経緯と未確認事項](docs/content-provenance.md)
- [検証記録](docs/VERIFICATION.md)
- [講義/問題JSONスキーマ](docs/course.schema.json)、[保存形式](docs/state.schema.json)

確認日：**2026年11月23日**。日商公式の[出題区分表一覧](https://www.kentei.ne.jp/bookkeeping/exam-list)から、2026年度は2022年度施行版を使用することを確認しました。2027年度の確定版は公表済みですが、本版は2027年度対応ではありません。知識の参照と原稿の生成を区別し、公式過去問・市販問題・他者アプリ・非公開問題の転載や書き換えは行っていません。AI作成で、人の専門家による監修は未実施です。

## 自動テストとブラウザー確認

```sh
npm run validate:content
npm test
VITE_BASE_PATH=/boki-study-14/ npm run build
npx playwright install chromium
npm run test:e2e
```

E2Eは本番ビルド後、4181番のローカルサーバーを `/boki-study-14/` に起動して検証し、終了時に停止します。ほかのアプリのサーバーは停止させません。更新保持テストは一時的に `dist/index.html` と `dist/sw.js` を差し替え、必ず元へ戻します。編集元の教材や学習記録をテストから変更しません。

この制作環境では既存のChromiumキャッシュを使い、`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ses-study-browsers npm run test:e2e` を実行しました。これはこのMacの一時パスで、一般の利用者には不要です。

## 素材とライブラリの表示

案内役の画像はユーザー提供の元PNGをそのまま使っています。`public/guide-character.png` が差し替え口です。出所とハッシュは [assets.json](docs/assets.json)。第三者権利の独立調査・一般配布の利用条件の確定は未実施です。アプリアイコンとHTML図解は本制作で作成し、UIアイコンにはLucideを使っています。公式ロゴ・資格バッジは使用していません。

実際のインストール版のLICENSE/NOTICEファイルから [THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt) と [全ライブラリ台帳](docs/licenses.json) を生成しました。ブラウザー側の主要ライブラリはReact/React DOM 19.3.1（MIT）、scheduler 0.28.0（MIT）、lucide-react 0.468.0（ISC）、idb 8.0.4（ISC）、zod 4.6.7（MIT）。生成Service Workerに含まれるWorkboxのライセンスも収録しています。ライセンス文は配布物 `dist/THIRD_PARTY_NOTICES.txt` に残し、アプリの出典画面から閲覧できます。

台帳は開発ツールも含みます。単独LICENSEファイルがない9件は台帳に明記しており、ブラウザーへの配布対象ではありません。OSごとのオプション依存は、実際にこのMacにインストールされた版だけを列挙しました。依存更新時は `npm run licenses` を再実行し、差分と必要な表示を確認してください。アプリ独自の教材・画像について、このREADMEで第三者への再配布ライセンスを新たに設定してはいません。

## GitHub Pagesでの公開・更新

リポジトリ：https://github.com/watanabeshun0828-cell/boki-study-14

Settings → Pages → SourceはGitHub Actionsです。`.github/workflows/deploy.yml`はmainへのpushで教材検証・単体テスト・本番ビルド・ブラウザーテストを実行し、成功時にdistを公開します。配信baseはconfigure-pagesのbase_pathから取得します。E2Eはビルド済みファイルを検証し、配信baseを上書きしません。

```sh
git add .
git commit -m "Update BOKI STUDY 14"
git push
```

ローカル版と公開版は別のオリジンのため、学習記録を自動共有しません。記録を移す場合はローカル版でJSONを書き出し、公開版の「使い方・保存」から読み込みます。公開版の利用開始時も必要な記録をバックアップしてください。
