"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, Github, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface IntegrationStatus {
  composio_enabled: boolean;
  connected_tools: string[];
  available_actions: {
    [tool: string]: string[];
  };
}

const TOOL_CONFIG = {
  calendar: {
    name: 'Google Calendar',
    icon: Calendar,
    description: 'Analyze meeting load and detect burnout signals',
    color: 'bg-blue-500',
  },
  slack: {
    name: 'Slack',
    icon: MessageSquare,
    description: 'Track communication patterns and overload',
    color: 'bg-purple-500',
  },
  github: {
    name: 'GitHub',
    icon: Github,
    description: 'Monitor code activity and collaboration',
    color: 'bg-gray-800',
  },
};

export default function ConnectedTools() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('/api/v1/tools/status', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch integration status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (tool: string) => {
    toast.info(`Visit Marketplace to manage ${tool} connections`, {
      description: 'Go to Settings > Marketplace to set up integrations.',
    });
  };

  const handleDisconnect = async (tool: string) => {
    toast.info(`Visit Marketplace to manage ${tool} connections`, {
      description: 'Go to Settings > Marketplace to disconnect integrations.',
    });
  };

  const handleTestTool = async (tool: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (tool === 'calendar') {
        const response = await fetch('/api/v1/tools/calendar/analyze', {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ days: 7 }),
        });

        if (!response.ok) {
          throw new Error('Calendar test failed');
        }

        const data = await response.json();
        alert(`Calendar Test Success!\n\nMeetings: ${data.metrics?.total_meetings}\nTotal Hours: ${data.metrics?.total_hours}h\nRisk Level: ${data.risk_assessment?.level}`);
      }
    } catch (err) {
      alert(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading integrations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-red-500">
            <XCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isComposioEnabled = status?.composio_enabled ?? false;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Tools</CardTitle>
              <CardDescription>
                External integrations that enhance Sentinel&apos;s insights
              </CardDescription>
            </div>
            <Badge variant={isComposioEnabled ? "default" : "secondary"}>
              {isComposioEnabled ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        {!isComposioEnabled && (
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Composio integration is not configured. Set <code className="bg-yellow-100 px-1 py-0.5 rounded">COMPOSIO_API_KEY</code> in your environment to enable external tools.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open('https://composio.dev', '_blank')}
              >
                Get Composio API Key
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tool Cards */}
      {isComposioEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(TOOL_CONFIG).map(([toolKey, config]) => {
            const IconComponent = config.icon;
            const isConnected = status?.connected_tools.includes(toolKey) ?? false;
            const actions = status?.available_actions[toolKey] || [];

            return (
              <Card key={toolKey}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${config.color} bg-opacity-10`}>
                        <IconComponent className={`h-5 w-5 ${config.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{config.name}</CardTitle>
                      </div>
                    </div>
                    <Badge variant={isConnected ? "default" : "outline"} className="text-xs">
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2 text-xs">
                    {config.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {isConnected ? (
                    <div className="space-y-3">
                      {/* Available Actions */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Available Actions:</p>
                        <div className="flex flex-wrap gap-1">
                          {actions.map((action) => (
                            <Badge key={action} variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestTool(toolKey)}
                          className="flex-1 text-xs"
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDisconnect(toolKey)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(toolKey)}
                      className="w-full text-xs"
                    >
                      Connect {config.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      {isComposioEnabled && (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How it works</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Connected tools enhance AI insights with real-time data</li>
                <li>• Ask Sentinel: &quot;How many meetings do I have this week?&quot;</li>
                <li>• Calendar integration detects burnout from meeting overload</li>
                <li>• All data stays private and follows your permission settings</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
