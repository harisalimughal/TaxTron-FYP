import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(0.3);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Initial animation sequence
    const timer1 = setTimeout(() => {
      setOpacity(1);
    }, 100);

    const timer2 = setTimeout(() => {
      setScale(1.2);
    }, 500);

    const timer3 = setTimeout(() => {
      setRotation(360);
    }, 800);

    const timer4 = setTimeout(() => {
      setScale(1);
    }, 1200);

    const timer5 = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    const timer6 = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="text-center">
        {/* Logo Container */}
        <div className="relative mb-8">
          <div
            className="transition-all duration-1000 ease-out"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              opacity: opacity,
            }}
          >
            <img
              src="/TaxTron-Logo.png"
              alt="TaxTron Logo"
              className="w-48 h-48 mx-auto drop-shadow-2xl"
            />
          </div>
        </div>

        {/* App Name */}
        <div
          className="transition-all duration-1000 ease-out"
          style={{
            opacity: opacity,
            transform: `translateY(${scale >= 1 ? '0' : '20px'})`,
          }}
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-2">TaxTron</h1>
          <p className="text-xl text-gray-600 mb-4">Blockchain Vehicle Registration & Taxation</p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-3 mt-8">
          <div
            className="w-4 h-4 rounded-full animate-bounce"
            style={{
              backgroundColor: '#8CC152',
              animationDelay: '0ms',
            }}
          />
          <div
            className="w-4 h-4 rounded-full animate-bounce"
            style={{
              backgroundColor: '#8CC152',
              animationDelay: '150ms',
            }}
          />
          <div
            className="w-4 h-4 rounded-full animate-bounce"
            style={{
              backgroundColor: '#8CC152',
              animationDelay: '300ms',
            }}
          />
        </div>

        {/* Loading Text */}
        <p className="text-base text-gray-500 mt-4 animate-pulse">
          Initializing secure blockchain connection...
        </p>
      </div>

    </div>
  );
};

export default SplashScreen;
