-- ============================================
-- テスト用TODOテンプレートデータ
-- ============================================
-- このSQLをSupabase SQL Editorで実行して、テスト用のTODOテンプレートを作成します

-- テンプレート1: 自己分析ワーク
INSERT INTO public.todo_templates (id, category, title, description, sort_order, is_active, input_schema)
VALUES (
  'template-001',
  '自己分析',
  '自己分析ワーク1: 自分の強みを整理する',
  '自分の強みを3つ以上書き出し、それぞれの具体例を挙げてください。',
  1,
  true,
  '[
    {
      "field_key": "strength_1",
      "display_name": "強み1",
      "required": true,
      "type": "text"
    },
    {
      "field_key": "strength_1_example",
      "display_name": "強み1の具体例",
      "required": true,
      "type": "text"
    },
    {
      "field_key": "strength_2",
      "display_name": "強み2",
      "required": true,
      "type": "text"
    },
    {
      "field_key": "strength_2_example",
      "display_name": "強み2の具体例",
      "required": true,
      "type": "text"
    },
    {
      "field_key": "strength_3",
      "display_name": "強み3",
      "required": false,
      "type": "text"
    },
    {
      "field_key": "strength_3_example",
      "display_name": "強み3の具体例",
      "required": false,
      "type": "text"
    }
  ]'::jsonb
);

-- テンプレート2: 志望理由書
INSERT INTO public.todo_templates (id, category, title, description, sort_order, is_active, input_schema)
VALUES (
  'template-002',
  '志望理由',
  '志望理由書の下書き',
  '第一志望校の志望理由を800字程度で書いてください。',
  2,
  true,
  '[
    {
      "field_key": "reason",
      "display_name": "志望理由",
      "required": true,
      "type": "text"
    },
    {
      "field_key": "memo",
      "display_name": "メモ・補足",
      "required": false,
      "type": "text"
    }
  ]'::jsonb
);

-- テンプレート3: 活動記録
INSERT INTO public.todo_templates (id, category, title, description, sort_order, is_active, input_schema)
VALUES (
  'template-003',
  '活動記録',
  '高校生活での主な活動を記録する',
  '高校生活で取り組んだ主な活動を時系列で記録してください。',
  3,
  true,
  '[
    {
      "field_key": "activities",
      "display_name": "活動内容",
      "required": true,
      "type": "text"
    },
    {
      "field_key": "learnings",
      "display_name": "学んだこと・気づき",
      "required": false,
      "type": "text"
    }
  ]'::jsonb
);

-- 確認: 作成されたテンプレートを表示
SELECT id, title, category, sort_order, is_active
FROM public.todo_templates
ORDER BY sort_order;
