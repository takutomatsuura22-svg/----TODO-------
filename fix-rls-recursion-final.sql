-- ============================================
-- RLSポリシーの無限再帰問題を修正（最終版）
-- ============================================

-- 問題: profilesテーブルのRLSポリシー内でprofilesテーブル自体を参照しているため、
-- INSERT時に無限再帰が発生している

-- 解決策: SECURITY DEFINER関数を使用して、RLSをバイパスしてroleを取得

-- 1. roleを取得する関数を作成（SECURITY DEFINERでRLSをバイパス）
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. 問題のあるポリシーを削除
DROP POLICY IF EXISTS "Teachers can view all student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 3. 関数を使用した教員ポリシー（無限再帰を回避）
CREATE POLICY "Teachers can view all student profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
  );

-- 4. 関数を使用した管理者ポリシー（無限再帰を回避）
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 5. 確認: ポリシー一覧を表示
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname, cmd;

-- 完了メッセージ
SELECT 'RLS policies fixed successfully!' AS message;
