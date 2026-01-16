-- ============================================
-- profilesテーブルのINSERTテスト
-- ============================================

-- 1. 現在のRLSポリシーを確認
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- 2. テーブル構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. 制約を確認
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- 4. テスト用: 直接INSERTを試行（これは失敗する可能性があります）
-- 注意: auth.usersに存在するユーザーIDが必要です
-- Authentication > Users からユーザーIDを取得してください

-- 例: ユーザーIDが '123e4567-e89b-12d3-a456-426614174000' の場合
-- INSERT INTO public.profiles (id, email, name, is_active)
-- VALUES ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', 'Test User', true);
