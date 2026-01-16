# 本番環境デプロイ手順（詳細版）

## 📋 デプロイ前の準備

### 必要なもの
- Supabaseアカウント
- Vercelアカウント（またはGitHubアカウント）
- Google Cloud Consoleアカウント
- 本番環境用のドメイン（Vercelが自動で提供する場合もあります）

---

## 🗄️ ステップ1: Supabase側の準備

### 1-1. 本番環境のSupabaseプロジェクトを作成

1. **Supabase Dashboardにログイン**
   - https://supabase.com/dashboard にアクセス
   - ログイン

2. **新規プロジェクトを作成**
   - 「New Project」ボタンをクリック
   - プロジェクト名を入力（例: `seifukan-gakuin-production`）
   - データベースパスワードを設定（メモしておく）
   - リージョンを選択（最寄りのリージョンを選択）
   - 「Create new project」をクリック
   - プロジェクト作成完了まで待機（2-3分）

3. **プロジェクト情報を取得**
   - プロジェクトが作成されたら、Settings → API を開く
   - 以下の情報をメモ：
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **service_role key**: 「Reveal」をクリックしてコピー

---

### 1-2. スキーマを適用

1. **Supabase SQL Editorを開く**
   - 左メニューから「SQL Editor」をクリック
   - 「New query」をクリック

2. **完全スキーマを適用**
   - `supabase-complete-schema.sql`ファイルを開く
   - 内容をすべてコピー
   - SQL Editorに貼り付け
   - 「Run」をクリック
   - 「Success. No rows returned」と表示されればOK

3. **自動TODO生成トリガーを適用**
   - `auto-todo-generation-trigger.sql`ファイルを開く
   - 内容をすべてコピー
   - SQL Editorに貼り付け
   - 「Run」をクリック
   - 「Success. No rows returned」と表示されればOK

4. **パフォーマンス最適化インデックスを適用**
   - `performance-optimization.sql`ファイルを開く
   - 内容をすべてコピー
   - SQL Editorに貼り付け
   - 「Run」をクリック
   - 「Success. No rows returned」と表示されればOK

---

### 1-3. 初期データを登録

1. **22件のスタートTODOを登録**
   - 以前に作成した22件のスタートTODOのINSERT文を実行
   - または、ローカル環境のSupabaseからエクスポートしてインポート

2. **志望校マスタデータを登録（必要に応じて）**
   - `test-admission-programs-secure.sql`を実行
   - または、実際の志望校データを登録

---

### 1-4. Google OAuth設定（Supabase側）

1. **Supabase Dashboardで設定**
   - 左メニューから「Authentication」→「Providers」をクリック
   - 「Google」を探してクリック
   - 「Enable Google provider」をONにする

2. **Google Cloud Consoleで認証情報を取得**
   - https://console.cloud.google.com にアクセス
   - プロジェクトを選択（または新規作成）
   - 「APIとサービス」→「認証情報」を開く
   - 「認証情報を作成」→「OAuth クライアント ID」を選択
   - アプリケーションの種類: **「ウェブアプリケーション」**
   - 名前: 任意（例: `Supabase Auth Production`）
   - **承認済みのリダイレクト URI**に以下を追加：
     ```
     https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
     ```
     - 例: `https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback`
   - 「作成」をクリック
   - **Client ID**と**Client Secret**をコピー

3. **Supabaseに認証情報を設定**
   - Supabase Dashboard → Authentication → Providers → Google
   - **Client ID (for OAuth)**に、Google Cloud Consoleで取得したClient IDを貼り付け
   - **Client Secret (for OAuth)**に、Google Cloud Consoleで取得したClient Secretを貼り付け
   - 「Save」をクリック

4. **URL Configurationを設定**
   - Supabase Dashboard → Authentication → URL Configuration
   - **Site URL**に本番環境のURLを設定：
     ```
     https://your-production-domain.vercel.app
     ```
     - まだVercelのURLが分からない場合は、後で設定
   - **Redirect URLs**に以下を追加：
     ```
     https://your-production-domain.vercel.app/auth/callback
     ```
   - 「Save」をクリック

---

## 🚀 ステップ2: Vercel側の準備

### 2-1. Vercelプロジェクトを作成

#### 方法A: GitHub連携（推奨）

1. **GitHubにリポジトリを作成**
   - GitHubにログイン
   - 「New repository」をクリック
   - リポジトリ名を入力（例: `seifukan-todo-app`）
   - 「Create repository」をクリック

2. **ローカルコードをGitHubにプッシュ**
   ```bash
   # リポジトリを初期化（まだの場合）
   git init
   
   # .gitignoreを確認（.env.localが含まれているか確認）
   # 含まれていない場合は追加
   
   # GitHubリポジトリを追加
   git remote add origin https://github.com/your-username/seifukan-todo-app.git
   
   # コードをコミット
   git add .
   git commit -m "Initial commit"
   
   # GitHubにプッシュ
   git push -u origin main
   ```

3. **Vercelでプロジェクトを作成**
   - https://vercel.com にアクセス
   - 「Add New...」→「Project」をクリック
   - GitHubリポジトリを選択
   - 「Import」をクリック
   - プロジェクト設定：
     - **Framework Preset**: Next.js（自動検出される）
     - **Root Directory**: `./`（そのまま）
     - **Build Command**: `npm run build`（自動）
     - **Output Directory**: `.next`（自動）
   - 「Deploy」をクリック
   - デプロイ完了まで待機（2-3分）

#### 方法B: Vercel CLI（GitHubを使わない場合）

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

### 2-2. 環境変数を設定

1. **Vercel Dashboardで環境変数を設定**
   - Vercel Dashboard → プロジェクトを選択
   - 「Settings」タブをクリック
   - 左メニューから「Environment Variables」をクリック

2. **以下の環境変数を追加**

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | 本番環境のSupabase Project URL | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 本番環境のSupabase anon key | Production, Preview, Development |
   | `NEXT_PUBLIC_SITE_URL` | 本番環境のURL（例: `https://your-app.vercel.app`） | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | 本番環境のSupabase service_role key | Production, Preview, Development |

   **設定方法:**
   - 「Add New」をクリック
   - Keyに環境変数名を入力
   - Valueに値を貼り付け
   - Environmentで「Production」「Preview」「Development」すべてにチェック
   - 「Save」をクリック
   - 4つの環境変数すべてを追加

3. **環境変数設定後の再デプロイ**
   - 環境変数を追加した後、自動で再デプロイされる場合があります
   - されない場合は、「Deployments」タブから「Redeploy」をクリック

---

### 2-3. ビルド確認

1. **ローカルでビルドテスト**
   ```bash
   npm run build
   ```
   - エラーが出ないことを確認

2. **Vercelでのビルド確認**
   - Vercel Dashboard → Deployments
   - 最新のデプロイメントの「Build Logs」を確認
   - エラーがないことを確認

---

## 🔄 ステップ3: Google OAuth設定の最終確認

### 3-1. Google Cloud Consoleの設定確認

1. **承認済みのリダイレクトURIを確認**
   - Google Cloud Console → APIとサービス → 認証情報
   - OAuth 2.0 クライアント IDを選択
   - **承認済みのリダイレクト URI**に以下が含まれているか確認：
     ```
     https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
     ```
   - 含まれていない場合は追加

### 3-2. SupabaseのURL Configurationを最終確認

1. **Site URLを確認**
   - Supabase Dashboard → Authentication → URL Configuration
   - **Site URL**が本番環境のURLになっているか確認
   - 例: `https://your-app.vercel.app`

2. **Redirect URLsを確認**
   - **Redirect URLs**に以下が含まれているか確認：
     ```
     https://your-app.vercel.app/auth/callback
     ```
   - 含まれていない場合は追加

---

## ✅ ステップ4: 動作確認

### 4-1. 認証確認

1. **ログインページにアクセス**
   - 本番環境のURLにアクセス（例: `https://your-app.vercel.app/login`）
   - ログインページが表示されることを確認

2. **Googleログインを試す**
   - 「Googleでログイン」をクリック
   - Googleアカウントを選択
   - 認証が成功することを確認
   - 適切な画面にリダイレクトされることを確認

### 4-2. 機能確認

1. **生徒機能**
   - 生徒アカウントでログイン
   - `/todos`でTODO一覧が表示されることを確認
   - TODOの詳細表示・保存が正常に動作することを確認
   - `/admissions`で進路情報の入力・保存が正常に動作することを確認

2. **教員機能**
   - 教員アカウントでログイン
   - `/teacher/dashboard`で生徒一覧が表示されることを確認
   - 停滞フラグが正しく表示されることを確認

3. **管理者機能**
   - 管理者アカウントでログイン
   - `/admin/users`でユーザー管理が正常に動作することを確認
   - `/admin/templates`でテンプレート管理が正常に動作することを確認

### 4-3. 自動化機能確認

1. **last_login_atの自動更新**
   - ログイン後、Supabase Dashboard → Table Editor → `profiles`テーブル
   - 自分のレコードの`last_login_at`が更新されていることを確認

2. **自動TODO生成**
   - 管理者でログイン
   - 新規テンプレートを追加
   - 対象生徒（高2）のTODO一覧に自動生成されることを確認

### 4-4. 監査ログ確認

1. **ロール変更の監査ログ**
   - 管理者でログイン
   - 任意のユーザーのロールを変更
   - Supabase Dashboard → Table Editor → `audit_logs`テーブル
   - ログが記録されていることを確認

2. **テンプレート変更の監査ログ**
   - 管理者でログイン
   - 任意のテンプレートを編集
   - `audit_logs`テーブルでログが記録されていることを確認

---

## 📝 デプロイ後の運用

### 監査ログの確認方法

Supabase SQL Editorで以下を実行：

```sql
-- 最近の監査ログを確認
SELECT 
  al.*,
  p.name as actor_name,
  p.email as actor_email
FROM public.audit_logs al
LEFT JOIN public.profiles p ON al.actor_user_id = p.id
ORDER BY al.created_at DESC
LIMIT 50;
```

### パフォーマンス監視

- Supabase Dashboard → Database → Performance でクエリパフォーマンスを確認
- Vercel Dashboard → Analytics でアプリのパフォーマンスを確認

### バックアップ

- Supabaseの自動バックアップ設定を確認
- 必要に応じて手動バックアップを取得

---

## 🐛 トラブルシューティング

### ログインできない場合

1. **Google OAuth設定を確認**
   - Supabase Dashboard → Authentication → Providers → Google
   - Client IDとClient Secretが正しく設定されているか確認
   - Google Cloud ConsoleのリダイレクトURIが正しいか確認

2. **URL Configurationを確認**
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URLとRedirect URLsが本番環境のURLになっているか確認

### 環境変数が読み込まれない場合

1. **Vercel Dashboardで環境変数を確認**
   - Settings → Environment Variables
   - すべての環境変数が正しく設定されているか確認

2. **再デプロイを実行**
   - Deployments → 最新のデプロイメント → 「Redeploy」をクリック

### 監査ログが記録されない場合

1. **環境変数を確認**
   - `SUPABASE_SERVICE_ROLE_KEY`が正しく設定されているか確認
   - Vercel Dashboard → Settings → Environment Variables

2. **ブラウザのコンソールでエラーを確認**
   - 開発者ツール（F12）→ Consoleタブ
   - エラーメッセージを確認

---

## 🎉 デプロイ完了

以上で本番環境へのデプロイが完了です！

テストで使用してもらい、フィードバックに基づいてUI/UX改善に進みましょう。
