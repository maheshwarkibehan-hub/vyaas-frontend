import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

import { toast } from 'sonner';

interface MetricsPanelProps {
    timeLeft: number | null;
}

interface SystemStats {
    cpu: number;
    memory: number;
    disk: number;
    processes: { name: string; cpu: string }[];
}

export function MetricsPanel({ timeLeft }: MetricsPanelProps) {
    const [stats, setStats] = useState<SystemStats>({
        cpu: 0,
        memory: 0,
        disk: 0,
        processes: [
            { name: 'System', cpu: '0%' },
            { name: 'Idle', cpu: '0%' }
        ]
    });

    const room = useRoomContext();

    useEffect(() => {
        const handleData = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
            if (topic === "system_metrics") {
                try {
                    const decoder = new TextDecoder();
                    const str = decoder.decode(payload);
                    const data = JSON.parse(str);

                    if (data.type === "system_metrics") {
                        setStats({
                            cpu: data.cpu,
                            memory: data.memory,
                            disk: data.disk,
                            processes: data.processes.map((p: any) => ({
                                name: p.name,
                                cpu: `${p.cpu_percent ? p.cpu_percent.toFixed(1) : '0'}%`
                            }))
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse system metrics:", e);
                }
            } else if (topic === "system_alert") {
                try {
                    const decoder = new TextDecoder();
                    const str = decoder.decode(payload);
                    const data = JSON.parse(str);

                    if (data.type === "system_alert" && data.message) {
                        toast.error("System Alert", {
                            description: data.message,
                            duration: 8000
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse alert:", e);
                }
            }
        };

        room.on(RoomEvent.DataReceived, handleData);
        return () => { room.off(RoomEvent.DataReceived, handleData); };
    }, [room]);

    const timeDisplay = timeLeft !== null
        ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
        : '∞';

    return (
        <div className="flex flex-col gap-3 p-4 rounded-3xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md shadow-inner shadow-white/5 h-full font-mono">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-white/90 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                    <Activity size={12} className="text-neon-green" />
                    System Metrics
                </h3>
                <div className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_#4ade80]" />
            </div>

            {/* Timer Section */}
            <div className="relative bg-[#252525]/80 backdrop-blur-xl rounded-2xl p-3 border border-white/20 overflow-hidden group hover:border-white/30 transition-colors duration-500 shadow-[0_0_8px_rgba(255,255,255,0.02)] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/3 before:to-transparent before:pointer-events-none">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <Clock size={40} />
                </div>
                <div className="text-white/40 text-[9px] font-bold uppercase mb-1 tracking-wider">Session Time</div>
                <div className={cn(
                    "text-3xl font-bold text-white mb-2 tracking-tight",
                    timeLeft !== null && timeLeft < 60 && "text-red-500 animate-pulse"
                )}>
                    {timeDisplay}
                </div>
                <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-neon-green shadow-[0_0_8px_#4ade80]" style={{ width: timeLeft ? `${(timeLeft / 300) * 100}%` : '100%' }} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* CPU Load */}
                <div className="relative bg-[#252525]/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 hover:border-white/30 transition-all duration-300 overflow-hidden group shadow-[0_0_8px_rgba(255,255,255,0.02)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/3 before:to-transparent before:pointer-events-none">
                    <div className="text-white/40 text-[9px] font-bold uppercase mb-1 tracking-wider flex items-center gap-1"><Cpu size={10} /> CPU</div>
                    <div className="text-xl font-bold text-white/90">{stats.cpu.toFixed(0)}%</div>
                </div>

                {/* RAM Usage */}
                <div className="relative bg-[#252525]/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 hover:border-white/30 transition-all duration-300 overflow-hidden group shadow-[0_0_8px_rgba(255,255,255,0.02)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/3 before:to-transparent before:pointer-events-none">
                    <div className="text-white/40 text-[9px] font-bold uppercase mb-1 tracking-wider flex items-center gap-1"><HardDrive size={10} /> RAM</div>
                    <div className="text-xl font-bold text-white/90">{stats.memory.toFixed(0)}%</div>
                </div>

                {/* Disk Usage */}
                <div className="relative bg-[#252525]/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 hover:border-white/30 transition-all duration-300 overflow-hidden group col-span-2 shadow-[0_0_8px_rgba(255,255,255,0.02)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/3 before:to-transparent before:pointer-events-none">
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-white/40 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><HardDrive size={10} /> DISK</div>
                        <div className="text-white/90 text-xs font-bold">{stats.disk.toFixed(0)}%</div>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-500" style={{ width: `${stats.disk}%` }} />
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Top Processes</span>
                </div>

                <div className="space-y-1.5">
                    {stats.processes.map((proc, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1 last:border-0 last:pb-0 hover:bg-white/5 p-1 rounded transition-colors cursor-default">
                            <span className="text-white/70 font-medium truncate max-w-[120px]">{proc.name}</span>
                            <span className="font-mono text-neon-green">{proc.cpu}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
