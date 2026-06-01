import { ChevronRight, User, Shield, Palette, HelpCircle, LogOut, Download, Sparkles, CreditCard, Receipt, Building2, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { RevenueAlertsSettings } from "@/components/settings/RevenueAlertsSettings";
import RoleManagement from "@/components/settings/RoleManagement";
import StaffInvitations from "@/components/settings/StaffInvitations";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { AdminBootstrapToken } from "@/components/admin/AdminBootstrapToken";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useBrandingSettings } from "@/hooks/useBrandingSettings";
import { Badge } from "@/components/ui/badge";
import AdminOnly from "@/components/AdminOnly";

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { role, isAdmin } = useRole();
  const { subscriptionEnabled } = useAppSettings();
  const { data: brandingSettings } = useBrandingSettings();

  const companyName = brandingSettings?.company_name || "ServicePro";

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", description: "Update your information", path: "/profile" },
        ...(subscriptionEnabled ? [{ icon: Receipt, label: "Billing History", description: "View invoices and payments", path: "/billing" }] : []),
      ],
    },
    {
      title: "App Settings",
      items: [
        { icon: Palette, label: "Theme", description: "Customize app appearance", path: "/theme" },
        { icon: Shield, label: "Privacy", description: "Manage your privacy settings", path: "/privacy" },
        { icon: Download, label: "Install App", description: "Add to your home screen", path: "/install" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "Get help and support", path: "/help" },
      ],
    },
    {
      title: "Reseller",
      items: [
        { icon: Building2, label: "Reseller Portal", description: "Track deployments and commissions", path: "/reseller" },
      ],
    },
  ];

  const adminSections = [
    {
      title: "Admin",
      items: [
        { icon: Building2, label: "Business Branding", description: "Customize company appearance", path: "/admin/branding" },
        { icon: Globe, label: "White-Label Manager", description: "Manage deployments and resellers", path: "/admin/whitelabel" },
        { icon: Sparkles, label: "Manage Updates", description: "Create and publish app updates", path: "/admin/updates" },
        ...(subscriptionEnabled ? [{ icon: CreditCard, label: "Subscription Management", description: "View user subscriptions", path: "/admin/subscriptions" }] : []),
      ],
    },
  ];

  return (
    <div className="p-4 space-y-6 pb-20" data-walkthrough="settings-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      {/* Profile Card */}
      <Card 
        className="p-6 border-border cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => navigate("/profile")}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-2xl">
              {user?.email?.charAt(0).toUpperCase() || companyName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">
              {user?.email || companyName}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                {role || 'staff'}
              </Badge>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Card>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {section.title}
          </h3>
          <Card className="divide-y divide-border">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <button
                  key={itemIndex}
                  onClick={() => navigate(item.path)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </Card>
        </div>
      ))}

      {/* Admin Sections */}
      {isAdmin && adminSections.map((section, sectionIndex) => (
        <div key={`admin-${sectionIndex}`} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {section.title}
          </h3>
          <Card className="divide-y divide-border">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <button
                  key={itemIndex}
                  onClick={() => navigate(item.path)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </Card>
        </div>
      ))}

      {/* Admin Bootstrap Token (Admin only) */}
      <AdminOnly>
        <AdminBootstrapToken />
      </AdminOnly>

      {/* Subscription Settings (Admin only) */}
      <AdminOnly>
        <SubscriptionSettings />
      </AdminOnly>

      {/* Notification Preferences (Admin only) */}
      <AdminOnly>
        <NotificationPreferences />
      </AdminOnly>

      {/* Revenue Alerts */}
      <RevenueAlertsSettings />

      {/* Staff Invitations (Admin only) */}
      <StaffInvitations />

      {/* Role Management (Admin only can manage) */}
      <RoleManagement />

      {/* Company Info */}
      <Card className="p-6 space-y-4 border-border">
        <h3 className="font-semibold text-foreground">Company Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span className="text-foreground font-medium">
              {brandingSettings?.contact_phone || "+1 (555) 123-4567"}
            </span>
          </div>
          {brandingSettings?.website && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Website:</span>
              <a
                href={brandingSettings.website}
                className="text-primary font-medium hover:underline"
              >
                Visit
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Logout Button */}
      <button 
        onClick={signOut}
        className="w-full p-4 bg-destructive/10 text-destructive rounded-xl font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground">
        Version 1.0.0 • © 2025 {companyName}
      </p>
    </div>
  );
};

export default Settings;
