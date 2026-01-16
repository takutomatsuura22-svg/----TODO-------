/**
 * 停滞判定ユーティリティ
 */

/**
 * 停滞判定ロジック
 * 以下のいずれかを満たす場合「停滞」と判定する：
 * - 最終ログインから4日以上経過
 * - 最終TODO更新から4日以上経過
 */
export function isStagnant(
  lastLoginAt: string | null,
  lastTodoUpdateAt: string | null
): boolean {
  const now = new Date()
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)

  // 最終ログインが4日以上前の場合
  if (lastLoginAt) {
    const lastLogin = new Date(lastLoginAt)
    if (lastLogin < fourDaysAgo) {
      return true
    }
  }

  // 最終TODO更新が4日以上前の場合
  if (lastTodoUpdateAt) {
    const lastUpdate = new Date(lastTodoUpdateAt)
    if (lastUpdate < fourDaysAgo) {
      return true
    }
  }

  // 両方nullの場合は停滞とみなす
  if (!lastLoginAt && !lastTodoUpdateAt) {
    return true
  }

  return false
}

/**
 * 停滞日数を計算
 */
export function getStagnationDays(
  lastLoginAt: string | null,
  lastTodoUpdateAt: string | null
): number {
  const now = new Date()
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)

  let latestDate: Date | null = null

  if (lastLoginAt) {
    const lastLogin = new Date(lastLoginAt)
    if (latestDate === null) {
      latestDate = lastLogin
    } else {
      const currentLatest: Date = latestDate
      if (lastLogin.getTime() > currentLatest.getTime()) {
        latestDate = lastLogin
      }
    }
  }

  if (lastTodoUpdateAt) {
    const lastUpdate = new Date(lastTodoUpdateAt)
    if (latestDate === null) {
      latestDate = lastUpdate
    } else {
      const currentLatest: Date = latestDate
      if (lastUpdate.getTime() > currentLatest.getTime()) {
        latestDate = lastUpdate
      }
    }
  }

  if (!latestDate) {
    return 999 // データがない場合は大きな値を返す
  }

  const diffTime = now.getTime() - latestDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}
