import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNextSchedule, formatDaysRemaining } from '@/lib/utils/countdown'
import { ErrorMessage, SuccessMessage } from '@/components/error-message'
import { SubmitButton } from '@/components/submit-button'

export default async function AdmissionsPage() {
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

  // 既存の進路情報を取得
  const { data: admission } = await supabase
    .from('student_admissions')
    .select('faculty, department, method, interests')
    .eq('student_id', user.id)
    .single()

  // 登録済みの志望校を取得
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
    .eq('student_id', user.id)
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
          schedule_type: s.schedule_type as 'application_deadline' | 'application_must_arrive' | 'first_exam' | 'second_exam',
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
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
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
            ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">進路情報</h1>
          <p className="text-gray-600">志望校や興味分野を入力してください</p>
        </div>

        {/* エラー・成功メッセージ */}
        <ErrorMessage />
        <SuccessMessage />

        {/* 進路情報入力フォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form action={saveAdmission} className="space-y-6">
            {/* 学部 */}
            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
                志望学部
              </label>
              <input
                type="text"
                id="faculty"
                name="faculty"
                defaultValue={admission?.faculty || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="例: 文学部、経済学部、工学部"
              />
            </div>

            {/* 学科 */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                志望学科
              </label>
              <input
                type="text"
                id="department"
                name="department"
                defaultValue={admission?.department || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="例: 日本文学科、経済学科、情報工学科"
              />
            </div>

            {/* 受験方式 */}
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
                受験方式 <span className="text-red-500">*</span>
              </label>
              <select
                id="method"
                name="method"
                required
                defaultValue={admission?.method || '総合型'}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="総合型">総合型選抜</option>
                <option value="一般選抜">一般選抜</option>
                <option value="学校推薦型選抜">学校推薦型選抜</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* 興味分野 */}
            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
                興味分野
              </label>
              <textarea
                id="interests"
                name="interests"
                rows={4}
                defaultValue={admission?.interests || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="興味のある分野や研究したいテーマを記入してください"
              />
            </div>

            {/* 保存ボタン */}
            <div className="flex gap-4">
              <SubmitButton loadingText="保存中...">
                保存
              </SubmitButton>
              <Link
                href="/"
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>

        {/* 志望校一覧 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">志望校一覧</h2>
            <Link
              href="/admissions/targets/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + 志望校を追加
            </Link>
          </div>

          {programsWithSchedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">志望校が登録されていません</p>
              <Link
                href="/admissions/targets/new"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                志望校を追加する
              </Link>
            </div>
          ) : (
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
                    className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                            {target.priority}
                          </span>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {program.university_name} {program.faculty_name}
                            {program.department_name && ` ${program.department_name}`}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                            {program.admission_method}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              statusColors[target.status as keyof typeof statusColors]
                            }`}
                          >
                            {statusLabels[target.status as keyof typeof statusLabels]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Link
                          href={`/admissions/targets/${target.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          編集
                        </Link>
                      </div>
                    </div>

                    {/* カウントダウン表示 */}
                    {target.nextSchedule ? (
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
                          className={`font-medium ${
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
                    ) : (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-600">日程未設定</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

async function saveAdmission(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const faculty = formData.get('faculty') as string
  const department = formData.get('department') as string
  const method = formData.get('method') as string
  const interests = formData.get('interests') as string

  if (!method) {
    return
  }

  const { error } = await supabase
    .from('student_admissions')
    .upsert(
      {
        student_id: user.id,
        faculty: faculty || null,
        department: department || null,
        method: method || '総合型',
        interests: interests || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'student_id',
      }
    )

  if (error) {
    console.error('Error saving admission:', error)
    redirect('/admissions?error=save_failed')
  }

  redirect('/admissions?success=saved')
}
