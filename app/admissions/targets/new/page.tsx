import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ErrorMessage } from '@/components/error-message'
import { SubmitButton } from '@/components/submit-button'

export default async function NewTargetProgramPage() {
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

  // 利用可能な志望校プログラムを取得
  const { data: programs } = await supabase
    .from('admission_programs')
    .select('id, university_name, faculty_name, department_name, admission_method')
    .order('university_name', { ascending: true })
    .order('faculty_name', { ascending: true })

  // 既に登録済みの志望校IDを取得
  const { data: existingTargets } = await supabase
    .from('student_target_programs')
    .select('program_id')
    .eq('student_id', user.id)

  const existingProgramIds = new Set(existingTargets?.map((t) => t.program_id) || [])
  const availablePrograms = programs?.filter((p) => !existingProgramIds.has(p.id)) || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/admissions"
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
            進路情報に戻る
          </Link>
          <h1 className="text-3xl font-bold mb-2">志望校を追加</h1>
          <p className="text-gray-600">志望校を選択して登録してください</p>
        </div>

        {/* エラーメッセージ */}
        <ErrorMessage />

        {/* 志望校選択フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          {availablePrograms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                登録可能な志望校がありません。
                <br />
                管理者に志望校マスタの追加を依頼してください。
              </p>
              <Link
                href="/admissions"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                進路情報に戻る
              </Link>
            </div>
          ) : (
            <form action={addTargetProgram} className="space-y-6">
              {/* 志望校選択 */}
              <div>
                <label
                  htmlFor="program_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  志望校 <span className="text-red-500">*</span>
                </label>
                <select
                  id="program_id"
                  name="program_id"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">選択してください</option>
                  {availablePrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.university_name} {program.faculty_name}
                      {program.department_name && ` ${program.department_name}`} (
                      {program.admission_method})
                    </option>
                  ))}
                </select>
              </div>

              {/* 優先順位 */}
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  優先順位
                </label>
                <input
                  type="number"
                  id="priority"
                  name="priority"
                  min="1"
                  defaultValue="1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  数字が小さいほど優先度が高くなります（1が最優先）
                </p>
              </div>

              {/* ステータス */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  ステータス
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="considering"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="considering">検討中</option>
                  <option value="applied">出願済み</option>
                  <option value="accepted">合格</option>
                  <option value="rejected">不合格</option>
                </select>
              </div>

              {/* 保存ボタン */}
              <div className="flex gap-4">
                <SubmitButton loadingText="登録中...">
                  登録
                </SubmitButton>
                <Link
                  href="/admissions"
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

async function addTargetProgram(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const programId = formData.get('program_id') as string
  const priority = parseInt(formData.get('priority') as string) || 1
  const status = formData.get('status') as string

  if (!programId) {
    return
  }

  const { error } = await supabase
    .from('student_target_programs')
    .insert({
      student_id: user.id,
      program_id: programId,
      priority,
      status: status || 'considering',
    })

  if (error) {
    console.error('Error adding target program:', error)
    redirect('/admissions/targets/new?error=save_failed')
  }

  redirect('/admissions?success=saved')
}
