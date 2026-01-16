-- ============================================
-- profilesテーブルのRLSポリシー修正
-- Table Editorでデータを確認できるようにする
-- ============================================

-- 既存のポリシーを削除（必要に応じて）
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view all student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 新しいポリシーを作成

-- 1. 本人は自分のプロフィールをSELECT可能
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. 本人は自分のプロフィールをINSERT可能
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. 本人は自分のプロフィールをUPDATE可能
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. 教員は全生徒のプロフィールをSELECT可能
CREATE POLICY "Teachers can view all student profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 5. 管理者は全プロフィールを操作可能
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. 開発用: service_roleでアクセスする場合は全データが見える
-- （これはRLSをバイパスするため、Table Editorでservice_role keyを使用する場合に有効）

-- 注意: Supabase DashboardのTable Editorは、認証されたユーザーとして動作します
-- そのため、RLSポリシーが適用されます。
-- データを確認するには：
-- 1. 再度ログインしてprofilesレコードを作成する
-- 2. または、service_role keyを使用してTable Editorで確認する（非推奨）
