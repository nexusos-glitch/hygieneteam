import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowRight, Play, Check, MapPin, Camera, 
  FileText, Users, BarChart3, Bell, Smartphone, 
  Palette
} from "lucide-react"

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100, "Company name cannot exceed 100 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function Landing() {
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    // Simulate sending an email
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast({
      title: "Message Sent",
      description: "We'll get back to you shortly.",
    })
    reset()
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-50 font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white text-lg border-2 border-white shadow-sm">HT</div>
              <span className="text-xl font-bold tracking-tight">Hygiene Team</span>
            </div>
            
            <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#demo" className="hover:text-white transition-colors">Demo</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</Link>
              <Link to="/auth" className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xl border-2 border-white shadow-lg shadow-primary/20">SP</div>
                <span className="text-3xl font-bold tracking-tight">Service Pro</span>
              </div>
              <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-sm mb-8 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                White-Label Service Management Platform
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                Run Your Service Business <span className="text-primary">Smarter</span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                All-in-one platform for field service teams. GPS tracking, photo documentation, automated invoicing, and real-time analytics - fully white-labeled for your brand.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Link to="/auth" className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  Start Free Trial <ArrowRight size={20} />
                </Link>
                <a href="#features" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors flex items-center justify-center">
                  See Features
                </a>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-slate-400">
                <span className="flex items-center gap-2"><Check size={16} className="text-green-500" /> No credit card required</span>
                <span className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 14-day free trial</span>
                <span className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Cancel anytime</span>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-2xl hidden lg:block">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800/50 to-slate-900/80"></div>
                 <div className="text-slate-500 text-lg flex flex-col items-center gap-4 justify-center">
                   <div className="p-4 bg-slate-800 rounded-full">
                     <MapPin size={48} className="text-primary" />
                   </div>
                   Dashboard Preview
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-slate-800/50 bg-slate-900/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-800/50">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                <div className="text-sm font-medium text-slate-400">Visits Tracked</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-sm font-medium text-slate-400">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm font-medium text-slate-400">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">$2M+</div>
                <div className="text-sm font-medium text-slate-400">Revenue Processed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-3">How It Works</h2>
            <h3 className="text-4xl font-bold mb-16">Get Started in 4 Simple Steps</h3>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-[45px] left-[12%] right-[12%] h-[2px] bg-slate-800/50 -z-10"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-slate-800 bg-[#0B1120] flex items-center justify-center relative mb-6">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">1</div>
                  <Users size={32} className="text-slate-300" />
                </div>
                <h4 className="text-xl font-bold mb-2">Sign Up & Setup</h4>
                <p className="text-slate-400 text-sm">Create your account, add your branding, and invite your team in under 5 minutes.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-slate-800 bg-[#0B1120] flex items-center justify-center relative mb-6">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">2</div>
                  <MapPin size={32} className="text-slate-300" />
                </div>
                <h4 className="text-xl font-bold mb-2">Add Clients & Sites</h4>
                <p className="text-slate-400 text-sm">Import your clients and job sites. Set hourly rates, travel fees, and materials markup.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-slate-800 bg-[#0B1120] flex items-center justify-center relative mb-6">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">3</div>
                  <Camera size={32} className="text-slate-300" />
                </div>
                <h4 className="text-xl font-bold mb-2">Track Visits</h4>
                <p className="text-slate-400 text-sm">Staff clock in with GPS, take photos, log materials, and complete visits from their phones.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-slate-800 bg-[#0B1120] flex items-center justify-center relative mb-6">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">4</div>
                  <FileText size={32} className="text-slate-300" />
                </div>
                <h4 className="text-xl font-bold mb-2">Auto Invoicing</h4>
                <p className="text-slate-400 text-sm">Invoices generate automatically with labor, travel, and materials. Send to clients instantly.</p>
              </div>
            </div>
            
            <div className="mt-16">
              <Link to="/auth" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors">
                Start Your Free Trial <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>

        {/* Watch How It Works (Video Space Saver) */}
        <section id="demo" className="py-24 bg-slate-900/50 border-y border-slate-800/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-3">See It In Action</h2>
            <h3 className="text-4xl font-bold mb-6">Watch How It Works</h3>
            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              See how Service Pro helps service companies streamline operations, track visits, and automate invoicing in under 3 minutes.
            </p>
            
            {/* SPACESAVER FOR PROMO VIDEO */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group cursor-pointer flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0B1120] via-[#0B1120]/50 to-transparent"></div>
              
              <div className="z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary/90 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(234,88,12,0.4)]">
                  <Play size={40} className="text-white fill-white ml-2" />
                </div>
                <span className="font-bold text-2xl text-white tracking-wide">Play Promo Video</span>
                <span className="text-slate-400 mt-2">2:45 Runtime</span>
              </div>

              {/* Fake Video Controls for realism */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950/90 to-transparent flex items-end px-6 pb-4">
                <div className="w-full flex items-center gap-4">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-primary relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">0:55 / 2:45</span>
                </div>
              </div>
            </div>
            {/* END SPACESAVER */}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-3">Features</h2>
              <h3 className="text-4xl font-bold mb-4">Everything You Need to Manage Field Services</h3>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Powerful tools designed for service businesses. From visit tracking to invoicing, we have got you covered.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: MapPin, title: "GPS Visit Tracking", desc: "Track staff arrivals and departures with precise GPS coordinates and timestamps." },
                { icon: Camera, title: "Photo Documentation", desc: "Capture before/after photos, document work completed, and report damage instantly." },
                { icon: FileText, title: "Auto Invoicing", desc: "Generate professional invoices automatically from completed visits with labor, travel, and materials." },
                { icon: Users, title: "Client Management", desc: "Manage clients, sites, and staff assignments with comprehensive profile pages." },
                { icon: BarChart3, title: "Revenue Analytics", desc: "Track revenue trends, staff performance, and business growth with real-time dashboards." },
                { icon: Bell, title: "Smart Notifications", desc: "Stay informed with email, push, and in-app notifications for all business events." },
                { icon: Smartphone, title: "Mobile-First PWA", desc: "Works offline, installs like a native app, and runs perfectly on any device." },
                { icon: Palette, title: "Full White-Label", desc: "Your branding, your colors, your logo - completely customizable for your business." }
              ].map((feature, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-primary mb-6">
                    <feature.icon size={24} />
                  </div>
                  <h4 className="text-lg font-bold mb-3">{feature.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 bg-slate-900 border-t border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-3">Get in Touch</h2>
              <h3 className="text-4xl font-bold mb-4">Contact Us</h3>
              <p className="text-xl text-slate-400">
                Have questions about Service Pro? Send us a message and our team will get back to you shortly.
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="bg-[#0B1120] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    {...register("firstName")}
                    className={`w-full bg-slate-900 border ${errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    placeholder="John" 
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    {...register("lastName")}
                    className={`w-full bg-slate-900 border ${errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    placeholder="Doe" 
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    {...register("email")}
                    className={`w-full bg-slate-900 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    placeholder="john@example.com" 
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    {...register("phone")}
                    className={`w-full bg-slate-900 border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    placeholder="+1234567890" 
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-400 mb-2">Company Name</label>
                <input 
                  type="text" 
                  id="companyName" 
                  {...register("companyName")}
                  className={`w-full bg-slate-900 border ${errors.companyName ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="Acme Corp" 
                />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              
              <div className="mb-8">
                <label htmlFor="message" className="block text-sm font-medium text-slate-400 mb-2">Message</label>
                <textarea 
                  id="message" 
                  {...register("message")}
                  rows={5}
                  className={`w-full bg-slate-900 border ${errors.message ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none`}
                  placeholder="How can we help you?" 
                ></textarea>
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-dark text-white rounded-xl py-4 font-semibold text-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </section>

        {/* Footer Starter */}
        <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
            <p>&copy; {new Date().getFullYear()} Service Pro. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

