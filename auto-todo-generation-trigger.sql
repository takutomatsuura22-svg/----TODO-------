-- ============================================
-- 新規テンプレート追加時の自動TODO生成トリガー
-- ============================================
-- 
-- このトリガーは、todo_templatesテーブルに新規テンプレートが追加された際に、
-- 対象生徒（grade='高2' かつ role='student' かつ is_active=true）全員に対して
-- 未着手状態（status='not_started'）のTODOを自動生成します。
--
-- 注意: このトリガーはRLSをバイパスするため、SECURITY DEFINER関数を使用します。

-- ============================================
-- 1. トリガー関数の作成
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_generate_student_todos()
RETURNS TRIGGER AS $$
BEGIN
  -- 新規テンプレートが追加され、is_active=trueの場合のみ実行
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    -- 対象生徒（高2、student、is_active=true）全員に未着手TODOを生成
    INSERT INTO public.student_todos (student_id, template_id, status, created_at, updated_at)
    SELECT 
      p.id,
      NEW.id,
      'not_started',
      NOW(),
      NOW()
    FROM public.profiles p
    WHERE p.role = 'student'
      AND p.grade = '高2'
      AND p.is_active = true
      -- 既にTODOが存在する場合はスキップ（UNIQUE制約エラーを防ぐ）
      AND NOT EXISTS (
        SELECT 1 
        FROM public.student_todos st
        WHERE st.student_id = p.id 
          AND st.template_id = NEW.id
      )
    ON CONFLICT (student_id, template_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. トリガーの作成
-- ============================================
-- todo_templatesテーブルにINSERT時にトリガーを実行
DROP TRIGGER IF EXISTS trigger_auto_generate_student_todos ON public.todo_templates;

CREATE TRIGGER trigger_auto_generate_student_todos
  AFTER INSERT ON public.todo_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_student_todos();

-- ============================================
-- 3. 確認用クエリ
-- ============================================
-- トリガーが正しく作成されたか確認
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_generate_student_todos';
