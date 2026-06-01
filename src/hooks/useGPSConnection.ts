export const useGPSConnection = (options: any) => {
  return {
    status: 'connected',
    signalQuality: 'good',
    accuracy: 10,
    errorMessage: null,
    reconnect: () => {}
  };
};
