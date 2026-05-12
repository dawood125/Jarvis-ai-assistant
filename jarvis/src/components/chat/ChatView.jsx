import { useRef, useEffect, useState } from 'react';
import { Send, Mic, Loader2 } from 'lucide-react';

/**
 * ChatView - Main chat interface with message list and input
 * Based on Master Plan v1.0 Section 3.5
 * Now supports real-time status updates from backend
 */
export default function ChatView({
  messages = [],
  onSendMessage,
  isProcessing = false,
  wsStatus = 'disconnected',
  statusMessage = '' // Real-time status from backend
}) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, statusMessage]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isProcessing) return;

    onSendMessage(text);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      {/* Messages List */}
      <div className="chat-messages chat-scroll">
        {messages.length === 0 && !isProcessing && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '16px'
          }}>
            <div className="core-dot" />
            <div style={{ fontSize: 'var(--text-sm)' }}>
              Ask JARVIS anything...
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {/* Show status message from backend or generic typing indicator */}
        {isProcessing && (
          <StatusIndicator
            statusMessage={statusMessage}
            wsStatus={wsStatus}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        <form onSubmit={handleSubmit} className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Ask JARVIS anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />

          {/* Voice button (placeholder for Phase 3) */}
          <button
            type="button"
            className="mic-button"
            title="Voice input (coming soon)"
            disabled
          >
            <Mic size={18} />
          </button>

          {/* Send button */}
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isProcessing}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * StatusIndicator - Shows real-time thinking status from backend
 * Replaces generic "..." with dynamic messages like "Thinking...", "Searching the web..."
 */
function StatusIndicator({ statusMessage, wsStatus }) {
  const isConnected = wsStatus === 'connected';

  // If we have a real status message from backend, display it
  if (statusMessage) {
    return (
      <div className="message-bubble jarvis" style={{
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(123, 97, 255, 0.05))',
        borderColor: 'var(--accent-primary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Loader2
            size={16}
            style={{
              color: 'var(--accent-primary)',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}>
            {statusMessage}
          </span>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Fallback: Generic typing indicator with connection status
  return (
    <div className="message-bubble jarvis">
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
        {isConnected && (
          <span style={{
            marginLeft: '8px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)'
          }}>
            Connected
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * MessageBubble - User or JARVIS message display
 */
function MessageBubble({ message }) {
  const { role, text, createdAt } = message;
  const isUser = role === 'user';

  return (
    <div className={`message-bubble ${isUser ? 'user message-user' : 'jarvis message-jarvis'}`}>
      <div>{text}</div>
      {createdAt && (
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          marginTop: '4px',
          opacity: 0.7
        }}>
          {new Date(createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

/**
 * TypingIndicator - Three pulsing dots when JARVIS is thinking (legacy)
 */
function TypingIndicator() {
  return (
    <div className="message-bubble jarvis">
      <div className="typing-indicator">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
