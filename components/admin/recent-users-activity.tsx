"use client";
import { useQuery } from "@tanstack/react-query";
import { UsersService } from "@/lib/users-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Users, Clock } from "lucide-react";

export function RecentUsersActivity() {
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recent-users"],
    queryFn: async () => {
      const all = await UsersService.getAllUsers();
      return all.slice(0, 5); // Get 5 most recent
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Recent Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-3 w-[130px]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">
            Failed to load recent users.
          </p>
        )}

        {!isLoading && !error && users && users.length === 0 && (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        )}

        {!isLoading && !error && users && users.length > 0 && (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {(user.full_name || user.email)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user.full_name || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {user.role}
                    </Badge>
                    {user.last_sign_in_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(user.last_sign_in_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
