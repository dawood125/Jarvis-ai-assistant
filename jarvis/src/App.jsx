import { useEffect, useState, useCallback } from 'react';
import TitleBar from './components/layout/TitleBar';
import TopBar from './components/layout/TopBar';
import Sidebar from './components/layout/Sidebar';
import StatusBar from './components/layout/StatusBar';
import ChatView from './components/chat/ChatView';
import { useWebSocket } from './hooks/useWebSocket';

const CHAT_STORAGE_KEY = 'jarvis.chat.history.v1';

/**
 * JARVIS App - New UI based on Master Plan v1.0 Section 3
 * "Minimal HUD" design - Iron Man HUD + Raycast/Linear hybrid
 */
export default function App() {
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      {
        role: 'jarvis',
        text: "JARVIS online, sir. What would you like me to do?",
        createdAt: new Date().toISOString()
      }
    ];
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState('chat');
  const [bridgeHealth, setBridgeHealth] = useState({ status: 'unknown' });
  const [statusMessage, setStatusMessage] = useState(''); // Real-time status from backend

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback((payload) => {
    if (payload.type === 'status') {
      // Real-time status update from backend
      setStatusMessage(payload.content || 'Processing...');
    } else if (payload.type === 'reply' && payload.text) {
      // Final reply from JARVIS
      const nextMessage = {
        role: 'jarvis',
        text: payload.text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, nextMessage]);
      setIsProcessing(false);
      setStatusMessage(''); // Clear status when done
    }
  }, []);

  // WebSocket connection
  const { status: wsStatus, sendMessage, reconnect } = useWebSocket(handleWsMessage);

  // Fetch bridge health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          const data = await res.json();
          setBridgeHealth(data);
        }
      } catch (e) {
        console.log('Backend not available yet');
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Clear any previous status
    setStatusMessage('');

    // Add user message
    const userMessage = {
      role: 'user',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setStatusMessage('Connecting...');

    // Try WebSocket first
    const sent = sendMessage(text.trim());

    if (!sent) {
      // Fallback to HTTP
      setStatusMessage('Processing...');
      try {
        const res = await fetch('http://localhost:8000/api/model/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: text.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            const jarvisMessage = {
              role: 'jarvis',
              text: data.reply,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, jarvisMessage]);
          }
        }
      } catch (e) {
        console.error('Failed to send message:', e);
        const errorMessage = {
          role: 'jarvis',
          text: "I'm having trouble connecting to my backend, sir. Please ensure the Python server is running.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="app-container">
      {/* Custom frameless titlebar */}
      <TitleBar />

      {/* Main content area */}
      <div className="app-main">
        {/* Sidebar navigation */}
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* Main content panel */}
        <div className="main-panel">
          {/* Top bar with status */}
          <TopBar
            bridgeHealth={bridgeHealth}
            modelName="MiniMax M2.5"
          />

          {/* Chat area */}
          <div className="chat-area">
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
              wsStatus={wsStatus}
              statusMessage={statusMessage}
            />
          </div>

          {/* Status bar */}
          <StatusBar
            latencyMs={15}
            memoryStatus="OK"
          />
        </div>
      </div>
    </div>
  );
}
