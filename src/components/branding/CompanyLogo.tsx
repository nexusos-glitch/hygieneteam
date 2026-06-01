import { useBrandingSettings } from "@/hooks/useBrandingSettings";
import { cn } from "@/lib/utils";

interface BootstrapLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const logoSizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export function BootstrapLogo({
  size = "md",
  className,
  showText = true,
}: BootstrapLogoProps) {
  const { data: settings, isLoading } = useBrandingSettings();

  const companyName = settings?.company_name || "Service Pro";
  const logoUrl = settings?.company_logo_url;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(companyName);

  if (isLoading) {
    return (
      <div
        className={cn(
          logoSizes[size],
          "animate-pulse rounded-lg bg-muted",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${companyName} logo`}
          className={cn(
            logoSizes[size],
            "rounded-lg object-cover"
          )}
        />
      ) : (
        <div
          className={cn(
            logoSizes[size],
            textSizes[size],
            "flex items-center justify-center rounded-lg font-bold text-primary-foreground bg-primary"
          )}
          style={{
            backgroundColor: settings?.primary_color
              ? `hsl(${settings.primary_color})`
              : undefined,
          }}
        >
          {initials}
        </div>
      )}

      {showText && (
        <span
          className={cn(
            textSizes[size],
            "font-semibold text-foreground truncate"
          )}
        >
          {companyName}
        </span>
      )}
    </div>
  );
}