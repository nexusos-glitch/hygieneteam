import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shield } from 'lucide-react';

interface MathCaptchaProps {
  onVerify: (isValid: boolean) => void;
  isVerified: boolean;
}

const generateChallenge = () => {
  const operators = ['+', '-', '×'] as const;
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let num1: number, num2: number, answer: number;
  
  switch (operator) {
    case '+':
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 20) + 10;
      num2 = Math.floor(Math.random() * num1);
      answer = num1 - num2;
      break;
    case '×':
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      break;
    default:
      num1 = 1;
      num2 = 1;
      answer = 2;
  }
  
  return {
    question: `${num1} ${operator} ${num2}`,
    answer,
  };
};

export const MathCaptcha = ({ onVerify, isVerified }: MathCaptchaProps) => {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');

  const refreshChallenge = useCallback(() => {
    setChallenge(generateChallenge());
    setUserAnswer('');
    setError('');
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    // Generate new challenge when component mounts
    refreshChallenge();
  }, []);

  const handleVerify = () => {
    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed)) {
      setError('Please enter a number');
      return;
    }
    
    if (parsed === challenge.answer) {
      setError('');
      onVerify(true);
    } else {
      setError('Incorrect answer. Try again.');
      refreshChallenge();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <Shield className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-600 font-medium">Verified - You may proceed</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-muted/50 border border-border rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Security Verification Required</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label htmlFor="captcha-answer" className="text-xs text-muted-foreground">
            What is {challenge.question}?
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="captcha-answer"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Your answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-24"
            />
            <Button type="button" onClick={handleVerify} size="sm">
              Verify
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={refreshChallenge}
              title="New challenge"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

