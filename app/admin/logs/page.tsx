'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Log {
  log_id: string;
  level: string;
  category: string;
  message: string;
  timestamp: string;
  ip?: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  user_id?: string;
  url?: string;
  status_code?: number;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('level', filter);
      
      const response = await fetch(`/api/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warn': return 'warning';
      case 'info': return 'default';
      case 'debug': return 'secondary';
      default: return 'default';
    }
  };

  const filteredLogs = logs.filter(log => 
    search === '' || 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.ip?.includes(search) ||
    log.user_id?.includes(search)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-muted-foreground">Monitor application logs and errors</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />

            <Button onClick={fetchLogs} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Recent application logs. For complete logs, check Vercel Dashboard or use the Vercel Toolbar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found. Logs are stored in Vercel and may not be available in this view.
              <br />
              <span className="text-sm">Use Vercel Dashboard or add ?vercelToolbar=1 to your URL to view logs.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.log_id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant={getLevelColor(log.level)}>
                      {log.level}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">{log.message}</div>
                      <div className="text-sm text-muted-foreground space-x-4">
                        <span>📅 {new Date(log.timestamp).toLocaleString()}</span>
                        {log.ip && <span>🌐 {log.ip}</span>}
                        {log.city && log.country && <span>📍 {log.city}, {log.country}</span>}
                        {log.browser && <span>💻 {log.browser}</span>}
                        {log.user_id && <span>👤 {log.user_id}</span>}
                      </div>
                      {log.url && (
                        <div className="text-xs text-muted-foreground">
                          🔗 {log.url}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💡 Pro Tip: Use Vercel Toolbar</CardTitle>
          <CardDescription>
            For real-time logs with full details, add <code className="bg-muted px-2 py-1 rounded">?vercelToolbar=1</code> to your URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The Vercel Toolbar gives you access to:
          </p>
          <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
            <li>Real-time logs with IP, location, and browser info</li>
            <li>Console output in production</li>
            <li>Network request monitoring</li>
            <li>Performance metrics</li>
            <li>Environment information</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
