# 招待コードによるチームアクセス要件

## 目的

招待コードで `team_members` に参加登録されたユーザーだけが、対象チームの投稿を閲覧・作成できるようにする。

## フロントエンド実装

`src/App.vue` は次の動作を行う。

- チーム作成時に8文字の招待コードを生成し、`teams.invite_code`へ保存する
- 招待コードで`teams`を検索する
- コードに一致するチームへ、現在のユーザーを`team_members`として登録する
- チーム一覧は現在のユーザーの`team_members`にある`team_id`だけ取得する
- 投稿一覧は選択された所属チームの`ideas`だけ取得する
- `PostForm`は所属チームの`selectedTeamId`に対してだけ表示する

## DB変更

`teams`に招待コードを追加する。既存データには重複しないコードを設定してからNOT NULL化する。

```sql
alter table public.teams add column if not exists invite_code text;
create unique index if not exists teams_invite_code_key
  on public.teams (invite_code);
```

`team_members`には同じユーザーの重複参加を防ぐ一意制約が必要。

```sql
create unique index if not exists team_members_team_user_key
  on public.team_members (team_id, user_id);
```

## RLS要件

UIの制御だけでは不十分なため、次のRLSをSupabase側に設定する。

- `ideas`のSELECT: `team_id`のチームに現在ユーザーが所属している場合だけ許可
- `ideas`のINSERT: `team_id`のチームに現在ユーザーが所属し、`user_id = auth.uid()`の場合だけ許可
- `team_members`のINSERT: 招待コードで解決したチームへの参加を許可する
- `team_members`のSELECT: 自分の所属行を参照できる
- `teams`の招待コード検索: 招待コードによる参加処理に必要な最小限のSELECTだけ許可

`team_members`のRLSポリシーから`team_members`自身を直接SELECTしてはいけない。自己参照は `infinite recursion detected in policy for relation "team_members"` を起こすため、所属確認は`SECURITY DEFINER`関数へ切り出す。

例:

```sql
create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = target_team_id
      and user_id = auth.uid()
  );
$$;
```

`ideas`のポリシーでは、次のように関数を使う。

```sql
create policy "Members can read team ideas"
on public.ideas
for select
to authenticated
using (public.is_team_member(team_id));

create policy "Members can create team ideas"
on public.ideas
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_team_member(team_id)
);
```

既存ポリシーと重複する場合は、先に既存ポリシーを確認してから置き換える。RLSを無効化したり、`service_role`キーをブラウザで使用したりしてはいけない。

## 確認項目

- 招待コードなしのユーザーにはチームが一覧表示されない
- 正しい招待コードで参加するとチームが一覧に追加される
- 未所属ユーザーが対象チームの`ideas`をSELECTできない
- 未所属ユーザーが対象チームへ`ideas`をINSERTできない
- 参加済みユーザーは投稿を閲覧・作成できる
- 同じコードで再参加しても`team_members`が重複しない
- `team_members`のRLS無限再帰エラーが発生しない
