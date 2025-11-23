'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type HindiLine = { t: number; text: string };

type Props = {
  lines: HindiLine[];
  started: boolean;
  musicOn: boolean;
  speaking: boolean;
  onStart: () => void;
  onCaption: (text: string) => void;
  onSpeakingChange: (v: boolean) => void;
};

export default function AudioController({ lines, started, musicOn, speaking, onStart, onCaption, onSpeakingChange }: Props) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<{ g: GainNode; lpf: BiquadFilterNode } | null>(null);
  const startAtRef = useRef<number>(0);
  const [canSpeak, setCanSpeak] = useState(false);

  // Prepare speech engine
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    const pickVoice = () => {
      const vs = window.speechSynthesis.getVoices();
      const preferred = vs.find(v => /hi|Hindi/i.test(v.lang) && /male|?????/i.test(v.name))
        || vs.find(v => /hi|Hindi/i.test(v.lang))
        || vs.find(v => /en/i.test(v.lang) && /India|IN|hi/i.test(v.name))
        || vs[0];
      if (preferred) u.voice = preferred;
      u.rate = 0.95;
      u.pitch = 0.88;
      u.volume = 1.0;
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    } else {
      pickVoice();
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, []);

  // Prepare ambient orchestral pad using WebAudio
  const ensureAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      // Some browsers require user gesture
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current!;

    if (!musicNodesRef.current) {
      const master = ctx.createGain();
      master.gain.value = 0.0; // fade in later

      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 1200;
      lpf.Q.value = 0.5;

      const reverb = ctx.createDelay();
      reverb.delayTime.value = 0.35;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.25;

      reverb.connect(reverbGain).connect(lpf);

      const voices: OscillatorNode[] = [];
      const voiceGains: GainNode[] = [];
      const baseFreqs = [110, 146.83, 196, 261.63]; // A2, D3, G3, C4

      baseFreqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.value = 0.0;
        osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.value = f;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.08 + i * 0.02;
        lfoGain.gain.value = 8 + i * 3; // vibrato depth
        lfo.connect(lfoGain).connect(osc.frequency);
        lfo.start();
        osc.connect(g).connect(master);
        g.connect(reverb);
        osc.start();
        voices.push(osc);
        voiceGains.push(g);
      });

      master.connect(lpf).connect(ctx.destination);
      musicNodesRef.current = { g: master, lpf };

      // Slow chord swells
      let alive = true;
      (async function loop() {
        while (alive) {
          const now = ctx.currentTime;
          voiceGains.forEach((g, i) => {
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(g.gain.value, now);
            const tgt = musicOn ? 0.045 + i * 0.01 : 0.0;
            g.gain.linearRampToValueAtTime(tgt, now + 4);
          });
          const m = musicNodesRef.current?.g;
          if (m) {
            m.gain.cancelScheduledValues(now);
            m.gain.setValueAtTime(m.gain.value, now);
            m.gain.linearRampToValueAtTime(musicOn ? 0.4 : 0.0, now + 3);
          }
          await new Promise(r => setTimeout(r, 3000));
        }
        // cleanup on unmount handled separately
      })();

      return () => { alive = false; };
    }
  }, [musicOn]);

  const begin = useCallback(async () => {
    await ensureAudio();
    startAtRef.current = performance.now();
    onStart();
    onSpeakingChange(true);
  }, [ensureAudio, onStart, onSpeakingChange]);

  // Caption driver + speech synthesis timing
  useEffect(() => {
    if (!started) return;

    const start = startAtRef.current;
    let i = 0;
    let stopped = false;

    const tick = (now: number) => {
      if (stopped) return;
      const t = (now - start) / 1000;
      if (i < lines.length && t >= lines[i].t) {
        const line = lines[i];
        onCaption(line.text);
        speak(line.text);
        i++;
        if (i >= lines.length) {
          // Clear caption after last line
          setTimeout(() => onCaption(''), 4500);
          onSpeakingChange(false);
        }
      }
      requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(id);
      window.speechSynthesis?.cancel();
    };
  }, [started, lines, onCaption, speak, onSpeakingChange]);

  // Reflect musicOn changes into current graph
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const master = musicNodesRef.current?.g;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(musicOn ? 0.4 : 0.0, now + 1.5);
  }, [musicOn]);

  useEffect(() => {
    setCanSpeak('speechSynthesis' in window);
  }, []);

  return (
    <>
      <button onClick={begin} disabled={started}>
        {started ? '?? ??? ???' : '????'}
      </button>
      {!canSpeak && (
        <span className="small" style={{ marginLeft: 12 }}>
          ???? ???????? ??? ????? ?????? ? ?? ???? ??
        </span>
      )}
      <button className="secondary" onClick={() => { window.speechSynthesis?.cancel(); onSpeakingChange(false); }} disabled={!started || !speaking}>
        ????? ?????
      </button>
    </>
  );
}
