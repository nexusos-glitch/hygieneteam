export function useExchangeRates(currencyCode: string) {
  return {
    data: { rates: {} },
    isLoading: false,
  };
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: any, baseCurrency: string) {
  return amount;
}
