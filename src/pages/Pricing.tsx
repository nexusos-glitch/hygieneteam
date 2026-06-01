import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft, Server, Code, Building2, Headphones, Shield, Zap, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import serviceProLogo from "@/assets/service-pro-logo.png";
import { useAuth } from "@/hooks/useAuth";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePlanAction = (tierId: string) => {
    if (tierId === 'lease') {
      navigate(user ? '/subscribe?plan=lease' : '/auth');
    } else if (tierId === 'purchase') {
      navigate(user ? '/subscribe?plan=pro' : '/auth');
    } else {
      // Enterprise - contact sales
      navigate('/auth');
    }
  };

  const pricingTiers = [
    {
      id: "lease",
      name: "Lease",
      price: "$299",
      period: "/month",
      description: "Hosted solution with updates and support",
      icon: Server,
      popular: true,
      cta: "Start 14-Day Trial",
      features: [
        { name: "Fully hosted on our infrastructure", included: true },
        { name: "Automatic updates and maintenance", included: true },
        { name: "Custom branding included", included: true },
        { name: "Email and chat support", included: true },
        { name: "Up to 50 staff users", included: true },
        { name: "Unlimited clients and visits", included: true },
        { name: "SSL certificate included", included: true },
        { name: "Daily backups", included: true },
        { name: "Source code access", included: false },
        { name: "Custom feature development", included: false },
        { name: "On-premise deployment", included: false },
      ],
      details: {
        hosting: "Cloud-hosted on enterprise-grade servers with 99.9% uptime SLA",
        support: "Email and live chat support during business hours (Mon-Fri, 9am-5pm NZST)",
        updates: "Automatic updates deployed monthly with zero downtime",
        scaling: "Auto-scaling infrastructure handles traffic spikes seamlessly",
        security: "Enterprise-grade security with SSL, encryption at rest, and regular audits",
        backup: "Daily automated backups with 30-day retention period",
      },
    },
    {
      id: "purchase",
      name: "Purchase",
      price: "$4,999",
      period: " one-time",
      description: "Own the software forever with source code",
      icon: Code,
      popular: false,
      cta: "Get Started",
      features: [
        { name: "Full source code access", included: true },
        { name: "Self-hosted on your servers", included: true },
        { name: "Unlimited users forever", included: true },
        { name: "1 year of updates included", included: true },
        { name: "White-label documentation", included: true },
        { name: "Deployment assistance", included: true },
        { name: "Priority email support", included: true },
        { name: "Resell rights available", included: true },
        { name: "Custom feature development", included: false },
        { name: "Dedicated account manager", included: false },
        { name: "24/7 phone support", included: false },
      ],
      details: {
        ownership: "Full ownership of the source code with no recurring fees",
        hosting: "Deploy on your own infrastructure (AWS, DigitalOcean, Hetzner, etc.)",
        support: "Priority email support with 24-hour response time guarantee",
        updates: "1 year of updates included, optional renewal at $999/year",
        customization: "Full access to modify and customize the codebase",
        reselling: "Rights to resell the platform under your own brand",
      },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Custom solutions for larger organizations",
      icon: Building2,
      popular: false,
      cta: "Contact Sales",
      features: [
        { name: "Multiple brand deployments", included: true },
        { name: "Custom feature development", included: true },
        { name: "API integrations", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "SLA guarantees", included: true },
        { name: "On-premise deployment option", included: true },
        { name: "Training and onboarding", included: true },
        { name: "24/7 phone support", included: true },
        { name: "Custom contracts", included: true },
        { name: "Volume licensing", included: true },
        { name: "White-glove migration", included: true },
      ],
      details: {
        deployments: "Deploy unlimited branded instances across your organization",
        development: "Custom feature development with dedicated engineering resources",
        integrations: "Deep API integrations with your existing systems (ERP, CRM, etc.)",
        support: "Dedicated account manager and 24/7 phone support",
        sla: "Custom SLA with guaranteed uptime and response times",
        onboarding: "Comprehensive training and white-glove migration assistance",
      },
    },
  ];

  const faqs = {
    general: [
      {
        question: "What's the difference between Lease and Purchase?",
        answer: "Lease is a hosted solution where we manage everything for you - servers, updates, backups, and maintenance. You pay monthly and get automatic updates. Purchase gives you the complete source code to host on your own infrastructure. It's a one-time payment with no recurring fees (except optional update renewals).",
      },
      {
        question: "Can I switch from Lease to Purchase later?",
        answer: "Yes! If you start with Lease and decide you want to own the software, you can upgrade to Purchase at any time. We'll credit up to 6 months of your Lease payments toward the Purchase price.",
      },
      {
        question: "Is there a trial period?",
        answer: "Yes, the Lease plan includes a 14-day free trial. You can explore all features and set up your branding before committing. No credit card required to start.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express), bank transfers for annual payments, and can arrange invoicing for Enterprise customers.",
      },
    ],
    lease: [
      {
        question: "What happens if I cancel my Lease subscription?",
        answer: "You can cancel anytime. Your data will be available for export for 30 days after cancellation. After that, it's permanently deleted from our servers.",
      },
      {
        question: "Can I exceed the 50 staff user limit?",
        answer: "Yes, additional staff users can be added at $5/user/month. Or consider the Enterprise plan for unlimited users with volume discounts.",
      },
      {
        question: "How often are updates released?",
        answer: "We release updates monthly with new features, improvements, and security patches. All updates are deployed automatically with zero downtime during off-peak hours.",
      },
      {
        question: "Where is my data hosted?",
        answer: "Your data is hosted on enterprise-grade servers in New Zealand with automatic failover. We also offer Australian and US hosting options for Enterprise customers.",
      },
    ],
    purchase: [
      {
        question: "What technology stack is the software built on?",
        answer: "The platform is built with React, TypeScript, Tailwind CSS, and Supabase (PostgreSQL database with real-time capabilities). It's designed for easy deployment and customization.",
      },
      {
        question: "Do I need technical expertise to self-host?",
        answer: "Basic familiarity with web deployment is helpful. We provide detailed documentation and deployment scripts. Our team also offers deployment assistance as part of the package.",
      },
      {
        question: "What's included in the 1-year update subscription?",
        answer: "You get all feature updates, security patches, and bug fixes released during your subscription period. After the first year, you can renew for $999/year or continue using your current version.",
      },
      {
        question: "Can I modify the source code?",
        answer: "Absolutely! You have full rights to modify, extend, and customize the codebase. The only restriction is you cannot resell the unmodified software as a competing product.",
      },
    ],
    enterprise: [
      {
        question: "How does multi-brand deployment work?",
        answer: "Each deployment is completely isolated with its own database, branding, and user base. You can manage all deployments from a central admin dashboard.",
      },
      {
        question: "What kind of custom features can you develop?",
        answer: "We can build any feature that fits within the platform's architecture - custom integrations, specialized workflows, unique reporting, mobile app extensions, and more.",
      },
      {
        question: "What SLA guarantees are available?",
        answer: "We offer 99.9% uptime SLAs with financial credits for any downtime. Response time guarantees range from 1-hour for critical issues to 24-hours for general inquiries.",
      },
      {
        question: "Is on-premise deployment really an option?",
        answer: "Yes, for organizations with strict data residency requirements, we can deploy the entire platform on your own infrastructure with full support and maintenance.",
      },
    ],
  };

  const comparisonFeatures = [
    { name: "Users", lease: "Up to 50", purchase: "Unlimited", enterprise: "Unlimited" },
    { name: "Clients & Visits", lease: "Unlimited", purchase: "Unlimited", enterprise: "Unlimited" },
    { name: "Custom Branding", lease: "✓", purchase: "✓", enterprise: "✓" },
    { name: "GPS Tracking", lease: "✓", purchase: "✓", enterprise: "✓" },
    { name: "Photo Documentation", lease: "✓", purchase: "✓", enterprise: "✓" },
    { name: "Automated Invoicing", lease: "✓", purchase: "✓", enterprise: "✓" },
    { name: "Team Chat", lease: "✓", purchase: "✓", enterprise: "✓" },
    { name: "Client Portal", lease: "✓", purchase: "✓", enterprise: "✓" },
    { name: "Source Code Access", lease: "✗", purchase: "✓", enterprise: "✓" },
    { name: "Self-Hosting", lease: "✗", purchase: "✓", enterprise: "✓" },
    { name: "Custom Development", lease: "✗", purchase: "✗", enterprise: "✓" },
    { name: "API Integrations", lease: "Basic", purchase: "Full", enterprise: "Custom" },
    { name: "Support", lease: "Email & Chat", purchase: "Priority Email", enterprise: "24/7 Phone" },
    { name: "SLA Guarantee", lease: "99.5%", purchase: "Self-managed", enterprise: "99.9%" },
    { name: "Backups", lease: "Daily", purchase: "Self-managed", enterprise: "Real-time" },
  ];

  return (
    <>
      <SEO
        title="Pricing - Service Pro White-Label Platform"
        description="Choose the perfect plan for your service business. Lease our hosted solution or purchase the platform outright. Flexible pricing for every business size."
        keywords="service management pricing, white-label software pricing, field service pricing, lease vs purchase software"
        ogTitle="Service Pro Pricing - Flexible Plans for NZ Service Businesses"
        ogDescription="Lease from $299/month or purchase for $4,999. GPS tracking, automated invoicing, team management. 14-day free trial available."
        ogUrl="https://servicepro.hygieneteam.nz/pricing"
        ogType="website"
        twitterCard="summary_large_image"
        canonicalUrl="https://servicepro.hygieneteam.nz/pricing"
      />
      
      {/* Pricing Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Service Pro Pricing",
          "description": "Choose the perfect plan for your service business. Lease or purchase options available.",
          "url": "https://servicepro.hygieneteam.nz/pricing",
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "Product",
                "position": 1,
                "name": "Service Pro Lease",
                "description": "Hosted solution with updates and support. Fully managed cloud hosting with automatic updates, custom branding, and email/chat support.",
                "brand": {
                  "@type": "Brand",
                  "name": "Service Pro"
                },
                "offers": {
                  "@type": "Offer",
                  "price": "299",
                  "priceCurrency": "NZD",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "url": "https://servicepro.hygieneteam.nz/subscribe?plan=lease",
                  "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": "299",
                    "priceCurrency": "NZD",
                    "billingDuration": "P1M",
                    "unitText": "month"
                  }
                }
              },
              {
                "@type": "Product",
                "position": 2,
                "name": "Service Pro Purchase",
                "description": "Own the software forever with full source code access. Self-hosted on your servers with unlimited users and 1 year of updates included.",
                "brand": {
                  "@type": "Brand",
                  "name": "Service Pro"
                },
                "offers": {
                  "@type": "Offer",
                  "price": "4999",
                  "priceCurrency": "NZD",
                  "priceValidUntil": "2025-12-31",
                  "availability": "https://schema.org/InStock",
                  "url": "https://servicepro.hygieneteam.nz/subscribe?plan=pro"
                }
              },
              {
                "@type": "Product",
                "position": 3,
                "name": "Service Pro Enterprise",
                "description": "Custom solutions for larger organizations with multiple brand deployments, custom feature development, API integrations, and 24/7 support.",
                "brand": {
                  "@type": "Brand",
                  "name": "Service Pro"
                },
                "offers": {
                  "@type": "Offer",
                  "availability": "https://schema.org/InStock",
                  "url": "https://servicepro.hygieneteam.nz/auth",
                  "priceSpecification": {
                    "@type": "PriceSpecification",
                    "priceCurrency": "NZD",
                    "valueAddedTaxIncluded": true
                  }
                }
              }
            ]
          }
        })}
      </script>
      
      {/* FAQ Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What's the difference between Lease and Purchase?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Lease is a hosted solution where we manage everything for you - servers, updates, backups, and maintenance. You pay monthly and get automatic updates. Purchase gives you the complete source code to host on your own infrastructure. It's a one-time payment with no recurring fees (except optional update renewals)."
              }
            },
            {
              "@type": "Question",
              "name": "Can I switch from Lease to Purchase later?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! If you start with Lease and decide you want to own the software, you can upgrade to Purchase at any time. We'll credit up to 6 months of your Lease payments toward the Purchase price."
              }
            },
            {
              "@type": "Question",
              "name": "Is there a trial period?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, the Lease plan includes a 14-day free trial. You can explore all features and set up your branding before committing. No credit card required to start."
              }
            },
            {
              "@type": "Question",
              "name": "What payment methods do you accept?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We accept all major credit cards (Visa, Mastercard, American Express), bank transfers for annual payments, and can arrange invoicing for Enterprise customers."
              }
            },
            {
              "@type": "Question",
              "name": "What happens if I cancel my Lease subscription?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can cancel anytime. Your data will be available for export for 30 days after cancellation. After that, it's permanently deleted from our servers."
              }
            },
            {
              "@type": "Question",
              "name": "What technology stack is the software built on?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The platform is built with React, TypeScript, Tailwind CSS, and Supabase (PostgreSQL database with real-time capabilities). It's designed for easy deployment and customization."
              }
            },
            {
              "@type": "Question",
              "name": "Do I need technical expertise to self-host?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Basic familiarity with web deployment is helpful. We provide detailed documentation and deployment scripts. Our team also offers deployment assistance as part of the package."
              }
            },
            {
              "@type": "Question",
              "name": "What SLA guarantees are available?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer 99.9% uptime SLAs with financial credits for any downtime. Response time guarantees range from 1-hour for critical issues to 24-hours for general inquiries."
              }
            }
          ]
        })}
      </script>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <img src={serviceProLogo} alt="Service Pro field service management software pricing and plans for NZ businesses" className="w-10 h-10 rounded-full object-contain" />
                <span className="font-bold text-xl">Service Pro</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">Flexible Pricing</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Choose Your <span className="text-primary">Perfect Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you want a fully managed solution or complete ownership, we have the right option for your business.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.id}
                  className={`relative flex flex-col ${
                    tier.popular ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <tier.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                          )}
                          <span className={feature.included ? "" : "text-muted-foreground/50"}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={tier.popular ? "default" : "outline"}
                      size="lg"
                      onClick={() => handlePlanAction(tier.id)}
                    >
                      {tier.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Feature Comparison</h2>
              <p className="text-muted-foreground">
                See exactly what's included in each plan
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold">Lease</th>
                    <th className="text-center py-4 px-4 font-semibold text-primary">Purchase</th>
                    <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, index) => (
                    <tr
                      key={index}
                      className={`border-b border-border ${
                        index % 2 === 0 ? "bg-background" : ""
                      }`}
                    >
                      <td className="py-4 px-4 font-medium">{feature.name}</td>
                      <td className="text-center py-4 px-4">
                        {feature.lease === "✓" ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : feature.lease === "✗" ? (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        ) : (
                          feature.lease
                        )}
                      </td>
                      <td className="text-center py-4 px-4 bg-primary/5">
                        {feature.purchase === "✓" ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : feature.purchase === "✗" ? (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        ) : (
                          feature.purchase
                        )}
                      </td>
                      <td className="text-center py-4 px-4">
                        {feature.enterprise === "✓" ? (
                          <Check className="w-5 h-5 text-primary mx-auto" />
                        ) : feature.enterprise === "✗" ? (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        ) : (
                          feature.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Plan Details */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Plan Details</h2>
              <p className="text-muted-foreground">
                Everything you need to know about each option
              </p>
            </div>
            <Tabs defaultValue="lease" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="lease">Lease</TabsTrigger>
                <TabsTrigger value="purchase">Purchase</TabsTrigger>
                <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
              </TabsList>
              {pricingTiers.map((tier) => (
                <TabsContent key={tier.id} value={tier.id}>
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(tier.details).map(([key, value]) => (
                      <Card key={key}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg capitalize flex items-center gap-2">
                            {key === "hosting" && <Server className="w-5 h-5 text-primary" />}
                            {key === "support" && <Headphones className="w-5 h-5 text-primary" />}
                            {key === "updates" && <Zap className="w-5 h-5 text-primary" />}
                            {key === "security" && <Shield className="w-5 h-5 text-primary" />}
                            {key === "scaling" && <Globe className="w-5 h-5 text-primary" />}
                            {key === "backup" && <Server className="w-5 h-5 text-primary" />}
                            {key === "ownership" && <Code className="w-5 h-5 text-primary" />}
                            {key === "customization" && <Code className="w-5 h-5 text-primary" />}
                            {key === "reselling" && <Users className="w-5 h-5 text-primary" />}
                            {key === "deployments" && <Building2 className="w-5 h-5 text-primary" />}
                            {key === "development" && <Code className="w-5 h-5 text-primary" />}
                            {key === "integrations" && <Zap className="w-5 h-5 text-primary" />}
                            {key === "sla" && <Shield className="w-5 h-5 text-primary" />}
                            {key === "onboarding" && <Users className="w-5 h-5 text-primary" />}
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Find answers to common questions about our pricing and plans
              </p>
            </div>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="lease">Lease</TabsTrigger>
                <TabsTrigger value="purchase">Purchase</TabsTrigger>
                <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
              </TabsList>
              {Object.entries(faqs).map(([category, questions]) => (
                <TabsContent key={category} value={category}>
                  <Accordion type="single" collapsible className="w-full">
                    {questions.map((faq, index) => (
                      <AccordionItem key={index} value={`${category}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start your 14-day free trial or contact our sales team for a custom quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg">Start Free Trial</Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-7xl mx-auto text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Service Pro. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Pricing;
