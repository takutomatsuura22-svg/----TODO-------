import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ErrorMessage } from '@/components/error-message'
import { SubmitButton } from '@/components/submit-button'
import { logAudit } from '@/lib/utils/audit-log'

export default async function NewTemplatePage() {
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

  // 既存テンプレートの最大sort_orderを取得
  const { data: maxTemplate } = await supabase
    .from('todo_templates')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxTemplate?.sort_order || 0) + 1

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
          <h1 className="text-3xl font-bold mb-2">テンプレート追加</h1>
        </div>

        {/* エラーメッセージ */}
        <ErrorMessage />

        {/* 追加フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <form action={createTemplate} className="space-y-6">
            {/* テンプレートID */}
            <div>
              <label
                htmlFor="id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                テンプレートID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="id"
                name="id"
                required
                pattern="[a-z0-9-]+"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="例: template-001"
              />
              <p className="text-xs text-gray-500 mt-1">
                小文字、数字、ハイフンのみ使用可能。一度設定したら変更できません。
              </p>
            </div>

            {/* タイトル */}
            <div>
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="例: 自己分析ワーク1: 自分の強みを整理する"
              />
            </div>

            {/* カテゴリ */}
            <div>
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="例: 自己分析"
              />
            </div>

            {/* 説明 */}
            <div>
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="テンプレートの説明を入力してください"
              />
            </div>

            {/* 表示順 */}
            <div>
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
                defaultValue={nextSortOrder}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                数字が小さいほど先に表示されます
              </p>
            </div>

            {/* 入力項目（簡易版 - 後で拡張可能） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                入力項目（JSON形式）
              </label>
              <textarea
                id="input_schema"
                name="input_schema"
                rows={8}
                defaultValue='[\n  {\n    "field_key": "field_1",\n    "display_name": "項目1",\n    "required": true,\n    "type": "text"\n  }\n]'
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder='[{"field_key": "field_1", "display_name": "項目1", "required": true, "type": "text"}]'
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON形式で入力項目を定義します。各項目にはfield_key、display_name、required、typeが必要です。
              </p>
            </div>

            {/* 保存ボタン */}
            <div className="flex gap-4">
              <SubmitButton loadingText="作成中...">
                作成
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

async function createTemplate(formData: FormData) {
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

  if (!id || !title) {
    return
  }

  // input_schemaをパース
  let inputSchema: any[] = []
  try {
    inputSchema = JSON.parse(inputSchemaText || '[]')
  } catch (error) {
    console.error('Error parsing input_schema:', error)
    redirect('/admin/templates/new?error=invalid_json')
  }

  const { error } = await supabase
    .from('todo_templates')
    .insert({
      id,
      title,
      category: category || null,
      description: description || null,
      sort_order: sortOrder,
      is_active: true,
      input_schema: inputSchema,
    })

  if (error) {
    console.error('Error creating template:', error)
    // 重複IDエラーの場合
    if (error.code === '23505') {
      redirect('/admin/templates/new?error=duplicate_id')
    }
    redirect('/admin/templates/new?error=save_failed')
  }

  // テンプレート作成時の監査ログ記録
  await logAudit(
    user.id,
    'TEMPLATE_CREATE',
    'todo_templates',
    id,
    {
      title,
      category: category || null,
      description: description || null,
      sort_order: sortOrder,
      input_schema: inputSchema,
    }
  )

  // テンプレート追加時、対象生徒（高2）全員に未着手TODOを自動生成
  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .eq('grade', '高2')
    .eq('is_active', true)

  if (students && students.length > 0) {
    const todosToInsert = students.map((student) => ({
      student_id: student.id,
      template_id: id,
      status: 'not_started',
    }))

    const { error: todoError } = await supabase
      .from('student_todos')
      .insert(todosToInsert)

    if (todoError) {
      console.error('Error creating student todos:', todoError)
    }
  }

  redirect('/admin/templates?success=created')
}
