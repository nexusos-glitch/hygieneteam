export interface WhiteLabelConfig {
  companyName: string;
  companyLogo: string;
  companyTagline: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  features: {
    showScheduling: boolean;
    showInvoicing: boolean;
    showReporting: boolean;
    showTeamManagement: boolean;
  };
}

export const whiteLabelConfig: WhiteLabelConfig = {
  companyName: "Your Company Name",
  companyLogo: "/company-logo.png",
  companyTagline: "Your Tagline",
  primaryColor: "24 100% 50%",
  accentColor: "175 60% 45%",
  contactEmail: "your@email.com",
  contactPhone: "+1 (555) 123-4567",
  website: "https://yourwebsite.com",
  features: {
    showScheduling: true,
    showInvoicing: true,
    showReporting: true,
    showTeamManagement: true,
  },
};
