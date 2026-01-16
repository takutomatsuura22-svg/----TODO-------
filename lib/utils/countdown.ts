/**
 * 志望校カウントダウン計算ユーティリティ
 */

export type ScheduleType = 'application_deadline' | 'application_must_arrive' | 'first_exam' | 'second_exam'

export interface Schedule {
  id: string
  schedule_type: ScheduleType
  schedule_date: string
  description: string | null
}

export interface NextSchedule {
  schedule: Schedule
  daysRemaining: number
  isOverdue: boolean
  label: string
}

/**
 * スケジュールタイプの優先順位を取得
 * 優先順位が低いほど先に来る（1次出願必着 > 1次試験 > 2次試験）
 */
function getSchedulePriority(type: ScheduleType): number {
  switch (type) {
    case 'application_must_arrive':
      return 1 // 最優先
    case 'application_deadline':
      return 2
    case 'first_exam':
      return 3
    case 'second_exam':
      return 4
    default:
      return 999
  }
}

/**
 * スケジュールタイプのラベルを取得
 */
function getScheduleLabel(type: ScheduleType, description: string | null): string {
  if (description) {
    return description
  }
  
  switch (type) {
    case 'application_must_arrive':
      return '出願（必着）'
    case 'application_deadline':
      return '出願（消印）'
    case 'first_exam':
      return '1次試験'
    case 'second_exam':
      return '2次試験'
    default:
      return '日程'
  }
}

/**
 * 次に来る重要日程を計算
 * 優先順位：1次出願（必着/消印）→ 1次試験日 → 2次試験日
 */
export function getNextSchedule(schedules: Schedule[]): NextSchedule | null {
  if (!schedules || schedules.length === 0) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 未来の日程のみをフィルタリング（期限超過も含める）
  const validSchedules = schedules
    .map((schedule) => {
      const scheduleDate = new Date(schedule.schedule_date)
      scheduleDate.setHours(0, 0, 0, 0)
      const daysRemaining = Math.floor(
        (scheduleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        schedule,
        daysRemaining,
        isOverdue: daysRemaining < 0,
        priority: getSchedulePriority(schedule.schedule_type),
      }
    })
    .sort((a, b) => {
      // 優先順位でソート（優先順位が低い順）
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // 同じ優先順位の場合は、日付が近い順
      return a.daysRemaining - b.daysRemaining
    })

  if (validSchedules.length === 0) {
    return null
  }

  const next = validSchedules[0]
  return {
    schedule: next.schedule,
    daysRemaining: next.daysRemaining,
    isOverdue: next.isOverdue,
    label: getScheduleLabel(next.schedule.schedule_type, next.schedule.description),
  }
}

/**
 * 残日数の表示テキストを生成
 */
export function formatDaysRemaining(nextSchedule: NextSchedule | null): string {
  if (!nextSchedule) {
    return '日程未設定'
  }

  if (nextSchedule.isOverdue) {
    return `${nextSchedule.label}：期限超過`
  }

  if (nextSchedule.daysRemaining === 0) {
    return `${nextSchedule.label}：今日`
  }

  return `${nextSchedule.label}まであと${nextSchedule.daysRemaining}日`
}
