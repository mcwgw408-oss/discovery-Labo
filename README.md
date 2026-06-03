# discovery-Labo

発信前の「まだ形になっていないもの」を一時的に置いて、あとから育てるためのReact + TypeScript + Viteアプリです。

投稿の自動化や完成記事の管理ではなく、気づき・違和感・反応・ひらめきの種を1つの場所に集めます。

## 機能

- 発見の登録、一覧表示、編集、削除
- 状態の変更
  - 🌱 発芽
  - 🌿 育成中
  - 🫙 発酵中
  - 🍎 収穫済み
- 発生源、タグ、日付の記録
- 状態別フィルター、タグ別フィルター
- localStorage保存
- スマホ対応レイアウト

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## GitHub Pages

`main`ブランチへpushすると、`.github/workflows/deploy.yml`で自動ビルドしてGitHub Pagesへ公開します。

GitHub側では、リポジトリの `Settings > Pages > Build and deployment` を `GitHub Actions` にしてください。
