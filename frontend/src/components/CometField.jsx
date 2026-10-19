import { useEffect, useRef } from 'react'

function CometField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined // e.g. test environments without canvas support
    let width, height
    let animationId

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: width / 2, y: height / 2 }
    const onMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouseMove)
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const STREAK_COLORS = ['rgba(139,92,246,0.5)', 'rgba(20,184,166,0.45)', 'rgba(245,158,11,0.35)']
    const streaks = Array.from({ length: 5 }, (_, i) => ({
      angle: -0.5 + Math.random() * 0.3,
      offset: Math.random() * height * 1.5 - height * 0.25,
      speed: 0.15 + Math.random() * 0.15,
      progress: Math.random() * 100,
      length: 300 + Math.random() * 200,
      color: STREAK_COLORS[i % STREAK_COLORS.length],
      width: 1.5 + Math.random() * 1.5,
    }))

    const DOTS = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      color: STREAK_COLORS[Math.floor(Math.random() * STREAK_COLORS.length)],
    }))

    const tick = () => {
      ctx.clearRect(0, 0, width, height)

      // soft mouse-follow glow
      const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 350)
      glow.addColorStop(0, 'rgba(139,92,246,0.08)')
      glow.addColorStop(1, 'rgba(139,92,246,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      // twinkling dots
      for (const d of DOTS) {
        d.twinkle += 0.015
        const a = (Math.sin(d.twinkle) + 1) / 2
        ctx.fillStyle = d.color
        ctx.globalAlpha = 0.3 + a * 0.5
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // diagonal comet streaks
      for (const s of streaks) {
        s.progress += s.speed
        if (s.progress > 100 + s.length / 2) s.progress = -s.length / 2

        const cx = (s.progress / 100) * (width + s.length) - s.length / 2
        const cy = s.offset + cx * Math.tan(s.angle)

        const dx = Math.cos(s.angle) * s.length
        const dy = Math.sin(s.angle) * s.length

        const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx, cy)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, s.color)

        ctx.strokeStyle = grad
        ctx.lineWidth = s.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx - dx, cy - dy)
        ctx.lineTo(cx, cy)
        ctx.stroke()
      }

      if (!reducedMotion) animationId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
}

export default CometField
