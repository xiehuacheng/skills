[中文](../README.md) | [English](./README.en.md) | **日本語**

# skills

> Agent Skills コレクション。各領域の経験を再利用可能な AI 能力にパッケージ化します | A collection of Agent Skills that turn AI agents into reusable domain experts.

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## 目次

- [インストール](#インストール)
- [Skill 紹介](#skill-紹介)
  - [クイック索引](#クイック索引)
- [貢献](#貢献)
- [ライセンス](#ライセンス)

## インストール

エージェントに一言話すだけでインストールできます：

```text
このリポジトリのすべての skill をインストールしてください： xiehuacheng/skills@hot-skills
```

または

```text
このリポジトリから skill をインストールしてください： xiehuacheng/skills@hot-skills
インストール対象：（インストールしたい skill 名）
```

または [skills.sh](https://skills.sh/) CLI を直接使用：

```bash
npx skills add xiehuacheng/skills@hot-skills
```

ローカルでテストする際は、直接パスを指定することもできます：

```bash
npx skills add /path/to/skills@hot-skills
```

## Skill 紹介

### クイック索引

| Skill | 一言説明 | 典型的なシーン |
|-------|-----------|---------|
| [`creating-skills`](../skills/creating-skills) | Agent Skill の作成・改善・検証 | 新しい skill を書きたい |
| [`hot-skills`](../skills/hot-skills) | 今人気の Agent Skills を発見 | 今何が流行っているか知りたい |
| [`skill-translator`](../skills/skill-translator) | skill の `SKILL.md` を多言語間で翻訳 | 多言語 skill を保守する |
| [`effort-audit`](../skills/effort-audit) | 現在のタスクが長期方向から外れていないか確認 | この作業が価値あるか確認したい |
| [`go-goal-go`](../skills/go-goal-go) | 検証可能な `/goal` 目標を作成 | 多ターンタスクを agent に自動実行させたい |
| [`ask-for-tools`](../skills/ask-for-tools) | agent がツール境界にぶつかったときにツールを要求 | agent にツールや権限が足りないとき |
| [`github-asset-manager`](../skills/github-asset-manager) | GitHub Stars・リポジトリ・README を整理 | GitHub のデジタル資産を管理する |
| [`cv-builder`](../skills/cv-builder) | プロジェクト・GitHub・旧履歴書から技術職の履歴書/CV を生成 | 履歴書を書く・更新する |
| [`cv-clone`](../skills/cv-clone) | 目標履歴書のレイアウト・スタイルを複製し、編集可能な LaTeX テンプレートを生成 | 参考にしたいサンプルと同じ体裁の履歴書を作りたい |
| [`init-llm-wiki`](../skills/init-llm-wiki) | Karpathy スタイルの LLM Wiki を初期化・維持 | 新しい領域の wiki を作る |

以下、各 skill の詳細を説明します。

### hot-skills

[`hot-skills`](../skills/hot-skills) は、現在注目されている Agent Skill を発見するために使われます。複数のデータソースからの信号を集約します：

- **[agentskills.media](https://agentskills.media)** — GitHub stars と分類
- **skills-rank.com** — 単一 skill のランキングスコア
- **skills.sh** — 実際のインストール数（ヘッドレスブラウザで公開ランキングを取得）

カテゴリやエイリアスによる絞り込み、キーワード検索、24 時間のトレンドランキングの確認、JSON 出力に対応しています。また、`owner/repo@skill-name` で正確に重複を排除し、複数ソースの指標を統合します。「今、人気の skill は何？」「フロントエンドで人気の skill は何？」といった質問に答えるのに適しています。

### init-llm-wiki

[`init-llm-wiki`](../skills/init-llm-wiki) は、新しい領域向けに Karpathy スタイルの LLM Wiki を迅速に立ち上げ、維持することを支援します。

Google Cloud Open Knowledge Format（OKF）v0.1 に準拠し、Obsidian 優先で動作します：`00-Raw/`、`01-Wiki/`、`02-Areas/`（または `02-Module/`）ディレクトリを自動生成し、ルートの `index.md`、`log.md`、agent schema ドキュメントを作成し、frontmatter と `[[wikilink]]` リンク規約を統一します。Ingest フローでは、まずユーザーと主要な学びについて議論し、次にページ構成を計画することを重視し、キュレーションをバッチ処理にしないようにします。

### github-asset-manager

[`github-asset-manager`](../skills/github-asset-manager) は、GitHub のデジタル資産を整理し、改善するために使われます。

GitHub CLI または `GITHUB_TOKEN` を使ってデータを読み取り、複数のローカル分析コマンドを提供します：GitHub Stars の分析と分類、個人リポジトリの健全性監査、GitHub Profile README の生成、リポジトリ README の潤色、多言語 README の生成、指定リポジトリの description と topics の補完、Stars を GitHub Lists に整理する機能です。使用時はまず認証と権限 scope を確認し、生成した内容をユーザーに提示します。すべての書き込み操作（About の更新、README のプッシュ、Star Lists の適用など）にはユーザーの明示的な確認が必要で、デフォルトでは構造化された Markdown レポートのみを出力します。

### cv-builder

[`cv-builder`](../skills/cv-builder) は、技術職の履歴書や CV を作成するために使われます。

ローカルプロジェクト、GitHub リポジトリ、既存の履歴書ファイル、またはプレーンテキストのメモから材料を収集し、sub agent を使って並列に読み取り、プロジェクトのハイライトを抽出します。その後、ユーザーに個人情報、キャリア目標、経歴、スキルなどを確認させ、最終的に Markdown 草稿を生成して HTML/PDF にレンダリングします。modern、classic、minimal などの組み込みテンプレートに加え、カスタムテンプレートやユーザーの説明に基づいて agent が生成するスタイルにも対応しています。

### cv-clone

[`cv-clone`](../skills/cv-clone) は、目標の履歴書・CV サンプルの視覚レイアウトを複製し、編集可能な LaTeX テンプレートを出力します。

サンプル履歴書（PDF またはスクリーンショット）を与えると、`tectonic` / `xelatex` ベースのコンパイル可能な LaTeX テンプレートを生成し、`\newcommand` プレースホルダを備えます。デフォルトでは実データを事前入力せず、まずテンプレートを生成してユーザーに確認を取り、明示的に承認を得てから入力ワークフローを開きます。`cv-builder` と補完関係にあり、`cv-builder` がコンテンツ、`cv-clone` がスタイルを担当します（cv-builder で草稿を作り、cv-clone で目標サンプルの体裁を適用する、という連結が可能）。macOS を主ターゲットとしつつ、`SKILL.md` で Linux / Windows の `apt` / `scoop` 手順も案内します。

**v0.3.0** — 未実装の Route A/C と cv-builder 統合の記述を削除（各 skill は独立を維持）。`SKILL.md` + `references/` 合計を 3509 → 1765 語（−50%）に縮小。
ローカルプロジェクト、GitHub リポジトリ、既存の履歴書ファイル、またはプレーンテキストのメモから材料を収集し、sub agent を使って並列に読み取り、プロジェクトのハイライトを抽出します。その後、ユーザーに個人情報、キャリア目標、経歴、スキルなどを確認させ、最終的に Markdown 草稿を生成して HTML/PDF にレンダリングします。modern、classic、minimal などの組み込みテンプレートに加え、カスタムテンプレートやユーザーの説明に基づいて agent が生成するスタイルにも対応しています。

### creating-skills

[`creating-skills`](../skills/creating-skills) は、Agent Skill の作成、改善、検証に使われます。

協働型のブレインストーミングを通じて、skill のシナリオ、トリガーとなるタイミング、範囲を明確にし、それぞれの重要なポイントでユーザーに確認を求め、承認前に最も脆弱な仮定を積極的に突きます。SKILL.md とディレクトリ構造の生成に加え、以下を重視します：まずインストール場所を確認すること、能力の境界とデフォルト動作を明確に宣言すること、skill を使う agent 向けに実行チェックリストと対話モードを提供すること、SKILL.md にユーザーの承認ポイントと期待される出力例を記載すること、そして `quick_validate.py` と sub-agent によるエンドツーエンドテストで skill の品質を検証することです。

### effort-audit

[`effort-audit`](../skills/effort-audit) は、現在のプロジェクトやタスクがユーザーの長期方向と一致しているかを自動的にチェックするために使われます。

プロジェクト対話の開始時に、`~/.config/effort-audit/profile.md` の個人方向設定を自動的に読み込み、現在のタスクが逸脱しているかどうかを判断します。逸脱が中度以上の場合、具体的な理由を挙げて一時停止し、「続行」「方向を調整」「保留」などのオプションを提供し、ユーザーの精力を主攻領域に戻すのを助けます。初回使用時には、一次性のインタビューで個人方向設定を生成します。

### ask-for-tools

[`ask-for-tools`](../skills/ask-for-tools) は、agent がツール境界に遭遇した際に、無理に進めるのではなくユーザーにツールを要求するために使われます。

新しいタスクの開始時や実行中に行き詰まった際にトリガーされ、まずツールが既に存在するかどうかを自己チェックします。存在しない場合、その理由と代替案、そして「ツールを提供する / 降格して試す / タスクを停止する」の 3 つのオプションをユーザーに明確に説明します。MCP server、CLI ツール、Python/Node パッケージ、API キー、システム権限、ローカルファイルなどのシーンに対応します。

### go-goal-go

[`go-goal-go`](../skills/go-goal-go) は、明確な終了状態、証拠、境界、停止ルールを持つ検証可能な `/goal` 目標を作成するのを手伝うために使われます。

タスクが反復的・検証可能・範囲限定である場合に積極的に goal モードを提案し、自律的に多ターン実行できる目標を作成します。ユーザーが明示的に指定した skill やシステムツールをループ内で使うように宣言することもできます。goal モードに向かないタスクには、はっきりとした理由を説明して正直に反論します。

### skill-translator

[`skill-translator`](../skills/skill-translator) は、skill の `SKILL.md` を多言語間で翻訳するために使われます。

中国語（`zh-CN`）と英語（`en`）を中心に、自然言語での翻訳依頼から対象 skill と目標言語を特定し、ソース言語を自動検出して、コードブロック・ファイルパス・コマンド名・技術識別子・URL など翻訳できない要素を保持しながら本文を翻訳します。翻訳後は `scripts/quick_validate.py` で SKILL.md を検証し、ユーザー承認の上で元のファイルを上書きします。新規 skill の作成や README など `SKILL.md` 以外のファイルの翻訳は扱いません。

## 貢献

新しい skill の追加や既存 skill の改善を歓迎します。各 skill は `skills/<skill-name>/` ディレクトリに個別に配置し、`SKILL.md` 説明ファイルを含めてください。

## ライセンス

[MIT](../LICENSE)
