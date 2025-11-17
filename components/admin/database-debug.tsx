"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Database } from "lucide-react";
import { Model } from "@/lib/models-service";

interface DatabaseTestResult {
  success?: boolean;
  message?: string;
  totalModels?: number;
  sampleModels?: Model[];
  supabaseUrl?: string;
  hasAnonKey?: boolean;
  error?: string;
  details?: string;
  suggestion?: string;
  originalStatus?: boolean;
  newStatus?: boolean;
  toggleResult?: unknown;
  modelsResult?: unknown;
}

export function DatabaseDebug() {
  const [testResult, setTestResult] = useState<DatabaseTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/models/test");
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        error: "Failed to connect to API",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const testToggle = async () => {
    try {
      setLoading(true);

      // First, get all models
      const modelsResponse = await fetch("/api/models");
      const modelsResult = await modelsResponse.json();

      if (modelsResult.models && modelsResult.models.length > 0) {
        const firstModel = modelsResult.models[0];

        // Try to toggle the first model
        const toggleResponse = await fetch(`/api/models?id=${firstModel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !firstModel.is_active }),
        });

        const toggleResult = await toggleResponse.json();

        setTestResult({
          success: true,
          message: "Toggle test completed",
          originalStatus: firstModel.is_active,
          newStatus: !firstModel.is_active,
          toggleResult,
        });
      } else {
        setTestResult({
          error: "No models found to test toggle",
          modelsResult,
        });
      }
    } catch (error) {
      setTestResult({
        error: "Toggle test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Debug
        </CardTitle>
        <CardDescription>
          Test database connection and model operations
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={testDatabase} disabled={loading}>
            Test Database Connection
          </Button>
          <Button onClick={testToggle} disabled={loading} variant="outline">
            Test Model Toggle
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : testResult.error ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="font-medium">
                {testResult.success
                  ? "Success"
                  : testResult.error
                    ? "Error"
                    : "Warning"}
              </span>
            </div>

            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Environment Check:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  process.env.NEXT_PUBLIC_SUPABASE_URL
                    ? "default"
                    : "destructive"
                }
              >
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing"}
              </Badge>
              <span>Supabase URL</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? "default"
                    : "destructive"
                }
              >
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}
              </Badge>
              <span>Supabase Anon Key</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
