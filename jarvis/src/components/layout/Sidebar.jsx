import { MessageSquare, Brain, Wrench, Zap, Settings, User } from 'lucide-react';

/**
 * Sidebar - Navigation, Quick Launch, Recent Notes
 * Based on Master Plan v1.0 Section 3.5
 */
export default function Sidebar({ activeView, onViewChange, recentNotes = [] }) {
  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'automations', label: 'Automation', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="sidebar">
      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User Profile at bottom */}
      <div className="sidebar-footer" style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--bg-base)'
        }}>
          D
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-primary)' }}>
            Dawood Ahmed
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Developer
          </div>
        </div>
      </div>
    </div>
  );
}
