"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, RoundedBox, TorusKnot, Line, Text } from "@react-three/drei";
import * as THREE from "three";

function Particles({ count = 200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 20;
      p[i * 3 + 1] = (Math.random() - 0.5) * 20;
      p[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return geo;
  }, [count]);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.02;
      mesh.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial size={0.04} color="#3B82F6" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function ScanRings() {
  const ring1 = useRef<THREE.LineSegments>(null!);
  const ring2 = useRef<THREE.LineSegments>(null!);
  const ring3 = useRef<THREE.LineSegments>(null!);

  const geo1 = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 64;
    const radius = 2.2;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const geo2 = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segs = 64;
    const r = 2.6;
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(theta) * r * Math.cos(Math.PI / 4),
        Math.sin(theta) * r,
        Math.cos(theta) * r * Math.sin(Math.PI / 4)
      ));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const geo3 = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segs = 64;
    const r = 2.0;
    for (let i = 0; i <= segs; i++) {
      const theta = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(theta) * r * Math.cos(-Math.PI / 6),
        Math.sin(theta) * r * Math.sin(Math.PI / 3),
        Math.cos(theta) * r * Math.sin(-Math.PI / 6)
      ));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame((_, delta) => {
    if (ring1.current) ring1.current.rotation.x += delta * 0.3;
    if (ring2.current) {
      ring2.current.rotation.y += delta * 0.4;
      ring2.current.rotation.z += delta * 0.15;
    }
    if (ring3.current) {
      ring3.current.rotation.x -= delta * 0.25;
      ring3.current.rotation.z += delta * 0.35;
    }
  });

  return (
    <group>
      <lineSegments ref={ring1} geometry={geo1}>
        <lineBasicMaterial color="#3B82F6" transparent opacity={0.3} />
      </lineSegments>
      <lineSegments ref={ring2} geometry={geo2}>
        <lineBasicMaterial color="#60A5FA" transparent opacity={0.2} />
      </lineSegments>
      <lineSegments ref={ring3} geometry={geo3}>
        <lineBasicMaterial color="#3B82F6" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

function ShieldCore() {
  const group = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.15;
      group.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.08);
    }
  });

  return (
    <group ref={group}>
      {/* Outer shield ring - torus knot */}
      <TorusKnot
        args={[1.5, 0.15, 128, 16]}
        position={[0, 0, 0]}
      >
        <MeshDistortMaterial
          color="#183B6B"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={2}
          distort={0.05}
          speed={1}
        />
      </TorusKnot>

      {/* Inner core - an octahedron (diamond shape, like a fingerprint scanner core) */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <octahedronGeometry args={[0.9, 0]} />
        <MeshDistortMaterial
          color="#3B82F6"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={3}
          emissive="#3B82F6"
          emissiveIntensity={0.3}
          distort={0.15}
          speed={2}
        />
      </mesh>

      {/* Inner glow sphere */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.15} />
      </Sphere>

      {/* Small decorative spheres orbiting */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 1.8;
        return (
          <Float key={i} speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <mesh
              position={[
                Math.cos(angle + Date.now() * 0.0002) * radius,
                Math.sin(angle + Date.now() * 0.0002) * radius * 0.5,
                0,
              ]}
            >
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#60A5FA" />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function FingerprintArc() {
  const group = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.2;
  });

  const arcs = useMemo(() => {
    const results = [];
    for (let a = 0; a < 5; a++) {
      const radius = 1.0 + a * 0.25;
      const points: THREE.Vector3[] = [];
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI - Math.PI / 2;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius * 0.6;
        points.push(new THREE.Vector3(x, y + 0.3, 0));
      }
      results.push(points);
    }
    return results;
  }, []);

  return (
    <group ref={group} position={[0, 0, 1.4]}>
      {arcs.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#60A5FA"
          lineWidth={0.5}
          transparent
          opacity={0.25 - i * 0.04}
        />
      ))}
    </group>
  );
}

function LightRays() {
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0, 3 + i * 2, -2]}
          rotation={[Math.PI / 3, (i / 3) * Math.PI * 2, 0]}
        >
          <planeGeometry args={[6, 8]} />
          <meshBasicMaterial
            color="#3B82F6"
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function IDGuardScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["transparent"]} />

        {/* Ambient + directional lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#60A5FA" />
        <directionalLight position={[-3, -2, 3]} intensity={0.8} color="#3B82F6" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#3B82F6" />
        <spotLight position={[0, 5, 3]} intensity={0.6} color="#60A5FA" angle={0.3} penumbra={1} />

        {/* Scene elements */}
        <ShieldCore />
        <ScanRings />
        <FingerprintArc />
        <LightRays />
        <Particles count={150} />
      </Canvas>
    </div>
  );
}
