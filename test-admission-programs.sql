-- ============================================
-- テスト用志望校マスタデータ
-- ============================================
-- このSQLをSupabase SQL Editorで実行して、テスト用の志望校マスタを作成します

-- 志望校プログラムを追加
INSERT INTO public.admission_programs (
  university_name,
  faculty_name,
  department_name,
  admission_method
) VALUES
  ('東京大学', '文学部', '日本文学科', '総合型選抜'),
  ('東京大学', '経済学部', '経済学科', '総合型選抜'),
  ('京都大学', '工学部', '情報工学科', '総合型選抜'),
  ('早稲田大学', '文学部', '日本文学科', '総合型選抜'),
  ('慶應義塾大学', '経済学部', '経済学科', '総合型選抜'),
  ('一橋大学', '商学部', '商学科', '総合型選抜')
ON CONFLICT (university_name, faculty_name, department_name, admission_method) DO NOTHING;

-- 各志望校のスケジュールを追加
-- 東京大学 文学部 日本文学科
INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'application_must_arrive',
  '2025-01-15'::DATE,
  '出願（必着）'
FROM public.admission_programs ap
WHERE ap.university_name = '東京大学'
  AND ap.faculty_name = '文学部'
  AND ap.department_name = '日本文学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'first_exam',
  '2025-02-10'::DATE,
  '1次試験'
FROM public.admission_programs ap
WHERE ap.university_name = '東京大学'
  AND ap.faculty_name = '文学部'
  AND ap.department_name = '日本文学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

-- 東京大学 経済学部 経済学科
INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'application_must_arrive',
  '2025-01-20'::DATE,
  '出願（必着）'
FROM public.admission_programs ap
WHERE ap.university_name = '東京大学'
  AND ap.faculty_name = '経済学部'
  AND ap.department_name = '経済学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'first_exam',
  '2025-02-15'::DATE,
  '1次試験'
FROM public.admission_programs ap
WHERE ap.university_name = '東京大学'
  AND ap.faculty_name = '経済学部'
  AND ap.department_name = '経済学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

-- 京都大学 工学部 情報工学科
INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'application_must_arrive',
  '2025-01-25'::DATE,
  '出願（必着）'
FROM public.admission_programs ap
WHERE ap.university_name = '京都大学'
  AND ap.faculty_name = '工学部'
  AND ap.department_name = '情報工学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'first_exam',
  '2025-02-20'::DATE,
  '1次試験'
FROM public.admission_programs ap
WHERE ap.university_name = '京都大学'
  AND ap.faculty_name = '工学部'
  AND ap.department_name = '情報工学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

-- 早稲田大学 文学部 日本文学科
INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'application_must_arrive',
  '2025-01-30'::DATE,
  '出願（必着）'
FROM public.admission_programs ap
WHERE ap.university_name = '早稲田大学'
  AND ap.faculty_name = '文学部'
  AND ap.department_name = '日本文学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

INSERT INTO public.admission_schedules (
  program_id,
  schedule_type,
  schedule_date,
  description
)
SELECT 
  ap.id,
  'first_exam',
  '2025-02-25'::DATE,
  '1次試験'
FROM public.admission_programs ap
WHERE ap.university_name = '早稲田大学'
  AND ap.faculty_name = '文学部'
  AND ap.department_name = '日本文学科'
  AND ap.admission_method = '総合型選抜'
ON CONFLICT DO NOTHING;

-- 確認: 作成された志望校マスタを表示
SELECT 
  ap.id,
  ap.university_name,
  ap.faculty_name,
  ap.department_name,
  ap.admission_method,
  COUNT(asch.id) as schedule_count
FROM public.admission_programs ap
LEFT JOIN public.admission_schedules asch ON ap.id = asch.program_id
GROUP BY ap.id, ap.university_name, ap.faculty_name, ap.department_name, ap.admission_method
ORDER BY ap.university_name, ap.faculty_name;

-- 完了メッセージ
SELECT 'Test admission programs created successfully!' AS message;
