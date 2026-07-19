"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

type VectorRef = MutableRefObject<{ x: number; y: number }>;
type SystemRef = MutableRefObject<number>;

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
    bevelSegments: lite ? 2 : 5,
    bevelSize: 0.08,
    bevelThickness: 0.08,
    curveSegments: lite ? 20 : 40,
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

function createFanBladeGeometry(lite: boolean) {
  const shape = new THREE.Shape();
  shape.moveTo(0.34, -0.08);
  shape.bezierCurveTo(0.62, -0.16, 1.08, -0.2, 1.38, -0.04);
  shape.bezierCurveTo(1.48, 0.02, 1.42, 0.18, 1.23, 0.27);
  shape.bezierCurveTo(0.88, 0.39, 0.53, 0.25, 0.32, 0.1);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelSegments: lite ? 2 : 4,
    bevelSize: 0.025,
    bevelThickness: 0.02,
    curveSegments: lite ? 12 : 24,
  });
  geometry.translate(0, 0, -0.0375);
  return geometry;
}

function Turbofan({ lite, progressRef }: { lite: boolean; progressRef: MutableRefObject<number> }) {
  const bladeCount = lite ? 10 : 16;
  const fanRef = useRef<THREE.Group>(null);
  const bladeGeometry = useMemo(() => createFanBladeGeometry(lite), [lite]);
  useEffect(() => () => bladeGeometry.dispose(), [bladeGeometry]);

  useFrame(() => {
    if (fanRef.current) fanRef.current.rotation.z = progressRef.current * Math.PI * 12;
  });

  return (
    <group>
      <mesh position={[0, 0, -0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.48, 1.62, 0.74, lite ? 56 : 112, 1, true]} />
        <meshPhysicalMaterial color="#61727c" metalness={0.96} roughness={0.2} clearcoat={0.8} clearcoatRoughness={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.11]}>
        <torusGeometry args={[1.45, 0.17, lite ? 14 : 28, lite ? 64 : 144]} />
        <meshPhysicalMaterial color="#b9c5ca" metalness={0.98} roughness={0.16} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <torusGeometry args={[1.2, 0.055, lite ? 12 : 20, lite ? 56 : 112]} />
        <meshStandardMaterial color="#293b45" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <circleGeometry args={[1.21, lite ? 56 : 112]} />
        <meshStandardMaterial color="#07131a" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.18]}>
        <torusGeometry args={[1.08, 0.04, lite ? 10 : 16, lite ? 52 : 104]} />
        <meshBasicMaterial color="#ff6b2c" transparent opacity={0.7} />
      </mesh>
      {!lite ? (
        <>
          <mesh position={[0, 0, -0.34]}><torusGeometry args={[0.9, 0.035, 8, 56]} /><meshBasicMaterial color="#ff8b52" transparent opacity={0.4} /></mesh>
          <mesh position={[0, 0, -0.48]}><torusGeometry args={[0.72, 0.026, 8, 48]} /><meshStandardMaterial color="#617986" metalness={0.9} roughness={0.25} /></mesh>
        </>
      ) : null}
      <group ref={fanRef} position={[0, 0, 0.02]}>
        {Array.from({ length: bladeCount }).map((_, index) => (
          <mesh geometry={bladeGeometry} key={index} rotation={[0, 0, (Math.PI * 2 * index) / bladeCount]}>
            <meshPhysicalMaterial
              color={index % 5 === 0 ? "#9eabb1" : "#71838c"}
              metalness={0.96}
              roughness={0.22}
              clearcoat={0.65}
              clearcoatRoughness={0.2}
            />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.42, 0.72, lite ? 40 : 80]} />
          <meshPhysicalMaterial color="#c7d1d5" metalness={0.97} roughness={0.15} clearcoat={1} clearcoatRoughness={0.12} />
        </mesh>
        <mesh position={[0, 0, 0.28]}><circleGeometry args={[0.18, 32]} /><meshBasicMaterial color="#e7eef1" /></mesh>
      </group>
    </group>
  );
}

function Gimbal({ lite }: { lite: boolean }) {
  return (
    <group>
      <mesh rotation={[0.3, 0.8, 0.2]}><torusGeometry args={[1.55, 0.045, lite ? 12 : 24, lite ? 64 : 144]} /><meshStandardMaterial color="#6d8491" metalness={0.88} roughness={0.2} /></mesh>
      <mesh rotation={[1.2, 0.15, 0.4]}><torusGeometry args={[1.18, 0.055, lite ? 12 : 24, lite ? 56 : 128]} /><meshStandardMaterial color="#b8c5cf" metalness={0.9} roughness={0.18} /></mesh>
      {!lite ? <mesh rotation={[0.25, 0.15, 1.15]}><torusGeometry args={[0.82, 0.035, 20, 112]} /><meshBasicMaterial color="#ff6b2c" transparent opacity={0.8} /></mesh> : null}
      <mesh><icosahedronGeometry args={[0.34, lite ? 3 : 5]} /><meshStandardMaterial color="#eaf0f4" emissive="#ff6b2c" emissiveIntensity={0.14} metalness={0.65} roughness={0.14} flatShading={false} /></mesh>
    </group>
  );
}

const VAULT_ROUTE_POINTS: readonly [number, number, number][] = [
  [-2.35, -0.72, 0],
  [-1.52, 0.18, 0.08],
  [-0.58, -0.08, 0.13],
  [0.18, 0.62, 0.08],
  [1.12, 0.28, 0.02],
  [2.28, 0.8, -0.04],
];

function VaultFlightPlan({ lite, activeSystemRef }: { lite: boolean; activeSystemRef: SystemRef }) {
  const markerRef = useRef<THREE.Group>(null);
  const markerProgressRef = useRef(0);
  const tubularSegments = lite ? 56 : 128;
  const radialSegments = lite ? 10 : 18;
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(VAULT_ROUTE_POINTS.map((point) => new THREE.Vector3(...point))),
    [],
  );
  const routeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, lite ? 0.025 : 0.038, radialSegments, false),
    [curve, lite, radialSegments, tubularSegments],
  );
  const completedRouteGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, lite ? 0.031 : 0.047, radialSegments, false),
    [curve, lite, radialSegments, tubularSegments],
  );
  const routeStops = useMemo(
    () => VAULT_ROUTE_POINTS.map((_, index) => curve.getPointAt(index / (VAULT_ROUTE_POINTS.length - 1))),
    [curve],
  );

  useEffect(() => () => {
    routeGeometry.dispose();
    completedRouteGeometry.dispose();
  }, [completedRouteGeometry, routeGeometry]);

  useFrame((state, delta) => {
    const targetProgress = clamp01(activeSystemRef.current / (VAULT_ROUTE_POINTS.length - 1));
    markerProgressRef.current = THREE.MathUtils.damp(markerProgressRef.current, targetProgress, 7.5, delta);
    const markerProgress = markerProgressRef.current;
    const marker = markerRef.current;
    if (marker) {
      const point = curve.getPointAt(markerProgress);
      const tangent = curve.getTangentAt(markerProgress);
      marker.position.copy(point);
      marker.rotation.z = Math.atan2(tangent.y, tangent.x);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 7) * 0.045;
      marker.scale.setScalar(pulse);
    }

    const availableIndices = completedRouteGeometry.index?.count ?? 0;
    const indexStep = radialSegments * 6;
    const completedIndices = Math.min(
      availableIndices,
      Math.max(0, Math.round((markerProgress * availableIndices) / indexStep) * indexStep),
    );
    completedRouteGeometry.setDrawRange(0, completedIndices);
  });

  return (
    <group>
      <mesh geometry={routeGeometry}>
        <meshBasicMaterial color="#8fb7c7" transparent opacity={0.32} />
      </mesh>
      <mesh geometry={completedRouteGeometry}>
        <meshBasicMaterial color="#ff6b2c" transparent opacity={0.82} />
      </mesh>
      {routeStops.map((point, index) => (
        <group key={index} position={point}>
          <mesh>
            <torusGeometry args={[0.14, 0.018, 8, lite ? 24 : 40]} />
            <meshBasicMaterial color="#a9c5d0" transparent opacity={0.42} />
          </mesh>
          <mesh position={[0, 0, -0.012]}>
            <circleGeometry args={[0.055, lite ? 18 : 30]} />
            <meshBasicMaterial color="#d6e3e8" transparent opacity={0.25} />
          </mesh>
        </group>
      ))}
      <group ref={markerRef}>
        <mesh>
          <torusGeometry args={[0.21, 0.025, 10, lite ? 30 : 48]} />
          <meshBasicMaterial color="#ff6b2c" transparent opacity={0.96} />
        </mesh>
        <mesh scale={1.34}>
          <torusGeometry args={[0.21, 0.012, 8, lite ? 24 : 40]} />
          <meshBasicMaterial color="#ff8b52" transparent opacity={0.36} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <circleGeometry args={[0.082, lite ? 20 : 34]} />
          <meshBasicMaterial color="#ff6b2c" transparent opacity={0.58} />
        </mesh>
        <mesh position={[0.29, 0, 0.016]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.055, 0.14, 3]} />
          <meshBasicMaterial color="#ffd2bd" transparent opacity={0.92} />
        </mesh>
      </group>
    </group>
  );
}

function SceneRig({ progressRef, pointerRef, activeSystemRef, tier }: { progressRef: MutableRefObject<number>; pointerRef: VectorRef; activeSystemRef: SystemRef; tier: "lite" | "full" }) {
  const airfoilRef = useRef<THREE.Group>(null);
  const turbineRef = useRef<THREE.Group>(null);
  const routeRef = useRef<THREE.Group>(null);
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
      const pathLocal = clamp01((p - 0.18) / 0.2);
      const firstCrossing = smooth((pathLocal - 0.46) / 0.14);
      const secondCrossing = smooth((pathLocal - 0.72) / 0.14);
      const firstToSecond = THREE.MathUtils.lerp(2.28, -2.28, firstCrossing);
      const chapterPosition = THREE.MathUtils.lerp(firstToSecond, 2.18, secondCrossing);
      const crossingDip = Math.max(
        windowWeight(pathLocal, 0.44, 0.53, 0.62),
        windowWeight(pathLocal, 0.7, 0.79, 0.88),
      );
      turbineRef.current.visible = weight > 0.002;
      turbineRef.current.scale.setScalar(Math.max(0.001, weight * (1.16 - crossingDip * 0.14)));
      turbineRef.current.position.set(chapterPosition, -0.12 + pointer.y * 0.08, -0.42 + weight * 0.72);
      turbineRef.current.rotation.set(-0.08 + local * 0.16, 0.32 - local * 0.54 + pointer.x * 0.04, -0.08 + local * 0.14);
    }

    if (routeRef.current) {
      const weight = windowWeight(p, 0.35, 0.5, 0.69);
      const local = smooth(clamp01((p - 0.35) / 0.34));
      routeRef.current.visible = weight > 0.002;
      routeRef.current.scale.setScalar(Math.max(0.001, weight * (0.92 + local * 0.12)));
      routeRef.current.position.set(0.75 - local * 1.45, 0.05, -1.55 + local * 0.18);
      routeRef.current.rotation.set(0.06 + local * 0.04, -0.2 + local * 0.34, -0.08 + local * 0.12);
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
      <group ref={turbineRef}><Turbofan lite={lite} progressRef={progressRef} /></group>
      <group ref={routeRef}><VaultFlightPlan lite={lite} activeSystemRef={activeSystemRef} /></group>
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
    let animationUntil = 0;
    const draw = () => {
      invalidate();
      if (performance.now() < animationUntil) frame = requestAnimationFrame(draw);
      else frame = 0;
    };
    const onChange = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onSystemChange = () => {
      animationUntil = performance.now() + 950;
      onChange();
    };
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("pointermove", onChange, { passive: true });
    window.addEventListener("interviewrunway:prep-system-change", onSystemChange);
    onChange();
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("pointermove", onChange);
      window.removeEventListener("interviewrunway:prep-system-change", onSystemChange);
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
  activeSystemRef,
  tier,
}: {
  progressRef: MutableRefObject<number>;
  pointerRef: VectorRef;
  activeSystemRef: SystemRef;
  tier: "lite" | "full";
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={tier === "full" ? [1.75, 2.5] : [1.25, 2]}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
      camera={{ position: [0, 0, 7.4], fov: 42 }}
      gl={{ alpha: true, antialias: true, precision: "highp", powerPreference: "high-performance", depth: true, stencil: false, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true }}
      shadows={false}
      fallback={null}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 5, 6]} intensity={3.4} color="#eaf0f4" />
      {tier === "full" ? <pointLight position={[-3, 1.5, 3]} intensity={14} distance={9} color="#4da8c7" /> : null}
      <pointLight position={[3, -1.5, 3]} intensity={18} distance={8} color="#ff6b2c" />
      <SceneRig progressRef={progressRef} pointerRef={pointerRef} activeSystemRef={activeSystemRef} tier={tier} />
      <DemandInvalidator />
      <CanvasLifecycle />
    </Canvas>
  );
}
