import { Zap, CheckCircle, XCircle } from 'lucide-react';

/**
 * ToolCard - Display tool execution status
 * Based on Master Plan v1.0 Section 3.5
 */
export default function ToolCard({ toolName, status, result }) {
  const isSuccess = status === 'success';
  const isPending = status === 'pending';

  return (
    <div className="tool-card">
      <div className="tool-card-header">
        <Zap size={14} />
        <span>EXECUTING — {toolName}</span>
        {isSuccess && <CheckCircle size={14} style={{ color: 'var(--accent-success)', marginLeft: 'auto' }} />}
        {isPending && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
            <div className="typing-dot" />
            <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
            <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>
      <div className="tool-card-body">
        {result || 'Processing...'}
      </div>
    </div>
  );
}
