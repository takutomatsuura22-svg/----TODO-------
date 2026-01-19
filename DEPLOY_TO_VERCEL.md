# Vercelデプロイ手順（簡易版）

本番環境用のデータベーステーブルが作成済みの状態から、Vercelにデプロイして他の人もログインできるようにする手順です。

## 📋 前提条件

- ✅ 本番環境用のSupabaseプロジェクトが作成済み
- ✅ 本番環境用のデータベーステーブルが作成済み
- ✅ GitHubアカウント（またはVercelアカウント）

---

## 🚀 ステップ1: Vercelにプロジェクトをデプロイ（10分）

### 方法A: GitHub経由（推奨）

1. **GitHubにリポジトリを作成**
   - GitHubにログイン
   - 「New repository」をクリック
   - リポジトリ名を入力（例: `todo-progress-app`）
   - 「Create repository」をクリック

2. **コードをGitHubにプッシュ**
   ```bash
   # リポジトリを初期化（まだの場合）
   git init
   
   # GitHubリポジトリを追加
   git remote add origin https://github.com/your-username/todo-progress-app.git
   
   # コードをコミット
   git add .
   git commit -m "Initial commit for production"
   
   # GitHubにプッシュ
   git push -u origin main
   ```

3. **Vercelでプロジェクトを作成**
   - https://vercel.com にアクセスしてログイン
   - 「Add New...」→「Project」をクリック
   - GitHubリポジトリを選択
   - 「Import」をクリック
   - プロジェクト設定（自動検出される）：
     - **Framework Preset**: Next.js
     - **Root Directory**: `./`
   - 「Deploy」をクリック
   - デプロイ完了まで待機（2-3分）

4. **デプロイURLを確認**
   - デプロイ完了後、Vercelが自動でURLを生成
   - 例: `https://your-app.vercel.app`
   - **このURLをメモしてください**（後で使用します）

### 方法B: Vercel CLI経由

1. **Vercel CLIをインストール**
   ```bash
   npm i -g vercel
   ```

2. **Vercelにログイン**
   ```bash
   vercel login
   ```

3. **プロジェクトをデプロイ**
   ```bash
   vercel
   ```
   - プロンプトに従って設定
   - 本番環境にデプロイする場合は：
     ```bash
     vercel --prod
     ```

---

## 🔧 ステップ2: 環境変数を設定（5分）

1. **Vercel Dashboardで環境変数を設定**
   - Vercel Dashboard → プロジェクトを選択
   - 「Settings」タブをクリック
   - 左メニュー → 「Environment Variables」

2. **以下の4つの環境変数を追加**

   | Key | Value | 取得方法 |
   |-----|-------|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | 本番環境のSupabase Project URL | Supabase Dashboard → Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番環境のSupabase anon key | Supabase Dashboard → Settings → API → anon/public key |
   | `NEXT_PUBLIC_SITE_URL` | VercelのURL（ステップ1で取得） | 例: `https://your-app.vercel.app` |
   | `SUPABASE_SERVICE_ROLE_KEY` | 本番環境のSupabase service_role key | Supabase Dashboard → Settings → API → service_role key（Revealをクリック） |

   **設定方法:**
   - 「Add New」をクリック
   - Keyに環境変数名を入力
   - Valueに値を貼り付け
   - **Environment**で以下をすべてチェック：
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - 「Save」をクリック
   - **4つすべて追加してください**

3. **再デプロイ**
   - 環境変数を追加した後、自動で再デプロイされる場合があります
   - されない場合は、「Deployments」タブ → 最新のデプロイメント → 「Redeploy」をクリック

---

## 🔐 ステップ3: SupabaseのURL Configurationを設定（3分）

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - 本番環境のSupabaseプロジェクトを選択

2. **URL Configurationを開く**
   - 左メニュー → **Authentication** → **URL Configuration**

3. **Site URLを設定**
   - **Site URL**にVercelのURLを入力：
     ```
     https://your-app.vercel.app
     ```
   - ステップ1でメモしたURLを使用

4. **Redirect URLsを追加**
   - **Redirect URLs**に以下を追加：
     ```
     https://your-app.vercel.app/auth/callback
     ```
   - 「Add URL」をクリックして追加
   - 「Save」をクリック

---

## 🔑 ステップ4: Google OAuth設定の確認（5分）

### 4-1. SupabaseでGoogleプロバイダーが有効か確認

1. **Supabase Dashboard → Authentication → Providers**
2. **Google**をクリック
3. **「Enable Google provider」**が**ON**になっているか確認
4. OFFの場合は、ONにして「Save」をクリック

### 4-2. Google Cloud Consoleの設定を確認

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com にログイン
   - プロジェクトを選択

2. **OAuth 2.0 クライアント IDを確認**
   - 左メニュー → **APIとサービス** → **認証情報**
   - OAuth 2.0 クライアント IDを選択

3. **承認済みのリダイレクト URIを確認**
   - **承認済みのリダイレクト URI**に以下が含まれているか確認：
     ```
     https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
     ```
   - 例: `https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback`
   - 含まれていない場合は追加して保存

4. **Client IDとClient Secretを確認**
   - クライアント IDとクライアント シークレットをコピー

5. **Supabaseに認証情報を設定**
   - Supabase Dashboard → Authentication → Providers → Google
   - **Client ID (for OAuth)**にClient IDを貼り付け
   - **Client Secret (for OAuth)**にClient Secretを貼り付け
   - 「Save」をクリック

---

## ✅ ステップ5: 動作確認（5分）

1. **本番環境のURLにアクセス**
   - ブラウザでVercelのURLにアクセス（例: `https://your-app.vercel.app`）
   - ログインページが表示されることを確認

2. **Googleログインを試す**
   - 「Googleでログイン」をクリック
   - Googleアカウントを選択
   - 認証が成功することを確認
   - 適切な画面にリダイレクトされることを確認

3. **初回ログイン時の動作確認**
   - 初回ログイン時は`/pending`にリダイレクトされることを確認
   - 管理者がroleを設定する必要があることを確認

---

## 🔗 リンク発行（他の人にログインしてもらう）

デプロイが完了したら、以下のURLを他の人に共有してください：

```
https://your-app.vercel.app
```

### ログイン方法

1. 共有されたURLにアクセス
2. 「Googleでログイン」をクリック
3. Googleアカウントでログイン
4. 初回ログイン時は承認待ち画面（`/pending`）が表示されます
5. 管理者がSupabaseの`profiles`テーブルでroleを設定すると、通常の画面が表示されます

### 管理者の作業

初回ログインしたユーザーのroleを設定するには：

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard
   - 本番環境のSupabaseプロジェクトを選択

2. **profilesテーブルを開く**
   - 左メニュー → **Table Editor** → **profiles**

3. **ユーザーのroleを設定**
   - ログインしたユーザーのレコードを探す（emailで検索可能）
   - `role`カラムを編集：
     - `student`: 生徒
     - `teacher`: 教員
     - `admin`: 管理者
   - 「Save」をクリック

4. **ユーザーに再ログインしてもらう**
   - roleを設定した後、ユーザーに再ログインしてもらうと、適切な画面が表示されます

---

## 🐛 トラブルシューティング

### ログインできない場合

1. **環境変数を確認**
   - Vercel Dashboard → Settings → Environment Variables
   - 4つの環境変数がすべて設定されているか確認

2. **SupabaseのURL Configurationを確認**
   - Site URLとRedirect URLsが正しく設定されているか確認

3. **Google OAuth設定を確認**
   - Supabase Dashboard → Authentication → Providers → Google
   - 「Enable Google provider」がONになっているか確認
   - Client IDとClient Secretが正しく設定されているか確認

### エラーメッセージが表示される場合

- **「provider is not enabled」**: Googleプロバイダーが有効になっていません。Supabase Dashboardで有効化してください。
- **「アクセスをブロック」**: Google Cloud ConsoleのOAuth同意画面の設定を確認してください。詳細は [`GOOGLE_OAUTH_BLOCKED_ERROR.md`](./GOOGLE_OAUTH_BLOCKED_ERROR.md) を参照。

---

## 📚 参考ドキュメント

- [Vercel環境変数設定ガイド](./VERCEL_ENV_SETUP.md)
- [Google OAuth設定ガイド](./GOOGLE_OAUTH_SETUP.md)
- [詳細なデプロイ手順](./DEPLOYMENT_GUIDE.md)

---

## ✅ デプロイ完了チェックリスト

- [ ] Vercelにプロジェクトがデプロイされた
- [ ] デプロイURLを取得した
- [ ] 4つの環境変数がVercelに設定された
- [ ] SupabaseのSite URLがVercelのURLに設定された
- [ ] SupabaseのRedirect URLsにコールバックURLが追加された
- [ ] Google OAuthプロバイダーが有効になっている
- [ ] Google Cloud ConsoleのリダイレクトURIが設定されている
- [ ] 本番環境でログインが正常に動作する
- [ ] 初回ログイン時に`/pending`にリダイレクトされる

---

🎉 **デプロイ完了！** これで他の人もログインできるようになりました。
