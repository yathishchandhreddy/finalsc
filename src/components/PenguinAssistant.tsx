import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { PenguinModel, PENGUIN_MODEL_PATH, ModelInspectionDetails } from './PenguinModel';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { PenguinState, VoiceStatus } from '../types';
import {
  Volume2,
  VolumeX,
  Square,
  Pause,
  Play,
  RotateCcw,
  Info,
  Bot,
  Maximize2,
  X,
  Sparkles
} from 'lucide-react';
import { getCustomModelUrl, removeCustomModel } from '../utils/modelStorage';

export interface PenguinAssistantProps {
  state: PenguinState;
  voiceStatus: VoiceStatus;
  onStateChange?: (newState: PenguinState) => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  onPauseResumeSpeech: () => void;
  onStopSpeech: () => void;
  className?: string;
  isMobileCompact?: boolean;
}

const MASCOT_STATE_META: Record<
  PenguinState,
  { label: string; badgeClass: string; dotClass: string; description: string }
> = {
  idle: {
    label: 'Idle',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-400',
    description: 'Floating gently & ready',
  },
  greeting: {
    label: 'Greeting',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold',
    dotClass: 'bg-blue-500 animate-pulse',
    description: 'Waving right wing hello',
  },
  listening: {
    label: 'Listening',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold',
    dotClass: 'bg-indigo-600 animate-ping',
    description: 'Attentive to your inquiry',
  },
  thinking: {
    label: 'Thinking',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    dotClass: 'bg-amber-500 animate-bounce',
    description: 'Consulting college records...',
  },
  speaking: {
    label: 'Speaking',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
    dotClass: 'bg-emerald-500 animate-pulse',
    description: 'Articulating response with beak',
  },
  happy: {
    label: 'Happy',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 font-semibold',
    dotClass: 'bg-teal-500',
    description: 'Answer delivered cheerfully',
  },
  error: {
    label: 'Confused',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
    dotClass: 'bg-rose-500',
    description: 'Encountered an interruption',
  },
};

const VOICE_STATUS_META: Record<
  VoiceStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  off: {
    label: 'Voice: Off',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
    dotClass: 'bg-slate-400',
  },
  ready: {
    label: 'Voice: Ready',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  speaking: {
    label: 'Voice: Speaking',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse',
    dotClass: 'bg-emerald-600',
  },
  paused: {
    label: 'Voice: Paused',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
  },
  stopped: {
    label: 'Voice: Stopped',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
    dotClass: 'bg-slate-400',
  },
  error: {
    label: 'Voice: Error',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-500',
  },
};

export function PenguinAssistant({
  state,
  voiceStatus,
  onStateChange,
  isVoiceEnabled,
  onToggleVoice,
  onPauseResumeSpeech,
  onStopSpeech,
  className = '',
  isMobileCompact = false,
}: PenguinAssistantProps) {
  const [inspection, setInspection] = useState<ModelInspectionDetails | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [showMobile3DModal, setShowMobile3DModal] = useState(false);
  const actionTimeoutRef = useRef<any>(null);
  const orbitRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    getCustomModelUrl().then((url) => {
      if (isMounted && url) {
        setCustomModelUrl(url);
      }
    });

    const handleModelUpdate = (e: any) => {
      if (!isMounted) return;
      const url = e.detail?.url;
      setCustomModelUrl(url || null);
    };

    window.addEventListener('vsb-model-updated', handleModelUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('vsb-model-updated', handleModelUpdate);
    };
  }, []);

  const handleModelLoaded = React.useCallback((details: ModelInspectionDetails) => {
    setInspection(details);
  }, []);

  const handleModelError = React.useCallback((error: Error) => {
    console.warn('Custom model failed to render, falling back to bundled model:', error.message);
    setCustomModelUrl(null);
    removeCustomModel().catch(() => {});
  }, []);

  const resetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  // Trigger test action and return smoothly to idle without staying permanently in that state
  const handleTriggerAction = (mood: 'greeting' | 'thinking' | 'happy') => {
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    onStateChange?.(mood);
    const timeouts = { greeting: 2600, thinking: 3000, happy: 2000 };
    actionTimeoutRef.current = setTimeout(() => {
      onStateChange?.('idle');
    }, timeouts[mood]);
  };

  const currentMascotMeta = MASCOT_STATE_META[state] || MASCOT_STATE_META.idle;
  const currentVoiceMeta = VOICE_STATUS_META[voiceStatus] || VOICE_STATUS_META.ready;
  const isSpeechActiveNow = voiceStatus === 'speaking' || voiceStatus === 'paused';

  // Mobile compact presentation stacked above conversation
  if (isMobileCompact) {
    return (
      <>
        <div className={`w-full rounded-2xl border border-slate-200 bg-white shadow-2xs p-3 flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            {/* Mascot Avatar with status dot */}
            <div
              onClick={() => setShowMobile3DModal(true)}
              className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs relative cursor-pointer shrink-0 hover:scale-105 transition-transform"
              title="Tap to open interactive 3D Mascot view"
            >
              <Bot className="w-5 h-5" />
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${currentMascotMeta.dotClass}`} />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900">VSB 3D Mascot</span>
                {/* Mascot action indicator */}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border flex items-center gap-1 ${currentMascotMeta.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentMascotMeta.dotClass}`} />
                  {currentMascotMeta.label}
                </span>
                {/* Voice playback indicator */}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border flex items-center gap-1 ${currentVoiceMeta.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentVoiceMeta.dotClass}`} />
                  {currentVoiceMeta.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {currentMascotMeta.description}
              </p>
            </div>
          </div>

          {/* Controls on mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isSpeechActiveNow && (
              <>
                <button
                  onClick={onPauseResumeSpeech}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs transition-colors cursor-pointer"
                  title={voiceStatus === 'paused' ? 'Resume Voice' : 'Pause Voice'}
                >
                  {voiceStatus === 'paused' ? <Play className="w-3.5 h-3.5 fill-slate-700" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onStopSpeech}
                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs transition-colors cursor-pointer"
                  title="Stop Speaking"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-700" />
                </button>
              </>
            )}

            <button
              onClick={onToggleVoice}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isVoiceEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title={isVoiceEnabled ? 'Voice is On' : 'Voice is Off'}
            >
              {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Mobile 3D Expand Button */}
            <button
              onClick={() => setShowMobile3DModal(true)}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs transition-colors cursor-pointer"
              title="Open full 3D mascot interactive view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Fullscreen 3D View Modal */}
        {showMobile3DModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md h-[480px] flex flex-col overflow-hidden relative">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">VSB 3D Tech Mascot</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${currentMascotMeta.badgeClass}`}>
                    {currentMascotMeta.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${currentVoiceMeta.badgeClass}`}>
                    {currentVoiceMeta.label}
                  </span>
                </div>
                <button
                  onClick={() => setShowMobile3DModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 w-full h-full relative bg-gradient-to-b from-slate-50 to-blue-50/20">
                <Canvas
                  shadows
                  camera={{ position: [0, 0.4, 4.4], fov: 43 }}
                  gl={{ antialias: true, toneMappingExposure: 1.15 }}
                >
                  <ambientLight intensity={1.15} />
                  <directionalLight position={[3.5, 6, 4.5]} intensity={1.5} castShadow />
                  <directionalLight position={[-3.5, 3, -2.5]} intensity={0.45} color="#dbeafe" />
                  <hemisphereLight intensity={0.65} groundColor="#f8fafc" color="#ffffff" />

                  <Suspense
                    fallback={
                      <group position={[0, 0, 0]}>
                        <mesh>
                          <boxGeometry args={[0.4, 0.4, 0.4]} />
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
                      onError={handleModelError}
                    >
                      <PenguinModel
                        state={state}
                        onModelLoaded={handleModelLoaded}
                        modelUrl={customModelUrl || PENGUIN_MODEL_PATH}
                      />
                    </ModelErrorBoundary>
                    <ContactShadows position={[0, -1.2, 0]} opacity={0.22} scale={3.6} blur={2.2} far={3.0} color="#64748b" />
                  </Suspense>

                  <OrbitControls enablePan={false} enableZoom={true} minDistance={2.5} maxDistance={6.0} />
                </Canvas>
              </div>

              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">{currentMascotMeta.description}</span>
                <button
                  onClick={() => setShowMobile3DModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full Desktop Assistant Panel (Left Column, 260-320px)
  return (
    <div
      className={`flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden select-none ${className}`}
    >
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 tracking-tight block">
              3D Mascot Assistant
            </span>
            <span className="text-[10px] text-slate-500 block">
              VSB Engineering College
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-xs cursor-pointer"
            title="Inspect 3D GLB Nodes & Bones"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors text-xs cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Scene Viewport: Prominently displaying the 3D penguin model */}
      <div className="relative flex-1 min-h-[250px] w-full bg-gradient-to-b from-slate-50 via-white to-blue-50/20">
        <Canvas
          shadows
          camera={{
            position: [0, 0.4, 4.2],
            fov: 44,
          }}
          gl={{
            antialias: true,
            toneMappingExposure: 1.15,
          }}
        >
          {/* 3-point Studio Illumination */}
          <ambientLight intensity={1.15} />
          <directionalLight
            position={[3.5, 6, 4.5]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-3.5, 3, -2.5]} intensity={0.45} color="#dbeafe" />
          <hemisphereLight intensity={0.65} groundColor="#f8fafc" color="#ffffff" />

          <Suspense
            fallback={
              <group position={[0, 0, 0]}>
                <mesh>
                  <boxGeometry args={[0.4, 0.4, 0.4]} />
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
              onError={handleModelError}
            >
              <PenguinModel
                state={state}
                onModelLoaded={handleModelLoaded}
                modelUrl={customModelUrl || PENGUIN_MODEL_PATH}
              />
            </ModelErrorBoundary>

            {/* Ground contact shadow */}
            <ContactShadows
              position={[0, -1.2, 0]}
              opacity={0.22}
              scale={3.6}
              blur={2.2}
              far={3.0}
              color="#64748b"
            />
          </Suspense>

          <OrbitControls
            ref={orbitRef}
            enablePan={false}
            enableZoom={true}
            minDistance={2.5}
            maxDistance={5.8}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* ========================================================================= */}
      {/* SEPARATE INDICATORS BENEATH THE PENGUIN                                   */}
      {/* 1. Mascot Action: Idle, Listening, Thinking, Speaking, Happy, Error       */}
      {/* 2. Voice Playback: Off, Ready, Speaking, Paused, Stopped, Error           */}
      {/* ========================================================================= */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0 space-y-2.5">
        {/* Status Indicators & Voice Toggle Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            {/* Mascot Action Indicator */}
            <div
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 shadow-2xs ${currentMascotMeta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentMascotMeta.dotClass}`} />
              <span>{currentMascotMeta.label}</span>
            </div>

            {/* Voice Playback Status Indicator */}
            <div
              className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1.5 ${currentVoiceMeta.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentVoiceMeta.dotClass}`} />
              <span>{currentVoiceMeta.label}</span>
            </div>

            {/* Small Voice On/Off Control */}
            <button
              onClick={onToggleVoice}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                isVoiceEnabled
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={isVoiceEnabled ? 'Voice is On - Click to Mute' : 'Voice is Off - Click to Enable'}
            >
              {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isVoiceEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 px-0.5">
            {currentMascotMeta.description}
          </div>
        </div>

        {/* Live Speaking Controls (Pause, Resume, Stop) */}
        {isSpeechActiveNow ? (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                {voiceStatus === 'paused' ? 'Speech Paused' : 'Playing AI Response...'}
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">Synced Beak</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onPauseResumeSpeech}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                {voiceStatus === 'paused' ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-emerald-800" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={onStopSpeech}
                className="flex-1 py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Mascot Quick Action Buttons: Wave, Think, Happy (Smoothly auto-reverts to Idle) */}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Mascot Reactions</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => handleTriggerAction('greeting')}
              className={`p-1.5 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                state === 'greeting'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Play greeting wave"
            >
              Wave
            </button>
            <button
              onClick={() => handleTriggerAction('thinking')}
              className={`p-1.5 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                state === 'thinking'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Play thinking contemplation"
            >
              Think
            </button>
            <button
              onClick={() => handleTriggerAction('happy')}
              className={`p-1.5 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                state === 'happy'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-semibold'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Play celebratory movement"
            >
              Happy
            </button>
          </div>
        </div>

        {/* College Accreditation Badge */}
        <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-500 px-0.5">
          <span>VSB Engineering College</span>
          <span className="font-mono text-blue-600 font-semibold">TNEA 2622</span>
        </div>
      </div>

      {/* Model Inspection Modal Overlay */}
      {showInspector && inspection && (
        <div className="absolute inset-0 bg-white/98 z-30 p-3.5 overflow-y-auto text-xs text-slate-800 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
            <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              GLB Model Hierarchy
            </h4>
            <button
              onClick={() => setShowInspector(false)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Meshes</span>
              <span className="font-bold text-slate-900 text-xs">{inspection.meshCount}</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 text-[10px] block">Kinematics</span>
              <span className="font-bold text-slate-900 text-xs">Procedural (7 states)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 block text-[11px]">Identified Nodes:</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              {inspection.nodeNames.map((n, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-mono shadow-2xs"
                >
                  {n || `node_${i}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
