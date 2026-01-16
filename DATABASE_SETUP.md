# データベースセットアップ手順

## 方法1: 手動でSQL Editorに実行（推奨・最も簡単）

### 手順

1. **Supabase Dashboard** にアクセス
   - https://supabase.com/dashboard
   - プロジェクトを選択

2. **SQL Editor** を開く
   - 左メニューから **「SQL Editor」** をクリック

3. **SQLファイルの内容をコピー**
   - `supabase-complete-schema.sql` ファイルを開く
   - 全内容をコピー（Ctrl+A → Ctrl+C）

4. **SQL Editorに貼り付け**
   - SQL Editorのエディタに貼り付け（Ctrl+V）

5. **実行**
   - 右下の **「Run」** ボタンをクリック
   - または `Ctrl+Enter`

6. **結果を確認**
   - 成功メッセージが表示されることを確認
   - Table Editorでテーブルが作成されているか確認

### メリット
- ✅ セットアップ不要
- ✅ 確実に実行できる
- ✅ エラーが発生した場合、すぐに確認できる

---

## 方法2: Supabase CLIを使用（自動化）

### 前提条件
- Supabase CLIがインストールされていること
- プロジェクトがSupabase CLIとリンクされていること

### セットアップ手順

#### 1. Supabase CLIのインストール

**Windows (PowerShell):**
```powershell
# Scoopを使用する場合
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# または、直接ダウンロード
# https://github.com/supabase/cli/releases から最新版をダウンロード
```

**または npm経由:**
```bash
npm install -g supabase
```

#### 2. Supabase CLIでログイン
```bash
supabase login
```
ブラウザが開くので、Supabaseアカウントでログイン

#### 3. プロジェクトをリンク
```bash
supabase link --project-ref <your-project-ref>
```
- `<your-project-ref>` は、Supabase Dashboard → Settings → API の「Project URL」から取得
- 例: `https://abcdefghijklmnop.supabase.co` の場合、`abcdefghijklmnop` がproject-ref

#### 4. SQLファイルを実行
```bash
supabase db push --file supabase-complete-schema.sql
```

または、SQL Editor経由で実行：
```bash
supabase db execute --file supabase-complete-schema.sql
```

### メリット
- ✅ コマンド一つで実行できる
- ✅ バージョン管理しやすい
- ✅ CI/CDに組み込みやすい

### デメリット
- ❌ セットアップが必要
- ❌ プロジェクトとのリンクが必要

---

## 方法3: Supabase REST APIを使用（上級者向け）

SupabaseのREST APIを使用してSQLを実行することも可能ですが、**service_role key**が必要で、セキュリティリスクがあります。通常は推奨されません。

---

## 推奨方法

**現時点では「方法1: 手動でSQL Editorに実行」を推奨します。**

理由：
- セットアップ不要で即座に実行できる
- エラーが発生した場合、すぐに確認・修正できる
- 初回のセットアップでは、手動で確認しながら進める方が安全

Supabase CLIは、以下の場合に有用です：
- マイグレーションを頻繁に実行する場合
- CI/CDパイプラインに組み込む場合
- チーム開発でマイグレーションを共有する場合

---

## トラブルシューティング

### エラー: "relation already exists"
- テーブルが既に存在する場合
- `DROP TABLE IF EXISTS` を実行してから再実行するか、既存のテーブルを確認

### エラー: "permission denied"
- RLSポリシーが正しく設定されていない可能性
- SQLファイルのRLSポリシー部分を確認

### エラー: "foreign key constraint"
- 参照先のテーブルが存在しない可能性
- SQLファイルの実行順序を確認
