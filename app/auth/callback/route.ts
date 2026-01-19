import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

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

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }

  const { data: { user }, error: getUserError } = await supabase.auth.getUser()

  if (getUserError || !user) {
    return NextResponse.redirect(new URL('/login?error=get_user_failed', request.url))
  }

  // profilesテーブルにupsert
  const profileData = {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
  }
  
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(profileData, {
      onConflict: 'id',
    })

  if (upsertError) {
    console.error('[AUTH CALLBACK] Error upserting profile:', upsertError)
  }

  // プロフィールの状態を確認
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, grade')
    .eq('id', user.id)
    .single()

  // リダイレクト先を決定
  let redirectUrl = '/'
  
  // プロフィール未設定の場合は初回プロフィール設定へ
  // 生徒の場合はnameとgradeの両方が必要、教員・管理者の場合はnameのみ必要
  const isStudent = profile?.role === 'student'
  const needsProfileSetup = isStudent
    ? !profile?.name || !profile?.grade
    : !profile?.name

  if (needsProfileSetup) {
    redirectUrl = '/profile/setup'
  } else if (!profile?.role) {
    // roleが未設定の場合は承認待ちへ
    redirectUrl = '/pending'
  }

  revalidatePath('/', 'layout')

  // Cookieが設定されたレスポンスを使ってリダイレクト
  const redirectResponse = NextResponse.redirect(new URL(redirectUrl, request.url))
  
  // responseに設定されたCookieをredirectResponseにコピー
  const cookies = response.cookies.getAll()
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
