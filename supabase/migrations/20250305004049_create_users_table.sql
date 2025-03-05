create table users (
  id uuid primary key references auth.users(id) not null,
  email text unique not null,
  type text default 'USER' check(
    type in ('USER', 'ADMIN')
  ),
  avatar_url text not null,
  created_at timestamp default current_timestamp
);

create or replace function public.handle_new_user() returns trigger as $$
  begin
    if new.raw_user_meta_data->>'avatar_url' is null or new.raw_user_meta_data->>'avatar_url' = '' then
      new.raw_user_meta_data = jsonb_set(new.raw_user_meta_data, '{avatar_url}', to_jsonb('https://api.adorable.io/avatars/285/' || new.email || '.png'));
    end if;
    insert into public.users(id, email, avatar_url)
    values (new.id, new.email, new.raw_user_meta_data->>'avatar_url');
    return new;
  end;
$$ language plpgsql security definer;


create or replace trigger on_auth_user_created
  after insert on auth.users for each row
  execute procedure public.handle_new_user();