-- ============================================
-- RLSポリシーの無限再帰問題を修正
-- ============================================

-- 問題: profilesテーブルのRLSポリシー内でprofilesテーブル自体を参照しているため、
-- INSERT時に無限再帰が発生している

-- 1. 問題のあるポリシーを削除
DROP POLICY IF EXISTS "Teachers can view all student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 2. 修正版ポリシーを作成
-- 教員は全生徒のプロフィールをSELECT可能（profilesテーブルを参照しない）
CREATE POLICY "Teachers can view all student profiles"
  ON public.profiles FOR SELECT
  USING (
    -- auth.jwt()から直接roleを取得（profilesテーブルを参照しない）
    (auth.jwt() ->> 'user_role')::text = 'teacher'
    OR
    -- または、auth.usersテーブルのraw_user_meta_dataから取得
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'teacher'
  );

-- 3. 管理者ポリシーを修正（profilesテーブルを参照しない）
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  USING (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role')::text = 'admin'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- 4. より確実な方法: 関数を使用してroleを確認
-- まず、roleを取得する関数を作成
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. 関数を使用したポリシー（より確実）
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Teachers can view all student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 関数を使用した教員ポリシー
CREATE POLICY "Teachers can view all student profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
  );

-- 関数を使用した管理者ポリシー
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- 6. INSERTポリシーを確認（これは問題ないはず）
-- 本人は自分のプロフィールをINSERT可能
-- このポリシーは既に存在し、profilesテーブルを参照していないので問題なし

-- 7. 確認: ポリシー一覧を表示
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
