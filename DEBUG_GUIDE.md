# デバッグガイド

## 問題: ログイン後もログイン画面に戻ってしまう

## デバッグ手順

### 1. 開発サーバーを再起動

```bash
npm run dev
```

### 2. ブラウザの開発者ツールを開く

- **Console タブ**: サーバー側のログを確認
- **Application タブ > Cookies**: Cookieが設定されているか確認

### 3. ログインを試行

1. `http://localhost:3000/login` にアクセス
2. 「Googleでログイン」をクリック
3. Google認証を完了

### 4. 確認すべきログ

#### サーバー側のログ（ターミナル）

以下のログが順番に表示されるはずです：

```
[AUTH CALLBACK] Code exchanged successfully
[AUTH CALLBACK] User authenticated: <user-id> <email>
[AUTH CALLBACK] Profile upserted successfully
[AUTH CALLBACK] Redirecting to: /pending Role: null
[AUTH CALLBACK] Cookies set: [ 'sb-...', ... ]
```

その後、リダイレクト先で：

```
[MIDDLEWARE] /pending { hasUser: true, userId: '...', ... }
```

または

```
[LOGIN PAGE] User check: { hasUser: false, ... }
```

### 5. Cookieの確認

**ブラウザの開発者ツール > Application > Cookies > http://localhost:3000**

以下のCookieが設定されているか確認：

- `sb-<project-ref>-auth-token` - セッショントークン
- その他のSupabase関連のCookie

**Cookieが設定されていない場合**:
- `app/auth/callback/route.ts` のCookie設定に問題がある可能性

**Cookieは設定されているが、セッションが取得できない場合**:
- `middleware.ts` または `lib/supabase/server.ts` に問題がある可能性

### 6. よくある問題と対処法

#### 問題1: Cookieが設定されていない

**症状**: Application > Cookies にSupabaseのCookieがない

**原因**: 
- `app/auth/callback/route.ts` のCookie設定が正しく動作していない
- SameSite属性の問題

**対処法**:
- ブラウザのCookie設定を確認
- プライベートモード/シークレットモードを試す
- 別のブラウザで試す

#### 問題2: Cookieは設定されているが、セッションが取得できない

**症状**: Cookieはあるが、`[LOGIN PAGE] User check: { hasUser: false }` と表示される

**原因**:
- `middleware.ts` が正しく動作していない
- Cookieの読み取りに問題がある

**対処法**:
- `middleware.ts` のログを確認
- Cookieの名前が正しいか確認

#### 問題3: 無限リダイレクトループ

**症状**: `/login` と `/pending` の間でリダイレクトが繰り返される

**原因**:
- セッションは取得できているが、roleの判定に問題がある

**対処法**:
- `[LOGIN PAGE] Profile check` のログを確認
- Supabase Dashboardでprofilesテーブルを確認

## 次のステップ

ログを確認したら、以下の情報を共有してください：

1. **サーバー側のログ**（ターミナルの出力）
2. **ブラウザのConsoleログ**（エラーがあれば）
3. **Cookieの状態**（Application > Cookies のスクリーンショット）
4. **どの段階で問題が発生しているか**

これらの情報があれば、より具体的な修正ができます。
