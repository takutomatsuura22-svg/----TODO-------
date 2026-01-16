import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('[AUTH LOGIN] Error signing in:', error)
    return NextResponse.redirect(new URL('/login?error=signin_failed', request.url))
  }

  if (data.url) {
    // responseに設定されたCookieを取得
    const cookies = response.cookies.getAll()
    
    // リダイレクトレスポンスを作成
    const redirectResponse = NextResponse.redirect(data.url)
    
    // Cookieをコピー
    cookies.forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        sameSite: (cookie.sameSite as 'lax' | 'strict' | 'none') || 'lax',
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        maxAge: cookie.maxAge,
        domain: cookie.domain,
      })
    })
    
    return redirectResponse
  }

  return NextResponse.redirect(new URL('/login?error=no_url', request.url))
}
