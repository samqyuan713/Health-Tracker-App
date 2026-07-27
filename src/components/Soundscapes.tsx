import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Play, 
  Pause, 
  Volume2, 
  Music, 
  Sliders, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  Heart, 
  HelpCircle,
  Disc,
  ListMusic,
  Download
} from 'lucide-react';
import { MetricLog } from '../types';
import { getTranslation, SupportedLanguage } from '../utils/i18n';

interface SoundscapesProps {
  onAddLog: (type: MetricLog['type'], value: number, notes?: string) => void;
  selectedDate: string;
  currentLang?: SupportedLanguage;
}

interface SongData {
  title: string;
  genre: string;
  mood: string;
  vocalsDescription: string;
  chords: string[];
  lyrics: { section: string; lines: string[] }[];
  midiSequence: number[];
  tempo: number;
}

export default function Soundscapes({ onAddLog, selectedDate, currentLang = 'en' }: SoundscapesProps) {
  const t = getTranslation(currentLang);
  // Config states
  const [model, setModel] = useState<'lyria' | 'musicfx' | 'gemini'>('lyria');
  const [tempo, setTempo] = useState<number>(60);
  const [styleTheme, setStyleTheme] = useState<string>('piano-strings');
  const [prompt, setPrompt] = useState<string>(
    'Create a classic style, slow, and moody ballad. The instrumentation should be stripped back and intimate, starting with a solitary, melancholic grand piano and slowly introducing deep, sweeping cello strings and a soft acoustic guitar. The tempo should be slow (around 60 BPM) to give the track a spacious, longing feel. The vocals should be warm, soulful, and deeply emotional, expressing a profound sense of homesickness and romantic yearning. The dynamic should build slightly during the bridge but return to a soft, intimate whisper for the outro.'
  );

  // Status states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingAudio, setIsSavingAudio] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeLyricsIndex, setActiveLyricsIndex] = useState<number>(0);
  const [noticeMessage, setNoticeMessage] = useState<string>('');
  
  // Synthesis Audio Engine References
  const audioContextRef = useRef<AudioContext | null>(null);
  const sequencerIntervalRef = useRef<number | null>(null);
  const currentBeatRef = useRef<number>(0);
  const chordsProgressRef = useRef<string[]>(['Am9', 'FM7', 'CM9', 'G6']);
  const midiSequenceRef = useRef<number[]>([57, 60, 64, 67, 53, 57, 60, 64, 48, 52, 55, 59, 55, 59, 62, 65]);

  // Model details helpers
  const MODELS = [
    {
      id: 'lyria',
      title: 'YouTube Lyria v2',
      tag: 'Vocals + Multi-Track Synthesis',
      description: 'Ideal for soulful vocals, acoustic backings, and rich multi-layered emotional ballads.',
      icon: '🎙️'
    },
    {
      id: 'musicfx',
      title: 'Google MusicFX',
      tag: 'Ambient & Instrumental',
      description: 'Generates high-fidelity soundscapes, rich orchestral stems, and intimate solo instrument loops.',
      icon: '🎹'
    },
    {
      id: 'gemini',
      title: 'Gemini Live-Audio',
      tag: 'Coached Narratives',
      description: 'Combines soothing spoken spoken-word poetry with low-frequency bio-resonance chords.',
      icon: '✨'
    }
  ];

  // Pre-load prompt triggers
  const promptPresets = [
    {
      name: 'Moody Ballad (60 BPM)',
      description: 'The requested intimate grand piano and sweeping cello homesickness track.',
      prompt: 'Create a classic style, slow, and moody ballad. The instrumentation should be stripped back and intimate, starting with a solitary, melancholic grand piano and slowly introducing deep, sweeping cello strings and a soft acoustic guitar. The tempo should be slow (around 60 BPM) to give the track a spacious, longing feel. The vocals should be warm, soulful, and deeply emotional, expressing a profound sense of homesickness and romantic yearning.'
    },
    {
      name: 'Sleep Ambient (50 BPM)',
      description: 'Ultra slow acoustic guitar with soft rainfall frequencies.',
      prompt: 'Create a slow ambient rain soundtrack with light acoustic guitar strums and warm analog synth pad swells. The tempo is relaxing (50 BPM), ideal for helping soothe stress and clearing a busy mind.'
    }
  ];

  const handleApplyPreset = (presetText: string) => {
    setPrompt(presetText);
    if (presetText.includes('60 BPM')) setTempo(60);
    else if (presetText.includes('50 BPM')) setTempo(50);
  };

  // STOP MUSIC SYNTH HELPER
  const stopAudioSynth = () => {
    setIsPlaying(false);
    if (sequencerIntervalRef.current) {
      window.clearInterval(sequencerIntervalRef.current);
      sequencerIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => console.log(e));
      audioContextRef.current = null;
    }
  };

  // INITIALIZE & PLAY MIDI WEB AUDIO SYNTHESIZER
  const togglePlayAudio = () => {
    if (isPlaying) {
      stopAudioSynth();
      return;
    }

    if (!currentSong) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      setIsPlaying(true);
      currentBeatRef.current = 0;

      // Fetch sequence data
      const seq = currentSong.midiSequence || midiSequenceRef.current;
      const chords = currentSong.chords || chordsProgressRef.current;
      const beatDuration = 60 / (currentSong.tempo || tempo); // beats in seconds (e.g. 1.0s for 60BPM)

      // Micro Synthesizer oscillator player
      const playSynthNote = (freq: number, type: 'sine' | 'triangle' | 'sawtooth', duration: number, volume: number) => {
        if (!ctx || ctx.state === 'closed') return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Amplitude Envelope helper
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05); // quick attack
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration - 0.05); // smooth release

        osc.start();
        osc.stop(ctx.currentTime + duration);
      };

      // Sequencer loop
      sequencerIntervalRef.current = window.setInterval(() => {
        const beat = currentBeatRef.current;
        const totalLyricsSections = currentSong.lyrics.length;

        // Sync lyrics highlighter line offset using beats
        const currentLyricsSectionIndex = Math.min(
          Math.floor(beat / 4) % totalLyricsSections,
          totalLyricsSections - 1
        );
        setActiveLyricsIndex(currentLyricsSectionIndex);

        // MIDI conversion helper
        const midiToFreq = (midi: number) => Math.pow(2, (midi - 69) / 12) * 440;

        // Retrieve chords of the active segment
        const chordIndex = Math.floor(beat / 2) % 4; // changes chord every 2 beats
        
        // 1. COMPONENT: Intro / Solitary Melancholic grand piano notes
        // Arpeggiate low to high piano notes
        const baseNote = seq[chordIndex * 4] || 57;
        const tone1 = seq[chordIndex * 4 + 1] || 60;
        const tone2 = seq[chordIndex * 4 + 2] || 64;
        const tone3 = seq[chordIndex * 4 + 3] || 67;

        // Simulate Grand Piano (Triangle wave, soft resonance)
        const noteToPlay = beat % 2 === 0 ? baseNote : tone2;
        playSynthNote(midiToFreq(noteToPlay), 'triangle', beatDuration * 1.5, 0.25);
        if (beat % 4 === 0) {
          // Play complete supportive chord root on downbeat
          playSynthNote(midiToFreq(tone1), 'triangle', beatDuration * 2.0, 0.15);
          playSynthNote(midiToFreq(tone3), 'triangle', beatDuration * 2.0, 0.12);
        }

        // 2. COMPONENT: Deep Sweeping Cello Strings (Low frequency sawtooth filtered sweep)
        // Introduced gradually (as user request says "slowly introducing deep strings")
        if (beat >= 2) {
          // Low cello support root transpose 2 octaves down
          const celloFreq = midiToFreq(baseNote - 24);
          playSynthNote(celloFreq, 'sine', beatDuration * 1.9, 0.22); // Sine sounds warm and subby
          
          const violinFreq = midiToFreq(tone1 - 12);
          playSynthNote(violinFreq, 'sine', beatDuration * 1.5, 0.10);
        }

        // 3. COMPONENT: Soft Acoustic Guitar Pluck (Short Sine wave transient)
        if (beat >= 6 && beat % 2 === 1) {
          const guitarPick = tone3 + 12; // high guitar ringing pluck
          playSynthNote(midiToFreq(guitarPick), 'sine', beatDuration * 0.4, 0.1);
        }

        currentBeatRef.current = beat + 1;
      }, beatDuration * 1000);

    } catch (e) {
      console.error("Audio Synthesis error: ", e);
    }
  };

  // Dismount cleanser
  useEffect(() => {
    return () => {
      stopAudioSynth();
    };
  }, []);

  // GENERATE CUSTOM SONG API TRIGGER
  const handleComposeSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    setIsGenerating(true);
    setNoticeMessage('');
    stopAudioSynth();

    try {
      const response = await fetch('/api/gemini/song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: model,
          tempo: tempo,
          style: styleTheme
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error synthesizing chords');
      }

      const data = await response.json();
      setCurrentSong(data);
      if (data.notice) {
        setNoticeMessage(data.notice);
      }
    } catch (err) {
      console.error(err);
      alert('Encountered an issue with the composer core. Initializing high-quality local ballad.');
    } finally {
      setIsGenerating(false);
    }
  };

  // SAVE AS MINDFULNESS SESSION LOG helper
  const handleSaveToJournal = () => {
    if (!currentSong) return;
    onAddLog('mood', 5, `🧘 Generated & Listened to custom song: "${currentSong.title}" (${currentSong.genre}, tempo: ${currentSong.tempo} BPM) constructed via AI Lyria.`);
    alert(`Logged: "${currentSong.title}" as an emotional therapy coaching session!`);
  };

  // EXPORT SONG SHEET AS TEXT FILE
  const handleDownloadSongSheet = () => {
    if (!currentSong) return;
    
    let content = `==================================================
SONG SHEET: ${currentSong.title.toUpperCase()}
==================================================
Genre: ${currentSong.genre}
Mood: ${currentSong.mood}
Model Backend: ${MODELS.find(m => m.id === model)?.title || model}
Tempo: ${currentSong.tempo} BPM
Vocals Style: ${currentSong.vocalsDescription}
Chords Progression: ${currentSong.chords.join(" - ")}

==================================================
LYRICS & SECTIONS
==================================================\n`;

    currentSong.lyrics.forEach(sec => {
      content += `\n[ ${sec.section.toUpperCase()} ]\n`;
      sec.lines.forEach(line => {
        content += `${line}\n`;
      });
    });

    content += `\n==================================================
Generated via Leo AI Coach and Soundscape Composer.
Thank you for playing. Enjoy your custom song!
==================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSong.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_song_sheet.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // HELPER FUNCTION: Encode AudioBuffer as a 16-bit mono/stereo WAV blob
  const bufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // 1 = raw PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferLength = result.length * 2;
    const arrayBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(arrayBuffer);
    
    // helper to write ascii string
    const writeString = (v: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + bufferLength, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw PCM)
    view.setUint16(20, format, true);
    // channel count
    view.setUint16(22, numOfChan, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // chunk length
    view.setUint32(40, bufferLength, true);
    
    // Write PCM audio samples
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, result[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const interleave = (inputL: Float32Array, inputR: Float32Array) => {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  };

  // MULTI-TRACK OFFLINE COMPILED WAV EXPORTER
  const handleDownloadAudioWav = async () => {
    if (!currentSong || isSavingAudio) return;
    setIsSavingAudio(true);

    try {
      const sampleRate = 44100;
      const bpm = currentSong.tempo || tempo || 60;
      const beatDuration = 60 / bpm;
      const totalBeats = 16;
      const totalDuration = beatDuration * totalBeats;

      // 1. Create OfflineAudioContext (Stereo, 44.1kHz)
      const OfflineAudioContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      const ctx = new OfflineAudioContextClass(2, sampleRate * totalDuration, sampleRate);

      const seq = currentSong.midiSequence || midiSequenceRef.current;
      const midiToFreq = (midi: number) => Math.pow(2, (midi - 69) / 12) * 440;

      // Helper to schedule offline notes
      const scheduleOfflineNote = (
        time: number,
        freq: number,
        type: 'sine' | 'triangle' | 'sawtooth',
        duration: number,
        volume: number
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.01);

        osc.start(time);
        osc.stop(time + duration);
      };

      // Loop through all 16 beats and schedule instruments
      for (let beat = 0; beat < totalBeats; beat++) {
        const startTime = beat * beatDuration;
        const chordIndex = Math.floor(beat / 2) % 4;

        const baseNote = seq[chordIndex * 4] || 57;
        const tone1 = seq[chordIndex * 4 + 1] || 60;
        const tone2 = seq[chordIndex * 4 + 2] || 64;
        const tone3 = seq[chordIndex * 4 + 3] || 67;

        // A. Grand Piano (Triangle wave)
        const noteToPlay = beat % 2 === 0 ? baseNote : tone2;
        scheduleOfflineNote(startTime, midiToFreq(noteToPlay), 'triangle', beatDuration * 1.5, 0.25);

        if (beat % 4 === 0) {
          scheduleOfflineNote(startTime, midiToFreq(tone1), 'triangle', beatDuration * 2.0, 0.12);
          scheduleOfflineNote(startTime, midiToFreq(tone3), 'triangle', beatDuration * 2.0, 0.10);
        }

        // B. Deep Sweeping Cello Strings Support (Sine/Sub-swells)
        if (beat >= 2) {
          const celloFreq = midiToFreq(baseNote - 24);
          scheduleOfflineNote(startTime, celloFreq, 'sine', beatDuration * 1.9, 0.20);

          const violinFreq = midiToFreq(tone1 - 12);
          scheduleOfflineNote(startTime, violinFreq, 'sine', beatDuration * 1.5, 0.08);
        }

        // C. Acoustic Guitar Pluck
        if (beat >= 6 && beat % 2 === 1) {
          const guitarPick = tone3 + 12;
          scheduleOfflineNote(startTime, midiToFreq(guitarPick), 'sine', beatDuration * 0.4, 0.08);
        }
      }

      // Render actual synthesized PCM buffer
      const renderedBuffer = await ctx.startRendering();

      // Encode to binary WAV format
      const wavBlob = bufferToWav(renderedBuffer);

      // Trigger standard browser download
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentSong.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_melody.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Offline render error:", err);
      alert("Experienced static in offline pipeline. Let's try compiling the stems again.");
    } finally {
      setIsSavingAudio(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden select-none">
      
      {/* Soundscape Main Header Section */}
      <div className="px-5 pt-5 pb-3 bg-white border-b border-slate-100 shrink-0">
        <div>
          <p className="text-[9px] font-extrabold text-amber-650 uppercase tracking-widest">Acoustic Therapy Hub</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <Music className="w-4 h-4 text-amber-500" /> AI SONGWRITER & MUSICIAN
            </h2>
            <div className="bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-amber-700">
              Live Synthesis
            </div>
          </div>
        </div>
      </div>

      {/* Main Scroller Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Model Chooser & Prompt form */}
        <form onSubmit={handleComposeSong} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          
          {/* 1. Model Selection Segment (In response to "Where can I choose the model so as to generate music and songs?") */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>🤖 STEP 1: SELECT GENERATIVE MUSIC MODEL BACKEND</span>
              <HelpCircle className="w-2.5 h-2.5 text-slate-350" title="Choose which specialized model constructs the track notes" />
            </label>
            <div className="grid grid-cols-1 gap-2">
              {MODELS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setModel(item.id as any)}
                  className={`p-2.5 rounded-2xl text-left border flex gap-3 cursor-pointer transition-all ${
                    model === item.id 
                      ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-500/10' 
                      : 'bg-slate-50 hover:bg-slate-100/60 border-slate-200'
                  }`}
                >
                  <span className="text-xl shrink-0 self-center">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-extrabold text-slate-800 tracking-tight">{item.title}</p>
                      <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded ${
                        model === item.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[8px] text-slate-400 font-bold mt-0.5 leading-snug">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Prompts helper */}
          <div className="space-y-1.5 pt-1.5 border-t border-slate-50">
            <span className="text-[8.5px] font-extrabold text-slate-450 uppercase tracking-wide">Quick Style Presets:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {promptPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(preset.prompt)}
                  className="py-1 px-2.5 bg-slate-50 text-slate-600 border border-slate-200 hover:border-amber-300 rounded-lg text-[8px] font-black uppercase shrink-0 transition-all active:scale-95 cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Prompt Input Description Box */}
          <div className="space-y-1">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
              ✍️ STEP 2: SPECIFY INSTRUMENTATION, LYRICS, & MOOD DETAILS
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What kind of song would you like to generate today?"
              className="w-full h-24 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-2xl p-3 text-[10px] font-bold text-slate-700 leading-relaxed placeholder-slate-350 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all select-text shrink-0"
              required
            />
          </div>

          {/* 3. Tempo slider and Acoustic options */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
            <div className="space-y-1">
              <label className="text-[8.5px] font-extrabold text-slate-450 uppercase tracking-wider block">
                ⏱️ Target Tempo: {tempo} BPM
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer h-1 bg-slate-150 rounded"
                />
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest shrink-0">Slow Ballad</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8.5px] font-extrabold text-slate-450 uppercase tracking-wider block">
                🎻 Instrumental Lead
              </label>
              <select
                value={styleTheme}
                onChange={(e) => setStyleTheme(e.target.value)}
                className="w-full p-1.5 bg-slate-55 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-650 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
              >
                <option value="piano-strings">Intimate Piano & Sweeping Strings</option>
                <option value="acoustic-guitar">Acoustic Guitar Plucks</option>
                <option value="ambient-pad">Washed Chillout Ambient Pads</option>
              </select>
            </div>
          </div>

          {/* Generate Button trigger */}
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all outline-none flex items-center justify-center gap-1.5 ${
              isGenerating
                ? 'bg-slate-200 text-slate-450 border border-slate-200'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-500 shadow-md hover:shadow-lg'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> COMPOSE MULTI-TRACK STEMS...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> GENERATE ORIGINAL BALLAD
              </>
            )}
          </button>
        </form>

        {/* API Warning Notice box in case fallback is triggered */}
        {noticeMessage && (
          <div className="bg-sky-50 border border-sky-100 p-3 rounded-2xl text-[8.5px] text-sky-700 font-bold leading-relaxed text-center animate-fadeIn shadow-sm">
            🛡️ <b>Composers offline fallback:</b> {noticeMessage}. Generate infinite unique tracks instantly by adding your `GEMINI_API_KEY` in AI Studio Settings.
          </div>
        )}

        {/* Dynamic Composed Output Player Card */}
        {currentSong && (
          <div className="p-4 bg-slate-900 border border-slate-850 rounded-3xl text-white space-y-4 shadow-xl select-text animate-fadeIn">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[7.5px] font-mono font-black text-amber-400 uppercase tracking-widest block mb-0.5 leading-none">Composed Masterpiece</span>
                <h3 className="text-sm font-black text-white tracking-snug truncate max-w-[200px]">{currentSong.title}</h3>
                <p className="text-[8.5px] text-slate-450 font-bold mt-0.5 font-mono">{currentSong.genre} • {currentSong.tempo} BPM</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="bg-amber-500 text-slate-950 font-black text-[7px] uppercase px-1.5 py-0.5 rounded leading-none shrink-0 flex items-center gap-0.5">
                  <Play className="w-2 h-2 fill-slate-950 tracking-tighter" /> Synthesizer Active
                </span>
                <span className="text-[8px] font-mono text-slate-400 mt-1">{currentSong.mood}</span>
              </div>
            </div>

            {/* Simulated Animated Vinyl / Pulse Graphic */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-805">
              <div className="relative shrink-0 w-11 h-11 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-800 select-none shadow-md overflow-hidden">
                <Disc className={`w-8 h-8 text-amber-500/80 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                <div className="absolute w-2 h-2 bg-slate-950 rounded-full border border-slate-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold text-amber-400 uppercase tracking-widest">{currentSong.vocalsDescription}</p>
                
                {/* Visual equalizer canvas simulation */}
                <div className="flex gap-1.2 items-end h-7 mt-1.5 select-none justify-start w-full">
                  {[...Array(16)].map((_, index) => {
                    const h = isPlaying 
                      ? Math.max(2, Math.floor(Math.random() * 24))
                      : 2;
                    return (
                      <div 
                        key={index} 
                        className="w-1 bg-amber-500 rounded-full transition-all duration-150"
                        style={{ height: `${h}px` }}
                      ></div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Play/Pause Synthesizer Controller Button */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={togglePlayAudio}
                className={`w-full py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 border shadow-md ${
                  isPlaying
                    ? 'bg-rose-600 hover:bg-rose-500 border-rose-650 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" /> Pause Live Soundboard
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" /> Play Live Soundboard
                  </>
                )}
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleSaveToJournal}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white hover:text-amber-400 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1.5 shadow-md"
                  title="Integrate as meditation mins to Health Journal"
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
                  <span>Save Journal</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSongSheet}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 border border-slate-705 text-white hover:text-amber-400 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1.5 shadow-md"
                  title="Download full lyrics & chords sheet"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Export Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAudioWav}
                  disabled={isSavingAudio}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 border border-slate-705 text-white hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-1.5 shadow-md"
                  title="Compile and download offline audio file (WAV)"
                >
                  {isSavingAudio ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <Music className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{isSavingAudio ? "Compiling..." : "Export Audio"}</span>
                </button>
              </div>
            </div>

            {/* Original Composed Lyrics Scrolling list */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none mb-1">
                <ListMusic className="w-3.5 h-3.5 text-amber-505" /> scrolling lyric transcription teleprompter
              </span>
              <div className="space-y-4 max-h-[190px] overflow-y-auto pr-1 scrollbar-none">
                {currentSong.lyrics.map((sec, secIdx) => {
                  const isSectionActive = activeLyricsIndex === secIdx;
                  return (
                    <div 
                      key={secIdx} 
                      className={`p-3 rounded-2xl border transition-all duration-300 ${
                        isSectionActive 
                          ? 'bg-amber-950/20 border-amber-500 shadow-sm' 
                          : 'bg-slate-950/30 border-slate-800/60 opacity-40'
                      }`}
                    >
                      <span className="text-[7.5px] font-extrabold text-amber-400 uppercase tracking-wider block mb-1">
                        {sec.section}
                      </span>
                      <div className="space-y-1">
                        {sec.lines.map((ln, lnIdx) => (
                          <p 
                            key={lnIdx} 
                            className={`text-[10px] leading-relaxed tracking-wide ${
                              isSectionActive ? 'font-bold text-white' : 'text-slate-400 font-medium'
                            }`}
                          >
                            {ln}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
