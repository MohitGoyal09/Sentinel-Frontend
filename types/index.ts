import type React from 'react';

// ============================================
// Risk Level Types
// ============================================
export type RiskLevel = 'CALIBRATING' | 'LOW' | 'ELEVATED' | 'CRITICAL';

const RISK_LEVELS: readonly RiskLevel[] = ['CALIBRATING', 'LOW', 'ELEVATED', 'CRITICAL'];

/** Safely cast an API string to RiskLevel, defaulting to 'CALIBRATING' if unknown. */
export function toRiskLevel(value: string | undefined | null): RiskLevel {
  if (value && RISK_LEVELS.includes(value as RiskLevel)) return value as RiskLevel;
  return 'CALIBRATING';
}

// ============================================
// API Response Types
// ============================================
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MeResponse {
  user: {
    user_hash: string;
    role: string;
    consent_share_with_manager: boolean;
    consent_share_anonymized: boolean;
    monitoring_paused_until: string | null;
  };
  risk: any;
  audit_trail: Array<{
    action: string;
    timestamp: string;
    details: any;
  }>;
  monitoring_status: {
    is_paused: boolean;
    paused_until: string | null;
  };
}

// ============================================
// Safety Valve Types
// ============================================
export interface SafetyValveData {
  user_hash: string;
  risk_level: RiskLevel;
  velocity: number;
  confidence: number;
  belongingness_score: number;
  circadian_entropy: number;
  indicators: Record<string, boolean>;
  nudge_status?: string;
}

// ============================================
// Nudge Types
// ============================================
export interface NudgeData {
  user_hash: string;
  nudge_type: string;
  message: string;
  risk_level: RiskLevel;
  actions: Array<{
    label: string;
    action: string;
  }>;
}

// ============================================
// History Types
// ============================================
export interface HistoryPoint {
  timestamp: string;
  date: string;
  risk_level: RiskLevel;
  velocity: number;
  confidence: number;
  belongingness_score: number;
}

// ============================================
// Talent Scout Types
// ============================================
export interface TalentScoutPerformer {
  user_hash: string;
  betweenness: number;
  eigenvector: number;
  unblocking: number;
  is_hidden_gem: boolean;
}

export interface TalentScoutData {
  engine: string;
  top_performers: TalentScoutPerformer[];
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface TeamMetrics {
  total_members: number;
  healthy_count: number;
  elevated_count: number;
  critical_count: number;
  calibrating_count: number;
  avg_velocity: number;
  graph_fragmentation: number;
  comm_decay_rate: number;
  contagion_risk: RiskLevel;
}

// ============================================
// Culture Thermometer Types
// ============================================
export interface CultureThermometerMetrics {
  avg_velocity: number;
  critical_members: number;
  graph_fragmentation: number;
  comm_decay_rate: number;
  total_members?: number;
  team_size?: number;
  member_count?: number;
  critical_count?: number;
}

export interface CultureThermometerData {
  engine: string;
  team_risk: string;
  metrics: CultureThermometerMetrics;
  recommendation: string;
}

// ============================================
// Network Visualization Types
// ============================================
export interface NetworkNode {
  id: string;
  label: string;
  risk_level: RiskLevel;
  betweenness?: number;
  unblocking_count?: number;
  is_hidden_gem?: boolean;
  eigenvector?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  edge_type: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

// ============================================
// Simulation Types
// ============================================
export type PersonaType = 'alex_burnout' | 'sarah_gem' | 'jordan_steady' | 'maria_contagion';

export interface SimulationEvent {
  id?: string;
  user_hash: string;
  timestamp: string;
  event_type: string;
  metadata: Record<string, unknown>;
  description?: string;
  risk_impact?: string;
}

/**
 * Lightweight event type for the ActivityFeed component.
 * Unlike SimulationEvent, this doesn't require user_hash or metadata.
 */
export interface ActivityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  description: string;
  risk_impact?: string;
}

export interface UserSummary {
  user_hash: string;
  name?: string;
  role?: string;
  risk_level?: string;
  velocity?: number;
  confidence?: number;
  updated_at?: string;
}

export interface CreatePersonaResponse {
  user_hash: string;
  events_created: number;
}

export interface SimulationData {
  user_hash: string;
  events_count: number;
  persona: string;
}

export interface InjectEventResponse {
  event_id: string;
  user_hash: string;
  risk_changed: boolean;
  new_risk_level: RiskLevel;
}

export interface RealtimeEventData {
  new_event: SimulationEvent;
  updated_risk: SafetyValveData;
}

// ============================================
// WebSocket Types
// ============================================
export type WebSocketMessageType = 'pong' | 'manual_refresh' | 'risk_update' | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp?: string;
  data?: SafetyValveData;
}

export interface WebSocketSendMessage {
  action: 'ping' | 'request_update';
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

// ============================================
// Context Enricher Types
// ============================================
export interface ContextCheckData {
  is_explained: boolean;
  explanation: string;
  sources: string[];
}

// ============================================
// Component Props Types
// ============================================

// Layout Components
export interface SidebarProps {
  className?: string;
}

export interface HeaderProps {
  userHash?: string;
  connectionStatus: ConnectionStatus;
}

// Dashboard Components
export interface RiskMeterProps {
  riskLevel: RiskLevel;
  velocity: number;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  status?: RiskLevel;
}

export interface TimelineChartProps {
  data: Array<{
    timestamp: string;
    risk_level: RiskLevel;
    velocity: number;
  }>;
}

export interface ConnectionStatusProps {
  status: ConnectionStatus;
  lastPing?: Date;
}

// Network Components
export interface ForceGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  width: number;
  height: number;
  onNodeClick?: (node: NetworkNode) => void;
  selectedNode?: string | null;
}

export interface NetworkNodeProps {
  node: NetworkNode;
  isSelected: boolean;
  onClick: () => void;
}

export interface NodeDetailsProps {
  node: NetworkNode | null;
  onClose: () => void;
}

// Simulation Components
export interface PersonaCreatorProps {
  onCreatePersona: (personaType: PersonaType, email: string) => Promise<void>;
  isLoading: boolean;
}

export interface EventInjectorProps {
  userHash: string;
  currentRisk: RiskLevel;
  onInjectEvent: (userHash: string, currentRisk: RiskLevel) => Promise<void>;
  isLoading: boolean;
}

export interface ActivityFeedProps {
  events: SimulationEvent[];
  maxItems?: number;
}

// Team Components
export interface CultureThermometerProps {
  teamRisk: RiskLevel;
  metrics: CultureThermometerMetrics;
  recommendation?: string;
}

export interface MemberListProps {
  members: Array<{
    user_hash: string;
    risk_level: RiskLevel;
    betweenness: number;
    is_hidden_gem: boolean;
  }>;
}

export interface RiskBadgeProps {
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Shared Components
export interface RiskIndicatorProps {
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

// ============================================
// App Context Types
// ============================================
export interface AppState {
  selectedUserHash: string | null;
  setSelectedUserHash: (hash: string | null) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

// ============================================
// Hook Return Types
// ============================================
export interface UseRiskDataReturn {
  data: SafetyValveData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseNetworkDataReturn {
  data: TalentScoutData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseTeamDataReturn {
  data: CultureThermometerData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface RiskIndicators {
  overwork: boolean;
  isolation: boolean;
  fragmentation: boolean;
  late_night_pattern: boolean;
  weekend_work: boolean;
  communication_decline: boolean;
}

export interface Employee {
  user_hash: string;
  name: string;
  role: string;
  risk_level: RiskLevel;
  velocity: number;
  confidence: number;
  belongingness_score: number;
  circadian_entropy: number;
  updated_at: string;
  persona: string;
  indicators: RiskIndicators;
}

export interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  lastMessage: WebSocketMessage | null;
  lastPing: Date | null;
  requestUpdate: () => void;
}

export interface UseSimulationReturn {
  createPersona: (email: string, personaType: PersonaType) => Promise<CreatePersonaResponse>;
  injectEvent: (userHash: string, eventType: string, metadata?: Record<string, unknown>) => Promise<InjectEventResponse>;
  isCreating: boolean;
  isInjecting: boolean;
  events: SimulationEvent[];
  error: Error | null;
  clearEvents: () => void;
}
