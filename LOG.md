## 2026-09-21

### 変更内容

- 認証、チーム管理、アイデア取得、投稿作成、いいね処理をComposableへ分割。
- UIを`AuthPanel`、`TeamPanel`、`IdeaBoard`へ分割し、`App.vue`を全体レイアウトとComposable接続に限定。
- Supabase通信をUIコンポーネントからComposableへ移管。
- 未使用の旧`src/composable/useTeam.js`を削除。
- いいね更新失敗時のロールバック処理を維持。
- 既存のSupabaseテーブル名、カラム名、RPC名、主要なprops/emits契約を維持。

### 対象ファイル

- `src/App.vue`
- `src/composables/useAuth.js`
- `src/composables/useTeams.js`
- `src/composables/useIdeas.js`
- `src/composables/useIdeaForm.js`
- `src/composables/useIdeaLike.js`
- `src/components/AuthPanel.vue`
- `src/components/TeamPanel.vue`
- `src/components/IdeaBoard.vue`
- `src/components/PostForm.vue`
- `src/components/PostCard.vue`
- `src/components/TeamCreateModal.vue`
- `src/composable/useTeam.js`（削除）

### 外部作業

- なし。パッケージ追加やSupabase側の変更はありません。

### 検証

- `npm run lint`: エラーなし（整形に関する警告のみ）。
- `npm run build`: 成功。
- コンポーネント150行以内、Composable/ユーティリティ200行以内を確認。

## 2026-09-21 ログイン画面表示修正

### 変更内容

- `App.vue` でComposableのネストされたrefをテンプレートへ渡す際に`.value`を明示。
- `AuthPanel`、`IdeaBoard`、`TeamPanel`へrefオブジェクトそのものが渡される問題を修正。
- `props.teams.find is not a function` による描画停止を解消し、未ログイン時の案内とDiscordログインボタンを表示可能にした。

### 対象ファイル

- `src/App.vue`
- `LOG.md`

### 外部作業

- なし。

### 検証

- ブラウザで未ログイン画面を確認。
- `npm run lint`: エラーなし（整形に関する警告のみ）。
- `npm run build`: 成功。
- エディタ診断: 対象ファイルにエラーなし。
