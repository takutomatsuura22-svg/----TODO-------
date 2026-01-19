# Next.js + Supabase Google OAuth 認証セットアップガイド

## 1. 前提条件

### 必要なNode.jsバージョン
- **推奨**: Node.js 18.17以上 または 20.x LTS
- 確認コマンド: `node --version`

### 必要なコマンド
- `npm` または `yarn` または `pnpm`（本ガイドは `npm` を使用）
- `git`（バージョン管理用）

### 必要なアカウント
- Google Cloud Console アカウント（OAuth認証情報取得用）
- Supabase アカウント（https://supabase.com）

---

## 2. Next.jsプロジェクト作成手順

### 2.1 プロジェクト作成

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

プロンプトが表示された場合：
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes（デフォルト）
- Import alias: `@/*`（デフォルト）

### 2.2 必要なパッケージのインストール

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2.3 プロジェクト構造確認

以下の構造になっていることを確認：

```
.
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   └── pending/
│       └── page.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── middleware.ts
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## 3. Supabaseプロジェクト作成と設定手順

### 3.1 Supabaseプロジェクト作成

1. https://supabase.com にアクセスしてログイン
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `my-todo-app`）
4. データベースパスワードを設定（後で使うのでメモ）
5. リージョンを選択（最寄りを選択）
6. 「Create new project」をクリック
7. プロジェクト作成完了まで待機（2-3分）

### 3.2 Google OAuth Provider設定

1. Supabase Dashboard でプロジェクトを開く
2. 左メニューから **「Authentication」** → **「Providers」** を選択
3. **「Google」** を探してクリック
4. **「Enable Google provider」** をONにする

### 3.3 Google Cloud Console で認証情報を取得

**重要**: Supabase Authを使う場合、Google Cloud Consoleには**SupabaseのコールバックURL**を設定します（Next.jsアプリのURLではありません）。

1. https://console.cloud.google.com にアクセス
2. プロジェクトを選択（または新規作成）
3. **「APIとサービス」** → **「認証情報」** を開く
4. **「認証情報を作成」** → **「OAuth クライアント ID」** を選択
5. アプリケーションの種類: **「ウェブアプリケーション」**
6. 名前: 任意（例: `Supabase Auth`）
7. **承認済みのリダイレクト URI** に以下を追加：
   ```
   https://[あなたのSupabaseプロジェクトID].supabase.co/auth/v1/callback
   ```
   - 例: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
   - SupabaseプロジェクトIDは、Supabase Dashboard → Settings → API の「Project URL」から確認できます
   - **注意**: `http://localhost:3000/auth/callback` は設定しません
8. **「作成」** をクリック
9. **クライアント ID** と **クライアント シークレット** をコピー

### 3.4 SupabaseにGoogle認証情報を設定

1. Supabase Dashboard の Google Provider設定画面に戻る
2. **Client ID (for OAuth)** に Google Cloud Console のクライアント ID を貼り付け
3. **Client Secret (for OAuth)** に Google Cloud Console のクライアント シークレットを貼り付け
4. **「Save」** をクリック

### 3.5 URL Configuration設定

1. Supabase Dashboard で **「Authentication」** → **「URL Configuration」** を開く
2. **「Site URL」** に以下を設定：
   ```
   http://localhost:3000
   ```
3. **「Redirect URLs」** セクションで以下を追加：
   ```
   http://localhost:3000/auth/callback
   ```
   - これは、Google認証後にSupabaseからNext.jsアプリにリダイレクトするURLです
4. **「Save」** をクリック

### 3.6 API Keys取得

1. Supabase Dashboard で **「Settings」** → **「API」** を開く
2. 以下の値をコピー（後で `.env.local` に設定）：
   - **Project URL**（例: `https://xxxxx.supabase.co`）
   - **anon public** key（`service_role` key は **絶対にクライアントに置かない**）

---

## 4. Supabase SQLスキーマ（profilesテーブル + RLS）

Supabase Dashboard で **「SQL Editor」** を開き、以下を実行：

```sql
-- profilesテーブル作成
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT, -- nullable（後で使う）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS（Row Level Security）を有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 本人は自分のプロフィールをSELECT可能（承認待ち画面判定のため）
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 本人は自分のプロフィールをINSERT可能
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 本人は自分のプロフィールをUPDATE可能
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- updated_at自動更新のトリガー関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at自動更新のトリガー
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## 5. Next.js側の実装コード

### 5.1 Supabase Client初期化

**`lib/supabase/client.ts`** - クライアントサイド用

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`lib/supabase/server.ts`** - サーバーサイド用

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

**`middleware.ts`** - セッションリフレッシュ用（必須）

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

### 5.2 ログインページ

**`app/login/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 既にログインしている場合はリダイレクト
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      redirect('/')
    } else {
      redirect('/pending')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ログイン</h1>
          <p className="mt-2 text-gray-600">Googleアカウントでログインしてください</p>
        </div>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Googleでログイン
          </button>
        </form>
      </div>
    </div>
  )
}

async function signInWithGoogle() {
  'use server'
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error signing in:', error)
    return
  }

  if (data.url) {
    redirect(data.url)
  }
}
```

### 5.3 認証コールバック

**`app/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    // セッション確立後、ユーザー情報を取得
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // profilesテーブルにupsert
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        })

      if (upsertError) {
        console.error('Error upserting profile:', upsertError)
      }

      // プロフィールのroleを確認
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      revalidatePath('/', 'layout')
      
      // roleがnullの場合は/pendingへ、それ以外は/へリダイレクト
      if (!profile?.role) {
        return NextResponse.redirect(new URL('/pending', request.url))
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```

### 5.4 承認待ちページ

**`app/pending/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  // roleが設定されている場合はホームへリダイレクト
  if (profile?.role) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 text-center">
        <div>
          <h1 className="text-3xl font-bold">承認待ち</h1>
          <p className="mt-4 text-gray-600">
            アカウントの承認をお待ちください。
          </p>
          <p className="mt-2 text-sm text-gray-500">
            ログイン中のアカウント: {profile?.email || user.email}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### 5.5 ルートレイアウト（認証状態確認）

**`app/layout.tsx`** を更新

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subset: 'latin' })

export const metadata: Metadata = {
  title: 'TODO進捗管理アプリ',
  description: 'Next.js + Supabaseで構築されたTODO進捗管理アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### 5.6 ホームページ（認証確認）

**`app/page.tsx`** を更新

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, full_name')
    .eq('id', user.id)
    .single()

  // roleがnullの場合は/pendingへリダイレクト
  if (!profile?.role) {
    redirect('/pending')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ホーム</h1>
          <p className="mt-4 text-gray-600">
            ようこそ、{profile?.full_name || profile?.email || 'ユーザー'}さん
          </p>
          <p className="mt-2 text-sm text-gray-500">
            ロール: {profile?.role}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-white font-medium hover:bg-red-700 transition-colors"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

---

## 6. 環境変数の設定

### ローカル開発環境（.env.local）

プロジェクトルートに `.env.local` ファイルを作成し、以下を設定：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# アプリケーションURL（ローカル開発用）
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Service Role Key（監査ログ用）
# 重要: このキーはサーバーサイドのみで使用され、クライアントに公開されません
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 本番環境（Vercel）

**環境変数はVercel Dashboardで管理します。**

#### 🚀 デプロイ手順

**本番環境用のデータベーステーブルが作成済みの場合：**
- 📖 [**Vercelデプロイ手順（簡易版）**](./DEPLOY_TO_VERCEL.md) - ステップバイステップのデプロイ手順
- ✅ [**本番環境設定チェックリスト**](./PRODUCTION_SETUP_CHECKLIST.md) - 設定漏れを防ぐチェックリスト

**詳細な設定手順：**
- 📝 [**Vercel環境変数設定ガイド**](./VERCEL_ENV_SETUP.md) - 環境変数の詳細な設定方法
- 📚 [**詳細なデプロイ手順**](./DEPLOYMENT_GUIDE.md) - 包括的なデプロイガイド

Vercel Dashboard → Settings → Environment Variables で以下の4つの環境変数を設定：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`（VercelのURL）
- `SUPABASE_SERVICE_ROLE_KEY`

**重要:**
- `NEXT_PUBLIC_` プレフィックスが付いた変数のみクライアント側で使用可能
- `SUPABASE_SERVICE_ROLE_KEY` は **絶対にクライアントに置かない**（サーバーサイドのみで使用）
- `.env.local` は `.gitignore` に含まれていることを確認

---

## 7. 動作確認チェックリスト

### 7.1 起動前の確認

- [ ] `.env.local` に必要な環境変数が設定されている
- [ ] `npm install` が完了している
- [ ] `middleware.ts` がプロジェクトルートに存在する
- [ ] SupabaseでprofilesテーブルとRLSポリシーが作成されている
- [ ] Google OAuth Providerが有効化されている
- [ ] **Google Cloud Console** のRedirect URIが `https://[project-id].supabase.co/auth/v1/callback` に設定されている
- [ ] **Supabase Dashboard** のSite URLが `http://localhost:3000` に設定されている
- [ ] **Supabase Dashboard** のRedirect URLsに `http://localhost:3000/auth/callback` が追加されている

### 7.2 開発サーバー起動

```bash
npm run dev
```

### 7.3 成功時の動作確認

1. **ログインページ (`http://localhost:3000/login`)**
   - [ ] ページが表示される
   - [ ] 「Googleでログイン」ボタンが表示される

2. **Googleログイン**
   - [ ] ボタンをクリックするとGoogle認証画面にリダイレクトされる
   - [ ] Googleアカウントを選択してログイン
   - [ ] 認証成功後、`/auth/callback` にリダイレクトされる

3. **初回ログイン時（role = null）**
   - [ ] `/pending` ページにリダイレクトされる
   - [ ] 「承認待ち」メッセージが表示される
   - [ ] ログイン中のメールアドレスが表示される
   - [ ] Supabase Dashboard の `profiles` テーブルにレコードが作成されている（role = null）

4. **ログアウト**
   - [ ] 「ログアウト」ボタンをクリック
   - [ ] `/login` にリダイレクトされる

5. **再ログイン時（role = nullのまま）**
   - [ ] 再度Googleログイン
   - [ ] `/pending` にリダイレクトされる（roleがnullのため）

6. **role設定後の動作確認（手動でSupabaseでroleを設定）**
   - [ ] Supabase Dashboard で `profiles` テーブルを開く
   - [ ] 自分のレコードの `role` カラムに任意の値（例: `user`）を設定
   - [ ] ブラウザで `/pending` にアクセス
   - [ ] `/`（ホーム）にリダイレクトされる
   - [ ] ホームページにユーザー名とロールが表示される

### 7.4 よくある失敗と原因

#### エラー: "Invalid API key"
- **原因**: `.env.local` の `NEXT_PUBLIC_SUPABASE_ANON_KEY` が間違っている
- **解決**: Supabase Dashboard の Settings → API で正しい `anon public` key をコピー

#### エラー: "redirect_uri_mismatch"
- **原因**: Google Cloud Console のリダイレクトURIが間違っている
- **解決**: 
  - **Google Cloud Console** には `https://[project-id].supabase.co/auth/v1/callback` を設定（SupabaseのコールバックURL）
  - **Supabase Dashboard** の Redirect URLs には `http://localhost:3000/auth/callback` を設定（Next.jsアプリのコールバックURL）
  - これらは異なるURLです。混同しないよう注意

#### エラー: "relation 'profiles' does not exist"
- **原因**: Supabaseでprofilesテーブルが作成されていない
- **解決**: SQL Editorでprofilesテーブル作成SQLを実行

#### エラー: "new row violates row-level security policy"
- **原因**: RLSポリシーが正しく設定されていない
- **解決**: SQL EditorでRLSポリシー作成SQLを実行

#### ログイン後、無限リダイレクトループ
- **原因**: `/auth/callback` の処理でエラーが発生している
- **解決**: ブラウザのコンソールとサーバーログを確認

#### ログイン後、常に `/pending` にリダイレクトされる
- **原因**: `profiles.role` がnullのまま
- **解決**: 正常な動作。Supabase Dashboardで手動でroleを設定すると `/` にリダイレクトされる

---

## 8. 動作確認手順（最短）

### ステップ1: 環境変数設定

`.env.local` を作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### ステップ2: Supabase設定

1. **SQL Editor** で `supabase-schema.sql` の内容を実行
2. **Authentication → Providers → Google** で有効化
3. **Google Cloud Console** でOAuthクライアントID作成
   - Redirect URI: `https://[project-id].supabase.co/auth/v1/callback`
4. **Supabase Dashboard** にGoogle認証情報を設定
5. **Authentication → URL Configuration** で設定：
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### ステップ3: 起動と確認

```bash
npm install
npm run dev
```

1. `http://localhost:3000/login` にアクセス
2. 「Googleでログイン」をクリック
3. Google認証完了後、`/pending` にリダイレクトされることを確認
4. Supabase Dashboard で `profiles` テーブルにレコードが作成されていることを確認

**成功の目安**: `/pending` ページが表示され、Supabaseにプロフィールが作成されていればOK

---

## 次のステップ

### 本番環境へのデプロイ

本番環境用のデータベーステーブルが作成済みの場合：

1. **Vercelにデプロイ**
   - 📖 [**Vercelデプロイ手順（簡易版）**](./DEPLOY_TO_VERCEL.md) を参照
   - ✅ [**本番環境設定チェックリスト**](./PRODUCTION_SETUP_CHECKLIST.md) で設定を確認

2. **リンク発行**
   - デプロイ完了後、VercelのURLを他の人に共有
   - 初回ログイン時は承認待ち（`/pending`）になる
   - 管理者がSupabaseでroleを設定すると、通常の画面が表示される

### 機能拡張

- 管理者によるrole設定機能の実装
- ロールベースのアクセス制御（RBAC）
- その他の機能実装
