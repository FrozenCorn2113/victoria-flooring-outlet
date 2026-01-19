// components/CountdownTimer.js

import { useState, useEffect } from 'react';

export function CountdownTimer({ targetDay = 1, className = '' }) {
  // targetDay: 0 = Sunday, 1 = Monday, etc.
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Get the next target day at midnight
      const nextTarget = new Date(now);

      // Calculate days until next target day
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;

      // If we're past the target day this week, or it's the target day but past midnight
      if (daysUntil < 0 || (daysUntil === 0 && now.getHours() > 0)) {
        daysUntil += 7;
      }

      // Set to next target day at midnight
      nextTarget.setDate(now.getDate() + daysUntil);
      nextTarget.setHours(0, 0, 0, 0);

      const difference = nextTarget.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDay]);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center" aria-label={`${value} ${label}`}>
      <div className="bg-vfo-charcoal px-3 py-2 md:px-3.5 md:py-2.5 rounded shadow-md min-w-[48px] md:min-w-[56px]">
        <span className="text-xl md:text-2xl font-semibold text-white tabular-nums" aria-hidden="true">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] md:text-xs uppercase tracking-wider text-vfo-charcoal mt-1.5 font-medium" aria-hidden="true">
        {label}
      </span>
    </div>
  );

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={className}>
        <div className="flex items-center gap-1.5 md:gap-2">
          <TimeUnit value={0} label="Days" />
          <span className="text-lg md:text-xl text-vfo-grey font-light">:</span>
          <TimeUnit value={0} label="Hours" />
          <span className="text-lg md:text-xl text-vfo-grey font-light">:</span>
          <TimeUnit value={0} label="Mins" />
          <span className="text-lg md:text-xl text-vfo-grey font-light">:</span>
          <TimeUnit value={0} label="Secs" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Time remaining until next deal"
    >
      <div className="flex items-center gap-1.5 md:gap-2">
        <TimeUnit value={timeLeft.days} label="Days" />
        <span className="text-lg md:text-xl text-vfo-grey font-light" aria-hidden="true">:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <span className="text-lg md:text-xl text-vfo-grey font-light" aria-hidden="true">:</span>
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <span className="text-lg md:text-xl text-vfo-grey font-light" aria-hidden="true">:</span>
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </div>
      {/* Screen reader announcement */}
      <span className="sr-only">
        {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes} minutes, and {timeLeft.seconds} seconds remaining
      </span>
    </div>
  );
}
