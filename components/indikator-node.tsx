'use client';

import { useEffect, useState, useRef } from 'react';
import { Cpu, HardDrive, Network, Globe } from 'lucide-react';

export default function KomponenStatistik() {
  const [lebarCpu, setLebarCpu] = useState('0%');
  const [lebarMemori, setLebarMemori] = useState('0%');
  const elemenRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setLebarCpu('39%');
          setLebarMemori('56.2%');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (elemenRef.current) {
      observer.observe(elemenRef.current);
    }

    return () => {
      if (elemenRef.current) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div 
      ref={elemenRef}
      className="w-full max-w-lg mx-auto p-6 bg-[#050505] border border-red-900/30 rounded-2xl text-white font-sans shadow-[0_0_30px_rgba(220,38,38,0.05)]"
    >
      
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1a0505] rounded-xl border border-red-900/50">
            <Cpu className="w-6 h-6 text-red-500" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-white tracking-wide">INTEL XEON V4</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-sm text-red-400 font-medium">Server Indonesia</span>
            </div>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-[#111] rounded-md border border-zinc-800">
          <span className="text-xs text-zinc-500 font-mono tracking-wider">Server Aktif</span>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-zinc-500 tracking-widest">RAM MEMORY</span>
            <span className="text-sm font-bold text-white">39.04 GB / 64 GB</span>
          </div>
          <div className="w-full h-2.5 bg-[#111] rounded-full overflow-hidden border border-zinc-800/80">
            <div 
              style={{ width: lebarCpu }} 
              className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-zinc-500 tracking-widest">STORAGE ALLOCATION</span>
            <span className="text-sm font-bold text-white">112.4 GB / 200 GB</span>
          </div>
          <div className="w-full h-2.5 bg-[#111] rounded-full overflow-hidden border border-zinc-800/80">
            <div 
              style={{ width: lebarMemori }} 
              className="h-full bg-gradient-to-r from-red-800 to-red-400 rounded-full transition-all duration-1000 ease-out"
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center p-5 bg-[#0a0a0a] rounded-xl border border-zinc-800/60">
          <Network className="w-6 h-6 text-red-500 mb-3" strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-zinc-600 tracking-widest mb-1">NETWORK</span>
          <span className="text-sm font-bold text-white">900 Mbps</span>
        </div>
        
        <div className="flex flex-col items-center justify-center p-5 bg-[#0a0a0a] rounded-xl border border-zinc-800/60">
          <HardDrive className="w-6 h-6 text-red-500 mb-3" strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-zinc-600 tracking-widest mb-1">RAM</span>
          <span className="text-sm font-bold text-white">64 GB</span>
        </div>
        
        <div className="flex flex-col items-center justify-center p-5 bg-[#0a0a0a] rounded-xl border border-zinc-800/60">
          <Cpu className="w-6 h-6 text-red-500 mb-3" strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-zinc-600 tracking-widest mb-1">VCPU</span>
          <span className="text-sm font-bold text-white">16 CORE</span>
        </div>
      </div>
      
    </div>
  );
}
