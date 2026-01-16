import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // envがないときに落とさずに原因が分かるようにする
  if (!url || !key) {
    console.error('Missing Supabase env', {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(key),
    })
    return response
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // リクエストのCookieも更新（次のリクエストで使用される）
          request.cookies.set(name, value)
          // レスポンスのCookieも設定（ブラウザに送信される）
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // セッションをリフレッシュ（重要：これによりセッションが有効に保たれる）
  const { data: { user } } = await supabase.auth.getUser()

  // last_login_atの自動更新（認証済みユーザーのみ、1時間ごとに更新）
  if (user) {
    try {
      // 現在のlast_login_atを取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_login_at')
        .eq('id', user.id)
        .single()

      const now = new Date()
      const lastLogin = profile?.last_login_at ? new Date(profile.last_login_at) : null
      
      // last_login_atが未設定、または1時間以上経過している場合に更新
      const shouldUpdate = !lastLogin || (now.getTime() - lastLogin.getTime()) >= 60 * 60 * 1000

      if (shouldUpdate) {
        await supabase
          .from('profiles')
          .update({ last_login_at: now.toISOString() })
          .eq('id', user.id)
      }
    } catch (error) {
      // エラーが発生してもリクエストは続行
      console.error('Error updating last_login_at:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
