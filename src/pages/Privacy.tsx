import { ArrowLeft, Eye, MapPin, Bell, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

const Privacy = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    shareLocation: true,
    activityStatus: true,
    profileVisibility: true,
    dataCollection: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => {
      const newValue = !prev[key];
      toast.success(`Setting ${newValue ? 'enabled' : 'disabled'}`);
      return { ...prev, [key]: newValue };
    });
  };

  const privacyOptions = [
    {
      id: "shareLocation" as const,
      icon: MapPin,
      label: "Share Location",
      description: "Allow GPS tracking during visits",
    },
    {
      id: "activityStatus" as const,
      icon: Eye,
      label: "Activity Status",
      description: "Show when you're active to team members",
    },
    {
      id: "profileVisibility" as const,
      icon: Shield,
      label: "Profile Visibility",
      description: "Allow other staff to view your profile",
    },
    {
      id: "dataCollection" as const,
      icon: Bell,
      label: "Analytics",
      description: "Help improve the app with usage data",
    },
  ];

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/settings")}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Privacy</h2>
          <p className="text-muted-foreground">Manage your privacy settings</p>
        </div>
      </div>

      {/* Privacy Options */}
      <Card className="divide-y divide-border">
        {privacyOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.id}
              className="p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <Switch
                checked={settings[option.id]}
                onCheckedChange={() => handleToggle(option.id)}
              />
            </div>
          );
        })}
      </Card>

      {/* Data Management */}
      <Card className="p-6 space-y-4 border-border">
        <h3 className="font-semibold text-foreground">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Your data is stored securely and encrypted. You have full control over your information.
        </p>
        <div className="space-y-2">
          <button className="w-full p-3 text-left text-sm text-foreground hover:bg-secondary rounded-lg transition-colors">
            Download my data
          </button>
          <button className="w-full p-3 text-left text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
            Delete my account
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Privacy;
