"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeAiCoreProps {
  isThinking?: boolean;
  size?: number;
  className?: string;
}

export function ThreeAiCore({
  isThinking = false,
  size = 36,
  className = "",
}: ThreeAiCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isVisible = true;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.6;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Meshes
    // A. Outer Wireframe Dodecahedron
    const outerGeo = new THREE.DodecahedronGeometry(1.0, 0);
    const outerMat = new THREE.MeshBasicMaterial({
      color: isThinking ? 0xffb5a0 : 0xd4eca2,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);

    // B. Inner Glowing Energy Core
    const coreGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: isThinking ? 0xa43716 : 0x52652a,
      emissive: isThinking ? 0xff7a59 : 0xd4eca2,
      emissiveIntensity: isThinking ? 1.4 : 0.8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // C. Orbiting Quantum Electrons (8 particles)
    const particleCount = 8;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particleSpeeds.push(1.5 + Math.random() * 2);
      particlePositions[i * 3] = (Math.random() - 0.5) * 2;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: isThinking ? 0xffdbd1 : 0xd4eca2,
      size: 0.12,
      transparent: true,
      opacity: 0.9,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 3. Lighting
    const pointLight = new THREE.PointLight(0xffffff, 2, 8);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    // IntersectionObserver to avoid background CPU burn
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 4. Animation loop
    const clock = new THREE.Clock();
    let spinBoost = 1.0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();
      const speedMult = isThinking ? 3.2 : 1.0;

      outerMesh.rotation.x += 0.015 * speedMult * spinBoost;
      outerMesh.rotation.y += 0.02 * speedMult * spinBoost;
      outerMesh.rotation.z += 0.01 * speedMult * spinBoost;

      // Core pulse
      const pulse = Math.sin(elapsed * (isThinking ? 8 : 3)) * 0.08 + 1;
      coreMesh.scale.set(pulse, pulse, pulse);

      // Particle orbital rotation
      particles.rotation.y += 0.025 * speedMult;
      particles.rotation.x += 0.018 * speedMult;

      if (spinBoost > 1.0) {
        spinBoost = Math.max(1.0, spinBoost - 0.02);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleHover = () => {
      spinBoost = 2.5;
    };
    container.addEventListener("mouseenter", handleHover);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      container.removeEventListener("mouseenter", handleHover);

      outerGeo.dispose();
      outerMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isThinking, size]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center pointer-events-auto cursor-pointer ${className}`}
      title="3D Neural AI Core"
    />
  );
}
