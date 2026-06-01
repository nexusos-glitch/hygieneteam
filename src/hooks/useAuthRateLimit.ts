export const useAuthRateLimit = () => {
  return {
    isLocked: () => false,
    getRemainingLockoutTime: () => 0,
    getRemainingAttempts: () => 5,
    recordAttempt: () => {},
    formatRemainingTime: () => '0s',
    maxAttempts: 5
  };
};
