# 環境変数のトラブルシューティングガイド

## 🔍 よくある問題と解決方法

### 問題1: Google OAuth認証で404エラーが発生する

**エラーメッセージ:**
```
GET https://supabase.com/dashboard/project/.../auth/v1/authorize 404 (Not Found)
```

**原因:**
`NEXT_PUBLIC_SUPABASE_URL`の値が間違っています。Supabase DashboardのURLではなく、プロジェクトのAPI URLを設定する必要があります。

**解決方法:**

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **正しいURLを取得**
   - 左メニュー → **Settings** → **API**
   - **Project URL** をコピー
   - 形式: `https://[project-ref].supabase.co`
   - 例: `https://wkkffimnocaiaubhyvlb.supabase.co`

3. **`.env.local`ファイルを更新**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
   ```
   ⚠️ **注意**: `https://supabase.com/dashboard/project/...` という形式は**間違い**です。

4. **開発サーバーを再起動**
   ```bash
   # サーバーを停止（Ctrl+C）
   npm run dev
   ```

### 問題2: 環境変数が読み込まれない

**症状:**
- ログインページで「環境変数が設定されていません」というエラーが表示される
- アプリケーションが正常に動作しない

**解決方法:**

1. **`.env.local`ファイルの存在を確認**
   ```bash
   # プロジェクトルートに.env.localファイルがあるか確認
   ls .env.local
   ```

2. **ファイルの場所を確認**
   - `.env.local`はプロジェクトの**ルートディレクトリ**に配置する必要があります
   - `package.json`と同じ階層に配置してください

3. **ファイル形式を確認**
   ```env
   # 正しい形式（=の前後にスペースは不要）
   NEXT_PUBLIC_SUPABASE_URL=https://wkkffimnocaiaubhyvlb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # 間違った形式（=の前後にスペースがある）
   NEXT_PUBLIC_SUPABASE_URL = https://wkkffimnocaiaubhyvlb.supabase.co  # ❌
   ```

4. **開発サーバーを再起動**
   - 環境変数を変更した後は、必ず開発サーバーを再起動してください

### 問題3: Supabase URLの形式が正しくない

**エラーメッセージ:**
```
Supabase URLの形式が正しくありません。正しい形式: https://[project-ref].supabase.co
```

**正しい形式:**
- ✅ `https://wkkffimnocaiaubhyvlb.supabase.co`
- ✅ `https://abcdefghijklmnop.supabase.co`

**間違った形式:**
- ❌ `https://supabase.com/dashboard/project/wkkffimnocaiaubhyvlb`
- ❌ `https://wkkffimnocaiaubhyvlb.supabase.co/`
- ❌ `http://wkkffimnocaiaubhyvlb.supabase.co` (httpではなくhttps)

### 問題4: Vercelで環境変数が設定されていない

**症状:**
- ローカルでは動作するが、Vercelにデプロイするとエラーが発生する

**解決方法:**

1. **Vercel Dashboardで環境変数を確認**
   - Vercel Dashboard → プロジェクト → Settings → Environment Variables
   - 以下の4つの環境変数が設定されているか確認：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_SITE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **環境変数の値を確認**
   - 各環境変数の値が正しいか確認
   - 特に`NEXT_PUBLIC_SUPABASE_URL`が正しい形式か確認

3. **再デプロイ**
   - 環境変数を追加・変更した後は、再デプロイが必要です
   - Deployments → 最新のデプロイメント → Redeploy

詳細は [`VERCEL_ENV_SETUP.md`](./VERCEL_ENV_SETUP.md) を参照してください。

## 📋 環境変数のチェックリスト

### ローカル開発環境

- [ ] `.env.local`ファイルがプロジェクトルートに存在する
- [ ] `NEXT_PUBLIC_SUPABASE_URL`が正しい形式（`https://[project-ref].supabase.co`）
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`が設定されている
- [ ] `NEXT_PUBLIC_SITE_URL`が設定されている（`http://localhost:3000`）
- [ ] `SUPABASE_SERVICE_ROLE_KEY`が設定されている（監査ログ用）
- [ ] 環境変数変更後、開発サーバーを再起動した

### 本番環境（Vercel）

- [ ] Vercel Dashboardで4つの環境変数がすべて設定されている
- [ ] 各環境変数の値が正しい
- [ ] 環境変数設定後、再デプロイを実行した
- [ ] デプロイメントログにエラーがない

## 🔧 デバッグ方法

### 1. 環境変数の値を確認（開発環境のみ）

**注意**: 本番環境では環境変数をログに出力しないでください。

```typescript
// 開発環境のみ
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL)
}
```

### 2. ブラウザのコンソールで確認

`NEXT_PUBLIC_`プレフィックスが付いた環境変数は、ブラウザのコンソールで確認できます：

```javascript
// ブラウザのコンソールで実行
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### 3. サーバーログで確認

開発サーバーのターミナルで、エラーメッセージを確認してください。

## 📚 参考リンク

- [Next.js環境変数](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase環境変数の設定](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel環境変数の設定](./VERCEL_ENV_SETUP.md)
