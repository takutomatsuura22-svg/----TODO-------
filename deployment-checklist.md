# 本番環境デプロイ チェックリスト

## 📋 現在の状況
- ✅ 本番環境用のSupabaseプロジェクト作成済み
- ✅ 22件のスタートTODOが登録済み

---

## 🗄️ Supabase側の準備

### 1. スキーマ適用の確認
- [ ] `supabase-complete-schema.sql` を実行済み
  - テーブル: `profiles`, `todo_templates`, `student_todos`, `todo_responses`, `admission_programs`, `admission_targets`, `audit_logs`
  - RLSポリシーが正しく設定されているか確認

### 2. トリガー適用の確認
- [ ] `auto-todo-generation-trigger.sql` を実行済み
  - 新規テンプレート追加時の自動TODO生成トリガーが動作するか確認

### 3. パフォーマンス最適化の確認
- [ ] `performance-optimization.sql` を実行済み
  - インデックスが正しく作成されているか確認

### 4. 初期データの確認
- [x] 22件のスタートTODOが登録済み
- [ ] 志望校マスタデータ（必要に応じて）

### 5. Google OAuth設定

#### 5-1. Supabase DashboardでGoogle Providerを有効化

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - 本番環境のプロジェクトを選択

2. **Google Providerを有効化**
   - 左メニューから「**Authentication**」をクリック
   - 「**Providers**」タブをクリック
   - プロバイダー一覧から「**Google**」を探してクリック
   - 「**Enable Google provider**」のトグルスイッチをONにする

#### 5-2. 本番環境のSupabaseプロジェクトIDを確認

1. **Supabase DashboardでプロジェクトIDを確認**
   - Supabase Dashboard → Settings → API
   - **Project URL**を確認（例: `https://wkkffimnocaiaubhyvlb.supabase.co`）
   - URLの `https://` と `.supabase.co` の間の部分が**プロジェクトID**
   - 例: `https://wkkffimnocaiaubhyvlb.supabase.co` の場合、プロジェクトIDは `wkkffimnocaiaubhyvlb`
   - **このプロジェクトIDをメモしておく**（後で使用します）

#### 5-3. Google Cloud ConsoleでOAuth認証情報を取得

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com にアクセス
   - Googleアカウントでログイン

2. **プロジェクトを選択または作成**
   - 上部のプロジェクト選択ドロップダウンをクリック
   - 既存のプロジェクトを選択、または「**新しいプロジェクト**」をクリックして作成
   - プロジェクト名: 任意（例: `seifukan-gakuin-production`）

3. **OAuth同意画面を設定（初回のみ）**
   - 左メニューから「**APIとサービス**」→「**OAuth同意画面**」をクリック
   - ユーザータイプを選択（通常は「**外部**」）
   - 「**作成**」をクリック
   - アプリ情報を入力：
     - アプリ名: 任意（例: `スタートTODO進捗管理アプリ`）
     - ユーザーサポートメール: 自分のメールアドレス
     - デベロッパーの連絡先情報: 自分のメールアドレス
   - 「**保存して次へ**」をクリック
   - スコープはそのまま「**保存して次へ**」をクリック
   - テストユーザーは後で追加可能なので「**保存して次へ**」をクリック
   - 最後に「**ダッシュボードに戻る**」をクリック

4. **OAuth 2.0 クライアント IDを作成**
   - 左メニューから「**APIとサービス**」→「**認証情報**」をクリック
   - 上部の「**認証情報を作成**」ボタンをクリック
   - 「**OAuth クライアント ID**」を選択

5. **OAuth クライアント IDの設定**
   - **アプリケーションの種類**: 「**ウェブアプリケーション**」を選択
   - **名前**: 任意（例: `Supabase Auth Production`）
   - **承認済みのリダイレクト URI**セクションで「**URIを追加**」をクリック
   - 以下を入力（`[本番環境のSupabaseプロジェクトID]`を5-2で確認したIDに置き換える）：
     ```
     https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
     ```
     - **例**: プロジェクトIDが `wkkffimnocaiaubhyvlb` の場合
     - 入力する値: `https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback`
     - **重要**: このURLはSupabaseのコールバックURLです。Next.jsアプリのURLではありません
   - 「**作成**」をクリック

6. **Client IDとClient Secretをコピー**
   - ポップアップが表示される
   - **クライアント ID**（例: `123456789-abcdefghijklmnop.apps.googleusercontent.com`）をコピー
   - **クライアント シークレット**（例: `GOCSPX-abcdefghijklmnopqrstuvwxyz`）をコピー
   - **重要**: このシークレットは後で表示されないので、必ずコピーして安全な場所に保存
   - 「**OK**」をクリック

#### 5-4. SupabaseにGoogle認証情報を設定

1. **Supabase Dashboardに戻る**
   - Supabase Dashboard → Authentication → Providers → Google の画面に戻る

2. **認証情報を入力**
   - **Client ID (for OAuth)** の入力欄に、Google Cloud Consoleでコピーした**Client ID**を貼り付け
   - **Client Secret (for OAuth)** の入力欄に、Google Cloud Consoleでコピーした**Client Secret**を貼り付け
   - 「**Save**」ボタンをクリック
   - 「Settings saved successfully」と表示されれば成功

#### 5-5. Supabase URL Configurationを設定

1. **URL Configuration画面を開く**
   - Supabase Dashboard → Authentication → **URL Configuration** をクリック

2. **Site URLを設定**
   - **Site URL**の入力欄に、本番環境のURLを入力：
     ```
     https://your-app.vercel.app
     ```
     - **注意**: まだVercelのURLが分からない場合は、後で設定してください
     - ローカル開発用のURL（`http://localhost:3000`）も残しておく場合は、カンマ区切りで複数指定可能

3. **Redirect URLsを設定**
   - **Redirect URLs**セクションで「**Add URL**」または「**+**」ボタンをクリック
   - 以下を追加（`your-app.vercel.app`を実際のVercelのURLに置き換える）：
     ```
     https://your-app.vercel.app/auth/callback
     ```
     - **例**: `https://seifukan-todo-app.vercel.app/auth/callback`
   - ローカル開発用も残す場合は、以下も追加：
     ```
     http://localhost:3000/auth/callback
     ```

4. **保存**
   - 「**Save**」ボタンをクリック
   - 「Settings saved successfully」と表示されれば成功

#### 5-6. 設定確認チェックリスト

- [ ] Supabase DashboardでGoogle Providerが有効化されている
- [ ] Google Cloud ConsoleでOAuth 2.0 クライアント IDが作成されている
- [ ] Google Cloud Consoleの承認済みリダイレクトURIに、`https://[SupabaseプロジェクトID].supabase.co/auth/v1/callback` が追加されている
- [ ] SupabaseにClient IDとClient Secretが設定されている
- [ ] SupabaseのSite URLに本番環境のURLが設定されている（VercelのURLが分かったら）
- [ ] SupabaseのRedirect URLsに `https://your-app.vercel.app/auth/callback` が追加されている

### 6. API Keysの取得
- [ ] Supabase Dashboard → Settings → API
  - [ ] **Project URL**をコピー
  - [ ] **anon/public key**をコピー
  - [ ] **service_role key**をコピー（Revealをクリック）

---

## 🚀 Vercel側の準備

### 1. プロジェクト作成
- [ ] GitHubリポジトリを作成（まだの場合）
- [ ] コードをGitHubにプッシュ
- [ ] Vercelでプロジェクトを作成
- [ ] デプロイ完了後、URLを確認（例: `https://your-app.vercel.app`）

### 2. 環境変数の設定
Vercel Dashboard → Settings → Environment Variables で以下を設定：

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - 値: 本番環境のSupabase Project URL
  - Environment: Production, Preview, Development すべてにチェック

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - 値: 本番環境のSupabase anon key
  - Environment: Production, Preview, Development すべてにチェック

- [ ] `NEXT_PUBLIC_SITE_URL`
  - 値: VercelのURL（例: `https://your-app.vercel.app`）
  - Environment: Production, Preview, Development すべてにチェック

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - 値: 本番環境のSupabase service_role key
  - Environment: Production, Preview, Development すべてにチェック
  - **重要**: 監査ログ機能に必要

### 3. 再デプロイ
- [ ] 環境変数設定後、再デプロイを実行

---

## ✅ 動作確認

### 1. 認証確認
- [ ] 本番URLでログインページが表示される
- [ ] Googleログインが正常に動作する
- [ ] ログイン後、適切な画面にリダイレクトされる

### 2. 機能確認
- [ ] 生徒画面でTODO一覧が表示される（22件のスタートTODOが表示される）
- [ ] TODOの詳細表示・保存が正常に動作する
- [ ] 進路情報の入力・保存が正常に動作する
- [ ] 教員ダッシュボードで生徒一覧が表示される
- [ ] 管理者画面でユーザー管理・テンプレート管理が正常に動作する

### 3. 自動化機能確認
- [ ] ログイン後、`profiles.last_login_at`が自動更新される
- [ ] 新規テンプレート追加後、対象生徒にTODOが自動生成される

### 4. 監査ログ確認
- [ ] ロール変更後、`audit_logs`テーブルに記録が追加される
- [ ] テンプレート変更後、`audit_logs`テーブルに記録が追加される

---

## 📝 次のステップ

デプロイ完了後：
1. テストユーザーで動作確認
2. フィードバック収集
3. UI/UX改善

---

## 🐛 トラブルシューティング

### Google OAuth関連のエラー

#### エラー: "redirect_uri_mismatch"
**原因**: Google Cloud ConsoleのリダイレクトURIが間違っている

**解決方法**:
1. Google Cloud Console → APIとサービス → 認証情報
2. OAuth 2.0 クライアント IDをクリック
3. **承認済みのリダイレクト URI**を確認
4. 以下が正しく追加されているか確認：
   ```
   https://[SupabaseプロジェクトID].supabase.co/auth/v1/callback
   ```
   - **重要**: Next.jsアプリのURL（`https://your-app.vercel.app/auth/callback`）は**設定しない**
   - SupabaseのコールバックURLのみを設定

#### エラー: "invalid_client"
**原因**: Supabaseに設定したClient IDまたはClient Secretが間違っている

**解決方法**:
1. Google Cloud ConsoleでClient IDとClient Secretを再確認
2. Supabase Dashboard → Authentication → Providers → Google
3. Client IDとClient Secretを再入力
4. 「Save」をクリック

#### エラー: "access_denied"
**原因**: OAuth同意画面の設定が不完全

**解決方法**:
1. Google Cloud Console → APIとサービス → OAuth同意画面
2. 必須項目がすべて入力されているか確認
3. テストユーザーを追加（アプリが「テスト中」の場合）

### ログインできない場合
1. **SupabaseのURL Configurationを確認**
   - Site URLが正しいか確認
   - Redirect URLsに `https://your-app.vercel.app/auth/callback` が追加されているか確認

2. **Google Cloud ConsoleのリダイレクトURIを確認**
   - `https://[SupabaseプロジェクトID].supabase.co/auth/v1/callback` が追加されているか確認

3. **Vercelの環境変数を確認**
   - `NEXT_PUBLIC_SUPABASE_URL` が正しいか確認
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認

### 環境変数が読み込まれない場合
1. **Vercel Dashboardで環境変数を確認**
   - Settings → Environment Variables
   - すべての環境変数が正しく設定されているか確認
   - Environment（Production, Preview, Development）にチェックが入っているか確認

2. **再デプロイを実行**
   - Deployments → 最新のデプロイメント → 「Redeploy」をクリック

### データが表示されない場合
1. **SupabaseのRLSポリシーを確認**
   - SQL Editorで `verify-production-setup.sql` を実行
   - RLSが有効化されているか確認

2. **環境変数が正しく設定されているか確認**
   - Vercel Dashboardで環境変数を確認
   - 本番環境のSupabase URLとキーが設定されているか確認

### よくある間違い

#### ❌ 間違い: Google Cloud Consoleに `https://your-app.vercel.app/auth/callback` を設定
#### ✅ 正解: Google Cloud Consoleには `https://[SupabaseプロジェクトID].supabase.co/auth/v1/callback` を設定

**理由**: 
- Google Cloud Consoleには**SupabaseのコールバックURL**を設定
- Next.jsアプリのURLは**Supabase DashboardのRedirect URLs**に設定

#### ❌ 間違い: 開発環境と本番環境で同じOAuthクライアントIDを使う
#### ✅ 正解: 本番環境用に新しいOAuthクライアントIDを作成することを推奨

**理由**: 
- セキュリティのため、環境ごとに分けることを推奨
- 同じものを使う場合は、両方のリダイレクトURIを追加する必要がある
