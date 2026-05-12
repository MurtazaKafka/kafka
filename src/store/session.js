import { create } from 'zustand';
import { supabase } from '../lib/supabase.js';

// single source of truth for the authed user + their profile row.
// pages subscribe via useSession(); auth events update it.

export const useSession = create((set, get) => ({
  loading: true,
  user: null,      // supabase auth user (or null)
  profile: null,   // row from `profiles` table (or null if not set up yet)
  unread: 0,       // unread notifications count

  async init() {
    // phase 1: read the cached session (effectively instant — localStorage).
    // unblock the UI as soon as we know whether there's a user at all.
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user ?? null;
    set({ user, loading: false });

    // phase 2: hydrate profile + unread without blocking. pages render their
    // skeleton state until these resolve.
    if (user) {
      fetchProfile(user.id).then((profile) => set({ profile }));
      fetchUnread(user.id).then((unread) => set({ unread }));
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      set({ user: u, profile: u ? get().profile : null, unread: u ? get().unread : 0, loading: false });
      if (u) {
        fetchProfile(u.id).then((profile) => set({ profile }));
        fetchUnread(u.id).then((unread) => set({ unread }));
      }
    });
  },

  async refreshProfile() {
    const { user } = get();
    if (!user) return;
    set({ profile: await fetchProfile(user.id) });
  },

  async refreshUnread() {
    const { user } = get();
    if (!user) { set({ unread: 0 }); return; }
    set({ unread: await fetchUnread(user.id) });
  },

  async signOut() {
    await supabase.auth.signOut();
    set({ user: null, profile: null, unread: 0 });
  },
}));

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

async function fetchUnread(userId) {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}
