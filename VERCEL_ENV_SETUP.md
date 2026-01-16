# Vercelでの環境変数設定ガイド

このプロジェクトの環境変数は、Vercel Dashboardで管理します。

## 📋 必要な環境変数

以下の4つの環境変数をVercelに設定する必要があります：

| 環境変数名 | 説明 | 取得方法 |
|-----------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseの匿名キー（公開可能） | Supabase Dashboard → Settings → API → anon/public key |
| `NEXT_PUBLIC_SITE_URL` | アプリケーションのURL | VercelのデプロイURL（例: `https://your-app.vercel.app`） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseのサービスロールキー（監査ログ用） | Supabase Dashboard → Settings → API → service_role key（Revealをクリック） |

## 🚀 Vercelでの設定手順

### ステップ1: Vercel Dashboardにアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択

### ステップ2: 環境変数設定画面を開く

1. プロジェクトの「Settings」タブをクリック
2. 左メニューから「Environment Variables」を選択

### ステップ3: 環境変数を追加

各環境変数を以下の手順で追加します：

1. 「Add New」ボタンをクリック
2. **Key** に環境変数名を入力（例: `NEXT_PUBLIC_SUPABASE_URL`）
3. **Value** に値を入力
4. **Environment** で以下をすべてチェック：
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. 「Save」をクリック

**重要:** 4つの環境変数すべてを追加してください。

### ステップ4: 再デプロイ

環境変数を追加した後、自動で再デプロイされる場合があります。されない場合は：

1. 「Deployments」タブを開く
2. 最新のデプロイメントを選択
3. 「Redeploy」ボタンをクリック

## 🔐 セキュリティに関する注意事項

### ✅ 安全な環境変数

以下の環境変数はクライアント側で使用されるため、`NEXT_PUBLIC_`プレフィックスが付いています：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

これらはブラウザのJavaScriptコードに含まれるため、公開されても問題ありません。

### ⚠️ 機密情報

以下の環境変数は**絶対にクライアントに公開してはいけません**：

- `SUPABASE_SERVICE_ROLE_KEY`

このキーはサーバーサイドのみで使用され、監査ログ機能に必要です。Vercelでは自動的にサーバーサイドでのみ利用可能になります。

## 📝 ローカル開発環境の設定

ローカル開発時は、プロジェクトルートに `.env.local` ファイルを作成し、同じ環境変数を設定してください。

### .env.local ファイルの作成

プロジェクトルートに `.env.local` ファイルを作成し、以下のテンプレートをコピーして実際の値を設定してください：

```env
# Supabase設定
# Supabase Dashboard → Settings → API から取得
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# アプリケーションURL
# ローカル開発: http://localhost:3000
# 本番環境: VercelのURL（例: https://your-app.vercel.app）
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Service Role Key（監査ログ用）
# Supabase Dashboard → Settings → API → service_role key（Revealをクリック）
# 重要: このキーはサーバーサイドのみで使用され、クライアントに公開されません
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**注意:** `.env.local` は `.gitignore` に含まれているため、Gitにコミットされません。

## ✅ 動作確認

環境変数が正しく設定されているか確認するには：

1. Vercelのデプロイメントログを確認
2. アプリケーションが正常に動作するか確認
3. 認証機能が正常に動作するか確認

## 🔄 環境変数の更新

環境変数を更新する場合：

1. Vercel Dashboard → Settings → Environment Variables
2. 更新したい環境変数を選択
3. 値を編集して「Save」をクリック
4. 再デプロイを実行

## 📚 参考リンク

- [Vercel環境変数のドキュメント](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js環境変数のドキュメント](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase環境変数の設定](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
