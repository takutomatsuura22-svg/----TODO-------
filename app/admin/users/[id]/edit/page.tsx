import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ErrorMessage } from '@/components/error-message'
import { SubmitButton } from '@/components/submit-button'
import { logAudit } from '@/lib/utils/audit-log'

export default async function EditUserPage({
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

  // 管理者のみアクセス可能
  if (profile.role !== 'admin') {
    redirect('/')
  }

  // 編集対象のユーザーを取得
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, name, email, grade, role, is_active')
    .eq('id', params.id)
    .single()

  if (!targetUser) {
    redirect('/admin/users')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/admin/users"
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
            ユーザー管理に戻る
          </Link>
          <h1 className="text-3xl font-bold mb-2">ユーザー編集</h1>
          <p className="text-gray-600">
            {targetUser.name || targetUser.email}さんの情報を編集
          </p>
        </div>

        {/* エラーメッセージ */}
        <ErrorMessage />

        {/* 編集フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <form action={updateUser}>
            <input type="hidden" name="id" value={targetUser.id} />

            {/* 基本情報（読み取り専用） */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">基本情報</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名
                  </label>
                  <p className="text-gray-900">{targetUser.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <p className="text-gray-900">{targetUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学年
                  </label>
                  <p className="text-gray-900">{targetUser.grade || '-'}</p>
                </div>
              </div>
            </div>

            {/* ロール設定 */}
            <div className="mb-6">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ロール <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue={targetUser.role || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">未設定（承認待ち）</option>
                <option value="student">生徒</option>
                <option value="teacher">教員</option>
                <option value="admin">管理者</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ロールを設定すると、ユーザーは該当ロールの機能を利用できるようになります
              </p>
            </div>

            {/* 有効/無効 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アカウント状態
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  defaultChecked={targetUser.is_active}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  アカウントを有効にする
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                無効にすると、ユーザーはログインできなくなります
              </p>
            </div>

            {/* 保存ボタン */}
            <div className="flex gap-4">
              <SubmitButton loadingText="更新中...">
                保存
              </SubmitButton>
              <Link
                href="/admin/users"
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

async function updateUser(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 管理者権限を確認
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const id = formData.get('id') as string
  const role = formData.get('role') as string
  const isActive = formData.get('is_active') === 'on'

  if (!id) {
    return
  }

  // 変更前のロールを取得（監査ログ用）
  const { data: oldProfile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', id)
    .single()

  const updateData: {
    role?: string | null
    is_active: boolean
    updated_at: string
  } = {
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }

  // roleが空文字の場合はnullに設定（承認待ち）
  const newRole = role === '' ? null : role

  // ロールが変更された場合のみ更新
  if (oldProfile?.role !== newRole) {
    updateData.role = newRole
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating user:', error)
    redirect(`/admin/users/${id}/edit?error=save_failed`)
  }

  // ロール変更時の監査ログ記録
  if (oldProfile?.role !== newRole) {
    await logAudit(
      user.id,
      'ROLE_CHANGE',
      'profiles',
      id,
      {
        old_role: oldProfile?.role || null,
        new_role: newRole,
      }
    )
  }

  redirect('/admin/users?success=updated')
}
