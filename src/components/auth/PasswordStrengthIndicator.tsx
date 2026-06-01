import { useMemo } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  critical?: boolean;
}

// Common weak passwords to block
const commonPasswords = [
  "password", "12345678", "123456789", "1234567890", "qwerty123",
  "abc12345", "password1", "password123", "admin123", "letmein",
  "welcome1", "monkey123", "dragon123", "master123", "login123",
  "princess1", "sunshine1", "football1", "baseball1", "iloveyou1",
  "trustno1", "shadow123", "ashley123", "michael1", "jennifer1",
  "charlie1", "andrew123", "joshua123", "matthew1", "daniel123"
];

const requirements: PasswordRequirement[] = [
  { label: "At least 10 characters", test: (p) => p.length >= 10, critical: true },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
  { label: "Contains special character (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'`~]/.test(p) },
  { label: "No common passwords", test: (p) => !commonPasswords.some(cp => p.toLowerCase().includes(cp)), critical: true },
  { label: "No sequential characters (123, abc)", test: (p) => !/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(p) },
  { label: "No repeated characters (aaa, 111)", test: (p) => !/(.)\1{2,}/.test(p) },
];

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { score, passedRequirements, failedCritical } = useMemo(() => {
    const passed = requirements.filter((req) => req.test(password));
    const failedCrit = requirements.filter((req) => req.critical && !req.test(password));
    return {
      score: passed.length,
      passedRequirements: passed.map((req) => req.label),
      failedCritical: failedCrit.map((req) => req.label),
    };
  }, [password]);

  const getStrengthLabel = (score: number, hasCriticalFailure: boolean) => {
    if (score === 0) return { label: "", color: "" };
    if (hasCriticalFailure) return { label: "Weak", color: "bg-destructive" };
    if (score <= 3) return { label: "Weak", color: "bg-destructive" };
    if (score <= 5) return { label: "Fair", color: "bg-amber-500" };
    if (score <= 6) return { label: "Good", color: "bg-primary" };
    if (score <= 7) return { label: "Strong", color: "bg-green-500" };
    return { label: "Excellent", color: "bg-green-600" };
  };

  const strength = getStrengthLabel(score, failedCritical.length > 0);
  const maxScore = requirements.length;

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            score <= 3 && "text-destructive",
            score > 3 && score <= 5 && "text-amber-500",
            score > 5 && score <= 6 && "text-primary",
            score > 6 && "text-green-500"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: maxScore }, (_, i) => i + 1).map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                level <= score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Critical warning */}
      {failedCritical.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">
            {failedCritical[0]}
          </p>
        </div>
      )}

      {/* Requirements list */}
      <ul className="space-y-1">
        {requirements.map((req) => {
          const passed = passedRequirements.includes(req.label);
          return (
            <li
              key={req.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
                req.critical && !passed && "text-destructive font-medium"
              )}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {req.label}
              {req.critical && !passed && " *"}
            </li>
          );
        })}
      </ul>
      
      <p className="text-xs text-muted-foreground">* Required</p>
    </div>
  );
};

export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  // Check critical requirements first
  const criticalReqs = requirements.filter(r => r.critical);
  for (const req of criticalReqs) {
    if (!req.test(password)) {
      return {
        isValid: false,
        message: req.label + " is required.",
      };
    }
  }
  
  // Count passed requirements
  const passedCount = requirements.filter((req) => req.test(password)).length;
  
  // Require at least 6 out of 8 requirements
  if (passedCount < 6) {
    return {
      isValid: false,
      message: "Password is too weak. Please meet at least 6 of the 8 security requirements.",
    };
  }
  
  return { isValid: true, message: "" };
};

