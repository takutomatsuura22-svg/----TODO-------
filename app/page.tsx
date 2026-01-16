import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
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

  // roleがnullの場合は/pendingへリダイレクト
  if (!profile?.role) {
    redirect('/pending')
  }

  // ロールに応じたコンテンツを表示
  if (profile.role === 'student') {
    return <StudentHomePage profile={profile} user={user} />
  }

  if (profile.role === 'teacher') {
    redirect('/teacher/dashboard')
  }

  if (profile.role === 'admin') {
    redirect('/admin/users')
  }

  // その他のロール用のホームページ
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ホーム</h1>
          <p className="mt-4 text-gray-600">
            ようこそ、{profile?.name || profile?.email || 'ユーザー'}さん
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

async function StudentHomePage({
  profile,
  user,
}: {
  profile: { name: string | null; email: string; role: string }
  user: { id: string }
}) {
  const supabase = await createClient()

  // アクティブなTODOテンプレート数を取得
  const { data: templates } = await supabase
    .from('todo_templates')
    .select('id', { count: 'exact' })
    .eq('is_active', true)

  // 自分のTODO進捗を取得
  const { data: todos } = await supabase
    .from('student_todos')
    .select('status')
    .eq('student_id', user.id)

  const totalCount = templates?.length || 0
  const doneCount = todos?.filter((t) => t.status === 'done').length || 0
  const inProgressCount = todos?.filter((t) => t.status === 'in_progress').length || 0
  const progressRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // 最終更新日時
  const { data: lastUpdatedTodo } = await supabase
    .from('student_todos')
    .select('last_todo_update_at')
    .eq('student_id', user.id)
    .not('last_todo_update_at', 'is', null)
    .order('last_todo_update_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ホーム</h1>
          <p className="text-gray-600">
            ようこそ、<span className="font-semibold text-gray-900">{profile.name || profile.email}</span>さん
          </p>
        </div>

        {/* 進捗サマリカード */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">進捗サマリ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mb-2">
                <span className="text-2xl font-bold text-white">{progressRate}%</span>
              </div>
              <p className="text-sm font-medium text-gray-600">達成率</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-2">
                <span className="text-2xl font-bold text-white">{doneCount}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">完了</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 mb-2">
                <span className="text-2xl font-bold text-white">{inProgressCount}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">進行中</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 mb-2">
                <span className="text-2xl font-bold text-white">{totalCount}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">総TODO数</p>
            </div>
          </div>
          {lastUpdatedTodo?.last_todo_update_at && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                最終更新: {new Date(lastUpdatedTodo.last_todo_update_at).toLocaleString('ja-JP')}
              </p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/todos"
            className="group bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">TODO一覧</h3>
                <p className="text-gray-600 text-sm">スタートTODOの進捗を管理します</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
          <Link
            href="/admissions"
            className="group bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">進路情報</h3>
                <p className="text-gray-600 text-sm">志望校や興味分野を入力します</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>

        {/* ログアウトボタン */}
        <form action={signOut} className="mt-8">
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
