# 認証問題の原因特定と修正内容

## 問題の原因

### 1. **Route HandlerでのCookie設定の問題**
- `app/auth/callback/route.ts` で `createClient()`（Server Component用）を使用していた
- Server Component用の実装では、Route HandlerでCookieが正しく設定されない
- `exchangeCodeForSession` の後、Cookieがブラウザに送信されていなかった

### 2. **middleware.tsの実装不備**
- `remove` メソッドで `value` が未定義（28行目）
- `setAll` の実装が不完全で、Cookieの設定が確実に行われていなかった

### 3. **Cookie設定タイミングの問題**
- `exchangeCodeForSession` の後、レスポンスオブジェクトにCookieが正しく反映されていなかった

## 修正内容

### 1. Route Handler専用のSupabaseクライアント作成
**新規ファイル**: `lib/supabase/middleware-client.ts`

Route Handlerとmiddlewareで使用する専用のクライアント作成関数を追加。
これにより、Cookieの設定が確実に行われる。

### 2. middleware.tsの修正
- `setAll` メソッドの実装を改善
- リクエストとレスポンスの両方にCookieを設定するように修正
- TypeScriptの型エラーを修正

### 3. app/auth/callback/route.tsの修正
- Route Handler専用の `createRouteHandlerClient` を使用
- `NextRequest` と `NextResponse` を正しく扱うように修正
- Cookieが確実に設定されるようにレスポンスオブジェクトを適切に管理

## 修正後の動作フロー

1. ユーザーがGoogleログインをクリック
2. Google認証画面にリダイレクト
3. 認証成功後、`/auth/callback?code=xxx` にリダイレクト
4. **Route Handler** で `exchangeCodeForSession` を実行
5. **Cookieが正しく設定される**（修正ポイント）
6. middlewareがセッションをリフレッシュ
7. ユーザー情報を取得し、profilesテーブルにupsert
8. roleに応じて `/pending` または `/` にリダイレクト

## 動作確認手順

1. 開発サーバーを再起動
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000/login` にアクセス

3. 「Googleでログイン」をクリック

4. Google認証完了後、以下を確認：
   - ✅ `/pending` または `/` にリダイレクトされる
   - ✅ ブラウザの開発者ツール > Application > Cookies でSupabaseのセッションCookieが設定されている
   - ✅ ページをリロードしてもログイン状態が維持される

## 技術的なポイント

### Route Handler vs Server Component
- **Route Handler** (`app/**/route.ts`): `NextRequest` / `NextResponse` を使用
- **Server Component** (`app/**/page.tsx`): `cookies()` を使用

それぞれでSupabaseクライアントの作成方法が異なるため、専用の関数を用意する必要がある。

### Cookie設定のタイミング
`exchangeCodeForSession` の後、レスポンスオブジェクトにCookieが設定される。
このレスポンスオブジェクトをリダイレクト時に使用することで、Cookieが確実にブラウザに送信される。

## 参考資料

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
