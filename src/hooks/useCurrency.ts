export const useCurrency = () => ({ formatCurrency: (v: any) => `$${v}`, currencyCode: 'USD', format: (v: any) => `$${v}` });
export const formatCurrency = (v: any) => `$${v}`;
export const SUPPORTED_CURRENCIES = [{ code: 'USD', symbol: '$' }];
