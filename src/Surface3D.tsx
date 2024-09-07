import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { surfaces, runOptimizer, OptimizerInfo, OptimizerConfig } from './optimizers';

interface SurfaceMeshProps {
  surfaceKey: string;
  resolution?: number;
}

function SurfaceMesh({ surfaceKey, resolution = 80 }: SurfaceMeshProps) {
  const surface = surfaces[surfaceKey];

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const [xMin, xMax] = surface.rangeX;
    const [yMin, yMax] = surface.rangeY;
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const colorLow = new THREE.Color('#1e40af');
    const colorMid = new THREE.Color('#22d3ee');
    const colorHigh = new THREE.Color('#f97316');
    const colorTop = new THREE.Color('#ef4444');

    let maxZ = 0;
    const zValues: number[][] = [];

    for (let i = 0; i <= resolution; i++) {
      zValues[i] = [];
      for (let j = 0; j <= resolution; j++) {
        const x = xMin + (xMax - xMin) * (i / resolution);
        const y = yMin + (yMax - yMin) * (j / resolution);
        const z = surface.fn(x, y);
        zValues[i][j] = z;
        if (z > maxZ && z < 50) maxZ = z;
      }
    }

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = xMin + (xMax - xMin) * (i / resolution);
        const y = yMin + (yMax - yMin) * (j / resolution);
        const z = Math.min(zValues[i][j], maxZ);

        const normX = (x - xMin) / (xMax - xMin) * 8 - 4;
        const normY = (y - yMin) / (yMax - yMin) * 8 - 4;
        const normZ = (z / maxZ) * 4;

        vertices.push(normX, normZ, normY);

        const t = z / maxZ;
        const color = new THREE.Color();
        if (t < 0.25) color.lerpColors(colorLow, colorMid, t * 4);
        else if (t < 0.6) color.lerpColors(colorMid, colorHigh, (t - 0.25) / 0.35);
        else color.lerpColors(colorHigh, colorTop, (t - 0.6) / 0.4);

        colors.push(color.r, color.g, color.b);
      }
    }

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * (resolution + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (resolution + 1) + j;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [surfaceKey, resolution]);

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial
        vertexColors
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        shininess={30}
      />
    </mesh>
  );
}

interface OptimizerPathProps {
  path: { x: number; y: number; z: number }[];
  color: string;
  surfaceKey: string;
  animStep: number;
}

function OptimizerPath({ path, color, surfaceKey, animStep }: OptimizerPathProps) {
  const surface = surfaces[surfaceKey];
  const [xMin, xMax] = surface.rangeX;
  const [yMin, yMax] = surface.rangeY;

  const maxZ = useMemo(() => {
    let mz = 0;
    const res = 40;
    for (let i = 0; i <= res; i++) {
      for (let j = 0; j <= res; j++) {
        const x = xMin + (xMax - xMin) * (i / res);
        const y = yMin + (yMax - yMin) * (j / res);
        const z = surface.fn(x, y);
        if (z > mz && z < 50) mz = z;
      }
    }
    return mz;
  }, [surfaceKey]);

  const visiblePath = path.slice(0, Math.min(animStep + 1, path.length));

  const points = useMemo(() => {
    return visiblePath.map(p => {
      const nx = (p.x - xMin) / (xMax - xMin) * 8 - 4;
      const ny = (p.y - yMin) / (yMax - yMin) * 8 - 4;
      const nz = (Math.min(p.z, maxZ) / maxZ) * 4 + 0.05;
      return new THREE.Vector3(nx, nz, ny);
    });
  }, [visiblePath.length, surfaceKey]);

  const currentPos = points.length > 0 ? points[points.length - 1] : null;

  if (points.length < 2) {
    return currentPos ? (
      <mesh position={currentPos}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    ) : null;
  }

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={3}
      />
      {currentPos && (
        <mesh position={currentPos}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}

function AxisLabels() {
  return (
    <group>
      <Text position={[0, -0.5, 5]} fontSize={0.4} color="#94a3b8" anchorX="center">
        Parameter 1 (x)
      </Text>
      <Text position={[5, -0.5, 0]} fontSize={0.4} color="#94a3b8" anchorX="center" rotation={[0, -Math.PI / 2, 0]}>
        Parameter 2 (y)
      </Text>
      <Text position={[-4.5, 2.5, -4.5]} fontSize={0.35} color="#94a3b8" anchorX="center">
        Loss ↑
      </Text>
    </group>
  );
}

interface Surface3DProps {
  surfaceKey: string;
  selectedOptimizers: OptimizerInfo[];
  animStep: number;
  maxSteps: number;
  config?: Partial<OptimizerConfig>;
  customStart?: { x: number; y: number } | null;
  className?: string;
}

export default function Surface3D({
  surfaceKey,
  selectedOptimizers,
  animStep,
  maxSteps,
  config = {},
  customStart,
  className = '',
}: Surface3DProps) {
  const paths = useMemo(() => {
    return selectedOptimizers.map(opt => ({
      optimizer: opt,
      path: runOptimizer(opt, surfaceKey, maxSteps, config, customStart ?? undefined),
    }));
  }, [surfaceKey, selectedOptimizers, maxSteps, config, customStart]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [8, 8, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        <pointLight position={[0, 8, 0]} intensity={0.4} />
        
        <group position={[0, -1.5, 0]}>
          <SurfaceMesh surfaceKey={surfaceKey} />
          {paths.map(({ optimizer, path }) => (
            <OptimizerPath
              key={optimizer.id}
              path={path}
              color={optimizer.color}
              surfaceKey={surfaceKey}
              animStep={animStep}
            />
          ))}
          <AxisLabels />
          <gridHelper args={[8, 16, '#334155', '#1e293b']} position={[0, -0.01, 0]} />
        </group>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
