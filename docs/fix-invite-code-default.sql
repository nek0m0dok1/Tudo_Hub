-- invite_code の DEFAULT 式が文字列として保存されている場合の修正
-- Supabase SQL Editorで実行する。

-- 1. DEFAULT を文字列ではなくSQL式として設定する。
alter table public.teams
  alter column invite_code set default (
    upper(substring(md5(random()::text) from 1 for 8))
  );

-- 2. 誤って保存されたDEFAULT文字列をランダムコードへ置換する。
-- 既存の正しいコードは変更しない。
update public.teams
set invite_code = upper(substring(md5(random()::text) from 1 for 8))
where invite_code in (
  'DEFAULT substring(md5(random()::text) from 1 for 8)',
  'substring(md5(random()::text) from 1 for 8)'
);

-- 3. NULLが残っている場合もコードを付与する。
update public.teams
set invite_code = upper(substring(md5(random()::text) from 1 for 8))
where invite_code is null;

-- 4. 招待コードを一意にする（未作成の場合のみ）。
create unique index if not exists teams_invite_code_key
  on public.teams (invite_code);
