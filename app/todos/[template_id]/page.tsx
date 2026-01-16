import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ErrorMessage } from '@/components/error-message'
import { SubmitButton } from '@/components/submit-button'

export default async function TodoDetailPage({
  params,
}: {
  params: { template_id: string }
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

  // TODOテンプレートを取得
  const { data: template } = await supabase
    .from('todo_templates')
    .select('id, title, description, category, input_schema')
    .eq('id', params.template_id)
    .eq('is_active', true)
    .single()

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">TODOテンプレートが見つかりません</p>
            <Link href="/todos" className="text-blue-600 hover:text-blue-700">
              TODO一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 自分のTODO進捗を取得
  const { data: todo } = await supabase
    .from('student_todos')
    .select('status, updated_at, last_todo_update_at')
    .eq('student_id', user.id)
    .eq('template_id', params.template_id)
    .single()

  // 回答を取得
  const { data: response } = await supabase
    .from('todo_responses')
    .select('responses')
    .eq('student_id', user.id)
    .eq('template_id', params.template_id)
    .single()

  const currentStatus = todo?.status || 'not_started'
  const inputSchema = (template.input_schema as Array<{
    field_key: string
    display_name: string
    required?: boolean
    type?: string
  }>) || []
  const responses = (response?.responses as Record<string, string>) || {}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/todos"
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
            TODO一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold mb-2">{template.title}</h1>
          {template.description && (
            <p className="text-gray-600">{template.description}</p>
          )}
        </div>

        {/* エラーメッセージ */}
        <ErrorMessage />

        {/* TODO詳細フォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <form action={saveTodo}>
            <input type="hidden" name="template_id" value={template.id} />

            {/* ステータス選択 */}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                ステータス <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                required
                defaultValue={currentStatus}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="not_started">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="done">完了</option>
              </select>
            </div>

            {/* 入力項目（input_schemaから動的生成） */}
            {inputSchema.length > 0 ? (
              <div className="space-y-4 mb-6">
                <h2 className="text-lg font-semibold mb-4">回答入力</h2>
                {inputSchema.map((field) => (
                  <div key={field.field_key}>
                    <label
                      htmlFor={field.field_key}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {field.display_name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      id={field.field_key}
                      name={field.field_key}
                      required={field.required}
                      defaultValue={responses[field.field_key] || ''}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder={`${field.display_name}を入力してください`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">自由メモ</h2>
                <textarea
                  name="memo"
                  defaultValue={responses.memo || ''}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="メモを入力してください"
                />
              </div>
            )}

            {/* 保存ボタン */}
            <div className="flex gap-4">
              <SubmitButton loadingText="保存中...">
                保存
              </SubmitButton>
              <Link
                href="/todos"
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

async function saveTodo(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const templateId = formData.get('template_id') as string
  const status = formData.get('status') as string

  if (!templateId || !status) {
    return
  }

  // 回答データを収集
  const responses: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (key !== 'template_id' && key !== 'status') {
      responses[key] = value as string
    }
  })

  // student_todosを更新または作成
  const { error: todoError } = await supabase
    .from('student_todos')
    .upsert(
      {
        student_id: user.id,
        template_id: templateId,
        status: status as 'not_started' | 'in_progress' | 'done',
        last_todo_update_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'student_id,template_id',
      }
    )

  if (todoError) {
    console.error('Error saving todo:', todoError)
    redirect(`/todos/${templateId}?error=save_failed`)
  }

  // todo_responsesを更新または作成
  const { error: responseError } = await supabase
    .from('todo_responses')
    .upsert(
      {
        student_id: user.id,
        template_id: templateId,
        responses,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'student_id,template_id',
      }
    )

  if (responseError) {
    console.error('Error saving response:', responseError)
    redirect(`/todos/${templateId}?error=save_failed`)
  }

  redirect('/todos?success=saved')
}
