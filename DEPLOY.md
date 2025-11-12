# デプロイガイド

## クイックスタート

### 必要な情報

1. **MEGA アカウント情報**
   - Email: あなたのMEGAメールアドレス
   - Password: MEGAパスワード

2. **設定済みの値**
   - API Key: `mumei114514` （変更推奨）
   - Domain: `file.mumeidayo.online`

## Netlify デプロイ手順

### 1. GitHubリポジトリ作成

```bash
cd "/Users/mumeidayo/Desktop/file easy"
git init
git add .
git commit -m "Initial commit: MEGA File Manager"
```

GitHubで新しいリポジトリを作成後：

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Netlify設定

1. [Netlify](https://app.netlify.com) にログイン
2. "Add new site" → "Import an existing project"
3. GitHubリポジトリを選択
4. ビルド設定（自動検出される）:
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

### 3. 環境変数設定

Site settings → Environment variables で以下を追加:

```
MEGA_EMAIL=your-mega-email@example.com
MEGA_PASSWORD=your-mega-password
API_KEY=mumei114514
DOMAIN=file.mumeidayo.online
NODE_ENV=production
```

### 4. カスタムドメイン設定

Site settings → Domain management → Add custom domain

1. `file.mumeidayo.online` を入力
2. DNSレコードを設定（ドメインレジストラで）:
   ```
   タイプ: CNAME
   ホスト名: file
   値: YOUR-SITE.netlify.app
   TTL: 自動 or 3600
   ```

3. SSL証明書が自動発行される（数分待つ）

### 5. デプロイ完了！

`https://file.mumeidayo.online` にアクセスして確認

## Render デプロイ手順

### 1. GitHubリポジトリ作成（上記と同じ）

### 2. Render設定

1. [Render](https://render.com) にログイン
2. "New" → "Web Service"
3. GitHubリポジトリを接続
4. 設定:
   - Name: `mega-file-manager`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

### 3. 環境変数設定

Environment タブで以下を追加:

```
MEGA_EMAIL=your-mega-email@example.com
MEGA_PASSWORD=your-mega-password
API_KEY=mumei114514
DOMAIN=file.mumeidayo.online
NODE_ENV=production
PORT=10000
```

### 4. カスタムドメイン設定

Settings → Custom Domain

1. `file.mumeidayo.online` を追加
2. DNSレコードを設定:
   ```
   タイプ: CNAME
   ホスト名: file
   値: YOUR-APP.onrender.com
   ```

### 5. デプロイ完了！

## 使い方

### ログイン

1. `https://file.mumeidayo.online` にアクセス
2. API Key: `mumei114514` を入力
3. ログイン

### 動画アップロード & 共有

1. 動画ファイルをアップロード
2. 🎬アイコンの動画ファイルを探す
3. "🔗 動画リンク" ボタンをクリック
4. URLをコピー
5. Discordに貼り付け → 自動埋め込み！

## トラブルシューティング

### ログインできない

- API Keyが `mumei114514` であることを確認
- ブラウザのキャッシュをクリア

### MEGA接続エラー

- 環境変数 `MEGA_EMAIL` と `MEGA_PASSWORD` が正しく設定されているか確認
- MEGAアカウントが有効か確認

### 動画が再生されない

- ファイル形式を確認（mp4, webm, ogg, mov, avi, mkv）
- ファイルサイズが大きすぎないか確認（推奨: 100MB以下）

### DNS設定が反映されない

- DNSの反映には最大48時間かかる場合があります
- `nslookup file.mumeidayo.online` で確認

## セキュリティ

⚠️ **重要**: 本番環境では以下を必ず実施してください:

1. API Keyを `mumei114514` から変更
2. HTTPSのみ使用（自動）
3. MEGAパスワードを強固にする
4. 定期的にAPIキーを変更

## サポート

問題が発生した場合:
1. ログを確認（Netlify/Renderのダッシュボード）
2. 環境変数が正しく設定されているか確認
3. GitHubのIssuesで報告
