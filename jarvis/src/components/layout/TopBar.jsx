import { useEffect, useState } from 'react';
import { MessageSquare, Cpu, Clock } from 'lucide-react';

/**
 * TopBar - JARVIS status, model indicator, system stats
 * Based on Master Plan v1.0 Section 3.5
 */
export default function TopBar({ bridgeHealth, modelName = 'MiniMax M2.5' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusDotClass = () => {
    if (!bridgeHealth || bridgeHealth.status !== 'online') return 'offline';
    return '';
  };

  const getStatusText = () => {
    if (!bridgeHealth || bridgeHealth.status !== 'online') return 'OFFLINE';
    return 'ONLINE';
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* JARVIS Logo with glow */}
        <div className="topbar-brand">
          <div className="titlebar-logo" style={{ width: 32, height: 32 }}>
            J
          </div>
        </div>

        {/* Status Indicator */}
        <div className="status-indicator">
          <div className={`status-dot ${getStatusDotClass()}`} />
          <span>JARVIS {getStatusText()}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Model Badge */}
        <div className="model-badge">
          <Cpu size={12} style={{ marginRight: 4 }} />
          {modelName}
        </div>

        {/* Clock */}
        <div className="clock">
          <Clock size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} />
          {formatTime(time)}
        </div>
      </div>
    </div>
  );
}
