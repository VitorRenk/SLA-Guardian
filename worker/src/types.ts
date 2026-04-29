/**
 * 📋 Definições de Tipos Compartilhadas
 */

export interface ServiceCheckResult {
  success: boolean;
  status?: number;
  duration?: number;
  error?: string;
}

export interface AlertStatus {
  service: string;
  failures: number;
  lastAlert?: Date;
}

export interface MonitorConfig {
  targetUrl: string;
  secondaryUrl?: string;
  checkInterval: number; // ms
  timeout: number; // ms
  maxRetries: number;
}

export enum AlertStatus {
  FAILURE = "failure",
  RECOVERED = "recovered",
  DEGRADED = "degraded",
}
