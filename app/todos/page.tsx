import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SuccessMessage } from '@/components/error-message'

export default async function TodosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, grade')
    .eq('id', user.id)
    .single()

  // プロフィール未設定の場合は設定画面へ
  if (!profile?.name || !profile?.grade) {
    redirect('/profile/setup')
  }

  // roleがnullの場合は/pendingへ
  if (!profile?.role) {
    redirect('/pending')
  }

  // 生徒のみアクセス可能
  if (profile.role !== 'student') {
    redirect('/')
  }

  // アクティブなTODOテンプレートを取得
  const { data: templates } = await supabase
    .from('todo_templates')
    .select('id, title, description, category, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // 自分のTODO進捗を取得
  const { data: todos } = await supabase
    .from('student_todos')
    .select('template_id, status, updated_at, last_todo_update_at')
    .eq('student_id', user.id)

  // テンプレートとTODO進捗を結合
  const todosWithStatus = (templates || []).map((template) => {
    const todo = todos?.find((t) => t.template_id === template.id)
    return {
      ...template,
      status: todo?.status || 'not_started',
      updated_at: todo?.updated_at,
      last_todo_update_at: todo?.last_todo_update_at,
    }
  })

  // 進捗統計
  const totalCount = todosWithStatus.length
  const doneCount = todosWithStatus.filter((t) => t.status === 'done').length
  const inProgressCount = todosWithStatus.filter((t) => t.status === 'in_progress').length
  const notStartedCount = todosWithStatus.filter((t) => t.status === 'not_started').length
  const progressRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // 次に取り組むTODO（未完了の先頭）
  const nextTodo = todosWithStatus.find(
    (t) => t.status === 'not_started' || t.status === 'in_progress'
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TODO一覧</h1>
          <p className="text-gray-600">スタートTODOの進捗を管理します</p>
        </div>

        {/* 成功メッセージ */}
        <SuccessMessage />

        {/* 進捗サマリ */}
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
                <span className="text-2xl font-bold text-white">{notStartedCount}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">未着手</p>
            </div>
          </div>
          {nextTodo && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">次に取り組むTODO</p>
                  <Link
                    href={`/todos/${nextTodo.id}`}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-lg"
                  >
                    {nextTodo.title}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TODO一覧 */}
        <div className="space-y-4">
          {todosWithStatus.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">TODOテンプレートがまだ作成されていません</p>
            </div>
          ) : (
            todosWithStatus.map((todo) => {
              const statusColors = {
                not_started: 'bg-gray-100 text-gray-800',
                in_progress: 'bg-blue-100 text-blue-800',
                done: 'bg-green-100 text-green-800',
              }

              const statusLabels = {
                not_started: '未着手',
                in_progress: '進行中',
                done: '完了',
              }

              return (
                <Link
                  key={todo.id}
                  href={`/todos/${todo.id}`}
                  className="block bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                          {todosWithStatus.indexOf(todo) + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{todo.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[todo.status as keyof typeof statusColors]}`}
                        >
                          {statusLabels[todo.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                      {todo.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{todo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {todo.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 font-medium">
                            {todo.category}
                          </span>
                        )}
                        {todo.last_todo_update_at && (
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
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
                            最終更新: {new Date(todo.last_todo_update_at).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400">
                        <svg
                          className="w-5 h-5"
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
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* 戻るボタン */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
