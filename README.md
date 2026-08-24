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

アプリ起動後のトップ画面（`/`）でリーディング／ライティングを選択する構成になっている。リスニング機能は使用実績がなかったため削除した（git履歴からは復元可能）。

### リーディング

| 機能 | パス | 概要 |
|---|---|---|
| 今日の問題 | `/reading` | 語彙穴埋め5問＋読解問題（内容一致 or 空所補充）を表示。解答・解説はデフォルト非表示で、ボタンで開閉できる。読解本文の直前には本番英検1級を再現したLLM生成の英語タイトル（v5.7）を表示する。RSS記事の元タイトル・出典表示（ページ上部、`no-print`）とは別要素 |
| 問題履歴 | `/history` | 過去30日分の生成済み問題一覧 |
| 過去問再表示 | `/quiz/[date]` | 指定日の問題を表示 |
| 精読ノート | `/seidoku/[date]` | 読解パッセージを段落ごとに区切り、Step1（本文＋段落要約）→Step2（論理の流れ）→Step3（語彙チェック）→記録欄の順で表示。本文直後に段落ごとの罫線付き要約欄を配置し、本文と要約の往復を減らすレイアウト。ブラウザ印刷（`window.print()`）でPDF保存する。`/api/pdf/seidoku`は`pdfkit`によるサーバー生成PDFだが、現在UIからリンクされていない未使用エンドポイント |
| 単語フラッシュカード | `/flashcards` | 前日出題分の語彙を翌日に復習できるカード形式ページ |
| 読み上げ（TTS） | `/api/tts` | Google Cloud TTSでパッセージ・例文を音声化（話者4種） |

### ライティング

英検1級ライティング（大問4/5相当）対策。アプリが担当するのは**お題生成とPDF化まで**で、手書き解答の添削・採点はアプリの範囲外（別スキル`writing-correction-review`やChatGPT等、チャットベースのAIに手書き写真を貼って評価してもらう運用）。3機能とも生成はオンデマンド（ページを開いてボタンを押した時点で生成。cronによる自動生成はしていない）。

| 機能 | パス | 頻度の目安 | 概要 |
|---|---|---|---|
| 週次エッセイ | `/writing/essay` | 週1回 | 意見論述問題（大問5形式）のTOPIC文（"Agree or disagree: ~" / "Should ~?"）を生成。論拠は提示しない。200〜240語 |
| 毎日の表現トレーニング | `/writing/daily` | 毎日 | 論説文頻出構文・1級語彙のストック（`lib/writingExpressions.ts`）からローテーション選定した表現を使った短文作文の指示を生成 |
| 隔週要約 | `/writing/summary` | 隔週 | 3段落・300語程度のオリジナル英文パッセージを生成。要約は90〜110語 |

いずれもPDFは`app/api/pdf/writing/route.ts`（`pdfkit`によるサーバー生成、`?type=essay\|daily\|summary&date=...`）で出力し、GoodNotesに読み込んでApple Pencilで手書き解答する運用を想定している。

## アーキテクチャ

読解・語彙問題生成のコアロジックは `lib/claude.ts` に、ライティング機能の生成ロジックは `lib/writingGenerate.ts` に実装されている（互いに独立したサイブリングファイル。`lib/claude.ts`はライティング追加にあたり変更していない）。

### 生成モデル

- **生成モデル**（語彙・読解本文の生成）: 環境変数 `GENERATION_MODEL`（本番では `claude-sonnet-5` を設定。コード側デフォルトは `claude-haiku-4-5`）
- **注釈モデル**（解説・アノテーション生成）: 環境変数 `ANNOTATION_MODEL`（本番では Haiku 4.5 を設定。コード側デフォルトは `claude-haiku-4-5`）
- **記事取得AI生成フォールバックモデル**（v5.3）: `claude-sonnet-5` に固定（環境変数では切替不可）。RSS全滅時のみ発火する低頻度経路のため、コストより品質を優先

### 生成パイプライン（v5.2）

1. **語彙生成と読解生成を並列・独立実行**（vocabulary-first / Plan A）
   語彙問題は記事の内容に依存しないため、読解パッセージ生成とは別のAPI呼び出しに分離し `Promise.all` で並列実行する。1呼び出しあたりの処理量を減らしてタイムアウトリスクを下げつつ、レイテンシも短縮する（`generateVocabOnly` / `generateReadingOnly`）。
2. **WordBankの単語割り当てはコード側で実施**
   `sampleWordBank()` が日付をシードに `lib/wordbank.ts`（英検1級単熟語、品詞タグ付き1,300語超）から決定論的に抽選し、「正解語1＋同品詞の誤答候補3」を1グループとして5グループ（20語、重複なし）を構成する。LLMには語の選定を任せず、確定済みの4語セットを渡して文だけを作らせることで、設問間の単語重複や品詞の不統一を構造的に排除する。
   候補プールからは `CEFR_BELOW_C1_BLOCKLIST`（CEFR B2以下と判明した語）と、直近30日分の出題済み語（`app/api/generate/route.ts` の `getRecentlyUsedWords` がKV/`.cache`から収集し `USED_WORDS_SEED` と統合）を除外する（v5.2）。
3. **語彙は設問単位でバリデーション＋個別リトライ**
   5問全体を作り直すのではなく、違反した設問のみ最大2回リトライする（`retryVocabQuestion`）。
4. **読解選択肢の語数・誤答精度チェック**（内容一致形式のみ、v5.5で拡張）
   選択肢が35語を超える数が1セットで3件以上ある場合、または誤答精度チェック（絶対表現の集中・sourceSpan欠落・distractorType単調・正解の本文丸写し）でエラーが検出された場合のみ、読解を1回だけ再生成する（エラー内容を次回生成プロンプトに含める）。再生成後もエラー総数が改善しない場合は元の生成結果を採用する。
   **時間予算チェック（v5.6）**: 読解生成が異常に長引くケース（実測262秒経験あり）で無条件にリトライすると`/api/generate`の`maxDuration`（300秒）を超過し、Vercelのプラットフォームタイムアウト（非JSON応答）でクライアント側`res.json()`が失敗する。生成開始からの経過時間が`READING_RETRY_TIME_BUDGET_MS`（150秒）を超えている場合はリトライを断念するが、この場合の下書きは誤答精度チェック等のエラーが検出済み＝壊れた問題である可能性が高いため、配信はせず`throw`して生成そのものを失敗させる（`route.ts`側でキャッシュへのフォールバック、なければJSONエラー応答）。**既知の未解決リスク**: リトライを実施したがエラー総数が改善しなかった場合（`afterTotal >= beforeTotal`）は、時間予算とは無関係にこの旧来パス（v5.5から存在）で元の下書きがそのまま採用される。同種の「壊れた問題を配信し得る」リスクが残っている。
5. **選択肢シャッフル**
   語彙は5問を通じて正解記号（A/B/C/D）が3回以上偏らないよう位置をあらかじめ均等割り当てしてからシャッフルし（`shuffleChoicesWithTarget` / `assignBalancedTargetLetters`、v5.2）、読解は従来通りランダムシャッフルする。解説文中の選択肢参照は数字(1〜4)で書かれる前提で、シャッフル後の番号に書き換える（`remapChoiceLetters`。UI表示（1〜4の数字）に合わせてv5.2でA/B/C/D参照から変更。旧レター参照が残っていた場合の安全網も維持）。
6. **注釈（解説）生成は語彙・読解でコンテキストを分離**
   `generateVocabAnnotations` と `generateReadingAnnotations` を独立した呼び出しに分割し、`generateAnnotations` が並列実行・結合する。バリデーション違反時は該当アノテーションのみ再生成する。問題本体とは別に `/api/annotations?date=...` で遅延生成される。
   **アノテーションキャッシュの鮮度検証（v5.3バグ修正）**: `annotations:{date}` キャッシュは対応する `questions:{date}` の `generatedAt` を保持し（`questionsGeneratedAt`）、読み出し時に現在の `questions.generatedAt` と一致する場合のみ使う。`questions:{date}` が同日中に再生成された場合（`forceRefresh` や、未キャッシュ状態への同時アクセスによる競合生成）でも、次回アクセスで自動的に古いアノテーションを検知して再生成するため、本文と選択肢/解説の記事が食い違う不整合を構造的に防ぐ。
7. **JSONパースの堅牢化（v5.2）**
   `parseJson`（`lib/claude.ts`）は語彙・読解・アノテーション全ての生成呼び出しで共通利用する。まず素の`JSON.parse`を試み、失敗時は```json ... ```/``` ... ```コードフェンスを検出してその中身を対象にし、さらに先頭`{`〜末尾`}`を抽出してから再パースする。各プロンプトにも「JSONオブジェクトのみを返す（前置き・コードフェンス禁止）」という指示を明記している。パース失敗時はレスポンス全文をログ出力する（`console.error`、原因調査用）。
   また、`choices`オブジェクトのキーが（解説文中の数字参照ルールに引きずられて）`"A"/"B"/"C"/"D"`ではなく`"1"/"2"/"3"/"4"`で返る場合があるため、`generateVocabOnly`のパース直後に`normalizeVocabChoiceKeys`でA/B/C/D表記へ正規化してから返す（answerも合わせて変換）。
8. **explanationの長さ上限（暴走出力・生成時間の長期化対策）**
   語彙・読解（内容一致）の各解説文にプロンプト上の文字数上限（語彙400字/読解450字、正解・各誤答も文数を指定）を明記し、SELF-CHECKリストにも追加した。`checkExplanationLength`（`lib/claude.ts`）が上限超過を警告ログとして検知する（リトライには乗せない、監視目的）。
9. **誤答メタデータ（`choiceDrafts`）による精度チェック**（内容一致形式のみ、v5.5）
   読解生成の同一呼び出しで、各選択肢に本文根拠（`sourceSpan`）と、誤答には誤りの分類（`distractorType`: `SCOPE_SHIFT`/`AGENT_SWAP`/`CAUSAL_REVERSAL`/`TIMELINE_SHIFT`/`MODALITY_SHIFT`/`HALF_TRUE_COMPOSITE`/`PURPOSE_RESULT_CONFUSION`）と誤りの最小部分（`falseElement`）を出力させる（`ReadingChoiceDraft`型、追加のLLM呼び出しなし）。このメタデータはバリデーション専用で、シャッフル後に記号と対応しなくなるため最終保存データからは取り除く（`stripChoiceDrafts`）。
10. **本文タイトルの生成**（両形式共通、v5.7）
    本番EIKEN Grade 1の長文冒頭に付くタイトルを再現するため、読解生成の同一呼び出しで`title`（名詞句・短いフレーズ形式、6語以内目安、空所の答えや設問の結論を示唆しない）を出力させる（追加のLLM呼び出しなし）。`checkTitleValid`（空文字でない・10語以内）が違反を検知した場合、既存の読解リトライ機構（項目4）に接続して読解を1回だけ再生成する。従来は内容一致形式のみが対象だったこのリトライ機構を、タイトルチェックに限り空所補充形式にも適用するよう拡張した。フロントエンド（`/reading`・`/quiz/[date]`の問題表示・解答解説）はページ上部のRSS記事出典表示（`data.article.source`/`data.article.title`、`no-print`）とは別要素として、本文直前にこのタイトルを表示する。

### 記事取得の3段階フォールバック（v5.4、`lib/rss.ts`）

読解パッセージの元記事は、以下の優先順位で取得する。

1. **Step A: ジャンル固有のリアルタイムRSS**（`tryFeeds`） — 曜日ごとに割り当てられたジャンルのフィード3件（`GENRE_FEEDS`）を順に試し、最初に本文が抽出できたものを採用する。
2. **Step B: AI生成記事**（`generateArticleWithAI`、`lib/claude.ts`） — Step Aの3件が全滅した場合のみ実行。`GENERATION_MODEL`（環境変数で切替可能）ではなく **Claude Sonnet 5に固定**し、`samples/fable5-v5/`の読解few-shotの文体を参考にした550〜650語のオリジナル記事を生成する。v5.2の語彙・読解生成で導入したV1〜V3自己検証ステップ（本文中の統計・固有名詞・具体的事実の捏造がないかの自己チェック）を記事生成にも適用している。発生頻度が低い経路のため、コストよりも品質・事実捏造の少なさを優先してモデルを固定している。
3. **Step C: BBC News/World固定フォールバック**（`tryFeeds`） — Step Bも失敗した場合（Claude APIエラー等）のみ実行。

どのStepで記事を取得できたかは`console.log('[ArticleSource] step=...')`で毎回記録する（週次レビューでStep B/Cの発生頻度を追跡できるようにする目的。[docs/weekly-review-checklist.md](./docs/weekly-review-checklist.md)参照）。

**v5.4: フィード重複の解消**。週次レビューで、火曜「サイエンス・テクノロジー」のBBC Scienceと木曜「環境・気候」のBBC Environmentが完全同一URL、火曜のScientific American 2・3件目がhttp/https違いのみの同一URL、土曜「文化・社会」と日曜「教育・テクノロジー」の両方でTIMEが使われジャンル純度を下げていた（8/1にエネルギー地政学記事の混入実例あり）ことが判明。それぞれNPR Science・Guardian Science・Ars Technicaに差し替えて解消した（詳細は[CHANGELOG.md](./CHANGELOG.md)参照）。

`lib/rss.ts`は`Article`型を通じて`lib/claude.ts`と相互参照する（`claude.ts`はStep B実装のため`rss.ts`の`Article`型を、`rss.ts`はStep B呼び出しのため`claude.ts`の`generateArticleWithAI`を参照）。実行時の循環importを避けるため、`claude.ts`側は`import type { Article }`と型のみのimportにしている（`Article`はinterfaceでランタイム値を持たないため、type importにすればコンパイル時に消去され、`rss.ts`→`claude.ts`の一方向のみが実行時に残る）。

テスト用に以下をexportしている（`genreIndexOverride`で特定ジャンルを強制指定して個別検証できる）:
- `tryGenreFeedsOnly(genreIndex)` — Step Aのみを単体実行（フォールバックしない）
- `debugFetchFeed(url)` — フィードURL単体の疎通確認（`scripts/check-feeds.ts`で全フィード一括確認に使用）
- `generateArticleWithAI(genre, dayIndex)`（`lib/claude.ts`） — Step Bのみを単体実行

### プロンプトキャッシング

不変部分（生成ルール・few-shot見本）は `cache_control: { type: 'ephemeral' }` を付けた system ブロックに分離し、記事本文など日次で変わる部分と分けることで入力コストを削減している。

### few-shotサンプル

`samples/fable5-v5/*.fewshot.json` を `lib/claude.ts` からモジュールとして直接importし、cache_control対象の静的プロンプトに埋め込んでいる（ビルド時にバンドルされ、リクエスト時にファイルI/Oは発生しない）。`samples/regression-v5_1/` にはモデル切り替え時の回帰確認用の生成サンプルが保存されている。

## インフラ設定

- **Vercel Fluid Compute**: 有効（Vercelプロジェクト設定）
- **maxDuration**: `300`秒（`/api/generate`、`/api/annotations`。Fluid Compute前提の設定）
- **ソフトタイムアウト（v5.6）**: `/api/generate`の`maxDuration`（300秒）にVercelのプラットフォームタイムアウトで到達すると応答本文がJSONでなくなり、クライアントの`res.json()`が`SyntaxError`で失敗する（本番で発生・`npx vercel logs`で特定）。`app/api/generate/route.ts`は`generateQuestions`を`SOFT_TIMEOUT_MS`（270秒）で`withTimeout`ラップし、必ずルート自身が先にJSONで応答（キャッシュへのフォールバック、またはJSON形式のエラー）できるようにしている
- **max_tokens**: 生成系呼び出しは用途ごとに異なる（読解生成 32,000 / 語彙生成 16,000 / 読解アノテーション 20,000 / 語彙アノテーション 8,000。詳細は `lib/claude.ts` 内の各Anthropic API呼び出しを参照）。語彙・読解の両方で`stop_reason === 'max_tokens'`（出力打ち切り）を検知した場合は明示的にエラーログを出す
- **Cron**: `vercel.json` で毎日 `23:00 UTC`（JST 08:00）に `/api/generate?refresh=true` を叩き、当日分の問題を事前生成（ライティング3機能はオンデマンド生成のみで、cronは設定していない）
- **`serverExternalPackages: ['pdfkit']`**（`next.config.ts`）: pdfkitは標準14フォントのAFMメトリクスを`fs.readFileSync(__dirname + '/data/...')`で実行時に読み込むが、Turbopackにバンドル・トレースされると`__dirname`が仮想パスに書き換えられ`ENOENT`になるため、ネイティブ`require`のまま解決させて回避している（`lib/pdfKit.ts`を使う`/api/pdf/seidoku`・`/api/pdf/writing`の両方に必要）

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
- 読解: 誤答3つ中2つ以上に絶対表現（always/never/every/entirely/completely/solely/regardless of等）を含んでいないか（内容一致形式のみ。**リトライ対象**）（`checkWrongChoiceAbsoluteWords`、v5.5）
- 読解: 誤答の`sourceSpan`（根拠にした本文箇所）が欠落・空でないか（内容一致形式のみ。**リトライ対象**）（`checkChoiceDraftSourceSpans`、v5.5）
- 読解: 誤答3つの`distractorType`がすべて同一になっていないか（内容一致形式のみ。**リトライ対象**）（`checkDistractorTypeDiversity`、v5.5）
- 読解: 正解選択肢が本文と5語以上の連続語句を共有していないか（簡易文字列一致検査。内容一致形式のみ。**リトライ対象**）（`checkCorrectChoiceCopiesPassage`、v5.5）
- 読解: タイトルが空文字でないか・10語以内か（両形式共通。**リトライ対象**）（`checkTitleValid`、v5.7）

**プロンプト側（意味的チェック）**
- 誤答の作り方（ラベルの配分、本文由来の要素の使い方）
- パッセージの論説構成の質、パラフレーズの抽象度
- 語彙アノテーションの紛らわしい類義語ペア（confusingPairs）の妥当性

機械的チェックのうち一部（語数バランス、正解最長、極端語、v5.2で追加した本文語数・簡体字混入・冠詞排除・ラベルホワイトリスト）は警告ログのみでリトライには乗せず、設問単位の重大な違反（空所欠落・語プール逸脱等。語彙は個別リトライ）や、v5.5で追加した誤答精度チェック（読解は35語超過チェックと合算し、読解セット全体を1回だけ再生成）がリトライ対象になる。

## ルールバージョン

現在の生成ルール（語彙・読解の出題ロジック）は **v5.7**（本番EIKEN Grade 1を再現した読解本文タイトルを追加。読解生成の同一呼び出しで`title`を出力させ、`checkTitleValid`（空文字でない・10語以内）を既存の読解リトライ機構に接続（空所補充形式にもこのチェックに限り拡張）。旧: v5.5 読解の誤答生成に`ReadingChoiceDraft`型（`distractorType`/`sourceSpan`/`falseElement`）を導入し、誤答の精度（絶対表現の集中・本文根拠の欠落・型の単調さ・正解の本文丸写し）を機械チェックしてリトライ対象に追加。正解選択肢のパラフレーズ指示も強化。v5.2 出題済み語除外・CEFR C1〜C2制約・正解位置分散・誤答型の体系化・解説ラベル5種固定、v5.1.1 語彙固定グループ化、v5.1.3 アノテーション分離・35語超過エスカレーション）。記事取得パイプライン（`lib/rss.ts`）は別途 **v5.4**（3段階フォールバック: ジャンル固有RSS→AI生成→BBC固定。v5.4でジャンル固有フィードの重複を解消）。各バージョンでの変更点・解決した課題は [CHANGELOG.md](./CHANGELOG.md) を参照。週次の品質チェックは [docs/weekly-review-checklist.md](./docs/weekly-review-checklist.md) を参照。

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
  page.tsx                     トップ画面（リーディング/ライティング選択）
  reading/                     今日の問題ページ（旧 app/page.tsx）
  history/                     問題履歴
  quiz/[date]/                 過去問再表示
  seidoku/[date]/               精読ノート
  flashcards/                  単語フラッシュカード
  writing/                     ライティング サブメニュー
  writing/essay/                週次エッセイ
  writing/daily/                 毎日の表現トレーニング
  writing/summary/               隔週要約
  api/
    generate/                  問題生成（語彙+読解）
    annotations/                解説・アノテーション生成
    pdf/seidoku/                 精読ノートPDF出力（pdfkit、現在未使用）
    pdf/writing/                 ライティング3機能のPDF出力（pdfkit、共通レイアウト）
    tts/                        音声合成
    writing/essay/, writing/daily/, writing/summary/  ライティング3機能のお題生成API（オンデマンド）
    writing/_storage.ts          ライティングのKV/.cache永続化・出題履歴による重複回避ヘルパー
    flashcards/, history/, quiz/[date]/  各機能のデータ取得API
lib/
  claude.ts                    リーディング（語彙+読解）の生成・バリデーション・アノテーションのコアロジック
  wordbank.ts                  英検1級単熟語データ（品詞タグ付き）
  rss.ts                       ニュース記事取得（曜日別ジャンルローテーション）
  writingGenerate.ts            ライティング3機能の生成ロジック（lib/claude.tsとは独立）
  writingTypes.ts               ライティングの型定義・テーマカテゴリ
  writingExpressions.ts          毎日の表現トレーニング用の構文/語彙ストック
  pdfKit.ts                     pdfkitの共通ヘルパー（フォント登録・罫線・A4定数等。seidoku/writing両PDFで共用）
samples/
  fable5-v5/                   few-shot見本データ
  regression-v5_1/              モデル切替時の回帰確認用サンプル
```
