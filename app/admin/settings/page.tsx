"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Save,
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  createdAt: string;
}

function SettingsPage() {
  const { user } = useAuth();
  const [runwareApiKey, setRunwareApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );

  // Load existing API key on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const response = await fetch("/api/settings/runware");
      if (response.ok) {
        const data = await response.json();
        setRunwareApiKey(data.apiKey || "");
      }
    } catch (error) {
      console.error("Failed to load API key:", error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!runwareApiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/runware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: runwareApiKey.trim() }),
      });

      if (response.ok) {
        toast.success("Runware API key saved successfully!");
      } else {
        toast.error("Failed to save API key");
      }
    } catch (error) {
      toast.error("Failed to save API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!runwareApiKey.trim()) {
      toast.error("Please enter an API key first");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test the API key by making a request to Runware
      const response = await fetch("/api/settings/runware/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: runwareApiKey.trim() }),
      });

      if (response.ok) {
        setTestResult("success");
        toast.success("API key is valid!");
      } else {
        setTestResult("error");
        toast.error("API key is invalid");
      }
    } catch (error) {
      setTestResult("error");
      toast.error("Failed to test API key");
    } finally {
      setIsTesting(false);
    }
  };

  const openRunwarePlayground = () => {
    window.open(
      "https://my.runware.ai/playground?modelAIR=runware%3A101%401&modelArchitecture=flux1d",
      "_blank",
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your application settings and API integrations
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <div className="flex gap-3">
                  <Input
                    id="full-name"
                    placeholder="Enter your full name"
                    defaultValue={user?.user_metadata?.full_name || ""}
                  />
                  <Button onClick={() => toast.success("Profile updated!")}>
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys & Integrations
              </CardTitle>
              <CardDescription>
                Configure API keys for external services and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Runware AI API Key */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label
                      htmlFor="runware-api-key"
                      className="text-base font-medium"
                    >
                      Runware AI API Key
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Required for AI-powered image generation features. Get
                      your key from the{" "}
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm text-blue-600 hover:text-blue-800"
                        onClick={openRunwarePlayground}
                      >
                        Runware Playground
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </p>
                  </div>

                  {testResult && (
                    <Badge
                      variant={
                        testResult === "success" ? "default" : "destructive"
                      }
                      className="flex items-center gap-1"
                    >
                      {testResult === "success" ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Valid
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          Invalid
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      id="runware-api-key"
                      type="password"
                      placeholder="Enter your Runware API key..."
                      value={runwareApiKey}
                      onChange={(e) => setRunwareApiKey(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleTestApiKey}
                    disabled={isTesting || !runwareApiKey.trim()}
                  >
                    {isTesting ? "Testing..." : "Test Key"}
                  </Button>

                  <Button
                    onClick={handleSaveApiKey}
                    disabled={isLoading || !runwareApiKey.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Key"}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <strong>How to get your API key:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>
                      Visit the{" "}
                      <a
                        href="https://my.runware.ai/playground"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Runware Playground
                      </a>
                    </li>
                    <li>Sign up or log in to your account</li>
                    <li>Navigate to your account settings</li>
                    <li>Generate a new API key</li>
                    <li>Copy and paste the key above</li>
                  </ol>
                </div>
              </div>

              <Separator />

              {/* Future API Keys */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base font-medium">Coming Soon</h4>
                  <p className="text-sm text-muted-foreground">
                    Additional API integrations will be available in future
                    updates
                  </p>
                </div>

                <div className="grid gap-3 opacity-50">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-semibold">SC</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Stripe Connect</p>
                        <p className="text-xs text-muted-foreground">
                          Payment processing
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Planned</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            SD
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">SendGrid</p>
                          <p className="text-xs text-muted-foreground">
                            Email notifications
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Planned</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                General application configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable the application for maintenance
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detailed logging and error reporting
                    </p>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}
