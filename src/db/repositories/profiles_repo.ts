export type Profile = {
  uid: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  trading_mode?: string | null;
};

export async function getProfileByUid(_uid: string): Promise<Profile | null> {
  // TODO: implement with Postgres schema once finalized.
  return null;
}

export async function upsertProfile(_profile: Profile): Promise<Profile> {
  // TODO: implement with Postgres schema once finalized.
  return _profile;
}

