export const useDataSharing = () => {
  return {
    configs: [],
    configsLoading: false,
    syncLogs: [],
    logsLoading: false,
    createConfig: { mutateAsync: async () => {}, isPending: false },
    updateConfig: { mutateAsync: async () => {}, mutate: () => {}, isPending: false },
    deleteConfig: { mutate: () => {} },
    triggerSync: () => {},
    isSyncing: null,
    regenerateToken: { mutate: () => {}, isPending: false }
  };
};
