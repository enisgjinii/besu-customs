"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteLogo } from "@/components/ui/site-logo";
import { GoogleLogo } from "@/components/ui/google-logo";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LoginFormProps {
  defaultView?: "signin" | "signup";
}

export function LoginForm({ defaultView = "signin" }: LoginFormProps) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully!");
      router.push("/admin");
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the confirmation link!");
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // Don't set loading to false here as we're redirecting
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await resetPassword(resetEmail);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email");
      setIsResetOpen(false);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[100svh] bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-sm border">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <SiteLogo size={56} withBackground rounded="md" />
            <ThemeToggle />
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {defaultView === "signin" ? "Sign In" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {defaultView === "signin" ? "Access your admin dashboard" : "Set up your admin access"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue={defaultView} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 bg-muted p-1 rounded-md">
              <TabsTrigger
                value="signin"
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10 h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-0 font-normal text-xs h-auto text-muted-foreground">
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="name@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground/60 hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10 h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-password"
                    className="text-sm font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground/60 hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Password must contain:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                    </ul>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-6 h-11 gap-2 font-medium"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <GoogleLogo size={18} variant="monogram" className="shrink-0" />
              {loading ? "Redirecting..." : "Continue with Google"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
