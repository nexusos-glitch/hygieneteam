export const supabase = {
  from: (table: string) => ({
    select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
    delete: () => ({ eq: () => ({}) })
  }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  removeChannel: () => {}
};
