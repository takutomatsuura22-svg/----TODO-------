-- ============================================
-- profilesテーブルのINSERT問題を修正
-- ============================================

-- 1. 既存のRLSポリシーを確認
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- 2. INSERTポリシーを確認・修正
-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 新しいINSERTポリシーを作成（より寛容に）
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    auth.uid() IS NOT NULL
  );

-- 3. テーブルの制約を確認
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- 4. emailカラムのNOT NULL制約を確認
-- もし問題があれば、一時的にNULLを許可する（開発用）
-- ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
-- 注意: 本番環境では元に戻してください

-- 5. テスト用: 直接INSERTを試行
-- Authentication > Users からユーザーIDを取得して実行
-- INSERT INTO public.profiles (id, email, name, is_active)
-- VALUES ('ユーザーID', 'takuto.matsuura22@gmail.com', 'Test User', true)
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   name = EXCLUDED.name,
--   updated_at = NOW();
