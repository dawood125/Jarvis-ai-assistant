import { useEffect, useRef } from 'react'

function HudBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return undefined
    }

    let frameId = 0
    const particles = []
    const particleCount = 60

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 1.5 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x < 0 || this.x > canvas.width) {
          this.speedX *= -1
        }

        if (this.y < 0 || this.y > canvas.height) {
          this.speedY *= -1
        }
      }

      draw() {
        context.fillStyle = 'rgba(0, 240, 255, 0.5)'
        context.beginPath()
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        context.fill()
      }
    }

    const initParticles = () => {
      particles.length = 0
      for (let i = 0; i < particleCount; i += 1) {
        particles.push(new Particle())
      }
    }

    const connectParticles = () => {
      for (let a = 0; a < particles.length; a += 1) {
        for (let b = a + 1; b < particles.length; b += 1) {
          const dx = particles[a].x - particles[b].x
          const dy = particles[a].y - particles[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            context.strokeStyle = `rgba(0, 240, 255, ${0.1 - distance / 1500})`
            context.lineWidth = 0.5
            context.beginPath()
            context.moveTo(particles[a].x, particles[a].y)
            context.lineTo(particles[b].x, particles[b].y)
            context.stroke()
          }
        }
      }
    }

    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })
      connectParticles()
      frameId = window.requestAnimationFrame(animate)
    }

    resizeCanvas()
    initParticles()
    animate()

    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" />
      <div className="hud-border-top" />
      <div className="hud-border-bottom" />
    </>
  )
}

export default HudBackground
