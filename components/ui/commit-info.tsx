"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { GitCommit, ExternalLink, Calendar, GitBranch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommitData {
  hash: string;
  message: string;
  date: string;
  branch: string;
  githubUrl: string | null;
}

interface CommitInfoProps {
  variant?: "badge" | "icon";
  className?: string;
}

export function CommitInfo({ variant = "icon", className = "" }: CommitInfoProps) {
  const { data, isLoading } = useQuery<CommitData>({
    queryKey: ["commit-info"],
    queryFn: async () => {
      const res = await fetch("/api/commit-info");
      if (!res.ok) throw new Error("Failed to fetch commit info");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data) {
    return null;
  }

  const relativeTime = data.date !== "N/A" 
    ? formatDistanceToNow(new Date(data.date), { addSuffix: true })
    : "N/A";

  const handleClick = () => {
    if (data.githubUrl) {
      window.open(data.githubUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {variant === "badge" ? (
            <Badge
              variant="outline"
              className={`cursor-pointer hover:bg-muted/50 transition-colors gap-1.5 ${className}`}
              onClick={handleClick}
            >
              <GitCommit className="h-3 w-3" />
              <span className="font-mono text-xs">{data.hash}</span>
              {data.githubUrl && <ExternalLink className="h-3 w-3" />}
            </Badge>
          ) : (
            <button
              onClick={handleClick}
              className={`flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/50 transition-colors ${className}`}
              aria-label="View commit info"
            >
              <GitCommit className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs space-y-2 p-3"
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <GitCommit className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Commit: <span className="font-mono">{data.hash}</span>
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {data.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3" />
              <span>{data.branch}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{relativeTime}</span>
            </div>

            {data.githubUrl && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Click to view on GitHub
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
