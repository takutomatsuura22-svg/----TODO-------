import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNextSchedule, formatDaysRemaining } from '@/lib/utils/countdown'

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  // プロフィール未設定の場合は設定画面へ
  if (!profile?.name) {
    redirect('/profile/setup')
  }

  // roleがnullの場合は/pendingへ
  if (!profile?.role) {
    redirect('/pending')
  }

  // 教員のみアクセス可能
  if (profile.role !== 'teacher') {
    redirect('/')
  }

  // 生徒のプロフィールを取得
  const { data: student } = await supabase
    .from('profiles')
    .select('id, name, email, grade, last_login_at')
    .eq('id', params.id)
    .eq('role', 'student')
    .single()

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">生徒が見つかりません</p>
            <Link href="/teacher/dashboard" className="text-blue-600 hover:text-blue-700">
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // アクティブなTODOテンプレートを取得
  const { data: templates } = await supabase
    .from('todo_templates')
    .select('id, title, description, category, sort_order, input_schema')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // 生徒のTODO進捗を取得
  const { data: todos } = await supabase
    .from('student_todos')
    .select('template_id, status, updated_at, last_todo_update_at')
    .eq('student_id', params.id)

  // 生徒の回答を取得
  const { data: responses } = await supabase
    .from('todo_responses')
    .select('template_id, responses')
    .eq('student_id', params.id)

  // テンプレートとTODO進捗・回答を結合
  const todosWithDetails = (templates || []).map((template) => {
    const todo = todos?.find((t) => t.template_id === template.id)
    const response = responses?.find((r) => r.template_id === template.id)

    return {
      ...template,
      status: todo?.status || 'not_started',
      updated_at: todo?.updated_at,
      last_todo_update_at: todo?.last_todo_update_at,
      responses: response?.responses || {},
    }
  })

  // 進捗統計
  const totalCount = todosWithDetails.length
  const doneCount = todosWithDetails.filter((t) => t.status === 'done').length
  const inProgressCount = todosWithDetails.filter(
    (t) => t.status === 'in_progress'
  ).length
  const progressRate =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // 進路情報を取得
  const { data: admission } = await supabase
    .from('student_admissions')
    .select('faculty, department, method, interests')
    .eq('student_id', params.id)
    .single()

  // 志望校を取得
  const { data: targetPrograms } = await supabase
    .from('student_target_programs')
    .select(`
      id,
      priority,
      status,
      program_id,
      admission_programs (
        id,
        university_name,
        faculty_name,
        department_name,
        admission_method
      )
    `)
    .eq('student_id', params.id)
    .order('priority', { ascending: true })

  // 各志望校のスケジュールを取得
  const programsWithSchedules = await Promise.all(
    (targetPrograms || []).map(async (target) => {
      const { data: schedules } = await supabase
        .from('admission_schedules')
        .select('id, schedule_type, schedule_date, description')
        .eq('program_id', target.program_id)
        .order('schedule_date', { ascending: true })

      const nextSchedule = getNextSchedule(
        (schedules || []).map((s) => ({
          id: s.id,
          schedule_type: s.schedule_type as
            | 'application_deadline'
            | 'application_must_arrive'
            | 'first_exam'
            | 'second_exam',
          schedule_date: s.schedule_date,
          description: s.description,
        }))
      )

      return {
        ...target,
        schedules: schedules || [],
        nextSchedule,
        countdownText: formatDaysRemaining(nextSchedule),
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
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
            ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {student.name || student.email}さんの詳細
          </h1>
        </div>

        {/* 基本情報カード */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">氏名</p>
              <p className="font-medium">{student.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">学年</p>
              <p className="font-medium">{student.grade || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">メールアドレス</p>
              <p className="font-medium text-sm">{student.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">最終ログイン</p>
              <p className="font-medium text-sm">
                {student.last_login_at
                  ? new Date(student.last_login_at).toLocaleString('ja-JP')
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 進捗サマリ */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">進捗サマリ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">達成率</p>
              <p className="text-2xl font-bold">{progressRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">完了</p>
              <p className="text-2xl font-bold text-green-600">{doneCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">進行中</p>
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">総TODO数</p>
              <p className="text-2xl font-bold text-gray-600">{totalCount}</p>
            </div>
          </div>
        </div>

        {/* TODO進捗一覧 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">TODO進捗一覧</h2>
          <div className="space-y-4">
            {todosWithDetails.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                TODOテンプレートがまだ作成されていません
              </p>
            ) : (
              todosWithDetails.map((todo) => {
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

                const inputSchema = (todo.input_schema as Array<{
                  field_key: string
                  display_name: string
                }>) || []

                return (
                  <div
                    key={todo.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{todo.title}</h3>
                        {todo.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {todo.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[todo.status as keyof typeof statusColors]
                        }`}
                      >
                        {statusLabels[todo.status as keyof typeof statusLabels]}
                      </span>
                    </div>

                    {/* 回答内容 */}
                    {todo.status !== 'not_started' &&
                      (inputSchema.length > 0 ? (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            回答内容
                          </h4>
                          <div className="space-y-2">
                            {inputSchema.map((field) => {
                              const value =
                                (todo.responses as Record<string, string>)[
                                  field.field_key
                                ] || ''
                              return (
                                <div key={field.field_key}>
                                  <p className="text-xs text-gray-600">
                                    {field.display_name}
                                  </p>
                                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                    {value || '-'}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            メモ
                          </h4>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {(todo.responses as Record<string, string>).memo ||
                              '-'}
                          </p>
                        </div>
                      ))}

                    {todo.last_todo_update_at && (
                      <p className="text-xs text-gray-500 mt-3">
                        最終更新:{' '}
                        {new Date(todo.last_todo_update_at).toLocaleString(
                          'ja-JP'
                        )}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 進路情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">進路情報</h2>
          {admission ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">志望学部</p>
                <p className="font-medium">{admission.faculty || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">志望学科</p>
                <p className="font-medium">{admission.department || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">受験方式</p>
                <p className="font-medium">{admission.method || '-'}</p>
              </div>
              {admission.interests && (
                <div>
                  <p className="text-sm text-gray-600">興味分野</p>
                  <p className="font-medium whitespace-pre-wrap">
                    {admission.interests}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">進路情報が登録されていません</p>
          )}
        </div>

        {/* 志望校一覧 */}
        {programsWithSchedules.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">志望校一覧</h2>
            <div className="space-y-4">
              {programsWithSchedules
                .filter((target) => target.admission_programs)
                .map((target) => {
                  const admissionPrograms = Array.isArray(target.admission_programs)
                    ? target.admission_programs[0]
                    : target.admission_programs
                  
                  if (!admissionPrograms) return null
                  
                  const program = admissionPrograms as {
                    id: string
                    university_name: string
                    faculty_name: string
                    department_name: string | null
                    admission_method: string
                  }

                  const statusColors = {
                    considering: 'bg-gray-100 text-gray-800',
                    applied: 'bg-blue-100 text-blue-800',
                    accepted: 'bg-green-100 text-green-800',
                    rejected: 'bg-red-100 text-red-800',
                  }

                  const statusLabels = {
                    considering: '検討中',
                    applied: '出願済み',
                    accepted: '合格',
                    rejected: '不合格',
                  }

                  return (
                    <div
                      key={target.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {program.university_name} {program.faculty_name}
                            {program.department_name &&
                              ` ${program.department_name}`}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {program.admission_method}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[
                              target.status as keyof typeof statusColors
                            ]
                          }`}
                        >
                          {
                            statusLabels[
                              target.status as keyof typeof statusLabels
                            ]
                          }
                        </span>
                      </div>

                      {/* カウントダウン表示 */}
                      {target.nextSchedule && (
                        <div
                          className={`mt-3 p-3 rounded-lg ${
                            target.nextSchedule.isOverdue
                              ? 'bg-red-50 border border-red-200'
                              : target.nextSchedule.daysRemaining <= 7
                              ? 'bg-yellow-50 border border-yellow-200'
                              : 'bg-blue-50 border border-blue-200'
                          }`}
                        >
                          <p
                            className={`font-medium text-sm ${
                              target.nextSchedule.isOverdue
                                ? 'text-red-700'
                                : target.nextSchedule.daysRemaining <= 7
                                ? 'text-yellow-700'
                                : 'text-blue-700'
                            }`}
                          >
                            {target.countdownText}
                          </p>
                          {target.nextSchedule.schedule.schedule_date && (
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(
                                target.nextSchedule.schedule.schedule_date
                              ).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
