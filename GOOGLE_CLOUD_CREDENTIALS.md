# Google Cloud認証情報の取得と設定ガイド

## 📌 重要なポイント

**Google CloudのClient IDとClient Secretは環境変数には設定しません。**
これらは**Supabase Dashboard**で設定します。

## 🔍 認証情報の形式

### Client ID（クライアント ID）
- **形式**: `数字-文字列.apps.googleusercontent.com`
- **例**: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
- **長さ**: 約50-70文字

### Client Secret（クライアント シークレット）
- **形式**: `GOCSPX-文字列` または `文字列`
- **例**: `GOCSPX-abcdefghijklmnopqrstuvwxyz123456`
- **長さ**: 約30-50文字

## 📋 取得手順

### ステップ1: Google Cloud Consoleにアクセス

1. **Google Cloud Consoleを開く**
   - https://console.cloud.google.com にアクセス
   - Googleアカウントでログイン

2. **プロジェクトを選択または作成**
   - 上部のプロジェクト選択ドロップダウンをクリック
   - 既存のプロジェクトを選択するか、「新しいプロジェクト」を作成

### ステップ2: OAuth同意画面を設定（初回のみ）

1. **OAuth同意画面を開く**
   - 左メニュー → **APIとサービス** → **OAuth同意画面**

2. **ユーザータイプを選択**
   - **外部** を選択（個人のGoogleアカウントで使用する場合）
   - **内部** を選択（Google Workspaceで使用する場合）
   - 「作成」をクリック

3. **アプリ情報を入力**
   - **アプリ名**: 任意（例: `TODO進捗管理アプリ`）
   - **ユーザーサポートメール**: 自分のメールアドレス
   - **デベロッパーの連絡先情報**: 自分のメールアドレス
   - 「保存して次へ」をクリック

4. **スコープを設定**
   - デフォルトのまま「保存して次へ」をクリック

5. **テストユーザーを追加（外部の場合）**
   - 自分のGoogleアカウントのメールアドレスを追加
   - 「保存して次へ」をクリック

6. **概要を確認**
   - 「ダッシュボードに戻る」をクリック

### ステップ3: OAuth 2.0 クライアント IDを作成

1. **認証情報ページを開く**
   - 左メニュー → **APIとサービス** → **認証情報**

2. **OAuth 2.0 クライアント IDを作成**
   - 上部の「**認証情報を作成**」ボタンをクリック
   - 「**OAuth クライアント ID**」を選択

3. **アプリケーションの種類を選択**
   - **アプリケーションの種類**: 「**ウェブアプリケーション**」を選択

4. **名前を入力**
   - **名前**: 任意（例: `Supabase Auth Production` または `TODO App Google OAuth`）

5. **承認済みのリダイレクト URIを設定**
   - **承認済みのリダイレクト URI**セクションで「**URIを追加**」をクリック
   - 以下を入力（`[あなたのSupabaseプロジェクトID]`を実際のIDに置き換える）：
     ```
     https://[あなたのSupabaseプロジェクトID].supabase.co/auth/v1/callback
     ```
   - **例**: プロジェクトIDが `wkkffimnocaiaubhyvlb` の場合
     ```
     https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback
     ```
   - **重要**: 
     - このURLは**SupabaseのコールバックURL**です
     - VercelのURLや`http://localhost:3000`は設定しません
     - SupabaseプロジェクトIDは、Supabase Dashboard → Settings → API の「Project URL」から確認できます

6. **作成を完了**
   - 「**作成**」をクリック

### ステップ4: Client IDとClient Secretをコピー

1. **認証情報をコピー**
   - ポップアップが表示されます
   - **クライアント ID**をコピー
     - 形式: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **クライアント シークレット**をコピー
     - 形式: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
   - **⚠️ 重要**: Client Secretは後で表示されないので、必ずコピーして安全な場所に保存してください

2. **確認**
   - 「**OK**」をクリック

## 🔧 Supabase Dashboardでの設定

### ステップ1: Supabase Dashboardを開く

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **Googleプロバイダー設定を開く**
   - 左メニュー → **Authentication** → **Providers**
   - **Google** をクリック

### ステップ2: Google認証情報を設定

1. **Googleプロバイダーを有効化**
   - **「Enable Google provider」** を **ON** にする

2. **Client IDを設定**
   - **Client ID (for OAuth)** の入力欄に、Google Cloud Consoleでコピーした**Client ID**を貼り付け
   - 例: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

3. **Client Secretを設定**
   - **Client Secret (for OAuth)** の入力欄に、Google Cloud Consoleでコピーした**Client Secret**を貼り付け
   - 例: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

4. **保存**
   - **「Save」** をクリック
   - 設定が保存されたことを確認

## ✅ 設定確認

### 確認項目

- [ ] Google Cloud ConsoleでOAuth 2.0 クライアント IDが作成されている
- [ ] 承認済みのリダイレクト URIにSupabaseのコールバックURLが設定されている
- [ ] Client IDとClient Secretをコピーして保存した
- [ ] Supabase DashboardでGoogleプロバイダーが有効になっている
- [ ] Supabase DashboardにClient IDとClient Secretが正しく設定されている

## 🔄 既存の認証情報を確認する方法

### Google Cloud Consoleで確認

1. **認証情報ページを開く**
   - Google Cloud Console → **APIとサービス** → **認証情報**

2. **OAuth 2.0 クライアント IDを確認**
   - 作成したOAuth 2.0 クライアント IDをクリック
   - **クライアント ID**を確認（常に表示される）
   - **クライアント シークレット**を確認（「表示」をクリックして表示）

### Supabase Dashboardで確認

1. **Googleプロバイダー設定を開く**
   - Supabase Dashboard → Authentication → Providers → Google

2. **設定を確認**
   - Client IDとClient Secretが設定されているか確認
   - 設定が表示されない場合は、再入力が必要です

## ⚠️ 注意事項

1. **Client Secretの管理**
   - Client Secretは機密情報です
   - 他人と共有しないでください
   - 漏洩した場合は、Google Cloud Consoleで新しいシークレットを生成してください

2. **リダイレクト URI**
   - 必ずSupabaseのコールバックURLを設定してください
   - VercelのURLやローカル開発用のURLは設定しません

3. **環境変数には設定しない**
   - Client IDとClient Secretは環境変数には設定しません
   - Supabase Dashboardでのみ設定します

## 🔗 参考リンク

- [Google Cloud Console - 認証情報](https://console.cloud.google.com/apis/credentials)
- [Supabase Authentication - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth設定ガイド](./GOOGLE_OAUTH_SETUP.md)
