/**
 * 監査ログ記録用ヘルパー関数
 * 
 * 注意: この関数はservice_role keyを使用してaudit_logsにINSERTします。
 * service_role keyは環境変数SUPABASE_SERVICE_ROLE_KEYに設定されている必要があります。
 */

import { createClient } from '@supabase/supabase-js'

/**
 * 監査ログを記録する
 * @param actorUserId 操作を行ったユーザーID
 * @param action アクション（ROLE_CHANGE, TEMPLATE_CREATE, TEMPLATE_UPDATE, TEMPLATE_DELETEなど）
 * @param targetType 対象のタイプ（profiles, todo_templatesなど）
 * @param targetId 対象のID
 * @param diff 変更内容の差分（JSONB形式）
 */
export async function logAudit(
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  diff?: Record<string, any>
) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
    return
  }

  // service_role keyを使用してクライアントを作成（RLSをバイパス）
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const { error } = await supabase.from('audit_logs').insert({
      actor_user_id: actorUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      diff: diff || null,
    })

    if (error) {
      console.error('Error logging audit:', error)
    }
  } catch (error) {
    console.error('Error in logAudit:', error)
  }
}
