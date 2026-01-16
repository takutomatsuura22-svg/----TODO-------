# 本番環境デプロイ手順（簡単版）

## 🎯 方針

**ローカル環境のSupabaseプロジェクトをそのまま本番環境でも使用します。**
- 新規Supabaseプロジェクト作成は不要
- スキーマ適用も不要（既に適用済み）
- 初期データ登録も不要（既に登録済み）

---

## 📋 必要な作業（3ステップのみ）

### ステップ1: SupabaseのURL Configurationを更新（5分）

1. **Supabase Dashboardにログイン**
   - https://supabase.com/dashboard
   - 現在使っているプロジェクトを開く

2. **URL Configurationを更新**
   - 左メニュー → **Authentication** → **URL Configuration**
   - **Site URL**に本番環境のURLを追加（後でVercelのURLが分かったら設定）
     - 例: `https://your-app.vercel.app`
   - **Redirect URLs**に以下を追加：
     ```
     https://your-app.vercel.app/auth/callback
     ```
   - **重要**: ローカル環境用のURLも残しておく：
     ```
     http://localhost:3000
     http://localhost:3000/auth/callback
     ```
   - 「Save」をクリック

---

### ステップ2: Vercelにデプロイ（10分）

#### 2-1. GitHubにコードをプッシュ（まだの場合）

```bash
# リポジトリがまだない場合
git init
git add .
git commit -m "Initial commit"

# GitHubでリポジトリを作成してから
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

#### 2-2. Vercelでプロジェクトを作成

1. **Vercelにログイン**
   - https://vercel.com にアクセス
   - 「Add New...」→「Project」をクリック

2. **GitHubリポジトリをインポート**
   - GitHubリポジトリを選択
   - 「Import」をクリック
   - 設定はそのまま（Next.jsが自動検出される）
   - 「Deploy」をクリック
   - デプロイ完了まで待機（2-3分）

3. **デプロイ完了後、URLを確認**
   - デプロイ完了後、Vercelが自動でURLを生成
   - 例: `https://your-app.vercel.app`
   - このURLをメモ

---

### ステップ3: 環境変数を設定（5分）

1. **Vercel Dashboardで環境変数を設定**
   - プロジェクトを選択 → 「Settings」タブ
   - 左メニュー → 「Environment Variables」

2. **以下の4つの環境変数を追加**

   | Key | Value | 取得方法 |
   |-----|-------|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ローカル環境と同じSupabase URL | Supabase Dashboard → Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ローカル環境と同じanon key | Supabase Dashboard → Settings → API → anon/public key |
   | `NEXT_PUBLIC_SITE_URL` | VercelのURL（ステップ2で取得） | 例: `https://your-app.vercel.app` |
   | `SUPABASE_SERVICE_ROLE_KEY` | ローカル環境と同じservice_role key | Supabase Dashboard → Settings → API → service_role key（Revealをクリック） |

   **設定方法:**
   - 「Add New」をクリック
   - KeyとValueを入力
   - Environmentで「Production」「Preview」「Development」すべてにチェック
   - 「Save」をクリック
   - 4つすべて追加

3. **再デプロイ**
   - 環境変数を追加した後、自動で再デプロイされる場合があります
   - されない場合は、「Deployments」タブ → 最新のデプロイメント → 「Redeploy」をクリック

---

### ステップ4: SupabaseのURL Configurationを最終更新（2分）

1. **Supabase Dashboard → Authentication → URL Configuration**
2. **Site URL**をVercelのURLに更新：
   ```
   https://your-app.vercel.app
   ```
3. **Redirect URLs**に以下が含まれているか確認：
   ```
   https://your-app.vercel.app/auth/callback
   ```
4. 「Save」をクリック

---

## ✅ 動作確認

1. **本番環境のURLにアクセス**
   - `https://your-app.vercel.app/login`
   - ログインページが表示されることを確認

2. **Googleログインを試す**
   - 「Googleでログイン」をクリック
   - 正常にログインできることを確認

3. **主要機能を確認**
   - TODO一覧が表示される
   - 進路情報が入力できる
   - 教員ダッシュボードが表示される
   - 管理者機能が動作する

---

## 🎉 完了！

これで本番環境へのデプロイが完了です。

**所要時間: 約20分**

---

## 📝 補足

### ローカル環境と本番環境で同じSupabaseを使う場合の注意点

- ✅ **メリット**: 設定が簡単、データが共有される
- ⚠️ **注意点**: 
  - 開発中にデータを変更すると本番環境にも影響する
  - 本番環境でデータを変更すると開発環境にも影響する

### 将来的に本番環境用のSupabaseプロジェクトを作成する場合

本番環境が安定してきたら、本番環境専用のSupabaseプロジェクトを作成することもできます。その場合は：

1. 新しいSupabaseプロジェクトを作成
2. スキーマを適用
3. 初期データを登録
4. Vercelの環境変数を新しいプロジェクトのURL/キーに更新

---

## 🐛 トラブルシューティング

### ログインできない場合

1. **SupabaseのURL Configurationを確認**
   - Site URLとRedirect URLsが正しいか確認

2. **Vercelの環境変数を確認**
   - `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しいか確認

### 環境変数が読み込まれない場合

1. **Vercel Dashboardで環境変数を確認**
2. **再デプロイを実行**

---

これで簡単にデプロイできます！
