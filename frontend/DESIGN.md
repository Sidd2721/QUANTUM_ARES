# QUANTUM-ARES Design System — Source of Truth

## Color Tokens
```css
:root {
  --bg-primary:    #0A0F1E;
  --bg-surface:    #111827;
  --bg-surface-2:  #1A2234;
  --border:        #1F2937;
  --border-glow:   rgba(59, 130, 246, 0.3);

  --accent:        #3B82F6;
  --accent-dim:    #1D4ED8;
  --accent-glow:   rgba(59, 130, 246, 0.15);

  --success:       #10B981;
  --warning:       #F59E0B;
  --danger:        #EF4444;
  --quantum:       #8B5CF6;

  --text-primary:  #F9FAFB;
  --text-secondary:#9CA3AF;
  --text-muted:    #6B7280;
}
```

## Typography
- Font: `'Inter', system-ui, sans-serif`
- Mono: `'JetBrains Mono', monospace`
- Heading xl: 24px/600 | lg: 20px/600 | md: 16px/600
- Body: 14px/400 | Caption: 12px/400

## Component Patterns
- Cards: `bg-[#111827] border border-[#1F2937] rounded-xl p-6`
- Glow: `border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]`
- Badges: pill shape, severity-colored
- Code: dark bg + syntax highlight + copy button
