import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ErrorMessage } from '@/components/error-message'
import { SubmitButton } from '@/components/submit-button'
import { logAudit } from '@/lib/utils/audit-log'

export default async function EditTemplatePage({
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

  // 編集対象のテンプレートを取得
  const { data: template } = await supabase
    .from('todo_templates')
    .select('id, title, description, category, sort_order, is_active, input_schema')
    .eq('id', params.id)
    .single()

  if (!template) {
    redirect('/admin/templates')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/admin/templates"
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
            テンプレート管理に戻る
          </Link>
          <h1 className="text-3xl font-bold mb-2">テンプレート編集</h1>
          <p className="text-gray-600">ID: {template.id}</p>
        </div>

        {/* エラーメッセージ */}
        <ErrorMessage />

        {/* 編集フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <form action={updateTemplate}>
            <input type="hidden" name="id" value={template.id} />

            {/* タイトル */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={template.title}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* カテゴリ */}
            <div className="mb-6">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                カテゴリ
              </label>
              <input
                type="text"
                id="category"
                name="category"
                defaultValue={template.category || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* 説明 */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                説明
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={template.description || ''}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* 表示順 */}
            <div className="mb-6">
              <label
                htmlFor="sort_order"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                表示順
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                min="0"
                defaultValue={template.sort_order}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                数字が小さいほど先に表示されます
              </p>
            </div>

            {/* 入力項目 */}
            <div className="mb-6">
              <label
                htmlFor="input_schema"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                入力項目（JSON形式）
              </label>
              <textarea
                id="input_schema"
                name="input_schema"
                rows={8}
                defaultValue={JSON.stringify(template.input_schema, null, 2)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON形式で入力項目を定義します。各項目にはfield_key、display_name、required、typeが必要です。
              </p>
            </div>

            {/* 有効/無効 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状態
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  defaultChecked={template.is_active}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  テンプレートを有効にする
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                無効にすると、生徒には表示されません（既存の回答データは保持されます）
              </p>
            </div>

            {/* 保存ボタン */}
            <div className="flex gap-4">
              <SubmitButton loadingText="保存中...">
                保存
              </SubmitButton>
              <Link
                href="/admin/templates"
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

async function updateTemplate(formData: FormData) {
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
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const inputSchemaText = formData.get('input_schema') as string
  const isActive = formData.get('is_active') === 'on'

  if (!id || !title) {
    return
  }

  // 変更前のテンプレート情報を取得（監査ログ用）
  const { data: oldTemplate } = await supabase
    .from('todo_templates')
    .select('title, category, description, sort_order, is_active, input_schema')
    .eq('id', id)
    .single()

  // input_schemaをパース
  let inputSchema: any[] = []
  try {
    inputSchema = JSON.parse(inputSchemaText || '[]')
  } catch (error) {
    console.error('Error parsing input_schema:', error)
    redirect(`/admin/templates/${id}/edit?error=invalid_json`)
    return
  }

  const { error } = await supabase
    .from('todo_templates')
    .update({
      title,
      category: category || null,
      description: description || null,
      sort_order: sortOrder,
      is_active: isActive,
      input_schema: inputSchema,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating template:', error)
    redirect(`/admin/templates/${id}/edit?error=save_failed`)
    return
  }

  // テンプレート変更時の監査ログ記録
  await logAudit(
    user.id,
    'TEMPLATE_UPDATE',
    'todo_templates',
    id,
    {
      old: {
        title: oldTemplate?.title,
        category: oldTemplate?.category,
        description: oldTemplate?.description,
        sort_order: oldTemplate?.sort_order,
        is_active: oldTemplate?.is_active,
      },
      new: {
        title,
        category: category || null,
        description: description || null,
        sort_order: sortOrder,
        is_active: isActive,
      },
    }
  )

  redirect('/admin/templates?success=updated')
}
