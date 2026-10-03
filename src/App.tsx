import { useState, useEffect, useRef, useCallback } from 'react'

const LETTERS = 'фывфывфвы'.split('')
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9'
]

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
}

interface FloatingLetter {
  id: number
  char: string
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  hovered: boolean
}

function App() {
  const [letters, setLetters] = useState<FloatingLetter[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const particleId = useRef(0)
  const animFrame = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize floating letters
  useEffect(() => {
    const initLetters = LETTERS.map((char, i) => ({
      id: i,
      char,
      x: 10 + (i * 80 / LETTERS.length) + Math.random() * 5,
      y: 30 + Math.random() * 40,
      rotation: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.6,
      color: COLORS[i % COLORS.length],
      hovered: false,
    }))
    setLetters(initLetters)
  }, [])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setLetters(prev => prev.map(l => ({
        ...l,
        rotation: l.rotation + (l.hovered ? 3 : 0.3),
        y: l.y + Math.sin(Date.now() / 1000 + l.id) * 0.02,
      })))

      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1,
          life: p.life - 1,
          size: p.size * 0.98,
        }))
        .filter(p => p.life > 0)
      )

      animFrame.current = requestAnimationFrame(animate)
    }
    animFrame.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrame.current)
  }, [])

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = Array.from({ length: 12 }, () => ({
      id: particleId.current++,
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      color,
      size: 4 + Math.random() * 8,
      life: 40 + Math.random() * 20,
    }))
    setParticles(prev => [...prev, ...newParticles])
  }, [])

  const handleLetterClick = useCallback((letter: FloatingLetter, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    spawnParticles(x, y, letter.color)
    setScore(s => s + 10 * (combo + 1))
    setCombo(c => c + 1)

    // Add ripple
    const rippleId = Date.now()
    setRipples(prev => [...prev, { id: rippleId, x: e.clientX, y: e.clientY }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== rippleId)), 600)

    // Move letter to new position
    setLetters(prev => prev.map(l =>
      l.id === letter.id
        ? {
          ...l,
          x: 5 + Math.random() * 85,
          y: 15 + Math.random() * 60,
          rotation: Math.random() * 360,
          scale: 0.8 + Math.random() * 0.8,
        }
        : l
    ))
  }, [combo, spawnParticles])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  // Reset combo after inactivity
  useEffect(() => {
    if (combo === 0) return
    const timer = setTimeout(() => setCombo(0), 2000)
    return () => clearTimeout(timer)
  }, [combo, score])

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full overflow-hidden relative cursor-crosshair select-none"
      style={{
        background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 30%, #2d1b4e 60%, #0c0c1d 100%)',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: 'white',
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Custom cursor glow */}
      <div
        className="fixed pointer-events-none z-50 rounded-full"
        style={{
          width: 30,
          height: 30,
          left: mousePos.x - 15,
          top: mousePos.y - 15,
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          transition: 'left 0.05s, top 0.05s',
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="text-white/80">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            ФЫВФЫВФВЫ
          </h1>
          <p className="text-sm text-white/50 mt-1">Нажимай на буквы! ✨</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            {score.toLocaleString()}
          </div>
          {combo > 1 && (
            <div
              className="text-sm font-bold animate-bounce"
              style={{ color: COLORS[combo % COLORS.length] }}
            >
              x{combo} COMBO! 🔥
            </div>
          )}
        </div>
      </div>

      {/* Floating Letters */}
      {letters.map(letter => (
        <div
          key={letter.id}
          className="absolute cursor-pointer transition-transform duration-200 hover:scale-150"
          style={{
            left: `${letter.x}%`,
            top: `${letter.y}%`,
            transform: `rotate(${letter.rotation}deg) scale(${letter.scale})`,
            fontSize: '3rem',
            fontWeight: 'bold',
            color: letter.color,
            textShadow: `0 0 20px ${letter.color}, 0 0 40px ${letter.color}50`,
            filter: 'drop-shadow(0 0 10px currentColor)',
            transition: 'left 0.5s ease-out, top 0.5s ease-out, transform 0.1s',
          }}
          onClick={(e) => handleLetterClick(letter, e)}
          onMouseEnter={() => {
            setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, hovered: true } : l))
          }}
          onMouseLeave={() => {
            setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, hovered: false } : l))
          }}
        >
          {letter.char}
        </div>
      ))}

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.life / 60,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
        />
      ))}

      {/* Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none rounded-full border-2 border-white/50 animate-ping"
          style={{
            left: ripple.x - 25,
            top: ripple.y - 25,
            width: 50,
            height: 50,
          }}
        />
      ))}

      {/* Bottom info */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-white/40 text-sm">
          Нажимай на летающие буквы • Собирай комбо • Набирай очки
        </p>
        <div className="mt-3 flex justify-center gap-2">
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: color,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Decorative gradient orbs */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #FF6B6B, transparent)',
          left: '-10%',
          top: '20%',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #4ECDC4, transparent)',
          right: '-10%',
          bottom: '20%',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #BB8FCE, transparent)',
          left: '40%',
          top: '50%',
          animation: 'float 12s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </div>
  )
}

export default App
