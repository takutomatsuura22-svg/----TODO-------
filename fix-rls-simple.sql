-- ============================================
-- RLSポリシーの無限再帰問題を修正（シンプル版）
-- ============================================

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

-- 完了メッセージ
SELECT 'RLS policies fixed! Please try logging in again.' AS message;
