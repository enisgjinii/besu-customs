'use client';

import { useState, useEffect } from 'react';
import { errorLogger } from '@/lib/error-logger';
import type { ErrorLog } from '@/lib/error-logger';

/**
 * Logs Viewer Component
 * Displays recent logs from the client-side logger
 * Note: For full logs, check Vercel dashboard
 */
export function LogsViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Get logs from the logger
    const allLogs = errorLogger.getLogs();
    setLogs(allLogs);

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      const updatedLogs = errorLogger.getLogs();
      setLogs(updatedLogs);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'error': return 'bg-red-500 text-white';
      case 'warn': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      case 'debug': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const exportLogs = () => {
    const data = errorLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Client-Side Logs</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recent logs from this session. For complete logs with IP and geolocation, check Vercel dashboard.
        </p>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          All ({logs.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-4 py-2 rounded ${filter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Critical ({logs.filter(l => l.level === 'critical').length})
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`px-4 py-2 rounded ${filter === 'error' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Errors ({logs.filter(l => l.level === 'error').length})
        </button>
        <button
          onClick={() => setFilter('warn')}
          className={`px-4 py-2 rounded ${filter === 'warn' ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Warnings ({logs.filter(l => l.level === 'warn').length})
        </button>
        <button
          onClick={() => setFilter('info')}
          className={`px-4 py-2 rounded ${filter === 'info' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Info ({logs.filter(l => l.level === 'info').length})
        </button>
        <button
          onClick={exportLogs}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 ml-auto"
        >
          Export Logs
        </button>
        <button
          onClick={() => errorLogger.clearLogs()}
          className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Clear Logs
        </button>
      </div>

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs to display
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${getLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{log.message}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex gap-4 flex-wrap">
                      <span>📍 {log.geoLocation?.city || 'Unknown'}, {log.geoLocation?.country || 'Unknown'}</span>
                      <span>🌐 {log.clientInfo.ip || 'Unknown IP'}</span>
                      <span>💻 {log.clientInfo.browser} on {log.clientInfo.os}</span>
                      <span>📱 {log.clientInfo.device}</span>
                    </div>
                    
                    {log.url && (
                      <div className="text-xs">🔗 {log.url}</div>
                    )}
                    
                    {log.userId && (
                      <div className="text-xs">👤 User: {log.userId}</div>
                    )}
                    
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400">
                          View Stack Trace
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                    
                    {log.additionalData && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400">
                          View Additional Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.additionalData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
