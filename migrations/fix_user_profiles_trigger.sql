-- Fix trigger to handle all OAuth providers correctly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_nickname TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extract nickname from OAuth metadata
  v_nickname := COALESCE(
    NEW.raw_user_meta_data->>'nickname',      -- Generic OAuth
    NEW.raw_user_meta_data->>'name',           -- Google
    NEW.raw_user_meta_data->>'full_name',      -- Some providers
    NEW.raw_user_meta_data->>'user_name',      -- Alternative
    NEW.raw_user_meta_data->>'login',          -- GitHub
    NEW.email,
    'User'
  );

  -- Extract avatar URL from OAuth metadata
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',     -- Generic
    NEW.raw_user_meta_data->>'picture',        -- Google
    NEW.raw_user_meta_data->>'avatar',         -- Some providers
    ''
  );

  INSERT INTO user_profiles (id, nickname, avatar_url)
  VALUES (NEW.id, v_nickname, v_avatar_url)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fix any existing users without profiles
INSERT INTO user_profiles (id, nickname, avatar_url)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'nickname',
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    u.email,
    'User'
  ),
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    u.raw_user_meta_data->>'avatar',
    ''
  )
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
