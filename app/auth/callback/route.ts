import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('[AUTH CALLBACK] Callback route called')
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('[AUTH CALLBACK] URL:', requestUrl.toString())
  console.log('[AUTH CALLBACK] Code:', code ? 'present' : 'missing')

  if (!code) {
    console.error('[AUTH CALLBACK] No code parameter found')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  // リクエストに含まれているCookieを確認
  const requestCookies = request.cookies.getAll()
  console.log('[AUTH CALLBACK] Request cookies:', requestCookies.length)
  requestCookies.forEach((cookie) => {
    console.log('[AUTH CALLBACK] Request cookie:', cookie.name, 'value length:', cookie.value?.length || 0)
  })

  const response = NextResponse.next()

  // 本番環境かどうかを判定
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

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
            // Vercelの本番環境ではsecure: trueが必要
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

  console.log('[AUTH CALLBACK] Exchanging code for session...')
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[AUTH CALLBACK] Error exchanging code:', exchangeError)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
  console.log('[AUTH CALLBACK] Code exchanged successfully')

  const { data: { user }, error: getUserError } = await supabase.auth.getUser()

  if (getUserError || !user) {
    console.error('[AUTH CALLBACK] Error getting user:', getUserError)
    return NextResponse.redirect(new URL('/login?error=get_user_failed', request.url))
  }
  console.log('[AUTH CALLBACK] User retrieved:', user.id, user.email)
  console.log('[AUTH CALLBACK] User metadata:', JSON.stringify(user.user_metadata))

  // profilesテーブルにupsert
  const profileData = {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
  }
  
  console.log('[AUTH CALLBACK] Attempting to upsert profile:', profileData)
  
  const { data: upsertData, error: upsertError } = await supabase
    .from('profiles')
    .upsert(profileData, {
      onConflict: 'id',
    })
    .select()

  if (upsertError) {
    console.error('[AUTH CALLBACK] Error upserting profile:', upsertError)
    console.error('[AUTH CALLBACK] Error details:', {
      code: upsertError.code,
      message: upsertError.message,
      details: upsertError.details,
      hint: upsertError.hint,
    })
    // エラーが発生しても続行（既にプロフィールが存在する可能性がある）
  } else {
    console.log('[AUTH CALLBACK] Profile upserted successfully:', upsertData)
  }

  // プロフィールの状態を確認（upsertが失敗した場合でも確認）
  const { data: profile, error: selectError } = await supabase
    .from('profiles')
    .select('role, name, grade, email')
    .eq('id', user.id)
    .single()

  let finalProfile = profile

  if (selectError) {
    console.error('[AUTH CALLBACK] Error selecting profile:', selectError)
    // プロフィールが存在しない場合は、再度insertを試みる
    console.log('[AUTH CALLBACK] Profile not found, attempting insert...')
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
    
    if (insertError) {
      console.error('[AUTH CALLBACK] Error inserting profile:', insertError)
      console.error('[AUTH CALLBACK] Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })
      // プロフィール作成に失敗した場合でも、プロフィール設定ページにリダイレクト
      finalProfile = null
    } else {
      console.log('[AUTH CALLBACK] Profile inserted successfully:', insertData)
      finalProfile = insertData?.[0] || null
    }
  } else {
    console.log('[AUTH CALLBACK] Profile found:', finalProfile)
  }

  // リダイレクト先を決定
  let redirectUrl = '/'
  
  // プロフィールが存在しない、または未設定の場合は初回プロフィール設定へ
  if (!finalProfile) {
    console.log('[AUTH CALLBACK] No profile found, redirecting to setup')
    redirectUrl = '/profile/setup'
  } else {
    // 生徒の場合はnameとgradeの両方が必要、教員・管理者の場合はnameのみ必要
    const isStudent = finalProfile.role === 'student'
    const needsProfileSetup = isStudent
      ? !finalProfile.name || !finalProfile.grade
      : !finalProfile.name

    if (needsProfileSetup) {
      console.log('[AUTH CALLBACK] Profile incomplete, redirecting to setup')
      redirectUrl = '/profile/setup'
    } else if (!finalProfile.role) {
      // roleが未設定の場合は承認待ちへ
      console.log('[AUTH CALLBACK] No role assigned, redirecting to pending')
      redirectUrl = '/pending'
    } else {
      console.log('[AUTH CALLBACK] Profile complete, redirecting to home')
    }
  }

  console.log('[AUTH CALLBACK] Redirecting to:', redirectUrl)
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
      secure: isProduction ? true : cookie.secure,
      maxAge: cookie.maxAge,
      domain: cookie.domain,
    })
  })
  
  return redirectResponse
}
