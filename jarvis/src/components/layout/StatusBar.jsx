/**
 * StatusBar - tokens, latency, memory status
 * Based on Master Plan v1.0 Section 3.5
 */
export default function StatusBar({ tokenCount = 0, latencyMs = 0, memoryStatus = 'OK' }) {
  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item">
          <span>Tokens:</span>
          <span style={{ color: 'var(--text-secondary)' }}>{tokenCount}</span>
        </div>
        <div className="statusbar-item">
          <span>Latency:</span>
          <span style={{ color: 'var(--text-secondary)' }}>{latencyMs}ms</span>
        </div>
      </div>
      <div className="statusbar-right">
        <div className="statusbar-item">
          <span>Memory:</span>
          <span style={{ color: 'var(--accent-success)' }}>{memoryStatus}</span>
        </div>
        <div className="statusbar-item">
          <span>JARVIS v1.0</span>
        </div>
      </div>
    </div>
  );
}
