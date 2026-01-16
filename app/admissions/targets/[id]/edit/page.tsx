import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ErrorMessage } from '@/components/error-message'
import { SubmitButton } from '@/components/submit-button'

export default async function EditTargetProgramPage({
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

  // 既存の志望校登録を取得
  const { data: target } = await supabase
    .from('student_target_programs')
    .select('id, priority, status, program_id')
    .eq('id', params.id)
    .eq('student_id', user.id)
    .single()

  if (!target) {
    redirect('/admissions')
  }

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
          <h1 className="text-3xl font-bold mb-2">志望校を編集</h1>
        </div>

        {/* エラーメッセージ */}
        <ErrorMessage />

        {/* 編集フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <form action={updateTargetProgram}>
            <input type="hidden" name="id" value={target.id} />

            {/* 優先順位 */}
            <div className="mb-6">
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
                defaultValue={target.priority}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                数字が小さいほど優先度が高くなります（1が最優先）
              </p>
            </div>

            {/* ステータス */}
            <div className="mb-6">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ステータス
              </label>
              <select
                id="status"
                name="status"
                defaultValue={target.status}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="considering">検討中</option>
                <option value="applied">出願済み</option>
                <option value="accepted">合格</option>
                <option value="rejected">不合格</option>
              </select>
            </div>

            {/* 保存・削除ボタン */}
            <div className="flex gap-4">
              <SubmitButton loadingText="保存中...">
                保存
              </SubmitButton>
              <SubmitButton
                formAction={deleteTargetProgram}
                className="px-6 py-3 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                loadingText="削除中..."
              >
                削除
              </SubmitButton>
              <Link
                href="/admissions"
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

async function updateTargetProgram(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = formData.get('id') as string
  const priority = parseInt(formData.get('priority') as string) || 1
  const status = formData.get('status') as string

  if (!id) {
    return
  }

  const { error } = await supabase
    .from('student_target_programs')
    .update({
      priority,
      status: status || 'considering',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) {
    console.error('Error updating target program:', error)
    redirect(`/admissions/targets/${id}/edit?error=save_failed`)
  }

  redirect('/admissions?success=updated')
}

async function deleteTargetProgram(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const id = formData.get('id') as string

  if (!id) {
    return
  }

  const { error } = await supabase
    .from('student_target_programs')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) {
    console.error('Error deleting target program:', error)
    redirect(`/admissions/targets/${id}/edit?error=save_failed`)
  }

  redirect('/admissions?success=deleted')
}
