export const AuthProvider = ({children}:any) => <>{children}</>;
export const useAuth = () => ({ session: null, user: null, signOut: () => {} });