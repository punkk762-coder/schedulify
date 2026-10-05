"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeProgressHaloProps {
  percentage: number;
  size?: number; // Size in px (e.g. 56, 80, 110)
  className?: string;
}

export function ThreeProgressHalo({
  percentage,
  size = 72,
  className = "",
}: ThreeProgressHaloProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isVisible = true;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Determine Color Palette from percentage
    const clampedPct = Math.max(0, Math.min(100, percentage));
    const isEmerald = clampedPct >= 85;
    const isAmber = clampedPct >= 50 && clampedPct < 85;

    const primaryHex = isEmerald ? 0xd4eca2 : isAmber ? 0xf59e0b : 0xff7a59;
    const accentHex = isEmerald ? 0x52652a : isAmber ? 0xa43716 : 0xba1a1a;

    // 3. Meshes
    // A. Outer Gimbal Ring (Thin Torus)
    const outerRingGeo = new THREE.TorusGeometry(1.5, 0.03, 8, 36);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: primaryHex,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    scene.add(outerRing);

    // B. Middle Progress Ring (Arc representing adherence)
    const arcLength = (clampedPct / 100) * Math.PI * 2;
    const middleRingGeo = new THREE.TorusGeometry(1.2, 0.06, 12, 48, Math.max(0.1, arcLength));
    const middleRingMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      emissive: accentHex,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const middleRing = new THREE.Mesh(middleRingGeo, middleRingMat);
    middleRing.rotation.z = -Math.PI / 2; // start from top
    scene.add(middleRing);

    // C. Central Floating Vitality Gem (Icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      emissive: accentHex,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: clampedPct < 25,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // D. Orbiting Star Particle Swarm (16 points)
    const particleCount = 16;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleAngles = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particleAngles[i] = (i / particleCount) * Math.PI * 2;
      const radius = 1.35 + (Math.random() - 0.5) * 0.2;
      particlePos[i * 3] = Math.cos(particleAngles[i]) * radius;
      particlePos[i * 3 + 1] = Math.sin(particleAngles[i]) * radius;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: primaryHex,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 4. Lighting
    const pointLight = new THREE.PointLight(0xffffff, 2, 10);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // 5. Pointer Tilt Physics
    let targetRotX = 0;
    let targetRotY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.8;
      targetRotX = y * 0.8;
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("touchmove", handlePointerMove, { passive: true });

    // IntersectionObserver to pause rendering when scrolled out
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // 6. Animation Loop
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = (performance.now() - startTime) * 0.001;

      // Gyro gimbal rotations
      outerRing.rotation.x = Math.sin(elapsed * 0.8) * 0.3;
      outerRing.rotation.y += 0.012;

      middleRing.rotation.x += 0.008;
      middleRing.rotation.y += 0.006;

      core.rotation.y += 0.018;
      core.rotation.x = Math.sin(elapsed * 1.2) * 0.25;

      // Particle orbit animation
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        particleAngles[i] += 0.015;
        const radius = 1.35;
        positions[i * 3] = Math.cos(particleAngles[i]) * radius;
        positions[i * 3 + 1] = Math.sin(particleAngles[i]) * radius;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Damped pointer tilt
      scene.rotation.y += (targetRotY - scene.rotation.y) * 0.1;
      scene.rotation.x += (targetRotX - scene.rotation.x) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("touchmove", handlePointerMove);

      outerRingGeo.dispose();
      outerRingMat.dispose();
      middleRingGeo.dispose();
      middleRingMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [percentage, size]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className={`relative select-none pointer-events-auto cursor-grab active:cursor-grabbing ${className}`}
      title={`${percentage}% Routine Adherence Halo`}
    />
  );
}
