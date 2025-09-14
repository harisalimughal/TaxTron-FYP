import React from 'react';

const TaxTronLogo = ({ size = '2xl', showText = false, className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
    '3xl': 'w-24 h-24',
    '4xl': 'w-32 h-32',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl',
    '4xl': 'text-5xl',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/TaxTron-Logo.png"
        alt="TaxTron Logo"
        className={`${sizeClasses[size]} drop-shadow-sm`}
      />
      {showText && (
        <span className={`ml-3 font-bold text-gray-900 ${textSizes[size]}`}>
          TaxTron
        </span>
      )}
    </div>
  );
};

export default TaxTronLogo;
