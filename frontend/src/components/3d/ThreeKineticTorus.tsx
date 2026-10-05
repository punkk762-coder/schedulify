"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface ThreeKineticTorusProps {
  size?: number;
  color?: string;
  wireframe?: boolean;
}

export const ThreeKineticTorus: React.FC<ThreeKineticTorusProps> = ({
  size = 140,
  color = "#a43716",
  wireframe = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Torus Knot Geometry
    const geometry = new THREE.TorusKnotGeometry(1.0, 0.28, 100, 16, 2, 3);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: 0.2,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe,
      emissive: new THREE.Color(color).multiplyScalar(0.15),
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.5);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0xffffff, 2.5, 10);
    light1.position.set(3, 3, 3);
    scene.add(light1);

    const light2 = new THREE.PointLight(color, 2, 8);
    light2.position.set(-3, -2, 2);
    scene.add(light2);

    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetY = x * 0.6;
      targetX = -y * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationId: number;
    const startTime = performance.now();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      group.rotation.x += (targetX - group.rotation.x) * 0.05 + 0.005;
      group.rotation.y += (targetY - group.rotation.y) * 0.05 + 0.008;
      group.rotation.z = Math.sin(elapsed * 0.5) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [size, color, wireframe]);

  return (
    <div
      ref={mountRef}
      className="relative flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing select-none"
      style={{ width: size, height: size }}
    />
  );
};
