'use client';

import { useState, useEffect, useRef } from 'react';
import type { SystemEvent } from '@/app/api/events/route';
import type { ProcessEntry } from '@/app/api/processes/route';
import type { PowerData } from '@/app/api/power/route';

export type { SystemEvent, ProcessEntry, PowerData };

export interface MetricsData {
  cpu: { usedPercent: number; cores: number; model: string; loadAvg: number[] };
  memory: { total: number; used: number; free: number; usedPercent: number };
  disk: Array<{ total: number; used: number; available: number; usedPercent: number; mount: string }>;
  uptime: number;
  hostname: string;
  platform: string;
  timestamp: string;
  history?: Array<{ ts: string; cpu: number; mem: number }>;
}

export interface HardwareData {
  cpuTemps: Array<{ zone: string; type: string; celsius: number }>;
  swap: { total: number; used: number; free: number; cached: number; usedPercent: number };
  timestamp: string;
}

export interface ServiceStatus { name: string; running: boolean; error?: string }
export interface CronJob {
  id: string; name: string; enabled: boolean; state: string; schedule: string;
  nextRun: string | null; lastRunAt: string | null; lastStatus: string | null;
  lastError: string | null; model: string | null; provider: string | null;
  script: string | null; noAgent: boolean;
}
export interface OpenPort { protocol: string; port: number; address: string; process: string }
export interface TcpConnection { local: string; remote: string; process: string }
export interface DockerContainer { id: string; name: string; image: string; status: string; ports: string }
export interface StatusData {
  ip: string; timestamp: string; services: ServiceStatus[];
  cronJobs: CronJob[]; openPorts: OpenPort[];
  tcpConnections: TcpConnection[]; dockerContainers: DockerContainer[];
}

export function useSystemData() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [processes, setProcesses] = useState<ProcessEntry[]>([]);
  const [hardware, setHardware] = useState<HardwareData | null>(null);
  const [power, setPower] = useState<PowerData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    destroyedRef.current = false;

    function connect() {
      if (destroyedRef.current) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/data`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          switch (type) {
            case 'metrics':   setMetrics(data);   break;
            case 'processes': setProcesses(data); break;
            case 'hardware':  setHardware(data);  break;
            case 'power':     setPower(data);     break;
            case 'status':    setStatus(data);    break;
            case 'events':    setEvents(data);    break;
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        if (!destroyedRef.current) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      destroyedRef.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { metrics, processes, hardware, power, status, events, connected };
}
