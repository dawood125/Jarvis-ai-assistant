export const quickSuggestions = [
  'System status report',
  'launch vscode',
  'search for diagnostics',
  'note Remember to push today updates to GitHub',
  'list notes',
  'help',
]

export const initialRecentActivity = [
  { ago: '2 min ago', label: 'System diagnostics completed' },
  { ago: '15 min ago', label: 'Project index refreshed' },
  { ago: '1 hour ago', label: 'Backup snapshot created' },
]

export const initialMessages = [
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
