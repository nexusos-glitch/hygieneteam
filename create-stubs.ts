import fs from 'fs';
import path from 'path';

const dirs = [
  'src/components/ui',
  'src/components/subscription',
  'src/components/onboarding',
  'src/components/walkthrough',
  'src/components/Layout',
  'src/hooks',
  'src/pages'
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

const components = {
  'src/components/ui/toaster.tsx': `export const Toaster = () => <div>Toaster</div>;`,
  'src/components/ui/sonner.tsx': `export const Toaster = () => <div>Sonner Toaster</div>;`,
  'src/components/ui/tooltip.tsx': `export const TooltipProvider = ({children}:any) => <>{children}</>;`,
  'src/hooks/useAuth.tsx': `export const AuthProvider = ({children}:any) => <>{children}</>;`,
  'src/components/ProtectedRoute.tsx': `export default function ProtectedRoute({children}:any) { return <>{children}</>; }`,
  'src/components/PublicRoute.tsx': `export default function PublicRoute({children}:any) { return <>{children}</>; }`,
  'src/components/subscription/SubscriptionPaywall.tsx': `export const SubscriptionPaywall = ({children}:any) => <>{children}</>;`,
  'src/components/onboarding/OnboardingProvider.tsx': `export const OnboardingProvider = ({children}:any) => <>{children}</>;`,
  'src/hooks/useWalkthrough.tsx': `export const WalkthroughProvider = ({children}:any) => <>{children}</>;`,
  'src/components/walkthrough/WalkthroughOverlay.tsx': `export const WalkthroughOverlay = () => <div>WalkthroughOverlay</div>;`,
  'src/components/Layout/AppLayout.tsx': `export default function AppLayout({children}:any) { return <div>AppLayout {children}</div>; }`,
};

const pages = [
  'Landing', 'Home', 'Schedule', 'Clients', 'ClientProfile', 'StaffProfile',
  'Staff', 'Jobs', 'Settings', 'Profile', 'Theme', 'Privacy', 'HelpCenter',
  'VisitTracking', 'Invoices', 'AlertHistory', 'Notifications', 'Chat',
  'Auth', 'ResetPassword', 'NotFound', 'Install', 'Subscribe', 'Affiliate',
  'Billing', 'UpdatesAdmin', 'SubscriptionManagement', 'AdminBranding',
  'VisitDetails', 'WhitelabelAdmin', 'ResellerPortal', 'GPSPlayback',
  'GPSSetup', 'ClientPortal', 'Achievements', 'Pricing', 'DataSharing',
  'ImportedData', 'PaymentHistory'
];

for (const p of pages) {
  components["src/pages/" + p + ".tsx"] = "export default function " + p + "() { return <div>" + p + "</div>; }";
}

for (const [file, content] of Object.entries(components)) {
  fs.writeFileSync(file, content);
}

console.log('Stubs created.');
