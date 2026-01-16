import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ErrorMessage } from '@/components/error-message'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 既にログインしている場合はリダイレクト
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      redirect('/')
    } else {
      redirect('/pending')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ログイン</h1>
          <p className="mt-2 text-gray-600">Googleアカウントでログインしてください</p>
        </div>
        <ErrorMessage />
        <a
          href="/auth/login"
          className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors text-center"
        >
          Googleでログイン
        </a>
      </div>
    </div>
  )
}
