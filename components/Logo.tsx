import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="logoTitle"
    >
      <title id="logoTitle">Healthcare Assistant Logo</title>
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="text-primary-400 stop-color" />
          <stop offset="100%" className="text-primary-600 stop-color" />
        </linearGradient>
      </defs>
      <style>
      {`
        .stop-color { stop-color: currentColor; }
      `}
      </style>
      <path
        fill="url(#logoGradient)"
        d="M100,0 C44.8,0,0,44.8,0,100s44.8,100,100,100s100-44.8,100-100S155.2,0,100,0z M150,112.5h-37.5V150h-25v-37.5H50v-25h37.5V50h25v37.5H150V112.5z"
      />
    </svg>
  );
};

export default Logo;
