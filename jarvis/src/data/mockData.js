export const quickSuggestions = [
  'Analyze recent activity patterns',
  'Generate system performance report',
  'Review security logs',
  'Optimize system resources',
]

export const recentActivity = [
  { ago: '2 min ago', label: 'System diagnostics completed' },
  { ago: '15 min ago', label: 'Project index refreshed' },
  { ago: '1 hour ago', label: 'Backup snapshot created' },
]

export const messages = [
  {
    role: 'jarvis',
    label: 'JARVIS CORE',
    text: 'Good evening, sir. All systems are stable and ready for command.',
  },
  {
    role: 'user',
    label: 'YOU',
    text: 'Give me the latest system status and prepare my coding workspace.',
  },
  {
    role: 'jarvis',
    label: 'JARVIS CORE',
    text: 'Network latency is 12ms, CPU is at 34%, memory is at 67%. Would you like a detailed breakdown?',
  },
]

export const statusMeters = [
  { name: 'Network', valueLabel: 'Optimal', width: '92%' },
  { name: 'Processing', valueLabel: '34%', width: '34%' },
  { name: 'Memory', valueLabel: '67%', width: '67%' },
]
