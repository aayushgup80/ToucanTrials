-- ============================================================
-- TOUCANTRIALS - 24 HOUR COIN COLLECTION SYSTEM
-- ============================================================

create table if not exists public.coin_collections (
    user_id uuid not null references auth.users(id) on delete cascade,
    level_id text not null,
    coin_id text not null,
    collected_at timestamptz not null default now(),

    primary key (user_id, level_id, coin_id)
);


create index if not exists coin_collections_user_level_time_idx
on public.coin_collections
(user_id, level_id, collected_at desc);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.coin_collections
enable row level security;


drop policy if exists "Users can read their own coin collections"
on public.coin_collections;


create policy "Users can read their own coin collections"
on public.coin_collections
for select
to authenticated
using (
    auth.uid() = user_id
);


-- ============================================================
-- COLLECT COIN FUNCTION
-- ============================================================

create or replace function public.collect_coin(
    p_level_id text,
    p_coin_id text
)
returns table (
    collected boolean,
    next_respawn_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_last_collected timestamptz;
    v_now timestamptz := now();

begin

    if v_user_id is null then
        raise exception 'Authentication required';
    end if;


    -- Find the last time this exact coin
    -- was collected by this account.

    select cc.collected_at
    into v_last_collected

    from public.coin_collections cc

    where cc.user_id = v_user_id
      and cc.level_id = p_level_id
      and cc.coin_id = p_coin_id;


    -- Still on cooldown?
    -- 24 hours have not passed.

    if v_last_collected is not null
       and v_last_collected >
           v_now - interval '24 hours'
    then

        return query
        select
            false,
            v_last_collected + interval '24 hours';

        return;

    end if;


    -- New collection OR expired collection.

    insert into public.coin_collections (
        user_id,
        level_id,
        coin_id,
        collected_at
    )

    values (
        v_user_id,
        p_level_id,
        p_coin_id,
        v_now
    )

    on conflict (
        user_id,
        level_id,
        coin_id
    )

    do update set
        collected_at = excluded.collected_at;


    -- Add exactly ONE coin to lifetime balance.

    update public.profiles

    set
        total_coins =
            coalesce(total_coins, 0) + 1,

        updated_at = v_now

    where id = v_user_id;


    return query
    select
        true,
        v_now + interval '24 hours';

end;
$$;


-- ============================================================
-- FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function public.collect_coin(text, text)
from public;


grant execute
on function public.collect_coin(text, text)
to authenticated;