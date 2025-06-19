import React from "react";

const PurpleBackground: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* Main glossy gradient */}
      <linearGradient id="glossyPurple" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FF66FF', stopOpacity: 1 }} />
        <stop offset="15%" style={{ stopColor: '#E055E0', stopOpacity: 1 }} />
        <stop offset="40%" style={{ stopColor: '#C044C0', stopOpacity: 1 }} />
        <stop offset="60%" style={{ stopColor: '#A033A0', stopOpacity: 1 }} />
        <stop offset="80%" style={{ stopColor: '#802280', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#601160', stopOpacity: 1 }} />
      </linearGradient>
      {/* Top highlight for glossy effect */}
      <linearGradient id="topHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.4 }} />
        <stop offset="30%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.2 }} />
        <stop offset="50%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
      </linearGradient>
      {/* Bottom shine */}
      <linearGradient id="bottomShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        <stop offset="70%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        <stop offset="85%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.1 }} />
        <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.3 }} />
      </linearGradient>
    </defs>
    {/* Base purple gradient */}
    <rect width="100%" height="100%" fill="url(#glossyPurple)" />
    {/* Top glossy highlight */}
    <rect width="100%" height="50%" fill="url(#topHighlight)" />
    {/* Bottom subtle shine */}
    <rect width="100%" height="30%" y="70%" fill="url(#bottomShine)" />
  </svg>
);

export default PurpleBackground; 