-- ============================================
-- パフォーマンス最適化用インデックス
-- ============================================
-- 
-- 教員ダッシュボードやその他のクエリのパフォーマンスを向上させるため、
-- 複合インデックスを追加します。

-- ============================================
-- 1. profilesテーブルの複合インデックス
-- ============================================

-- 教員ダッシュボード用：role='student' AND is_active=true のクエリを高速化
CREATE INDEX IF NOT EXISTS idx_profiles_role_is_active 
ON public.profiles(role, is_active) 
WHERE role = 'student' AND is_active = true;

-- 自動TODO生成用：role='student' AND grade='高2' AND is_active=true のクエリを高速化
CREATE INDEX IF NOT EXISTS idx_profiles_role_grade_is_active 
ON public.profiles(role, grade, is_active) 
WHERE role = 'student' AND grade = '高2' AND is_active = true;

-- last_login_atでのソート用
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at 
ON public.profiles(last_login_at DESC NULLS LAST);

-- ============================================
-- 2. student_todosテーブルの複合インデックス
-- ============================================

-- 教員ダッシュボード用：student_idとstatusの複合インデックス
CREATE INDEX IF NOT EXISTS idx_student_todos_student_id_status 
ON public.student_todos(student_id, status);

-- 停滞判定用：student_idとlast_todo_update_atの複合インデックス
CREATE INDEX IF NOT EXISTS idx_student_todos_student_id_last_update 
ON public.student_todos(student_id, last_todo_update_at DESC NULLS LAST);

-- ============================================
-- 3. todo_templatesテーブルのインデックス
-- ============================================

-- アクティブなテンプレート取得用
CREATE INDEX IF NOT EXISTS idx_todo_templates_is_active_sort_order 
ON public.todo_templates(is_active, sort_order) 
WHERE is_active = true;

-- ============================================
-- 4. インデックスの確認
-- ============================================
-- 作成されたインデックスを確認
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'student_todos', 'todo_templates')
ORDER BY tablename, indexname;
