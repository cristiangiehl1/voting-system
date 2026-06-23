"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function VotingBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!containerRef.current || reduce) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x080818, 0.025)

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    const bars: { mesh: THREE.Mesh; initialY: number; speed: number; offset: number; phase: number }[] = []
    const barCount = 28
    const spacing = 1.0
    const startX = -((barCount - 1) * spacing) / 2

    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5)
    geometry.translate(0, 0.5, 0)

    for (let i = 0; i < barCount; i++) {
      const height = 1.5 + Math.random() * 4
      const hue = 0.58 + (i / barCount) * 0.2
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.6, 0.4),
        transparent: true,
        opacity: 0.3,
        roughness: 0.3,
        metalness: 0.7,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(startX + i * spacing, -3, -8)
      mesh.scale.set(1, height, 1)

      scene.add(mesh)
      bars.push({
        mesh,
        initialY: -3,
        speed: 0.4 + Math.random() * 0.6,
        offset: Math.random() * Math.PI * 2,
        phase: (i / barCount) * Math.PI * 2,
      })
    }

    const torusGeo = new THREE.TorusKnotGeometry(1.2, 0.35, 128, 16)
    const torusMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.62, 0.8, 0.5),
      transparent: true,
      opacity: 0.12,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.set(0, 1, -4)
    scene.add(torus)

    const innerRingGeo = new THREE.TorusGeometry(2.5, 0.04, 32, 64)
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.65, 0.9, 0.6),
      transparent: true,
      opacity: 0.15,
      roughness: 0.1,
      metalness: 0.9,
    })
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat)
    innerRing.position.set(0, 1, -4)
    innerRing.rotation.x = Math.PI / 3
    scene.add(innerRing)

    const outerRingGeo = new THREE.TorusGeometry(3.5, 0.03, 32, 64)
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.7, 0.8, 0.5),
      transparent: true,
      opacity: 0.08,
      roughness: 0.1,
      metalness: 0.9,
    })
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat)
    outerRing.position.set(0, 1, -4)
    outerRing.rotation.x = -Math.PI / 4
    scene.add(outerRing)

    const particleCount = 500
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const particleSpeeds: number[] = []
    const particleRadii: number[] = []
    const particleAngles: number[] = []

    for (let i = 0; i < particleCount; i++) {
      const radius = 2 + Math.random() * 6
      const angle = Math.random() * Math.PI * 2
      const yOffset = (Math.random() - 0.5) * 4

      particleRadii.push(radius)
      particleAngles.push(angle)
      particleSpeeds.push(0.1 + Math.random() * 0.3)

      particlePositions[i * 3] = Math.cos(angle) * radius
      particlePositions[i * 3 + 1] = yOffset
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius

      const hue = 0.58 + Math.random() * 0.2
      const c = new THREE.Color().setHSL(hue, 0.8, 0.5 + Math.random() * 0.3)
      particleColors[i * 3] = c.r
      particleColors[i * 3 + 1] = c.g
      particleColors[i * 3 + 2] = c.b
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false,
    })

    const particleSystem = new THREE.Points(particleGeo, particleMat)
    scene.add(particleSystem)

    const ambientLight = new THREE.AmbientLight(0x303060, 0.8)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0x6688ff, 2)
    keyLight.position.set(5, 8, 5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xff66aa, 0.8)
    fillLight.position.set(-5, 3, 5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x4488ff, 1.5)
    rimLight.position.set(0, -5, -5)
    scene.add(rimLight)

    camera.position.set(0, 2, 12)

    let mouseX = 0
    let targetMouseX = 0
    let mouseY = 0
    let targetMouseY = 0

    function onMouseMove(event: MouseEvent) {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("resize", onResize)

    const startTime = performance.now()

    function animate() {
      const elapsed = (performance.now() - startTime) / 1000

      mouseX += (targetMouseX - mouseX) * 0.03
      mouseY += (targetMouseY - mouseY) * 0.03

      camera.position.x = mouseX * 1.5
      camera.position.y = 2 + mouseY * 0.5
      camera.lookAt(0, 0.5, -6)

      bars.forEach((bar) => {
        const wave = Math.sin(elapsed * bar.speed + bar.offset + bar.phase)
        const scaleY = 1 + wave * 0.12
        bar.mesh.scale.y += (bar.mesh.scale.y * scaleY - bar.mesh.scale.y) * 0.05
        const mat = bar.mesh.material as THREE.MeshStandardMaterial
        mat.opacity = 0.2 + wave * 0.12
        const hue = 0.58 + (wave * 0.08) + (bars.indexOf(bar) / barCount) * 0.15
        mat.color.setHSL(Math.min(hue, 0.78), 0.6, 0.35 + wave * 0.1)
      })

      torus.rotation.x = elapsed * 0.15
      torus.rotation.y = elapsed * 0.2
      torus.position.y = 1 + Math.sin(elapsed * 0.3) * 0.3

      innerRing.rotation.z = elapsed * 0.1
      innerRing.rotation.x = Math.PI / 3 + Math.sin(elapsed * 0.15) * 0.1

      outerRing.rotation.z = -elapsed * 0.08
      outerRing.rotation.x = -Math.PI / 4 + Math.cos(elapsed * 0.12) * 0.1

      const positions = particleSystem.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        particleAngles[i] += particleSpeeds[i] * 0.01
        const angle = particleAngles[i]
        const radius = particleRadii[i]
        positions[i * 3] = Math.cos(angle) * radius
        positions[i * 3 + 1] += Math.sin(elapsed * 0.5 + i) * 0.002
        positions[i * 3 + 2] = Math.sin(angle) * radius
      }
      particleSystem.geometry.attributes.position.needsUpdate = true
      particleSystem.rotation.y = elapsed * 0.01

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", onResize)
      container.removeChild(renderer.domElement)
      renderer.dispose()
      geometry.dispose()
      torusGeo.dispose()
      torusMat.dispose()
      innerRingGeo.dispose()
      innerRingMat.dispose()
      outerRingGeo.dispose()
      outerRingMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      bars.forEach((bar) => {
        bar.mesh.geometry.dispose()
        ;(bar.mesh.material as THREE.MeshStandardMaterial).dispose()
      })
    }
  }, [reduce])

  if (reduce) return null

  return <div ref={containerRef} className="fixed inset-0 -z-10" aria-hidden="true" />
}
