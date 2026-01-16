-- ============================================
-- スタートTODOのエクスポート用SQL
-- ============================================
-- 開発環境のSupabase SQL Editorで実行して、INSERT文を生成します
-- 生成されたINSERT文をコピーして、本番環境で実行してください

-- 22件のスタートTODOをINSERT文形式で出力
SELECT 
  'INSERT INTO public.todo_templates (id, category, title, description, sort_order, is_active, input_schema) VALUES (' ||
  '''' || id || ''', ' ||
  '''' || REPLACE(category, '''', '''''') || ''', ' ||
  '''' || REPLACE(title, '''', '''''') || ''', ' ||
  '''' || REPLACE(description, '''', '''''') || ''', ' ||
  sort_order || ', ' ||
  is_active || ', ' ||
  '''' || REPLACE(input_schema::text, '''', '''''') || '''::jsonb' ||
  ');' as insert_statement
FROM public.todo_templates
WHERE id LIKE 'start-todo-%'
ORDER BY sort_order;
