import { useEffect, useRef } from 'react'

function ParticleNetwork() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width, height
    let animationId

    const mouse = { x: -9999, y: -9999 }

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseleave', () => {
      mouse.x = -9999
      mouse.y = -9999
    })

    const COUNT = 85
    const palette = ['#14B8A6', '#F59E0B', '#8B5CF6', '#3B82F6']
    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.8 + 1.2,
      color: palette[Math.floor(Math.random() * palette.length)],
      twinkle: Math.random() * Math.PI * 2,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, width, height)

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.twinkle += 0.02

        const dx = mouse.x - n.x
        const dy = mouse.y - n.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 170) {
          const force = (170 - dist) / 170
          n.vx += (dx / dist) * force * 0.035
          n.vy += (dy / dist) * force * 0.035
        }

        n.vx *= 0.975
        n.vy *= 0.975

        if (n.x < 0 || n.x > width) n.vx *= -1
        if (n.y < 0 || n.y > height) n.vy *= -1
        n.x = Math.max(0, Math.min(width, n.x))
        n.y = Math.max(0, Math.min(height, n.y))
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            ctx.strokeStyle = `rgba(20, 184, 166, ${(1 - dist / 140) * 0.3})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        const glow = (Math.sin(n.twinkle) + 1) / 2
        ctx.save()
        ctx.shadowColor = n.color
        ctx.shadowBlur = 8 + glow * 6
        ctx.fillStyle = n.color
        ctx.globalAlpha = 0.75 + glow * 0.25
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationId = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  )
}

export default ParticleNetwork
