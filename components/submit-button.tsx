'use client'

import { useFormStatus } from 'react-dom'
import { ReactNode } from 'react'

interface SubmitButtonProps {
  children: ReactNode
  className?: string
  disabled?: boolean
  loadingText?: string
  formAction?: (formData: FormData) => void | Promise<void>
}

export function SubmitButton({
  children,
  className = 'flex-1 rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  disabled = false,
  loadingText,
  formAction,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={className}
      formAction={formAction}
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText || '処理中...'}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
