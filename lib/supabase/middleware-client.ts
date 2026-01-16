import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Route Handler専用のSupabaseクライアント作成
 * middleware.tsとapp/auth/callback/route.tsで使用
 */
export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )
}
