[中文](../README.md) | [English](./README.en.md) | **日本語**

# skills

> xiehuacheng の JavaScript プロジェクト。

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## 目次

- [インストール](#インストール)
- [Skill 介绍](#skill-介绍)
- [貢献](#貢献)
- [ライセンス](#ライセンス)

## インストール

エージェントに一言話すだけでインストールできます：

```text
帮我安装这个仓库下的所有 skill： xiehuacheng/skills@hot-skills
```

または

```text
帮我从这个仓库安装 skill： xiehuacheng/skills@hot-skills
只安装：（你想要安装的 skill 名称）
```

または [skills.sh](https://skills.sh/) CLI を直接使用：

```bash
npx skills add xiehuacheng/skills@hot-skills
```

ローカルでテストする際は、直接パスを指定することもできます：

```bash
npx skills add /path/to/skills@hot-skills
```

## Skill 介绍

### hot-skills

[`hot-skills`](./skills/hot-skills) は、現在注目されている Agent Skill を発見するために使われます。複数のデータソースからの信号を集約します：

- **[agentskills.media](https://agentskills.media)** — GitHub stars と分類
- **skills-rank.com** — 単一 skill のランキングスコア
- **skills.sh** — 実際のインストール数（ヘッドレスブラウザで公開ランキングを取得）

カテゴリやエイリアスによる絞り込み、キーワード検索、24 時間のトレンドランキングの確認、JSON 出力に対応しています。また、`owner/repo@skill-name` で正確に重複を排除し、複数ソースの指標を統合します。「今、人気の skill は何？」「フロントエンドで人気の skill は何？」といった質問に答えるのに適しています。

### init-llm-wiki

[`init-llm-wiki`](./skills/init-llm-wiki) は、新しい領域向けに Karpathy スタイルの LLM Wiki を迅速に立ち上げ、維持することを支援します。

Google Cloud Open Knowledge Format（OKF）v0.1 に準拠し、Obsidian 優先で動作します：`00-Raw/`、`01-Wiki/`、`02-Areas/`（または `02-Module/`）ディレクトリを自動生成し、ルートの `index.md`、`log.md`、agent schema ドキュメントを作成し、frontmatter と `[[wikilink]]` リンク規約を統一します。Ingest フローでは、まずユーザーと主要な学びについて議論し、次にページ構成を計画することを重視し、キュレーションをバッチ処理にしないようにします。

### github-asset-manager

[`github-asset-manager`](./skills/github-asset-manager) は、GitHub のデジタル資産を整理し、改善するために使われます。

GitHub CLI または `GITHUB_TOKEN` を使ってデータを読み取り、複数のローカル分析コマンドを提供します：GitHub Stars の分析と分類、個人リポジトリの健全性監査、GitHub Profile README の生成、指定リポジトリの description と topics の補完、Stars を GitHub Lists に整理する機能です。すべての書き込み操作にはユーザーの明示的な確認が必要で、デフォルトでは構造化された Markdown レポートのみを出力します。

### creating-skills

[`creating-skills`](./skills/creating-skills) は、新しい Agent Skill を作成するために使われます。

協働型のブレインストーミングを通じて、skill のユースケース、トリガーとなるタイミング、範囲を明確にし、命名と構造の提案を行い、それぞれの重要なポイントでユーザーに確認を求めます。漸進的な情報開示、ヒト・イン・ザ・ループ（人在回路）における意思決定、および skill ワークフローでは中間ファイルを生成するのではなく、スクリプトを stdin/stdout で組み合わせることを優先することを重視しています。

## 貢献

新しい skill の追加や既存 skill の改善を歓迎します。各 skill は `skills/<skill-name>/` ディレクトリに個別に配置し、`SKILL.md` 説明ファイルを含めてください。

## ライセンス

[MIT](./LICENSE)

> この文書は翻訳版です。正確な内容は README.md を参照してください。
