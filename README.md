# MEGA File Manager

個人用ファイル管理サービス - MEGA APIを使用したCLIとWebインターフェース

## 機能

- 🔐 APIキーベースの認証（個人使用向け）
- 💻 強力なCLIツール
- 🌐 モダンなWebインターフェース
- ☁️ MEGA.nzストレージバックエンド
- 🚀 Netlify/Render/Vercelでデプロイ可能

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成（`.env.example`を参考に）：

```env
# MEGA Account Credentials
MEGA_EMAIL=your-email@example.com
MEGA_PASSWORD=your-mega-password

# API Security (ランダムな長い文字列を生成してください)
API_KEY=your-secret-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. APIキーについて

このプロジェクトでは、APIキーが `mumei114514` にハードコードされています。

**本番環境では必ず変更してください！**

安全なAPIキーを生成する方法：

```bash
# macOS/Linux
openssl rand -hex 32

# または Node.js で
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

生成されたキーを`.env`の`API_KEY`に設定してください。

## 使い方

### CLIツール

```bash
# ファイル一覧
npm run cli list
npm run cli ls /path/to/folder

# ファイルアップロード
npm run cli upload ./local-file.txt
npm run cli up ./local-file.txt remote-name.txt

# ファイルダウンロード
npm run cli download /remote-file.txt
npm run cli dl /remote-file.txt ./local-file.txt

# ファイル削除
npm run cli delete /remote-file.txt
npm run cli rm /remote-file.txt

# フォルダ作成
npm run cli mkdir /my-folder

# ファイル情報取得
npm run cli info /remote-file.txt
```

### グローバルインストール（オプション）

```bash
npm install -g .
```

その後、どこからでも`mega-cli`コマンドが使えます：

```bash
mega-cli ls
mega-cli upload file.txt
mega-cli download /file.txt
```

### Webインターフェース

#### ローカルで起動

```bash
npm start
# または開発モード（ホットリロード）
npm run dev
```

ブラウザで `http://localhost:3000` を開いてアクセス。

APIキー（`.env`で設定したもの）でログインしてください。

#### 動画の埋め込み機能

動画ファイル（.mp4, .webm, .ogg, .mov, .avi, .mkv）をアップロードすると、Discordで埋め込み表示できる共有リンクが生成できます：

1. 動画ファイルをアップロード
2. ファイル一覧で動画ファイルの横にある「🔗 動画リンク」ボタンをクリック
3. 生成されたURLをコピー
4. DiscordにURLを貼り付け → 自動的に動画が埋め込まれて再生可能に！

**URL形式:**
- 埋め込み用: `https://your-domain.com/v/{fileId}`
- 直接ストリーム: `https://your-domain.com/video/{fileId}`

動画は認証不要でアクセス可能（公開リンク）なので、Discordや他のSNSで簡単に共有できます。

## デプロイ

### Renderでデプロイ（推奨）

Expressサーバーを使用した従来型のデプロイ：

1. [Render](https://render.com)でアカウント作成
2. 新しいWeb Serviceを作成
3. GitHubリポジトリを接続
4. 環境変数を設定：
   - `MEGA_EMAIL`
   - `MEGA_PASSWORD`
   - `API_KEY`
5. デプロイ完了

または`render.yaml`を使用した自動デプロイ：

```bash
# render.yaml が既に含まれています
git push
```

**Renderの特徴:**
- ✅ 常時稼働サーバー
- ✅ 動画ストリーミングが安定
- ✅ WebSocketサポート
- ⚠️ 無料プランはスリープあり（15分無操作でスリープ）

### Netlifyでデプロイ（サーバーレス）

Netlify Functionsを使用したサーバーレス実装に対応しています：

1. [Netlify](https://netlify.com)でアカウント作成
2. GitHubリポジトリを接続
3. ビルド設定（自動検出されます）：
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. 環境変数を設定：
   - `MEGA_EMAIL`
   - `MEGA_PASSWORD`
   - `API_KEY`
5. デプロイ

**Netlifyの特徴:**
- ✅ サーバーレス（自動スケール）
- ✅ CDN配信で高速
- ✅ 無料枠でも十分使える
- ⚠️ 動画ストリーミングはMEGAのダイレクトリンクにリダイレクト

### Vercelでデプロイ（サーバーレス）

1. [Vercel](https://vercel.com)でアカウント作成
2. プロジェクトをインポート
3. 環境変数を設定：
   - `MEGA_EMAIL`
   - `MEGA_PASSWORD`
   - `API_KEY`
4. デプロイ

```bash
# Vercel CLIを使用
npm i -g vercel
vercel
```

### 独自ドメインの設定

このプロジェクトは `file.mumeidayo.online` で運用されます。

#### Netlify でのドメイン設定

1. Netlify Dashboard → Site settings → Domain management
2. "Add custom domain" をクリック
3. `file.mumeidayo.online` を入力
4. DNS設定（ドメインレジストラで設定）：
   ```
   タイプ: CNAME
   ホスト: file
   値: your-site.netlify.app
   ```
5. Netlifyで SSL証明書が自動発行される（数分）

#### Render でのドメイン設定

1. Render Dashboard → Settings → Custom Domain
2. `file.mumeidayo.online` を追加
3. DNS設定（ドメインレジストラで設定）：
   ```
   タイプ: CNAME
   ホスト: file
   値: your-app.onrender.com
   ```

#### 環境変数にドメインを設定

Netlify/Renderの環境変数に追加：
```
DOMAIN=file.mumeidayo.online
```

これにより動画埋め込みURLが正しく生成されます。

## API エンドポイント

全てのAPIリクエストには`X-API-Key`ヘッダーまたは`?apiKey=xxx`クエリパラメータが必要です。

### GET /api/health
ヘルスチェック（認証不要）

### GET /api/files?path=/
ファイル一覧取得

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/files
```

### GET /api/files/info?path=/file.txt
ファイル情報取得

### POST /api/files/upload
ファイルアップロード（multipart/form-data）

```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@./local-file.txt" \
  http://localhost:3000/api/files/upload
```

### DELETE /api/files?path=/file.txt
ファイル削除

```bash
curl -X DELETE \
  -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/files?path=/file.txt"
```

### POST /api/folders
フォルダ作成

```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"path":"/my-folder"}' \
  http://localhost:3000/api/folders
```

### GET /v/:fileId
動画埋め込みページ（認証不要）

Discord埋め込み対応のOGPメタタグ付き動画ページ

### GET /video/:fileId
動画ストリーミング（認証不要）

直接動画をストリーミング再生。Range Requestsサポートでシーク可能

## セキュリティ

- **APIキーは絶対に公開しないでください**
- `.gitignore`に`.env`が含まれていることを確認
- 本番環境では必ずHTTPSを使用
- APIキーは定期的に変更することを推奨
- 個人使用向けなので、複数ユーザーのサポートはありません

## トラブルシューティング

### MEGA接続エラー

```
Error: Login failed
```

→ MEGA_EMAILとMEGA_PASSWORDが正しいか確認してください

### 認証エラー

```
401 Unauthorized
```

→ API_KEYが正しく設定されているか確認してください

### ファイルアップロードエラー

→ 一時ディレクトリの書き込み権限を確認してください

```bash
mkdir -p temp
chmod 755 temp
```

## ライセンス

MIT

## 開発

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# CLIのテスト
npm run cli -- ls

# リンター（オプション）
npm run lint
```

## 技術スタック

- **バックエンド**: Node.js, Express
- **MEGA API**: megajs
- **CLI**: Commander.js, Chalk, Ora
- **フロントエンド**: Vanilla JavaScript（フレームワーク不要）
- **デプロイ**: Render, Netlify, Vercel対応

## 貢献

個人使用向けプロジェクトですが、改善提案は歓迎します！

## 注意事項

- このプロジェクトは個人使用を想定しています
- 商用利用の場合は適切な認証・認可システムの実装が必要です
- MEGAの利用規約を遵守してください
- 大容量ファイルのアップロード/ダウンロードには時間がかかります
# hum
