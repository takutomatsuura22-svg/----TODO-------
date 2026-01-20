# Google Cloud Console設定手順（詳細版）

本番環境用のSupabaseプロジェクトでGoogle OAuthを使用するための、Google Cloud Console側の設定手順です。

---

## 📋 前提条件

- ✅ Googleアカウントを持っている
- ✅ 本番環境用のSupabaseプロジェクトが作成済み
- ✅ 本番環境のSupabaseプロジェクトIDが分かっている

**SupabaseプロジェクトIDの確認方法:**
- Supabase Dashboard → Settings → API → Project URL
- 例: `https://wkkffimnocaiaubhyvlb.supabase.co` の場合、プロジェクトIDは `wkkffimnocaiaubhyvlb`

---

## 🚀 ステップ1: Google Cloud Consoleにアクセス

1. **Google Cloud Consoleを開く**
   - https://console.cloud.google.com にアクセス
   - Googleアカウントでログイン

2. **プロジェクトを選択または作成**
   - 画面上部のプロジェクト選択ドロップダウンをクリック
   - 既存のプロジェクトを選択するか、「新しいプロジェクト」をクリック
   - 新規作成する場合：
     - プロジェクト名を入力（例: `TODO App Production`）
     - 「作成」をクリック
     - プロジェクトが作成されるまで待機（数秒）

---

## 🔐 ステップ2: OAuth同意画面を設定（初回のみ）

**注意**: 既にOAuth同意画面を設定済みの場合は、このステップをスキップできます。

### 2-1. OAuth同意画面を開く

1. 左メニューから **「APIとサービス」** をクリック
2. **「OAuth同意画面」** をクリック

### 2-2. ユーザータイプを選択

1. **「外部」** を選択（個人のGoogleアカウントで使用する場合）
   - または **「内部」** を選択（Google Workspaceで使用する場合）
2. **「作成」** をクリック

### 2-3. アプリ情報を入力

1. **アプリ名**: 任意の名前を入力（例: `TODO進捗管理アプリ`）
2. **ユーザーサポートメール**: 自分のメールアドレスを選択
3. **デベロッパーの連絡先情報**: 自分のメールアドレスを入力
4. **「保存して次へ」** をクリック

### 2-4. スコープを設定

1. デフォルトのスコープのまま **「保存して次へ」** をクリック

### 2-5. テストユーザーを追加（外部の場合）

1. **「+ ADD USERS」** をクリック
2. 自分のGoogleアカウントのメールアドレスを入力
3. **「追加」** をクリック
4. 複数のGoogleアカウントでテストする場合は、すべて追加
5. **「保存して次へ」** をクリック

### 2-6. 概要を確認

1. 設定内容を確認
2. **「ダッシュボードに戻る」** をクリック

---

## 🔑 ステップ3: OAuth 2.0 クライアント IDを作成

### 3-1. 認証情報ページを開く

1. 左メニューから **「APIとサービス」** をクリック
2. **「認証情報」** をクリック

### 3-2. OAuth 2.0 クライアント IDを作成

1. 画面上部の **「認証情報を作成」** ボタンをクリック
2. ドロップダウンから **「OAuth クライアント ID」** を選択

### 3-3. アプリケーションの種類を選択

1. **「アプリケーションの種類」** で **「ウェブアプリケーション」** を選択

### 3-4. 名前を入力

1. **「名前」** に任意の名前を入力
   - 例: `Supabase Auth Production`
   - 例: `TODO App Google OAuth - Production`
   - 本番環境用であることが分かる名前を推奨

### 3-5. 承認済みのリダイレクト URIを設定

**⚠️ 重要**: ここが最も重要な設定です！

1. **「承認済みのリダイレクト URI」** セクションで **「+ URIを追加」** をクリック
2. 以下の形式でURIを入力（`[本番環境のSupabaseプロジェクトID]`を実際のIDに置き換える）：
   ```
   https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
   ```
3. **具体例**:
   - プロジェクトIDが `wkkffimnocaiaubhyvlb` の場合：
     ```
     https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback
     ```
   - プロジェクトIDが `abcdefghijklmnop` の場合：
     ```
     https://abcdefghijklmnop.supabase.co/auth/v1/callback
     ```

4. **⚠️ 注意事項**:
   - ✅ このURLは**SupabaseのコールバックURL**です
   - ❌ VercelのURL（`https://your-app.vercel.app`）は設定しません
   - ❌ ローカル開発用のURL（`http://localhost:3000`）は設定しません
   - ✅ 必ず `https://` で始まる必要があります
   - ✅ 最後に `/auth/v1/callback` が付いている必要があります

5. **「作成」** をクリック

### 3-6. Client IDとClient Secretをコピー

1. **ポップアップが表示されます**
   - **「クライアント ID」** をコピー
     - 形式: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
     - 例: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
   
   - **「クライアント シークレット」** をコピー
     - 形式: `GOCSPX-文字列` または `文字列`
     - 例: `GOCSPX-abcdefghijklmnopqrstuvwxyz123456`
   
   - **⚠️ 重要**: Client Secretは後で表示されないので、**必ずコピーして安全な場所に保存してください**

2. **「OK」** をクリック

---

## ✅ ステップ4: 設定の確認

### 4-1. 作成したOAuth 2.0 クライアント IDを確認

1. **認証情報ページ**で、作成したOAuth 2.0 クライアント IDをクリック
2. 以下を確認：
   - ✅ **クライアント ID**が表示されている
   - ✅ **承認済みのリダイレクト URI**にSupabaseのコールバックURLが設定されている
   - ✅ **クライアント シークレット**が表示されている（「表示」をクリック）

### 4-2. 承認済みのリダイレクト URIを再確認

**承認済みのリダイレクト URI**セクションに以下が含まれていることを確認：
```
https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
```

**例**:
```
https://wkkffimnocaiaubhyvlb.supabase.co/auth/v1/callback
```

---

## 🔄 既存のOAuth 2.0 クライアント IDを編集する場合

既にOAuth 2.0 クライアント IDが作成されている場合：

1. **認証情報ページ**を開く
   - Google Cloud Console → **APIとサービス** → **認証情報**

2. **OAuth 2.0 クライアント IDを選択**
   - 一覧から使用するOAuth 2.0 クライアント IDをクリック

3. **承認済みのリダイレクト URIを追加**
   - **「承認済みのリダイレクト URI」** セクションで **「+ URIを追加」** をクリック
   - 本番環境のSupabaseコールバックURLを入力：
     ```
     https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
     ```

4. **保存**
   - **「保存」** をクリック

---

## 📝 チェックリスト

設定が完了したら、以下を確認してください：

- [ ] Google Cloud ConsoleでOAuth 2.0 クライアント IDが作成されている
- [ ] 承認済みのリダイレクト URIに本番環境のSupabaseコールバックURLが設定されている
- [ ] Client IDをコピーして保存した
- [ ] Client Secretをコピーして保存した（後で表示されないため重要）

---

## 🔗 次のステップ

Google Cloud Consoleでの設定が完了したら：

1. **Supabase Dashboardで設定**
   - Supabase Dashboard → Authentication → Providers → Google
   - 「Enable Google provider」をONにする
   - Client IDとClient Secretを設定
   - 詳細は [`GOOGLE_CLOUD_CREDENTIALS.md`](./GOOGLE_CLOUD_CREDENTIALS.md) を参照

2. **SupabaseのURL Configurationを設定**
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URLにVercelのURLを設定
   - Redirect URLsにVercelのコールバックURLを追加

---

## 🐛 トラブルシューティング

### 問題1: 「承認済みのリダイレクト URI」が正しく設定されていない

**エラーメッセージ**: `redirect_uri_mismatch`

**解決方法**:
1. Google Cloud ConsoleでOAuth 2.0 クライアント IDを確認
2. 承認済みのリダイレクト URIに以下が正確に設定されているか確認：
   ```
   https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
   ```
3. URLにタイポがないか確認（`https://`、末尾の`/auth/v1/callback`など）

### 問題2: Client Secretを忘れてしまった

**解決方法**:
1. Google Cloud Console → APIとサービス → 認証情報
2. OAuth 2.0 クライアント IDをクリック
3. 「クライアント シークレット」の「表示」をクリック
4. 新しいシークレットが表示される場合は、Supabase Dashboardでも更新が必要

### 問題3: 複数のSupabaseプロジェクト（開発環境と本番環境）を使う場合

**解決方法**:
- 開発環境用と本番環境用で、それぞれ異なるリダイレクトURIを追加：
  ```
  https://[開発環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
  https://[本番環境のSupabaseプロジェクトID].supabase.co/auth/v1/callback
  ```
- または、開発環境と本番環境で別々のOAuth 2.0 クライアント IDを作成することも可能

---

## 📚 参考リンク

- [Google Cloud Console - 認証情報](https://console.cloud.google.com/apis/credentials)
- [Google OAuth 2.0設定ガイド](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Authentication - Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)
