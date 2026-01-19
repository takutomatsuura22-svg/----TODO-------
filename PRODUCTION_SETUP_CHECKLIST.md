# 本番環境設定チェックリスト

本番環境用のデータベーステーブルが作成済みの状態から、Vercelデプロイと設定を完了するためのチェックリストです。

---

## 📋 ステップ1: Vercelデプロイ

### プロジェクト作成
- [ ] GitHubリポジトリを作成（またはVercel CLIを使用）
- [ ] コードをGitHubにプッシュ（GitHub経由の場合）
- [ ] Vercelでプロジェクトを作成
- [ ] デプロイが成功した
- [ ] デプロイURLを取得（例: `https://your-app.vercel.app`）

---

## 🔧 ステップ2: Vercel環境変数設定

Vercel Dashboard → Settings → Environment Variables で以下を設定：

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - 値: 本番環境のSupabase Project URL
  - 取得方法: Supabase Dashboard → Settings → API → Project URL
  - Environment: Production, Preview, Development すべてにチェック

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - 値: 本番環境のSupabase anon key
  - 取得方法: Supabase Dashboard → Settings → API → anon/public key
  - Environment: Production, Preview, Development すべてにチェック

- [ ] `NEXT_PUBLIC_SITE_URL`
  - 値: VercelのURL（ステップ1で取得したURL）
  - 例: `https://your-app.vercel.app`
  - Environment: Production, Preview, Development すべてにチェック

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - 値: 本番環境のSupabase service_role key
  - 取得方法: Supabase Dashboard → Settings → API → service_role key（Revealをクリック）
  - Environment: Production, Preview, Development すべてにチェック
  - **重要**: 監査ログ機能に必要

- [ ] 環境変数設定後、再デプロイを実行

---

## 🔐 ステップ3: Supabase URL Configuration

Supabase Dashboard → Authentication → URL Configuration で設定：

- [ ] **Site URL**にVercelのURLを設定
  - 値: `https://your-app.vercel.app`（ステップ1で取得したURL）

- [ ] **Redirect URLs**にコールバックURLを追加
  - 値: `https://your-app.vercel.app/auth/callback`
  - 「Add URL」をクリックして追加

- [ ] 「Save」をクリックして保存

---

## 🔑 ステップ4: Google OAuth設定

### Supabase側の設定

- [ ] Supabase Dashboard → Authentication → Providers → Google
- [ ] **「Enable Google provider」**が**ON**になっている
- [ ] **Client ID (for OAuth)**が設定されている
- [ ] **Client Secret (for OAuth)**が設定されている
- [ ] 設定を保存

### Google Cloud Console側の設定

- [ ] Google Cloud Consoleにアクセス
- [ ] プロジェクトを選択
- [ ] APIとサービス → 認証情報
- [ ] OAuth 2.0 クライアント IDを選択
- [ ] **承認済みのリダイレクト URI**に以下が含まれている：
  ```
  https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
  ```
  - 例: `https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback`
- [ ] 含まれていない場合は追加して保存

---

## ✅ ステップ5: 動作確認

### 基本動作確認

- [ ] 本番環境のURLにアクセスできる
- [ ] ログインページが表示される
- [ ] 「Googleでログイン」ボタンが表示される

### 認証動作確認

- [ ] 「Googleでログイン」をクリックするとGoogle認証画面が表示される
- [ ] Googleアカウントを選択してログインできる
- [ ] 認証後、アプリケーションにリダイレクトされる
- [ ] 初回ログイン時は`/pending`にリダイレクトされる

### エラー確認

- [ ] ブラウザのコンソール（F12 → Console）にエラーが表示されない
- [ ] ネットワークタブで認証リクエストが成功している

---

## 🔗 ステップ6: リンク発行準備

### URLの確認

- [ ] デプロイURLをメモ（例: `https://your-app.vercel.app`）
- [ ] URLが正しく動作することを確認

### 共有方法の準備

- [ ] ログインURLを他の人に共有する準備ができた
- [ ] 初回ログイン時の承認待ちについて説明する準備ができた

---

## 👥 ステップ7: ユーザー管理準備

### 管理者の準備

- [ ] Supabase Dashboardにアクセスできる
- [ ] `profiles`テーブルを開ける
- [ ] ユーザーのroleを設定する方法を理解している

### ユーザーroleの設定方法

1. Supabase Dashboard → Table Editor → profiles
2. ログインしたユーザーのレコードを探す（emailで検索可能）
3. `role`カラムを編集：
   - `student`: 生徒
   - `teacher`: 教員
   - `admin`: 管理者
4. 「Save」をクリック
5. ユーザーに再ログインしてもらう

---

## 📝 メモ欄

### 本番環境のSupabase情報
- Project URL: `https://________________.supabase.co`
- Project ID: `________________`

### Vercel情報
- デプロイURL: `https://________________.vercel.app`

### Google OAuth情報
- Client ID: `________________`
- リダイレクトURI: `https://________________.supabase.co/auth/v1/callback`

---

## 🎉 完了確認

すべてのチェック項目が完了したら：

- [ ] 本番環境でログインが正常に動作する
- [ ] 他の人にURLを共有できる状態になった
- [ ] ユーザー管理の準備ができた

**デプロイ完了！** 🚀
