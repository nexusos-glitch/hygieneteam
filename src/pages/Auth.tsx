import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useBrandingSettings } from "@/hooks/useBrandingSettings";
import { Loader2, LogIn, UserPlus, Mail, ShieldAlert } from "lucide-react";
import { z } from "zod";
import serviceProLogo from "@/assets/service-pro-logo.png";
import { PasswordStrengthIndicator, validatePasswordStrength } from "@/components/auth/PasswordStrengthIndicator";
import { useAuthRateLimit } from "@/hooks/useAuthRateLimit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MathCaptcha } from "@/components/auth/MathCaptcha";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(10, { message: "Password must be at least 10 characters" }).max(100),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const { role, isClient, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: brandingSettings } = useBrandingSettings();
  const { 
    isLocked, 
    getRemainingLockoutTime, 
    getRemainingAttempts,
    recordAttempt, 
    formatRemainingTime,
    maxAttempts 
  } = useAuthRateLimit();
  const [lockoutTime, setLockoutTime] = useState(0);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  // Honeypot fields - invisible to real users, filled by bots
  const [honeypotName, setHoneypotName] = useState("");
  const [honeypotWebsite, setHoneypotWebsite] = useState("");
  
  const companyName = brandingSettings?.company_name || "Service Pro";
  
  // Show CAPTCHA after 3 failed attempts
  const CAPTCHA_THRESHOLD = 3;
  const showCaptcha = getRemainingAttempts() <= (maxAttempts - CAPTCHA_THRESHOLD) && !isLocked();
  const companyLogo = brandingSettings?.company_logo_url || serviceProLogo;

  // Update lockout timer
  useEffect(() => {
    if (isLocked()) {
      const updateTimer = () => {
        const remaining = getRemainingLockoutTime();
        setLockoutTime(remaining);
        if (remaining <= 0) {
          setLockoutTime(0);
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setLockoutTime(0);
    }
  }, [isLocked, getRemainingLockoutTime]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Check rate limiting for password reset too
    if (isLocked()) {
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${formatRemainingTime(getRemainingLockoutTime())} before trying again.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check Your Email",
          description: `A password reset link has been sent to ${email}. Please check your inbox.`,
        });
        setShowForgotPassword(false);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !roleLoading && user) {
      // Redirect based on role
      if (isClient) {
        navigate("/client-portal");
      } else {
        navigate("/home");
      }
    }
  }, [user, loading, roleLoading, isClient, navigate]);

  const handleSubmit = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    
    // Check honeypot fields - if filled, silently reject (bot detected)
    if (honeypotName || honeypotWebsite) {
      // Simulate success to not alert bots, but do nothing
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
      toast({
        title: isSignUp ? "Account Created" : "Welcome Back",
        description: "Processing your request...",
      });
      return;
    }
    
    // Check if locked out (only for login attempts)
    if (!isSignUp && isLocked()) {
      toast({
        title: "Too Many Attempts",
        description: `Account temporarily locked. Please wait ${formatRemainingTime(getRemainingLockoutTime())} before trying again.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check CAPTCHA verification if required
    if (!isSignUp && showCaptcha && !captchaVerified) {
      toast({
        title: "Verification Required",
        description: "Please complete the security verification before signing in.",
        variant: "destructive",
      });
      return;
    }
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    // Additional password strength check for sign up
    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        return;
      }
      
      const strengthCheck = validatePasswordStrength(password);
      if (!strengthCheck.isValid) {
        toast({
          title: "Weak Password",
          description: strengthCheck.message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        // Record failed attempt for login
        if (!isSignUp) {
          recordAttempt(false);
          // Reset CAPTCHA on failed attempt
          setCaptchaVerified(false);
          
          // Check if this attempt triggered a lockout and send notification
          if (isLocked()) {
            const lockoutDuration = formatRemainingTime(getRemainingLockoutTime());
            supabase.functions.invoke('notify-account-lockout', {
              body: {
                email,
                lockoutDuration,
                attemptCount: maxAttempts,
              },
            }).catch(err => console.log('Lockout notification skipped:', err));
          }
        }
        
        let message = error.message;
        if (error.message.includes("User already registered")) {
          message = "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes("Invalid login credentials")) {
          const remaining = getRemainingAttempts() - 1;
          message = `Invalid email or password. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : 'Account will be temporarily locked.'}`;
        }
        
        toast({
          title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
          description: message,
          variant: "destructive",
        });
      } else {
        // Record successful login
        if (!isSignUp) {
          recordAttempt(true);
        }
        
        // If signup was successful, send welcome email and check for invitations
        if (isSignUp) {
          // Send welcome email asynchronously
          supabase.functions.invoke('send-welcome-email', {
            body: { email },
          }).catch(err => console.log('Welcome email skipped:', err));

          try {
            // The trigger handles role assignment, we just need to trigger notification
            // Check if there was an invitation that was just accepted
            const { data: acceptedInvite } = await supabase
              .from('staff_invitations')
              .select('id, staff_name')
              .eq('email', email)
              .eq('status', 'accepted')
              .order('accepted_at', { ascending: false })
              .limit(1)
              .single();
            
            if (acceptedInvite) {
              // Send notification asynchronously - don't wait for it
              supabase.functions.invoke('notify-invite-accepted', {
                body: {
                  invitationId: acceptedInvite.id,
                  newUserEmail: email,
                  staffName: acceptedInvite.staff_name || email,
                },
              }).catch(err => console.log('Notification skipped:', err));
            }
          } catch (e) {
            // Silently ignore - notification is not critical
            console.log('Invitation check skipped');
          }
        }
        
        toast({
          title: isSignUp ? "Account Created" : "Welcome Back",
          description: isSignUp 
            ? "Your account has been created successfully." 
            : "You have been signed in successfully.",
        });
        navigate("/");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 overflow-hidden">
            {showForgotPassword ? (
              <Mail className="w-8 h-8 text-primary-foreground" />
            ) : (
              <img 
                src={companyLogo} 
                alt={companyName} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<span class="text-primary-foreground font-bold text-2xl">${companyName.charAt(0)}</span>`;
                }}
              />
            )}
          </div>
          <CardTitle className="text-2xl">
            {showForgotPassword ? "Reset Password" : companyName}
          </CardTitle>
          <CardDescription>
            {showForgotPassword 
              ? "Enter your email to receive a reset link"
              : activeTab === "login" 
                ? "Sign in to access your account" 
                : "Create an account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Reset Link
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                {lockoutTime > 0 && (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription>
                      Too many failed attempts. Please wait {formatRemainingTime(lockoutTime)} before trying again.
                    </AlertDescription>
                  </Alert>
                )}
                {/* Honeypot fields - hidden from real users */}
                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <Label htmlFor="login-name">Name</Label>
                  <Input
                    id="login-name"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotName}
                    onChange={(e) => setHoneypotName(e.target.value)}
                  />
                  <Label htmlFor="login-website">Website</Label>
                  <Input
                    id="login-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotWebsite}
                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || lockoutTime > 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || lockoutTime > 0}
                  />
                </div>
                {showCaptcha && (
                  <MathCaptcha 
                    onVerify={setCaptchaVerified} 
                    isVerified={captchaVerified} 
                  />
                )}
                <Button type="submit" className="w-full" disabled={isLoading || lockoutTime > 0 || (showCaptcha && !captchaVerified)}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  {lockoutTime > 0 ? `Locked (${formatRemainingTime(lockoutTime)})` : 'Sign In'}
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="w-full text-sm"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot your password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                {/* Honeypot fields - hidden from real users */}
                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotName}
                    onChange={(e) => setHoneypotName(e.target.value)}
                  />
                  <Label htmlFor="signup-website">Website URL</Label>
                  <Input
                    id="signup-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypotWebsite}
                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <PasswordStrengthIndicator password={password} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className={confirmPassword && password !== confirmPassword ? "border-destructive" : ""}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords don't match</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Create Account
              </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
