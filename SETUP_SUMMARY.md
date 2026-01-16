# セットアップ修正サマリー

## 1. Google Cloud Consoleに設定する正しいRedirect URI

**重要**: Supabase Authを使う場合、Google Cloud Consoleには**SupabaseのコールバックURL**を設定します。

```
https://[あなたのSupabaseプロジェクトID].supabase.co/auth/v1/callback
```

**例**: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

- SupabaseプロジェクトIDは、Supabase Dashboard → Settings → API の「Project URL」から確認できます
- **注意**: `http://localhost:3000/auth/callback` は設定しません（これはSupabase側の設定です）

---

## 2. Supabase URL Configurationの正しい値

### Site URL
```
http://localhost:3000
```

### Redirect URLs
```
http://localhost:3000/auth/callback
```

**設定場所**: Supabase Dashboard → Authentication → URL Configuration

---

## 3. 修正版 server.ts

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // Middleware handles cookie updates for route handlers and server components.
          }
        },
      },
    }
  )
}
```

---

## 4. middleware.ts（新規追加・必須）

プロジェクトルートに `middleware.ts` を作成：

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションをリフレッシュ（重要：これによりセッションが有効に保たれる）
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**重要**: `@supabase/ssr` を使う場合、このmiddleware.tsは必須です。セッションのリフレッシュを担当します。

---

## 5. 動作確認手順（最短）

### 前提条件
- Node.js 18.17以上がインストールされている
- Supabaseプロジェクトが作成済み
- Google Cloud ConsoleでOAuth認証情報を取得済み

### 手順

1. **環境変数設定**
   - `.env.local` を作成し、以下を設定：
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```

2. **Supabase SQL実行**
   - Supabase Dashboard → SQL Editor
   - `supabase-schema.sql` の内容を実行

3. **Google OAuth設定**
   - Google Cloud Console: Redirect URI = `https://[project-id].supabase.co/auth/v1/callback`
   - Supabase Dashboard: Google Providerに認証情報を設定

4. **Supabase URL設定**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

5. **依存関係インストールと起動**
   ```bash
   npm install
   npm run dev
   ```

6. **動作確認**
   - `http://localhost:3000/login` にアクセス
   - 「Googleでログイン」をクリック
   - Google認証後、`/pending` にリダイレクトされることを確認
   - Supabase Dashboard → Table Editor → profiles でレコードが作成されていることを確認

**成功の目安**: 
- ✅ `/pending` ページが表示される
- ✅ Supabaseの `profiles` テーブルに自分のレコードが作成されている
- ✅ ブラウザのコンソールにエラーがない

---

## よくある間違い

### ❌ 間違い: Google Cloud Consoleに `http://localhost:3000/auth/callback` を設定
### ✅ 正解: Google Cloud Consoleに `https://[project-id].supabase.co/auth/v1/callback` を設定

### ❌ 間違い: middleware.tsを追加しない
### ✅ 正解: middleware.tsは必須。セッションリフレッシュのために必要

### ❌ 間違い: server.tsでcookies()を同期で扱う
### ✅ 正解: `await cookies()` を使用（Next.js 14以降）
