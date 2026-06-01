import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ThemeOption = "light" | "dark" | "system";

const Theme = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeOption>("system");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeOption | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    const root = document.documentElement;
    if (newTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
    
    toast.success(`Theme changed to ${newTheme}`);
  };

  const themeOptions = [
    { id: "light" as ThemeOption, label: "Light", icon: Sun, description: "Light theme for bright environments" },
    { id: "dark" as ThemeOption, label: "Dark", icon: Moon, description: "Dark theme for low-light environments" },
    { id: "system" as ThemeOption, label: "System", icon: Monitor, description: "Follows your device settings" },
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
          <h2 className="text-2xl font-bold text-foreground">Theme</h2>
          <p className="text-muted-foreground">Customize app appearance</p>
        </div>
      </div>

      {/* Theme Options */}
      <Card className="divide-y divide-border">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.id;
          return (
            <button
              key={option.id}
              onClick={() => applyTheme(option.id)}
              className={`w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors text-left ${
                isSelected ? "bg-primary/10" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </Card>

      {/* Preview */}
      <Card className="p-6 border-border">
        <h3 className="font-semibold text-foreground mb-4">Preview</h3>
        <div className="space-y-3">
          <div className="p-3 bg-primary text-primary-foreground rounded-lg text-sm">
            Primary element
          </div>
          <div className="p-3 bg-secondary text-secondary-foreground rounded-lg text-sm">
            Secondary element
          </div>
          <div className="p-3 bg-muted text-muted-foreground rounded-lg text-sm">
            Muted element
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Theme;
