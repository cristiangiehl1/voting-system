"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    const gridHelper = new THREE.GridHelper(20, 20, 0x00f0ff, 0xff00aa)
    gridHelper.position.y = -2
    scene.add(gridHelper)

    const torusKnotGeo = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16)
    const torusKnotMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.2,
    })
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusKnotMat)
    scene.add(torusKnot)

    const particlesGeo = new THREE.BufferGeometry()
    const count = 2000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40
      positions[i + 1] = (Math.random() - 0.5) * 40
      positions[i + 2] = (Math.random() - 0.5) * 40

      const color = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 1, 0.5)
      colors[i] = color.r
      colors[i + 1] = color.g
      colors[i + 2] = color.b
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particlesGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const particlesMat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particles)

    const light1 = new THREE.AmbientLight(0x222244, 0.5)
    scene.add(light1)
    const light2 = new THREE.DirectionalLight(0x00f0ff, 1)
    light2.position.set(5, 5, 5)
    scene.add(light2)
    const light3 = new THREE.DirectionalLight(0xff00aa, 0.8)
    light3.position.set(-5, -5, 5)
    scene.add(light3)

    camera.position.z = 6

    let mouseX = 0
    let mouseY = 0

    function onMouseMove(event: MouseEvent) {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener("mousemove", onMouseMove)

    function animate() {
      requestAnimationFrame(animate)
      torusKnot.rotation.x += 0.005
      torusKnot.rotation.y += 0.008
      particles.rotation.x += 0.0003
      particles.rotation.y += 0.0005
      torusKnot.rotation.x += mouseY * 0.02
      torusKnot.rotation.y += mouseX * 0.02
      renderer.render(scene, camera)
    }
    animate()

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", onResize)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="fixed inset-0 -z-10 opacity-60" />
}
