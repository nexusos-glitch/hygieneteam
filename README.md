# White-Label Configuration Guide

This app is designed to be fully customizable for different service-based companies. Follow this guide to brand it for your business.

## 🎨 Quick Customization

### 1. Company Branding

Edit `src/config/whitelabel.ts` to customize:

```typescript
export const whiteLabelConfig: WhiteLabelConfig = {
  companyName: "Your Company Name",
  companyLogo: "/company-logo.png",
  companyTagline: "Your Tagline",
  primaryColor: "200 85% 45%", // HSL format
  accentColor: "175 60% 45%", // HSL format
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
```

### 2. Color Customization

Colors use HSL format: `hue saturation% lightness%`

**Examples:**
- Blue: `200 85% 45%`
- Green: `142 76% 36%`
- Orange: `25 95% 53%`
- Purple: `280 80% 50%`

Use an [HSL color picker](https://hslpicker.com/) to find your brand colors.

### 3. Logo Setup

1. Place your company logo in the `public` folder
2. Name it `company-logo.png` (or update the path in config)
3. Recommended size: 512x512px PNG with transparency

### 4. Feature Toggles

Control which features appear in your app:

```typescript
features: {
  showScheduling: true,    // Show/hide scheduling page
  showInvoicing: true,     // Show/hide invoicing features
  showReporting: true,     // Show/hide reporting
  showTeamManagement: true, // Show/hide team features
}
```

## 🗄️ Database Setup

This app requires Supabase for backend functionality. To enable:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the provided `schema.sql` to create the following database tables:
   - `clients` - Client directory
   - `jobs` - Service jobs
   - `appointments` - Scheduled appointments
   - `team_members` - Team/technician information
   - `services` - Service catalog

## 📱 Mobile Optimization

The app is mobile-first and responsive. To convert to a native mobile app:

1. Use Capacitor for iOS/Android deployment
2. See Capacitor's official documentation for setup

## 🚀 Deployment

1. Customize your white-label config
2. Add your logo to the public folder
3. Test all features
4. Deploy to your preferred hosting provider (Vercel, Netlify, Cloud Run, etc.)

## 🎯 Next Steps

After basic customization:
- Add authentication for user logins via Supabase Auth
- Connect to your database
- Customize service types for your industry
- Add custom fields specific to your business

## 💡 Pro Tips

- Test on mobile devices to ensure responsiveness
- Use your brand's exact colors for consistency
- Consider your target industry when enabling features
- Keep the interface simple and focused
