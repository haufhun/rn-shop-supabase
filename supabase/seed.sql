
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
    INSERT INTO category
      (name, image_url, slug)
      VALUES
        ('Electronics', 'https://images.pexels.com/photos/1841841/pexels-photo-1841841.jpeg', 'electronics'),
        ('Books', 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg', 'books'),
        ('Clothing', 'https://images.pexels.com/photos/581087/pexels-photo-581087.jpeg', 'clothing'),
        ('Home & Kitchen', 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg', 'home-kitchen'),
        ('Sports & Outdoors', 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg', 'sports-outdoors');

    INSERT INTO product
      (title, slug, price, hero_image, images_url, category, max_quantity)
      VALUES
        ('Smartphone', 'smartphone', 699, 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg', ARRAY['https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg', 'https://images.pexels.com/photos/1042143/pexels-photo-1042143.jpeg'], 1, 100),
        ('Laptop', 'laptop', 1299, 'https://images.pexels.com/photos/18105/pexels-photo.jpg', ARRAY['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg', 'https://images.pexels.com/photos/7974/pexels-photo.jpg'], 1, 50),
        ('Headphones', 'headphones', 199, 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg', ARRAY['https://images.pexels.com/photos/1591/technology-music-sound-things.jpg', 'https://images.pexels.com/photos/1037999/pexels-photo-1037999.jpeg'], 1, 200),
        ('Fiction Book', 'fiction-book', 19.99, 'https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg', ARRAY['https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg'], 2, 500),
        ('Non-Fiction Book', 'non-fiction-book', 24.99, 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg', ARRAY['https://images.pexels.com/photos/2128249/pexels-photo-2128249.jpeg'], 2, 300);

END $$;