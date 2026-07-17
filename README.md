# eiken-app

英検1級レベルの語彙・読解問題を毎日自動生成する学習トレーニングアプリ。ニュース記事を題材にした読解問題と、単語帳ベースの語彙穴埋め問題を日次で生成し、解答・解説・精読ノート・リスニング問題・単語フラッシュカードまでを一貫して提供する。

- **本番環境**: https://eiken-app-eosin.vercel.app （Vercel。`main` への push で自動デプロイ）
- **技術スタック**: Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS 4
- **LLM**: Anthropic Claude API（`@anthropic-ai/sdk`）
- **永続化**: Vercel KV（本番）/ ローカルファイルキャッシュ（開発時のフォールバック）

## 目次

- [主な機能](#主な機能)
- [アーキテクチャ](#アーキテクチャ)
- [インフラ設定](#インフラ設定)
- [環境変数](#環境変数)
- [バリデーション方針](#バリデーション方針)
- [ルールバージョン](#ルールバージョン)
- [ローカル開発](#ローカル開発)
- [デプロイ](#デプロイ)
- [ディレクトリ構成](#ディレクトリ構成)

## 主な機能

| 機能 | パス | 概要 |
|---|---|---|
| 今日の問題 | `/` | 語彙穴埋め5問＋読解問題（内容一致 or 空所補充）を表示。解答・解説はデフォルト非表示で、ボタンで開閉できる |
| 問題履歴 | `/history` | 過去30日分の生成済み問題一覧 |
| 過去問再表示 | `/quiz/[date]` | 指定日の問題を表示 |
| 精読ノート（PDF） | `/seidoku/[date]`、`/api/pdf/seidoku` | 読解パッセージの構文・語彙を解説する精読ノートをHTML表示／PDF出力（`pdfkit`使用） |
| 単語フラッシュカード | `/flashcards` | 前日出題分の語彙を翌日に復習できるカード形式ページ |
| 読み上げ（TTS） | `/api/tts` | Google Cloud TTSでパッセージ・例文を音声化（話者4種） |
| リスニング問題 | `/listening`、`/listening/daily` | リスニング過去問ページと、日次自動生成のリスニング問題 |

## アーキテクチャ

問題生成のコアロジックは `lib/claude.ts` に実装されている。

### 生成モデル

- **生成モデル**（語彙・読解本文の生成）: 環境変数 `GENERATION_MODEL`（本番では `claude-sonnet-5` を設定。コード側デフォルトは `claude-haiku-4-5`）
- **注釈モデル**（解説・アノテーション生成）: 環境変数 `ANNOTATION_MODEL`（本番では Haiku 4.5 を設定。コード側デフォルトは `claude-haiku-4-5`）

### 生成パイプライン（v5.2）

1. **語彙生成と読解生成を並列・独立実行**（vocabulary-first / Plan A）
   語彙問題は記事の内容に依存しないため、読解パッセージ生成とは別のAPI呼び出しに分離し `Promise.all` で並列実行する。1呼び出しあたりの処理量を減らしてタイムアウトリスクを下げつつ、レイテンシも短縮する（`generateVocabOnly` / `generateReadingOnly`）。
2. **WordBankの単語割り当てはコード側で実施**
   `sampleWordBank()` が日付をシードに `lib/wordbank.ts`（英検1級単熟語、品詞タグ付き1,300語超）から決定論的に抽選し、「正解語1＋同品詞の誤答候補3」を1グループとして5グループ（20語、重複なし）を構成する。LLMには語の選定を任せず、確定済みの4語セットを渡して文だけを作らせることで、設問間の単語重複や品詞の不統一を構造的に排除する。
   候補プールからは `CEFR_BELOW_C1_BLOCKLIST`（CEFR B2以下と判明した語）と、直近30日分の出題済み語（`app/api/generate/route.ts` の `getRecentlyUsedWords` がKV/`.cache`から収集し `USED_WORDS_SEED` と統合）を除外する（v5.2）。
3. **語彙は設問単位でバリデーション＋個別リトライ**
   5問全体を作り直すのではなく、違反した設問のみ最大2回リトライする（`retryVocabQuestion`）。
4. **読解選択肢の語数チェック**（内容一致形式のみ）
   選択肢が35語を超える数が1セットで3件以上ある場合のみ、読解を1回だけ再生成する。
5. **選択肢シャッフル**
   語彙は5問を通じて正解記号（A/B/C/D）が3回以上偏らないよう位置をあらかじめ均等割り当てしてからシャッフルし（`shuffleChoicesWithTarget` / `assignBalancedTargetLetters`、v5.2）、読解は従来通りランダムシャッフルする。解説文中の選択肢参照は数字(1〜4)で書かれる前提で、シャッフル後の番号に書き換える（`remapChoiceLetters`。UI表示（1〜4の数字）に合わせてv5.2でA/B/C/D参照から変更。旧レター参照が残っていた場合の安全網も維持）。
6. **注釈（解説）生成は語彙・読解でコンテキストを分離**
   `generateVocabAnnotations` と `generateReadingAnnotations` を独立した呼び出しに分割し、`generateAnnotations` が並列実行・結合する。バリデーション違反時は該当アノテーションのみ再生成する。問題本体とは別に `/api/annotations?date=...` で遅延生成される。
7. **JSONパースの堅牢化（v5.2）**
   `parseJson`（`lib/claude.ts`）は語彙・読解・アノテーション全ての生成呼び出しで共通利用する。まず素の`JSON.parse`を試み、失敗時は```json ... ```/``` ... ```コードフェンスを検出してその中身を対象にし、さらに先頭`{`〜末尾`}`を抽出してから再パースする。各プロンプトにも「JSONオブジェクトのみを返す（前置き・コードフェンス禁止）」という指示を明記している。パース失敗時はレスポンス全文をログ出力する（`console.error`、原因調査用）。
   また、`choices`オブジェクトのキーが（解説文中の数字参照ルールに引きずられて）`"A"/"B"/"C"/"D"`ではなく`"1"/"2"/"3"/"4"`で返る場合があるため、`generateVocabOnly`のパース直後に`normalizeVocabChoiceKeys`でA/B/C/D表記へ正規化してから返す（answerも合わせて変換）。

### プロンプトキャッシング

不変部分（生成ルール・few-shot見本）は `cache_control: { type: 'ephemeral' }` を付けた system ブロックに分離し、記事本文など日次で変わる部分と分けることで入力コストを削減している。

### few-shotサンプル

`samples/fable5-v5/*.fewshot.json` を `lib/claude.ts` からモジュールとして直接importし、cache_control対象の静的プロンプトに埋め込んでいる（ビルド時にバンドルされ、リクエスト時にファイルI/Oは発生しない）。`samples/regression-v5_1/` にはモデル切り替え時の回帰確認用の生成サンプルが保存されている。

## インフラ設定

- **Vercel Fluid Compute**: 有効（Vercelプロジェクト設定）
- **maxDuration**: `300`秒（`/api/generate`、`/api/annotations`。Fluid Compute前提の設定）
- **max_tokens**: 生成系呼び出しは用途ごとに異なる（読解生成 32,000 / 語彙生成 16,000 / 読解アノテーション 20,000 / 語彙アノテーション 8,000。詳細は `lib/claude.ts` 内の各Anthropic API呼び出しを参照）。語彙・読解の両方で`stop_reason === 'max_tokens'`（出力打ち切り）を検知した場合は明示的にエラーログを出す
- **Cron**: `vercel.json` で毎日 `23:00 UTC`（JST 08:00）に `/api/generate?refresh=true` を叩き、当日分の問題を事前生成

## 環境変数

コード内 `process.env` 参照から実際に使用されているものを列挙する。

| 変数名 | 用途 | 未設定時の挙動 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API認証 | 必須（未設定だとAPI呼び出しが失敗） |
| `GENERATION_MODEL` | 語彙・読解生成に使うモデルID | 未設定時は `claude-haiku-4-5` にフォールバック |
| `ANNOTATION_MODEL` | 解説・アノテーション生成に使うモデルID | 未設定時は `claude-haiku-4-5` にフォールバック |
| `KV_REST_API_URL` | Vercel KV（Upstash）接続の有無判定 | 未設定時はローカルの `.cache/` ディレクトリへのファイル書き込みにフォールバック |
| `GOOGLE_TTS_API_KEY` | Google Cloud Text-to-Speech API認証（`/api/tts`） | 未設定時は500エラーを返す |

`KV_REST_API_URL` を含むVercel KV関連の他の変数（`KV_REST_API_TOKEN`等）はVercel連携時に自動設定される。

## バリデーション方針

生成品質の担保は「機械的にチェックできるものはコード側、意味的な妥当性はプロンプト側」で役割分担している。

**コード側（機械的チェック、`lib/claude.ts`）**
- 語彙: 空所の存在・個数、正解語の露出、選択肢4つの重複なし、指定語プール外の語がないか、設問間の20語重複なし（`validateOneVocabQuestion` / `validateVocabQuestions`）
- 読解: 選択肢の語数上下限（15〜35語）・選択肢間の語数バランス（差12語以内）（`validateChoiceLength`）
- 読解: 「正解=最長」になっていないか（内容一致形式のみ。過半数で警告）（`checkCorrectIsLongest`）
- 読解: 極端語（"always"/"never"等の絶対語）の使用チェック（内容一致形式のみ。警告のみ）（`checkAbsoluteWords`）
- 本文語数チェック（内容一致550〜650語／空所補充450〜550語の範囲外で警告。警告のみ）（`checkPassageWordCount`、v5.2）
- 中国語簡体字混入チェック（ベストエフォートのブロックリスト照合。警告のみ）（`checkCjkSimplifiedContamination`、v5.2）
- 空所直前の冠詞(a/an)による選択肢の文法的排除チェック（語彙・穴埋め読解の両方。警告のみ）（`checkArticleAgreement`系、v5.2）
- 誤答分類ラベルのホワイトリスト照合（語彙2種／読解内容一致5種。警告のみ）（`checkVocabLabelWhitelist` / `checkReadingContentLabelWhitelist`、v5.2）
- 選択肢シャッフル後の番号（1〜4）と解説文中の参照の同期チェック（`verifyChoiceLabelConsistency`）
- 解説と設問のマッピング整合性チェック（`validateExplanationMapping`）

**プロンプト側（意味的チェック）**
- 誤答の作り方（ラベルの配分、本文由来の要素の使い方）
- パッセージの論説構成の質、パラフレーズの抽象度
- 語彙アノテーションの紛らわしい類義語ペア（confusingPairs）の妥当性

機械的チェックのうち一部（語数バランス、正解最長、極端語、v5.2で追加した本文語数・簡体字混入・冠詞排除・ラベルホワイトリスト）は警告ログのみでリトライには乗せず、設問単位の重大な違反（空所欠落・語プール逸脱等）のみが個別リトライの対象になる。

## ルールバージョン

現在の生成ルールは **v5.2**（出題済み語除外・CEFR C1〜C2制約・正解位置分散・誤答型の体系化・解説ラベル5種固定。旧: v5.1.1 語彙固定グループ化、v5.1.3 アノテーション分離・35語超過エスカレーション）。各バージョンでの変更点・解決した課題は [CHANGELOG.md](./CHANGELOG.md) を参照。週次の品質チェックは [docs/weekly-review-checklist.md](./docs/weekly-review-checklist.md) を参照。

## ローカル開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) で起動する。`.env.local` に最低限 `ANTHROPIC_API_KEY` を設定すること（`KV_REST_API_URL` 未設定時は `.cache/` へのファイルキャッシュで動作する）。

```bash
npm run lint    # ESLint
npm run build   # 本番ビルド
npm run start   # ビルド済みアプリの起動
```

## デプロイ

`main` ブランチへの push でVercelが自動ビルド・デプロイする。環境変数（`ANTHROPIC_API_KEY` / `GENERATION_MODEL` / `ANNOTATION_MODEL` / `GOOGLE_TTS_API_KEY` / Vercel KV関連）はVercelプロジェクト設定側で管理する。

## ディレクトリ構成

```
app/
  page.tsx                     今日の問題ページ
  history/                     問題履歴
  quiz/[date]/                 過去問再表示
  seidoku/[date]/               精読ノート
  flashcards/                  単語フラッシュカード
  listening/, listening/daily/ リスニング問題
  api/
    generate/                  問題生成（語彙+読解）
    annotations/                解説・アノテーション生成
    pdf/seidoku/                 精読ノートPDF出力
    tts/                        音声合成
    flashcards/, history/, quiz/[date]/, listening/daily/  各機能のデータ取得API
lib/
  claude.ts                    生成・バリデーション・アノテーションのコアロジック
  wordbank.ts                  英検1級単熟語データ（品詞タグ付き）
  rss.ts                       ニュース記事取得（曜日別ジャンルローテーション）
  listeningGenerate.ts, listeningTypes.ts, listeningData.ts  リスニング問題関連
samples/
  fable5-v5/                   few-shot見本データ
  regression-v5_1/              モデル切替時の回帰確認用サンプル
```
