-- ============================================
-- profilesテーブルのデータ確認用SQL
-- ============================================

-- 1. RLSを一時的に無効化してデータを確認（管理者のみ実行可能）
-- 注意: これはservice_role keyで実行する必要があります
-- または、Supabase DashboardのTable Editorで直接確認してください

-- 2. 現在のRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- 3. テーブルの行数を確認（RLSを考慮）
SELECT COUNT(*) as total_rows FROM public.profiles;

-- 4. 認証ユーザーから見えるデータを確認
-- （これは認証済みユーザーとして実行する必要があります）
-- SELECT * FROM public.profiles;
