# Google OAuth設定ガイド（本番環境）

Vercelにデプロイ後、Googleログインで「Unsupported provider: provider is not enabled」エラーが発生する場合の解決方法です。

## 🔍 エラーの原因

このエラーは、SupabaseでGoogle OAuthプロバイダーが有効になっていないか、設定が不完全な場合に発生します。

## ✅ 解決手順

### ステップ1: Supabase DashboardでGoogleプロバイダーを確認

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択（本番環境で使用しているSupabaseプロジェクト）

2. **Googleプロバイダーの設定を確認**
   - 左メニュー → **Authentication** → **Providers**
   - **Google** をクリック
   - **「Enable Google provider」** が **ON** になっているか確認
   - OFFの場合は、ONにして「Save」をクリック

### ステップ2: Google Cloud Consoleの設定を確認

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com にログイン
   - プロジェクトを選択

2. **OAuth 2.0 クライアント IDを確認**
   - 左メニュー → **APIとサービス** → **認証情報**
   - OAuth 2.0 クライアント IDの一覧を確認

3. **承認済みのリダイレクト URIを確認**
   - 使用しているOAuth 2.0 クライアント IDをクリック
   - **承認済みのリダイレクト URI** に以下が含まれているか確認：
     ```
     https://[あなたのSupabaseプロジェクトID].supabase.co/auth/v1/callback
     ```
   - 例: `https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback`
   - **重要**: このURLはSupabaseのコールバックURLです。VercelのURLではありません

4. **Client IDとClient Secretをコピー**
   - クライアント IDをコピー
   - クライアント シークレットをコピー（「表示」をクリックして表示）

### ステップ3: SupabaseにGoogle認証情報を設定

1. **Supabase Dashboardに戻る**
   - Supabase Dashboard → Authentication → Providers → Google

2. **認証情報を入力**
   - **Client ID (for OAuth)** に、Google Cloud ConsoleでコピーしたClient IDを貼り付け
   - **Client Secret (for OAuth)** に、Google Cloud ConsoleでコピーしたClient Secretを貼り付け
   - **「Save」** をクリック

3. **設定が保存されたことを確認**
   - ページをリロードして、設定が保存されているか確認

### ステップ4: SupabaseのURL Configurationを確認

1. **URL Configurationを開く**
   - Supabase Dashboard → Authentication → **URL Configuration**

2. **Site URLを設定**
   - **Site URL** にVercelのURLを設定：
     ```
     https://your-app.vercel.app
     ```
   - 例: `https://my-todo-app.vercel.app`

3. **Redirect URLsを設定**
   - **Redirect URLs** に以下を追加：
     ```
     https://your-app.vercel.app/auth/callback
     ```
   - 例: `https://my-todo-app.vercel.app/auth/callback`
   - **「Add URL」** をクリックして追加
   - **「Save」** をクリック

### ステップ5: 動作確認

1. **Vercelのアプリケーションにアクセス**
   - ブラウザでVercelのURLにアクセス
   - 「Googleでログイン」をクリック

2. **エラーが解消されたか確認**
   - Googleの認証画面が表示されることを確認
   - 認証後、アプリケーションにリダイレクトされることを確認

## 🔄 よくある問題と解決方法

### 問題1: 「Enable Google provider」がONになっているのにエラーが発生する

**原因:**
- Client IDまたはClient Secretが正しく設定されていない
- 設定が保存されていない

**解決方法:**
1. Supabase DashboardでGoogleプロバイダーの設定を再度確認
2. Client IDとClient Secretを再入力して保存
3. ページをリロードして設定が反映されているか確認

### 問題2: Google認証画面が表示されない

**原因:**
- Google Cloud Consoleの承認済みのリダイレクト URIが正しく設定されていない

**解決方法:**
1. Google Cloud ConsoleでOAuth 2.0 クライアント IDを確認
2. 承認済みのリダイレクト URIに以下が含まれているか確認：
   ```
   https://[SupabaseプロジェクトID].supabase.co/auth/v1/callback
   ```
3. 含まれていない場合は追加して保存

### 問題3: 認証後、エラーページにリダイレクトされる

**原因:**
- SupabaseのURL Configurationが正しく設定されていない

**解決方法:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URLとRedirect URLsが正しく設定されているか確認
3. VercelのURLと一致しているか確認

### 問題4: 「アクセスをブロック: このアプリのリクエストは無効です」エラーが発生する

**原因:**
- OAuth同意画面が正しく設定されていない
- テストユーザーが追加されていない（外部ユーザータイプの場合）
- 承認済みのリダイレクトURIが正しく設定されていない

**解決方法:**
詳細は [`GOOGLE_OAUTH_BLOCKED_ERROR.md`](./GOOGLE_OAUTH_BLOCKED_ERROR.md) を参照してください。

## 📋 チェックリスト

デプロイ前に以下を確認してください：

- [ ] Supabase DashboardでGoogleプロバイダーが有効になっている
- [ ] Google Cloud ConsoleでOAuth 2.0 クライアント IDが作成されている
- [ ] 承認済みのリダイレクト URIにSupabaseのコールバックURLが設定されている
- [ ] SupabaseにClient IDとClient Secretが正しく設定されている
- [ ] SupabaseのSite URLにVercelのURLが設定されている
- [ ] SupabaseのRedirect URLsにVercelのコールバックURLが設定されている
- [ ] Vercelの環境変数が正しく設定されている（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_SITE_URL`）

## 🔗 参考リンク

- [Supabase Authentication - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console - OAuth 2.0設定](https://console.cloud.google.com/apis/credentials)
- [Vercel環境変数設定ガイド](./VERCEL_ENV_SETUP.md)
