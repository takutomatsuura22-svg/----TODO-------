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
    .select('role, email, name, grade')
    .eq('id', user.id)
    .single()

  // プロフィール未設定の場合は初回プロフィール設定へ
  // 生徒の場合はnameとgradeの両方が必要、教員・管理者の場合はnameのみ必要
  const isStudent = profile?.role === 'student'
  const needsProfileSetup = isStudent
    ? !profile?.name || !profile?.grade
    : !profile?.name

  if (needsProfileSetup) {
    redirect('/profile/setup')
  }

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
