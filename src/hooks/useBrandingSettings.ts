export const useBrandingSettings = () => { return { data: null, isLoading: false }; };
export const useUpdateBrandingSettings = () => ({ mutate: () => {}, isPending: false });
export const applyBrandingToDocument = (settings: any) => {};
export interface BrandingSettings { primary_color?: string; secondary_color?: string; }
