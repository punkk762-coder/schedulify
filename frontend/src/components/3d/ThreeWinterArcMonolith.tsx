"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeWinterArcMonolithProps {
  phaseNumber?: number; // 1 to 5
  size?: number;
  className?: string;
}

export function ThreeWinterArcMonolith({
  phaseNumber = 1,
  size = 140,
  className = "",
}: ThreeWinterArcMonolithProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isVisible = true;

    // 1. Color mapping by phase
    const phaseColors: Record<number, { primary: number; emissive: number; wire: number }> = {
      1: { primary: 0x2d1810, emissive: 0xa43716, wire: 0xff7a59 }, // Phase 1: Foundation (Terracotta)
      2: { primary: 0x331c0a, emissive: 0xc2410c, wire: 0xfb923c }, // Phase 2: Hypertrophy (Orange)
      3: { primary: 0x141a29, emissive: 0x3730a3, wire: 0x818cf8 }, // Phase 3: Defense (Indigo)
      4: { primary: 0x330c0c, emissive: 0xb91c1c, wire: 0xf87171 }, // Phase 4: Shred (Crimson)
      5: { primary: 0x2e240a, emissive: 0xa16207, wire: 0xfacc15 }, // Phase 5: Peak (Gold)
    };

    const colors = phaseColors[phaseNumber] || phaseColors[1];

    // 2. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.5, 4.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Meshes
    // A. The Obsidian Monolith Crystal (Cylinder with 6 sides = hexagonal prism)
    const monolithGeo = new THREE.CylinderGeometry(0.55, 0.75, 2.1, 6, 1);
    const monolithMat = new THREE.MeshStandardMaterial({
      color: colors.primary,
      emissive: colors.emissive,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.15,
    });
    const monolith = new THREE.Mesh(monolithGeo, monolithMat);
    scene.add(monolith);

    // Accent Wireframe outline on crystal
    const wireGeo = new THREE.EdgesGeometry(monolithGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: colors.wire,
      transparent: true,
      opacity: 0.8,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    monolith.add(wireframe);

    // B. Floating Orbital Rings (2 concentric rings)
    const ring1Geo = new THREE.TorusGeometry(1.25, 0.025, 8, 48);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: colors.wire,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.45, 0.02, 8, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 5;
    scene.add(ring2);

    // C. Upward Rising Transformation Embers (18 particles)
    const emberCount = 18;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberSpeeds: number[] = [];

    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3] = (Math.random() - 0.5) * 1.6;
      emberPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      emberSpeeds.push(0.008 + Math.random() * 0.015);
    }
    emberGeo.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));

    const emberMat = new THREE.PointsMaterial({
      color: colors.wire,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // 4. Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    const backLight = new THREE.PointLight(colors.wire, 3, 6);
    backLight.position.set(-2, -2, -2);
    scene.add(backLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 5. Pointer Interactivity
    let targetTiltX = 0;
    let targetTiltY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      targetTiltY = x * 1.2;
      targetTiltX = y * 0.8;
    };

    container.addEventListener("mousemove", handlePointerMove);
    container.addEventListener("touchmove", handlePointerMove, { passive: true });

    // IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // 6. Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Monolith floating & majestic rotation
      monolith.rotation.y += 0.008;
      monolith.position.y = Math.sin(elapsed * 1.5) * 0.06;

      // Orbital rings rotation
      ring1.rotation.z += 0.012;
      ring1.rotation.y += 0.008;

      ring2.rotation.z -= 0.009;
      ring2.rotation.x += 0.006;

      // Rising embers physics
      const pos = embers.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < emberCount; i++) {
        pos[i * 3 + 1] += emberSpeeds[i];
        if (pos[i * 3 + 1] > 1.4) {
          pos[i * 3 + 1] = -1.4;
          pos[i * 3] = (Math.random() - 0.5) * 1.5;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
      }
      embers.geometry.attributes.position.needsUpdate = true;

      // Damped pointer tilt
      scene.rotation.y += (targetTiltY - scene.rotation.y) * 0.08;
      scene.rotation.x += (targetTiltX - scene.rotation.x) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("touchmove", handlePointerMove);

      monolithGeo.dispose();
      monolithMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      emberGeo.dispose();
      emberMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phaseNumber, size]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className={`relative select-none pointer-events-auto cursor-grab active:cursor-grabbing shrink-0 ${className}`}
      title={`Winter Arc Phase ${phaseNumber} Obsidian Monolith`}
    />
  );
}
