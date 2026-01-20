import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const response = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 環境変数の検証
  if (!supabaseUrl || !supabaseKey) {
    console.error('[AUTH LOGIN] Missing environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(supabaseKey),
    })
    return NextResponse.redirect(new URL('/login?error=env_missing', request.url))
  }

  // Supabase URLの形式を検証（https://[project-ref].supabase.co の形式である必要がある）
  if (!supabaseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
    console.error('[AUTH LOGIN] Invalid Supabase URL format:', supabaseUrl)
    console.error('[AUTH LOGIN] Expected format: https://[project-ref].supabase.co')
    return NextResponse.redirect(new URL('/login?error=invalid_url', request.url))
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          console.log('[AUTH LOGIN] Setting cookies:', cookiesToSet.length)
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log('[AUTH LOGIN] Setting cookie:', name, 'value length:', value?.length || 0, 'options:', JSON.stringify(options))
            request.cookies.set(name, value)
            // Vercelの本番環境ではsecure: trueが必要
            const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
            // PKCEコードベリファイアのクッキーは、クロスサイトリクエストでも送信される必要がある
            const isPKCECookie = name.includes('code-verifier')
            response.cookies.set(name, value, {
              path: options?.path || '/',
              sameSite: isPKCECookie && isProduction ? 'none' : ((options?.sameSite as 'lax' | 'strict' | 'none') || 'lax'),
              httpOnly: options?.httpOnly !== false,
              secure: isProduction ? true : (options?.secure !== false),
              maxAge: options?.maxAge,
              domain: options?.domain,
            })
          })
        },
      },
    }
  )

  console.log('[AUTH LOGIN] Initiating OAuth flow...')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('[AUTH LOGIN] Error signing in:', error)
    
    // より具体的なエラーメッセージを返す
    if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
      return NextResponse.redirect(new URL('/login?error=provider_not_enabled', request.url))
    }
    
    return NextResponse.redirect(new URL('/login?error=signin_failed', request.url))
  }

  if (data.url) {
    console.log('[AUTH LOGIN] OAuth URL generated, redirecting to:', data.url)
    
    // responseに設定されたCookieを取得
    const cookies = response.cookies.getAll()
    console.log('[AUTH LOGIN] Cookies in response:', cookies.length)
    cookies.forEach((cookie) => {
      console.log('[AUTH LOGIN] Cookie:', cookie.name, 'value length:', cookie.value?.length || 0)
    })
    
    // リダイレクトレスポンスを作成
    const redirectResponse = NextResponse.redirect(data.url)
    
    // 本番環境かどうかを判定
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    
    // Cookieをコピー（PKCE code verifierを含む）
    cookies.forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        sameSite: (cookie.sameSite as 'lax' | 'strict' | 'none') || 'lax',
        httpOnly: cookie.httpOnly,
        secure: isProduction ? true : cookie.secure,
        maxAge: cookie.maxAge,
        domain: cookie.domain,
      })
    })
    
    console.log('[AUTH LOGIN] Redirecting with', cookies.length, 'cookies')
    return redirectResponse
  }

  console.error('[AUTH LOGIN] No URL returned from signInWithOAuth')
  return NextResponse.redirect(new URL('/login?error=no_url', request.url))
}
