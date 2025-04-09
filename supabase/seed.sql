
DO $$ 
DECLARE 
  first_user_id UUID;
BEGIN
  INSERT INTO
    auth.users (
      email,
      encrypted_password,
      raw_user_meta_data,
      raw_app_meta_data,
      instance_id,
      id,
      aud,
      role,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) (
      select
        'user1@example.com',
        crypt('password123', gen_salt ('bf')),
        '{"email": "user1@example.com", "email_verified": true, "phone_verified": false}',
        '{"provider":"email","providers":["email"]}',
        '00000000-0000-0000-0000-000000000000',
        uuid_generate_v4 (),
        'authenticated',
        'authenticated',
        current_timestamp,
        current_timestamp,
        current_timestamp,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    )
    returning id into first_user_id;

  UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{sub}', to_jsonb(first_user_id))
    WHERE id = first_user_id;

  UPDATE public.users
    SET type = 'ADMIN'
    WHERE id = first_user_id;

  INSERT INTO
    auth.identities (
      id,
      user_id,
      identity_data,
      provider_id,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) (
      select
        uuid_generate_v4 (),
        id,
        format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
        -- provider is email or phone,
        -- the id is the user's id from the auth.users table.
        id,
        'email',
        current_timestamp,
        current_timestamp,
        current_timestamp
      from
        auth.users
    );

END $$;