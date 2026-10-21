import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import { PenguinModel, PENGUIN_MODEL_PATH, ModelInspectionDetails } from './PenguinModel';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { PenguinState } from '../types';
import { Volume2, VolumeX, Sparkles, AlertCircle, Info, RefreshCw, Box } from 'lucide-react';
import { getCustomModelUrl, removeCustomModel } from '../utils/modelStorage';

interface PenguinViewerProps {
  state: PenguinState;
  variant?: 'prominent' | 'compact';
  onStateChange?: (newState: PenguinState) => void;
  isSpeaking?: boolean;
  className?: string;
}

const STATE_CONFIG: Record<PenguinState, { label: string; color: string; desc: string }> = {
  idle: { label: 'Idle', color: 'bg-slate-100 text-slate-700 border-slate-200', desc: 'Gentle floating & subtle sway' },
  greeting: { label: 'Greeting', color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Friendly wave & welcome movement' },
  listening: { label: 'Listening', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', desc: 'Attentive forward lean' },
  thinking: { label: 'Thinking', color: 'bg-amber-50 text-amber-800 border-amber-200', desc: 'Curious head tilt & pondering' },
  speaking: { label: 'Speaking', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', desc: 'Beak motion & vocal gestures' },
  happy: { label: 'Happy', color: 'bg-teal-50 text-teal-800 border-teal-200', desc: 'Upbeat hops & celebratory flutters' },
  error: { label: 'Confused', color: 'bg-rose-50 text-rose-800 border-rose-200', desc: 'Gentle puzzled head tilt' },
};

export function PenguinViewer({
  state,
  variant = 'prominent',
  onStateChange,
  isSpeaking = false,
  className = '',
}: PenguinViewerProps) {
  const [inspection, setInspection] = useState<ModelInspectionDetails | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const orbitRef = useRef<any>(null);

  useEffect(() => {
    getCustomModelUrl().then((url) => {
      if (url) setCustomModelUrl(url);
    });

    const handleModelUpdate = (e: any) => {
      const url = e.detail?.url;
      setCustomModelUrl(url || null);
    };

    window.addEventListener('vsb-model-updated', handleModelUpdate);
    return () => {
      window.removeEventListener('vsb-model-updated', handleModelUpdate);
    };
  }, []);

  const handleModelLoaded = React.useCallback((details: ModelInspectionDetails) => {
    setInspection(details);
  }, []);

  const resetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  const isProminent = variant === 'prominent';

  return (
    <div
      className={`relative rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col ${
        isProminent ? 'h-[360px] sm:h-[420px] w-full max-w-2xl mx-auto' : 'h-[140px] w-full'
      } ${className}`}
    >
      {/* Top Header Bar */}
      <div className="absolute top-2.5 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            VSB 3D Mascot
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium border ${
              STATE_CONFIG[state]?.color || 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {STATE_CONFIG[state]?.label || state}
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <Volume2 className="w-3 h-3 animate-bounce" />
              Speaking
            </span>
          )}
          {customModelUrl && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Box className="w-2.5 h-2.5" />
              Custom Model
            </span>
          )}
        </div>

        {isProminent && (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setShowInspector(!showInspector)}
              title="Inspect 3D Model hierarchy"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs text-xs flex items-center gap-1 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Inspect GLB</span>
            </button>
            <button
              onClick={resetCamera}
              title="Reset view"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full bg-white">
        <Canvas
          shadows
          camera={{
            position: [0, 0.4, isProminent ? 4.2 : 4.8],
            fov: isProminent ? 45 : 42,
          }}
          gl={{
            antialias: true,
            toneMappingExposure: 1.15,
          }}
        >
          {/* Studio 3-point Lighting */}
          <ambientLight intensity={1.15} />
          <directionalLight
            position={[4, 7, 5]}
            intensity={1.6}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={20}
            shadow-camera-left={-3}
            shadow-camera-right={3}
            shadow-camera-top={3}
            shadow-camera-bottom={-3}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#dbeafe" />
          <hemisphereLight intensity={0.7} groundColor="#ffffff" color="#ffffff" />

          <Suspense
            fallback={
              <group position={[0, 0, 0]}>
                <mesh>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshStandardMaterial color="#2563eb" wireframe />
                </mesh>
              </group>
            }
          >
            <ModelErrorBoundary
              key={customModelUrl || 'default'}
              fallback={
                <PenguinModel
                  state={state}
                  onModelLoaded={handleModelLoaded}
                  modelUrl={PENGUIN_MODEL_PATH}
                />
              }
              onError={() => {
                setCustomModelUrl(null);
                removeCustomModel().catch(() => {});
              }}
            >
              <PenguinModel
                state={state}
                onModelLoaded={handleModelLoaded}
                modelUrl={customModelUrl || PENGUIN_MODEL_PATH}
              />
            </ModelErrorBoundary>
            {/* Contact ground shadow */}
            <ContactShadows
              position={[0, -1.2, 0]}
              opacity={0.2}
              scale={3.5}
              blur={2.0}
              far={3.0}
              color="#94a3b8"
            />
          </Suspense>

          <OrbitControls
            ref={orbitRef}
            enablePan={false}
            enableZoom={isProminent}
            minDistance={2.5}
            maxDistance={7.0}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* Prominent State Interactive Selector Bar (Bottom) */}
      {isProminent && (
        <div className="border-t border-slate-100 bg-white px-3 py-2 z-10">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
              Test Mascot States:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {(Object.keys(STATE_CONFIG) as PenguinState[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStateChange?.(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap ${
                    state === st
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {STATE_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Inspector Overlay Modal */}
      {showInspector && inspection && (
        <div className="absolute inset-0 bg-white/98 z-30 p-4 overflow-y-auto text-xs text-slate-800 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              GLB Inspection: Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb
            </h4>
            <button
              onClick={() => setShowInspector(false)}
              className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Detected Meshes</span>
              <span className="text-base font-bold text-slate-900">{inspection.meshCount}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Embedded Clips</span>
              <span className="text-base font-bold text-slate-900">{inspection.animationNames.length}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Bones / Skeleton</span>
              <span className="text-base font-bold text-slate-900">{inspection.hasBones ? 'Yes' : 'None (Procedural)'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Morph Targets</span>
              <span className="text-base font-bold text-slate-900">{inspection.hasMorphTargets ? 'Yes' : 'Procedural Beak'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Detected Nodes / Objects:</span>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
                {inspection.nodeNames.map((n, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-mono shadow-2xs">
                    {n || `(node_${i})`}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Animation Clips:</span>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                {inspection.animationNames.length > 0 ? (
                  inspection.animationNames.join(', ')
                ) : (
                  <span className="italic">
                    No embedded clips in GLB file. Using real-time procedural kinematics across all 7 states (Head, Beak, Wings, Body, Feet).
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
