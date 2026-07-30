[中文](../README.md) | [English](./README.en.md) | **日本語**

# skills

> Agent Skills コレクション — 各領域の経験を再利用可能な AI 能力としてパッケージ化。

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## インストール

[skills.sh](https://skills.sh/) CLI を使用：

```bash
npx skills add xiehuacheng/skills              # 全部インストール
npx skills add xiehuacheng/skills -s hot-skills # 一つだけインストール
npx skills add xiehuacheng/skills -l           # 一覧を見る（インストールしない）
```

エージェントに依頼する場合：

```
このリポジトリから skill をインストールしてください：xiehuacheng/skills
```

## 分類別

トピックごとに分類されており、各分類に独自の README があります：

- **[wiki/](../skills/wiki/README.md)** — ナレッジベース・ノート
- **[skill-ecosystem/](../skills/skill-ecosystem/README.md)** — Skill エンジニアリングツール
- **[career/](../skills/career/README.md)** — 転職・履歴書
- **[github/](../skills/github/README.md)** — GitHub デジタル資産
- **[workflow/](../skills/workflow/README.md)** — ワークフロー・目標管理

> 分類はリポジトリ構造の選択であり、`npx skills add` コマンドには影響しません — CLI は SKILL.md を再帰的にスキャンします。

## これらの Skill が解決する問題

**Skill エンジニアリング**

- 新しい skill を書きたいがどこから始めればよいか分からない → [creating-skills](../skills/skill-ecosystem/creating-skills)
- 今どんな skill が流行しているか知りたい → [hot-skills](../skills/skill-ecosystem/hot-skills)
- 多言語の SKILL.md を保守したい → [skill-translator](../skills/skill-ecosystem/skill-translator)

**ワークフローと方向性**

- 新しいことを始めたいが考えがまとまっていない、あるいは脱線している気がする → [think-twice](../skills/workflow/think-twice)
- 多ターンタスクで「完了」の判断がつかない → [go-goal-go](../skills/workflow/go-goal-go)
- agent にツールがなくて無理に進めている → [ask-for-tools](../skills/workflow/ask-for-tools)

**個人成果物**

- 技術職の履歴書を書きたい・更新したい → [cv-builder](../skills/career/cv-builder)
- 参考にしたい履歴書と同じレイアウトにしたい → [cv-clone](../skills/career/cv-clone)
- GitHub Stars が乱雑 / リポジトリの README が未執筆 → [github-asset-manager](../skills/github/github-asset-manager)
- 新しい領域の Karpathy 風 wiki を立ち上げたい → [init-llm-wiki](../skills/wiki/init-llm-wiki)

## 貢献

新しい skill や改善を歓迎します。各 skill は対応するトピックサブディレクトリに配置してください（例：`skills/wiki/<skill-name>/`）。SKILL.md を含めてください。新しいトピックの場合は、新しいサブディレクトリを作成してください。

## ライセンス

[MIT](../LICENSE)
