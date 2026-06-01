import { useState, useMemo } from "react";
import { ArrowLeft, MessageCircle, Mail, Phone, ExternalLink, Play, Clock, MousePointerClick, Users, Briefcase, MapPin, FileText, Search, X, Video, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { whiteLabelConfig } from "@/config/whitelabel";
import { useWalkthrough, WALKTHROUGHS } from "@/hooks/useWalkthrough";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  steps: string[];
}

interface SearchResult {
  type: "walkthrough" | "video" | "faq";
  id: string;
  title: string;
  description: string;
  data: any;
}

const walkthroughIcons: Record<string, typeof Users> = {
  "add-client": Users,
  "create-job": Briefcase,
  "track-visit": MapPin,
  "manage-staff": Users,
  "view-invoices": FileText,
};

const HelpCenter = () => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { startWalkthrough } = useWalkthrough();

  const videoTutorials: VideoTutorial[] = [
    {
      id: "getting-started",
      title: "Getting Started Guide",
      description: "Learn the basics of setting up your account and navigating the app.",
      duration: "5:30",
      category: "basics",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop",
      steps: [
        "Complete your profile with display name and contact info",
        "Add your first client from the Clients page",
        "Create sites for your clients to track service locations",
        "Invite team members from Settings",
        "Create jobs to assign to clients"
      ]
    },
    {
      id: "visit-tracking",
      title: "How to Track Visits",
      description: "Clock in/out of job sites with GPS tracking and document your work.",
      duration: "4:15",
      category: "visits",
      thumbnail: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=225&fit=crop",
      steps: [
        "Navigate to Visit Tracking from the menu",
        "Select the site you're visiting from the dropdown",
        "Tap 'Start Visit' to clock in with GPS",
        "Add materials, photos, or damage reports during your visit",
        "Tap 'End Visit' when finished to clock out"
      ]
    },
    {
      id: "adding-materials",
      title: "Adding Materials to Visits",
      description: "Track materials used during visits for accurate invoicing.",
      duration: "3:45",
      category: "visits",
      thumbnail: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=225&fit=crop",
      steps: [
        "Start an active visit at a job site",
        "Go to the Materials tab in the visit screen",
        "Tap 'Add Material' button",
        "Enter material name, SKU, quantity, and unit cost",
        "Materials are automatically added to invoices with markup"
      ]
    },
    {
      id: "managing-clients",
      title: "Managing Clients & Sites",
      description: "Add clients, create service sites, and organize your customer base.",
      duration: "6:00",
      category: "clients",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop",
      steps: [
        "Go to Clients page from the navigation",
        "Tap 'Register Client' to add a new client",
        "Fill in company details, contact info, and upload a photo",
        "Switch to Sites tab to add service locations",
        "Each site can have custom hourly rates and travel charges"
      ]
    },
    {
      id: "creating-jobs",
      title: "Creating & Managing Jobs",
      description: "Set up recurring or one-time jobs for your clients.",
      duration: "4:30",
      category: "jobs",
      thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=225&fit=crop",
      steps: [
        "Navigate to Jobs from the main menu",
        "Tap 'Add Job' to create a new job",
        "Select the client and site for the job",
        "Choose frequency: one-time, daily, weekly, or monthly",
        "Set the price and mark jobs complete when finished"
      ]
    },
    {
      id: "invoicing",
      title: "Understanding Invoices",
      description: "View, generate, and export invoices for your clients.",
      duration: "5:00",
      category: "billing",
      thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop",
      steps: [
        "Go to Invoices from the navigation menu",
        "View all invoices organized by client and date",
        "Invoices are auto-generated from completed visits",
        "Tap any invoice to view full details",
        "Download PDF invoices to send to clients"
      ]
    },
  ];

  const faqs = [
    {
      id: "faq-1",
      question: "How do I clock in to a job site?",
      answer: "Navigate to Visit Tracking, select your site, and tap 'Start Visit'. Make sure location services are enabled for GPS tracking.",
    },
    {
      id: "faq-2",
      question: "How do I add materials to a visit?",
      answer: "While on an active visit, go to the Materials tab and tap 'Add Material'. Enter the details including name, quantity, and unit cost.",
    },
    {
      id: "faq-3",
      question: "How do I view my invoices?",
      answer: "Go to the Invoices page from the main menu. You can filter by date range and download PDFs of any invoice.",
    },
    {
      id: "faq-4",
      question: "How do I update my profile information?",
      answer: "Go to Settings > Profile to update your display name, phone number, and other personal details.",
    },
    {
      id: "faq-5",
      question: "How do I report a problem or damage?",
      answer: "During an active visit, use the Damage Report feature to document any issues with photos and descriptions.",
    },
  ];

  // Search functionality
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search walkthroughs
    WALKTHROUGHS.forEach((w) => {
      if (
        w.title.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query) ||
        w.steps.some((s) => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query))
      ) {
        results.push({
          type: "walkthrough",
          id: w.id,
          title: w.title,
          description: w.description,
          data: w,
        });
      }
    });

    // Search videos
    videoTutorials.forEach((v) => {
      if (
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.steps.some((s) => s.toLowerCase().includes(query))
      ) {
        results.push({
          type: "video",
          id: v.id,
          title: v.title,
          description: v.description,
          data: v,
        });
      }
    });

    // Search FAQs
    faqs.forEach((f) => {
      if (
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query)
      ) {
        results.push({
          type: "faq",
          id: f.id,
          title: f.question,
          description: f.answer,
          data: f,
        });
      }
    });

    return results;
  }, [searchQuery]);

  const supportOptions = [
    {
      icon: MessageCircle,
      label: "Chat Support",
      description: "Start a conversation with our team",
      action: () => navigate("/chat"),
    },
    {
      icon: Mail,
      label: "Email Support",
      description: whiteLabelConfig.contactEmail,
      action: () => window.open(`mailto:${whiteLabelConfig.contactEmail}`),
    },
    {
      icon: Phone,
      label: "Phone Support",
      description: whiteLabelConfig.contactPhone,
      action: () => window.open(`tel:${whiteLabelConfig.contactPhone}`),
    },
  ];

  const categories = [
    { id: "all", label: "All" },
    { id: "basics", label: "Getting Started" },
    { id: "visits", label: "Visits" },
    { id: "clients", label: "Clients" },
    { id: "jobs", label: "Jobs" },
    { id: "billing", label: "Billing" },
  ];

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredVideos = activeCategory === "all" 
    ? videoTutorials 
    : videoTutorials.filter(v => v.category === activeCategory);

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === "walkthrough") {
      startWalkthrough(result.id);
    } else if (result.type === "video") {
      setSelectedVideo(result.data);
    }
    // For FAQs, we'll just clear search and let them find it in the FAQs tab
    setSearchQuery("");
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "walkthrough":
        return MousePointerClick;
      case "video":
        return Video;
      case "faq":
        return HelpCircle;
    }
  };

  const getResultBadge = (type: SearchResult["type"]) => {
    switch (type) {
      case "walkthrough":
        return "Interactive";
      case "video":
        return "Video";
      case "faq":
        return "FAQ";
    }
  };

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
          <h2 className="text-2xl font-bold text-foreground">Help Center</h2>
          <p className="text-muted-foreground">Get help and support</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search walkthroughs, videos, and FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-12 bg-card border-border"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                Clear
              </Button>
            )}
          </div>
          
          {searchResults.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse the tabs below</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {searchResults.map((result) => {
                const Icon = getResultIcon(result.type);
                return (
                  <Card
                    key={`${result.type}-${result.id}`}
                    className="p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground line-clamp-1">{result.title}</h4>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {getResultBadge(result.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabs - Hidden when searching */}
      {!searchQuery.trim() && (
        <Tabs defaultValue="walkthroughs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="walkthroughs">Walkthroughs</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

        {/* Interactive Walkthroughs Tab */}
        <TabsContent value="walkthroughs" className="space-y-4">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <MousePointerClick className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Interactive Guides</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Click any walkthrough below to get step-by-step guidance through the actual app interface.
            </p>
          </Card>

          <div className="grid gap-3">
            {WALKTHROUGHS.map((walkthrough) => {
              const Icon = walkthroughIcons[walkthrough.id] || Play;
              return (
                <Card
                  key={walkthrough.id}
                  className="p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                  onClick={() => startWalkthrough(walkthrough.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-foreground">{walkthrough.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {walkthrough.steps.length} steps
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {walkthrough.description}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="flex-shrink-0">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Video Tutorials Tab */}
        <TabsContent value="videos" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="flex-shrink-0"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-border"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground ml-1" />
                    </div>
                  </div>
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    <Clock className="w-3 h-3 mr-1" />
                    {video.duration}
                  </Badge>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-foreground mb-1">{video.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-3">
          <Card className="border-border">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="px-4 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card className="divide-y divide-border">
            {supportOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <button
                  key={index}
                  onClick={option.action}
                  className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors text-left"
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
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </Card>

          {/* Documentation Link */}
          {whiteLabelConfig.website && (
            <Card className="p-6 border-border">
              <h3 className="font-semibold text-foreground mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visit our website for detailed guides and documentation.
              </p>
              <a
                href={whiteLabelConfig.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                Visit Documentation
                <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      )}

      {/* Video Tutorial Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              {/* Video placeholder with play button */}
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={selectedVideo.thumbnail}
                  alt={selectedVideo.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </div>
                </div>
                <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  {selectedVideo.duration}
                </Badge>
              </div>

              <p className="text-muted-foreground">{selectedVideo.description}</p>

              {/* Step by step guide */}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Step-by-Step Guide</h4>
                <ol className="space-y-2">
                  {selectedVideo.steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Button className="w-full" onClick={() => setSelectedVideo(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpCenter;
