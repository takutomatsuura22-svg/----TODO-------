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
            const isPKCECookie = name.includes('code-verifier') || name.includes('auth-token')
            response.cookies.set(name, value, {
              path: options?.path || '/',
              sameSite: isPKCECookie && isProduction ? 'none' : ((options?.sameSite as 'lax' | 'strict' | 'none') || 'lax'),
              httpOnly: options?.httpOnly !== false,
              secure: isProduction ? true : (options?.secure !== false),
              maxAge: options?.maxAge,
              domain: options?.domain,
            })
            if (isPKCECookie) {
              console.log('[AUTH LOGIN] PKCE cookie set:', name, 'sameSite:', isPKCECookie && isProduction ? 'none' : 'lax', 'secure:', isProduction)
            }
          })
        },
      },
    }
  )

  // 現在のリクエストURLからベースURLを取得
  const requestUrl = new URL(request.url)
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
  const redirectTo = `${baseUrl}/auth/callback`
  
  console.log('[AUTH LOGIN] Initiating OAuth flow...')
  console.log('[AUTH LOGIN] Redirect URL:', redirectTo)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
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
      const isPKCECookie = cookie.name.includes('code-verifier') || cookie.name.includes('auth-token')
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        sameSite: isPKCECookie && isProduction ? 'none' : ((cookie.sameSite as 'lax' | 'strict' | 'none') || 'lax'),
        httpOnly: cookie.httpOnly,
        secure: isPKCECookie && isProduction ? true : (isProduction ? true : cookie.secure),
        maxAge: cookie.maxAge,
        domain: cookie.domain,
      })
      console.log('[AUTH LOGIN] Copied cookie to redirect:', cookie.name, 'isPKCE:', isPKCECookie, 'sameSite:', isPKCECookie && isProduction ? 'none' : 'lax')
    })
    
    console.log('[AUTH LOGIN] Redirecting with', cookies.length, 'cookies')
    return redirectResponse
  }

  console.error('[AUTH LOGIN] No URL returned from signInWithOAuth')
  return NextResponse.redirect(new URL('/login?error=no_url', request.url))
}
