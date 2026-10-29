import React from 'react';

export const AiRobotIllustration = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0">
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-600/30 to-indigo-500/20 blur-xl animate-pulse" />
        
        {/* Robot Head SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <defs>
            <linearGradient id="headGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="50%" stopColor="#6D28D9" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="visorGradCompact" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B1220" />
              <stop offset="100%" stopColor="#06080F" />
            </linearGradient>
            <linearGradient id="earGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          {/* Headset Band */}
          <path d="M 22 50 C 22 24, 78 24, 78 50" fill="none" stroke="url(#headGradCompact)" strokeWidth="6" strokeLinecap="round" />

          {/* Head Body */}
          <circle cx="50" cy="50" r="30" fill="url(#headGradCompact)" />

          {/* Dark Glass Visor Screen */}
          <rect x="28" y="36" width="44" height="26" rx="12" fill="url(#visorGradCompact)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Cyan Glowing Eyes */}
          <ellipse cx="41" cy="48" rx="3.5" ry="4" fill="#06B6D4" className="animate-pulse" />
          <ellipse cx="59" cy="48" rx="3.5" ry="4" fill="#06B6D4" className="animate-pulse" />

          {/* Cute Smile */}
          <path d="M 46 54 Q 50 58 54 54" fill="none" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" />

          {/* Glowing Headset Ear Cups */}
          <rect x="16" y="42" width="8" height="18" rx="4" fill="url(#earGradCompact)" filter="drop-shadow(0 0 6px #06B6D4)" />
          <rect x="76" y="42" width="8" height="18" rx="4" fill="url(#earGradCompact)" filter="drop-shadow(0 0 6px #8B5CF6)" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-72 sm:w-80 h-72 sm:h-80 flex items-center justify-center select-none">
      {/* Background Multi-layer Ambient Lighting */}
      <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-500/15 via-purple-600/25 to-pink-500/15 blur-3xl pointer-events-none" />
      <div className="absolute w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

      {/* Floating Mini Chart 1 (Top Left Line Graph) */}
      <div className="absolute -top-2 left-2 z-20 p-2.5 rounded-xl bg-[#0E1628]/90 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md transform -rotate-6 animate-pulse" style={{ animationDuration: '6s' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-[9px] font-mono font-bold text-slate-300">Revenue Trend</span>
        </div>
        <svg width="64" height="28" viewBox="0 0 64 28" fill="none">
          <path d="M2 24 L16 16 L28 20 L42 8 L62 4" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
          <path d="M2 24 L16 16 L28 20 L42 8 L62 4 V 28 H 2 Z" fill="url(#miniLineGrad)" opacity="0.3" />
          <defs>
            <linearGradient id="miniLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Mini Chart 2 (Middle Left Donut) */}
      <div className="absolute bottom-6 -left-3 z-20 p-2.5 rounded-xl bg-[#0E1628]/90 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md transform -rotate-3">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#6366F1"
                strokeWidth="4"
                strokeDasharray="60, 100"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="4"
                strokeDasharray="30, 100"
                strokeDashoffset="-60"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#EC4899"
                strokeWidth="4"
                strokeDasharray="10, 100"
                strokeDashoffset="-90"
              />
            </svg>
          </div>
          <div>
            <p className="text-[8px] font-mono text-slate-400">Categories</p>
            <p className="text-[10px] font-bold text-white">DuckDB Fast</p>
          </div>
        </div>
      </div>

      {/* Speech Bubble (Top Right) */}
      <div className="absolute -top-1 right-1 z-20 px-3 py-1.5 rounded-2xl bg-[#111C30]/95 border border-purple-500/30 shadow-[0_4px_20px_rgba(139,92,246,0.3)] backdrop-blur-md transform rotate-2">
        <p className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
          <span>Ask questions in plain English</span>
        </p>
        <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-[#111C30] border-r border-b border-purple-500/30 transform rotate-45" />
      </div>

      {/* Floating Mini Table Card (Bottom Right) */}
      <div className="absolute -bottom-1 right-2 z-20 p-2.5 rounded-xl bg-[#0E1628]/90 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md transform rotate-6">
        <div className="space-y-1 w-24">
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 border-b border-white/[0.08] pb-0.5">
            <span>Product</span>
            <span>Sales</span>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-300">
            <span className="truncate max-w-[45px]">MacBook</span>
            <span className="text-cyan-400 font-bold">$186K</span>
          </div>
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
            <span className="truncate max-w-[45px]">iPhone</span>
            <span className="text-purple-400 font-bold">$142K</span>
          </div>
        </div>
      </div>

      {/* Main 3D Spherical Robot Character */}
      <div className="relative z-10 w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-[0_0_35px_rgba(139,92,246,0.55)]">
          <defs>
            {/* Robot Head Metallic Gradient */}
            <radialGradient id="headSphere" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="25%" stopColor="#7C3AED" />
              <stop offset="65%" stopColor="#4C1D95" />
              <stop offset="100%" stopColor="#2E1065" />
            </radialGradient>

            {/* Dark Visor Reflection Gradient */}
            <linearGradient id="visorScreen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="60%" stopColor="#0B1220" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Cyan Ear Radiance */}
            <radialGradient id="earCyan" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="60%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#0E7490" />
            </radialGradient>

            {/* Headset Arc Gradient */}
            <linearGradient id="headsetArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>

          {/* Overhead Headband */}
          <path
            d="M 32 80 C 32 30, 128 30, 128 80"
            fill="none"
            stroke="url(#headsetArc)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Robot Head Sphere */}
          <circle cx="80" cy="80" r="48" fill="url(#headSphere)" />

          {/* Ambient Rim Light highlight on head */}
          <ellipse cx="68" cy="50" rx="22" ry="10" fill="rgba(255,255,255,0.2)" transform="rotate(-15 68 50)" />

          {/* Visor Bezel */}
          <rect x="42" y="56" width="76" height="46" rx="20" fill="url(#visorScreen)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />

          {/* Visor Glass Flare */}
          <path d="M 48 64 Q 80 60 112 64" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Cute Cyan Smiling Eyes (Curved Arcs / Circles) */}
          <ellipse cx="62" cy="76" rx="5.5" ry="6.5" fill="#22D3EE" filter="drop-shadow(0 0 6px #06B6D4)" />
          <ellipse cx="98" cy="76" rx="5.5" ry="6.5" fill="#22D3EE" filter="drop-shadow(0 0 6px #06B6D4)" />
          <circle cx="64" cy="74" r="1.8" fill="#FFFFFF" />
          <circle cx="100" cy="74" r="1.8" fill="#FFFFFF" />

          {/* Cute Happy Smile */}
          <path
            d="M 72 88 Q 80 95 88 88"
            fill="none"
            stroke="#22D3EE"
            strokeWidth="3"
            strokeLinecap="round"
            filter="drop-shadow(0 0 4px #06B6D4)"
          />

          {/* Glowing Headset Ear Cups */}
          <rect x="22" y="65" width="12" height="30" rx="6" fill="url(#earCyan)" filter="drop-shadow(0 0 10px #06B6D4)" />
          <circle cx="28" cy="80" r="3.5" fill="#FFFFFF" opacity="0.8" />

          <rect x="126" y="65" width="12" height="30" rx="6" fill="url(#earCyan)" filter="drop-shadow(0 0 10px #8B5CF6)" />
          <circle cx="132" cy="80" r="3.5" fill="#FFFFFF" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
};

export default AiRobotIllustration;

