import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ErrorMessage } from '@/components/error-message'

export default async function ProfileSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, grade, role')
    .eq('id', user.id)
    .single()

  // 既にプロフィールが設定されている場合はホームへリダイレクト
  // 生徒の場合はnameとgradeの両方が必要、教員・管理者の場合はnameのみ必要
  const isStudent = profile?.role === 'student'
  const isProfileComplete = isStudent
    ? profile?.name && profile?.grade && profile.grade.trim() !== ''
    : profile?.name && profile.name.trim() !== ''

  if (isProfileComplete) {
    if (!profile?.role) {
      redirect('/pending')
    } else {
      redirect('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">初回プロフィール設定</h1>
          <p className="mt-2 text-gray-600">
            以下の情報を入力してください
          </p>
        </div>
        <ErrorMessage />
        <form action={saveProfile} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={profile?.name || ''}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="山田 太郎"
            />
          </div>
          {/* 生徒のみ学年を必須 */}
          {profile?.role === 'student' && (
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                学年 <span className="text-red-500">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                required
                defaultValue={profile?.grade || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">選択してください</option>
                <option value="高2">高2</option>
                <option value="高3">高3</option>
              </select>
            </div>
          )}
          {/* 教員・管理者の場合は学年は任意 */}
          {profile?.role !== 'student' && (
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                学年（任意）
              </label>
              <select
                id="grade"
                name="grade"
                defaultValue={profile?.grade || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">選択してください</option>
                <option value="高2">高2</option>
                <option value="高3">高3</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            保存
          </button>
        </form>
      </div>
    </div>
  )
}

async function saveProfile(formData: FormData) {
  'use server'
  console.log('[PROFILE SETUP] Save profile called')
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error('[PROFILE SETUP] No user found')
    redirect('/login')
  }

  const name = (formData.get('name') as string)?.trim()
  const grade = (formData.get('grade') as string)?.trim() || null

  console.log('[PROFILE SETUP] Form data:', { name, grade, userId: user.id })

  if (!name) {
    console.error('[PROFILE SETUP] Name is required')
    redirect('/profile/setup?error=validation_error')
  }

  // 生徒の場合は学年が必須
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[PROFILE SETUP] Current profile role:', currentProfile?.role)

  if (currentProfile?.role === 'student' && !grade) {
    console.error('[PROFILE SETUP] Grade is required for students')
    redirect('/profile/setup?error=validation_error')
  }

  // 更新データを準備（空文字列の場合はnullに変換）
  const updateData: { name: string; grade: string | null; updated_at: string } = {
    name,
    grade: grade || null,
    updated_at: new Date().toISOString(),
  }

  console.log('[PROFILE SETUP] Updating profile with:', updateData)

  const { error, data } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()

  if (error) {
    console.error('[PROFILE SETUP] Error updating profile:', error)
    redirect('/profile/setup?error=save_failed')
  }

  console.log('[PROFILE SETUP] Profile updated successfully:', data)

  // キャッシュをクリア
  revalidatePath('/profile/setup')
  revalidatePath('/')
  revalidatePath('/pending')

  // プロフィール保存後、roleを確認してリダイレクト
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, grade')
    .eq('id', user.id)
    .single()

  console.log('[PROFILE SETUP] Profile after update:', profile)

  if (!profile?.role) {
    console.log('[PROFILE SETUP] Redirecting to /pending (no role)')
    redirect('/pending')
  } else {
    console.log('[PROFILE SETUP] Redirecting to / (profile complete)')
    redirect('/')
  }
}
