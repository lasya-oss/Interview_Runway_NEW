"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

type VectorRef = MutableRefObject<{ x: number; y: number }>;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smooth(value: number) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function windowWeight(progress: number, start: number, peak: number, end: number) {
  if (progress <= start || progress >= end) return 0;
  if (progress < peak) return smooth((progress - start) / (peak - start));
  return smooth((end - progress) / (end - peak));
}

function createAirfoilGeometry(lite: boolean) {
  const shape = new THREE.Shape();
  shape.moveTo(-2.65, 0);
  shape.bezierCurveTo(-1.45, 0.64, 0.7, 0.72, 2.62, 0.07);
  shape.bezierCurveTo(0.7, -0.24, -1.3, -0.36, -2.65, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSegments: lite ? 1 : 3,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    curveSegments: lite ? 14 : 24,
  });
  geometry.center();
  return geometry;
}

function Airfoil({ geometry, color = "#b8c5cf", wire = false, lite = false }: { geometry: THREE.ExtrudeGeometry; color?: string; wire?: boolean; lite?: boolean }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {wire ? (
        <meshBasicMaterial color="#ff6b2c" wireframe transparent opacity={0.32} />
      ) : lite ? (
        <meshStandardMaterial color={color} metalness={0.88} roughness={0.24} />
      ) : (
        <meshPhysicalMaterial
          color={color}
          metalness={0.92}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.16}
          reflectivity={0.9}
        />
      )}
    </mesh>
  );
}

function Turbine({ lite }: { lite: boolean }) {
  const bladeCount = lite ? 5 : 9;
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh><torusGeometry args={[1.45, 0.13, 10, lite ? 30 : 56]} /><meshStandardMaterial color="#9fb2bd" metalness={0.9} roughness={0.24} /></mesh>
      <mesh><torusGeometry args={[0.92, 0.045, 8, lite ? 28 : 48]} /><meshBasicMaterial color="#ff6b2c" transparent opacity={0.8} /></mesh>
      <mesh><cylinderGeometry args={[0.32, 0.56, 0.75, lite ? 18 : 32]} /><meshStandardMaterial color="#c7d2d8" metalness={0.92} roughness={0.2} /></mesh>
      {Array.from({ length: bladeCount }).map((_, index) => (
        <mesh key={index} rotation={[0, (Math.PI * 2 * index) / bladeCount, 0]} position={[0, 0.02, 0]}>
          <boxGeometry args={[0.06, 0.08, 1.55]} />
          <meshStandardMaterial color={index === 2 ? "#ff6b2c" : "#708795"} metalness={0.78} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function Gimbal({ lite }: { lite: boolean }) {
  return (
    <group>
      <mesh rotation={[0.3, 0.8, 0.2]}><torusGeometry args={[1.55, 0.045, 8, lite ? 36 : 72]} /><meshStandardMaterial color="#6d8491" metalness={0.88} roughness={0.2} /></mesh>
      <mesh rotation={[1.2, 0.15, 0.4]}><torusGeometry args={[1.18, 0.055, 8, lite ? 32 : 64]} /><meshStandardMaterial color="#b8c5cf" metalness={0.9} roughness={0.18} /></mesh>
      {!lite ? <mesh rotation={[0.25, 0.15, 1.15]}><torusGeometry args={[0.82, 0.035, 10, 56]} /><meshBasicMaterial color="#ff6b2c" transparent opacity={0.8} /></mesh> : null}
      <mesh><icosahedronGeometry args={[0.34, lite ? 1 : 2]} /><meshStandardMaterial color="#eaf0f4" emissive="#ff6b2c" emissiveIntensity={0.14} metalness={0.65} roughness={0.14} /></mesh>
    </group>
  );
}

function VaultRibs({ lite }: { lite: boolean }) {
  const ribCount = lite ? 4 : 7;
  return (
    <group>
      {Array.from({ length: ribCount }).map((_, index) => (
        <mesh key={index} position={[0, 0, -index * 0.5]} scale={1 + index * 0.12}>
          <torusGeometry args={[1.15, 0.035, 8, 6]} />
          <meshStandardMaterial color={index === 2 || index === 5 ? "#ff6b2c" : "#7f949e"} metalness={0.8} roughness={0.32} transparent opacity={0.78 - index * 0.06} />
        </mesh>
      ))}
    </group>
  );
}

function SceneRig({ progressRef, pointerRef, tier }: { progressRef: MutableRefObject<number>; pointerRef: VectorRef; tier: "lite" | "full" }) {
  const airfoilRef = useRef<THREE.Group>(null);
  const turbineRef = useRef<THREE.Group>(null);
  const ribsRef = useRef<THREE.Group>(null);
  const gimbalRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Group>(null);
  const lite = tier === "lite";
  const airfoilGeometry = useMemo(() => createAirfoilGeometry(lite), [lite]);
  useEffect(() => () => airfoilGeometry.dispose(), [airfoilGeometry]);

  useFrame(() => {
    const p = progressRef.current;
    const pointer = pointerRef.current;

    if (airfoilRef.current) {
      const weight = windowWeight(p, -0.28, 0, 0.31);
      const travel = smooth(clamp01(p / 0.28));
      airfoilRef.current.visible = weight > 0.002;
      airfoilRef.current.scale.setScalar(Math.max(0.001, weight * (1.08 + travel * 0.12)));
      airfoilRef.current.position.set(1.65 - travel * 3.4 + pointer.x * 0.18, 0.25 + Math.sin(travel * Math.PI) * 0.55 + pointer.y * 0.08, -0.2 + travel * 0.5);
      airfoilRef.current.rotation.set(-0.15 + travel * 0.36, -0.55 + travel * 1.25 + pointer.x * 0.05, -0.13 + travel * 0.22);
    }

    if (turbineRef.current) {
      const weight = windowWeight(p, 0.16, 0.3, 0.49);
      const local = smooth(clamp01((p - 0.16) / 0.33));
      turbineRef.current.visible = weight > 0.002;
      turbineRef.current.scale.setScalar(Math.max(0.001, weight * 1.22));
      turbineRef.current.position.set(-2.45 + local * 4.25, -0.18 + pointer.y * 0.1, -0.5 + weight * 0.8);
      turbineRef.current.rotation.set(local * 0.22, local * 0.7, local * Math.PI * 2.4);
    }

    if (ribsRef.current) {
      const weight = windowWeight(p, 0.35, 0.5, 0.69);
      const local = smooth(clamp01((p - 0.35) / 0.34));
      ribsRef.current.visible = weight > 0.002;
      ribsRef.current.scale.setScalar(Math.max(0.001, weight * (1.15 + local * 0.3)));
      ribsRef.current.position.set(1.55 - local * 3.15, 0.15, -1.2 + local * 1.2);
      ribsRef.current.rotation.set(0.15, -0.45 + local * 0.8, 0.25 + local * 0.35);
    }

    if (gimbalRef.current) {
      const weight = windowWeight(p, 0.58, 0.72, 0.94);
      const local = smooth(clamp01((p - 0.58) / 0.34));
      gimbalRef.current.visible = weight > 0.002;
      gimbalRef.current.scale.setScalar(Math.max(0.001, weight * 1.06));
      gimbalRef.current.position.set(-1.9 + local * 3.2 + pointer.x * 0.12, 0.15 + pointer.y * 0.1, 0.1);
      gimbalRef.current.rotation.set(local * 0.55, local * 0.8, -local * 0.35);
    }

    if (trailRef.current) {
      const travel = smooth(clamp01(p / 0.9));
      trailRef.current.position.x = -2.8 + travel * 2.5;
      trailRef.current.rotation.z = -0.12 + travel * 0.2;
      trailRef.current.scale.x = 0.7 + travel * 0.7;
    }
  });

  return (
    <>
      <group ref={airfoilRef}>
        <Airfoil geometry={airfoilGeometry} lite={lite} />
        {!lite ? <group position={[0.2, -0.18, -0.34]} scale={0.98}><Airfoil geometry={airfoilGeometry} color="#324653" /></group> : null}
        {!lite ? <group position={[0.45, -0.34, -0.68]} scale={0.96}><Airfoil geometry={airfoilGeometry} wire /></group> : null}
      </group>
      <group ref={turbineRef}><Turbine lite={lite} /></group>
      <group ref={ribsRef}><VaultRibs lite={lite} /></group>
      <group ref={gimbalRef}><Gimbal lite={lite} /></group>
      <group ref={trailRef}>
        {(lite ? [-0.5, 0, 0.5] : [-0.72, -0.36, 0, 0.36, 0.72]).map((y, index) => (
          <mesh position={[0, y, -1.8 - index * 0.08]} key={y}>
            <boxGeometry args={[5.7 - index * 0.35, 0.012, 0.012]} />
            <meshBasicMaterial color={y === 0 ? "#ff6b2c" : "#8fa4af"} transparent opacity={0.12 + (y === 0 ? 0.15 : 0)} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function DemandInvalidator() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = 0;
      invalidate();
    };
    const onChange = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("pointermove", onChange, { passive: true });
    onChange();
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("pointermove", onChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [invalidate]);
  return null;
}

function CanvasLifecycle() {
  const gl = useThree((state) => state.gl);
  const markedReady = useRef(false);

  useFrame(() => {
    if (markedReady.current) return;
    markedReady.current = true;
    document.documentElement.dataset.aeroCanvas = "ready";
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = () => {
      document.documentElement.dataset.aeroCanvas = "failed";
    };
    canvas.addEventListener("webglcontextlost", onLost, { once: true });
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl]);

  return null;
}

export function HomeAeroCanvas({
  progressRef,
  pointerRef,
  tier,
}: {
  progressRef: MutableRefObject<number>;
  pointerRef: VectorRef;
  tier: "lite" | "full";
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={tier === "full" ? [1, 1.45] : 1}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
      camera={{ position: [0, 0, 7.4], fov: 42 }}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance", depth: true, stencil: false, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true }}
      shadows={false}
      fallback={null}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 5, 6]} intensity={3.4} color="#eaf0f4" />
      {tier === "full" ? <pointLight position={[-3, 1.5, 3]} intensity={14} distance={9} color="#4da8c7" /> : null}
      <pointLight position={[3, -1.5, 3]} intensity={18} distance={8} color="#ff6b2c" />
      <SceneRig progressRef={progressRef} pointerRef={pointerRef} tier={tier} />
      <DemandInvalidator />
      <CanvasLifecycle />
    </Canvas>
  );
}
