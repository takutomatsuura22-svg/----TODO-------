'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function ErrorMessageContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      // 5秒後に自動で非表示
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (!error || !isVisible) {
    return null
  }

  const errorMessages: Record<string, string> = {
    save_failed: '保存に失敗しました。もう一度お試しください。',
    validation_error: '入力内容に誤りがあります。確認してください。',
    network_error: 'ネットワークエラーが発生しました。接続を確認してください。',
    permission_denied: 'この操作を実行する権限がありません。',
    template_not_found: 'テンプレートが見つかりません。',
    invalid_json: '入力項目のJSON形式が正しくありません。',
    duplicate_id: 'このテンプレートIDは既に使用されています。',
    signin_failed: 'ログインに失敗しました。もう一度お試しください。',
    auth_failed: '認証に失敗しました。',
    no_code: '認証コードが取得できませんでした。',
    get_user_failed: 'ユーザー情報の取得に失敗しました。',
    no_url: '認証URLの取得に失敗しました。',
    env_missing: '環境変数が設定されていません。.env.localファイルを確認してください。',
    invalid_url: 'Supabase URLの形式が正しくありません。正しい形式: https://[project-ref].supabase.co',
    provider_not_enabled: 'Google OAuthプロバイダーが有効になっていません。Supabase DashboardでGoogleプロバイダーを有効にしてください。',
  }

  const message = errorMessages[error] || 'エラーが発生しました。'

  return (
    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{message}</p>
          {error === 'provider_not_enabled' && (
            <p className="text-xs text-red-600 mt-1">
              Supabase DashboardでGoogleプロバイダーを有効にしてください。詳細は <code className="bg-red-100 px-1 rounded">GOOGLE_OAUTH_SETUP.md</code> を参照してください。
            </p>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-red-600 hover:text-red-800"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function ErrorMessage() {
  return (
    <Suspense fallback={null}>
      <ErrorMessageContent />
    </Suspense>
  )
}

function SuccessMessageContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (success) {
      setIsVisible(true)
      // 3秒後に自動で非表示
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  if (!success || !isVisible) {
    return null
  }

  const successMessages: Record<string, string> = {
    saved: '保存しました。',
    created: '作成しました。',
    updated: '更新しました。',
    deleted: '削除しました。',
  }

  const message = successMessages[success] || '操作が完了しました。'

  return (
    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-green-600 hover:text-green-800"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function SuccessMessage() {
  return (
    <Suspense fallback={null}>
      <SuccessMessageContent />
    </Suspense>
  )
}
