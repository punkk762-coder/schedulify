"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface ThreeFluidOrbProps {
  level?: number; // 0 to 100 percentage
  size?: number; // canvas dimension in px
  color?: string; // hex or CSS color
  interactive?: boolean;
}

export const ThreeFluidOrb: React.FC<ThreeFluidOrbProps> = ({
  level = 75,
  size = 180,
  color = "#a43716",
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    // Group for mouse rotation
    const group = new THREE.Group();
    scene.add(group);

    // 1. Outer Glass Sphere
    const glassGeometry = new THREE.SphereGeometry(1.4, 64, 64);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.8,
      ior: 1.45,
      transparent: true,
      opacity: 0.9,
      color: 0xffffff,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const glassSphere = new THREE.Mesh(glassGeometry, glassMaterial);
    group.add(glassSphere);

    // 2. Inner Liquid Mesh (Clipped sphere / procedural wave)
    // Normalized height: level / 100 maps to -1.3 to +1.3
    const fillFrac = Math.max(0.05, Math.min(0.98, level / 100));
    const liquidGeom = new THREE.SphereGeometry(1.32, 48, 48);

    // Custom shader material for procedural fluid undulating wave
    const liquidColor = new THREE.Color(color);
    const fluidMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLevel: { value: -1.3 + fillFrac * 2.6 },
        uColor: { value: liquidColor },
        uDeepColor: { value: liquidColor.clone().multiplyScalar(0.5) },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normal;

          // Gentle sine wave displacement on top surface
          vec3 pos = position;
          float wave = sin(pos.x * 3.5 + uTime * 2.2) * 0.06 + cos(pos.z * 3.0 + uTime * 1.8) * 0.05;
          pos.y += wave * smoothstep(-0.2, 0.4, pos.y);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uLevel;
        uniform vec3 uColor;
        uniform vec3 uDeepColor;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // Dynamic liquid cut-off plane with wave ripple
          float wave = sin(vPosition.x * 4.0 + uTime * 2.0) * 0.06 + cos(vPosition.z * 3.5 + uTime * 1.5) * 0.04;
          if (vPosition.y > (uLevel + wave)) {
            discard;
          }

          // Shading and Fresnel glow
          vec3 lightDir = normalize(vec3(1.0, 1.5, 2.0));
          float diff = max(dot(vNormal, lightDir), 0.2);
          float depthFactor = smoothstep(-1.3, uLevel, vPosition.y);
          vec3 col = mix(uDeepColor, uColor, depthFactor);

          // Specular rim
          float rim = 1.0 - max(dot(normalize(-vPosition), vNormal), 0.0);
          col += vec3(1.0, 0.9, 0.8) * pow(rim, 3.0) * 0.35;

          gl_FragColor = vec4(col * (diff + 0.4), 0.92);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const liquidMesh = new THREE.Mesh(liquidGeom, fluidMaterial);
    group.add(liquidMesh);

    // 3. Floating Micro-bubbles inside the liquid
    const bubbleCount = 28;
    const bubbleGeom = new THREE.SphereGeometry(0.04, 16, 16);
    const bubbleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
    });
    const bubbles: { mesh: THREE.Mesh; speed: number; seed: number }[] = [];

    for (let i = 0; i < bubbleCount; i++) {
      const bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.9;
      bubble.position.set(
        Math.cos(theta) * r,
        -1.1 + Math.random() * (fillFrac * 2.2),
        Math.sin(theta) * r
      );
      const scale = 0.5 + Math.random() * 0.8;
      bubble.scale.set(scale, scale, scale);
      group.add(bubble);
      bubbles.push({
        mesh: bubble,
        speed: 0.008 + Math.random() * 0.012,
        seed: Math.random() * 10,
      });
    }

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(color, 1.5, 8);
    pointLight.position.set(-2, -1, 2);
    scene.add(pointLight);

    // Mouse Interaction
    let targetRotX = 0;
    let targetRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.45;
      targetRotX = -y * 0.35;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      fluidMaterial.uniforms.uTime.value = elapsedTime;

      // Smooth camera/group tilt
      group.rotation.x += (targetRotX - group.rotation.x) * 0.08;
      group.rotation.y += (targetRotY - group.rotation.y) * 0.08;
      glassSphere.rotation.y = elapsedTime * 0.15;

      // Animate floating bubbles
      const maxLevel = -1.3 + fillFrac * 2.4;
      for (const b of bubbles) {
        b.mesh.position.y += b.speed;
        b.mesh.position.x += Math.sin(elapsedTime * 2 + b.seed) * 0.002;
        if (b.mesh.position.y > maxLevel) {
          b.mesh.position.y = -1.1;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      glassGeometry.dispose();
      glassMaterial.dispose();
      liquidGeom.dispose();
      fluidMaterial.dispose();
      bubbleGeom.dispose();
      bubbleMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [level, size, color, interactive]);

  return (
    <div
      ref={mountRef}
      className="relative flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing select-none"
      style={{ width: size, height: size }}
    />
  );
};
