// Tiny WebAudio synth: clicks, fanfares, ambience. No external files.
let ctx: AudioContext | null = null
let muted = false
export function setMuted(m: boolean): void { muted = m }

function ac(): AudioContext | null {
  if (muted) return null
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.06, when = 0): void {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, c.currentTime + when)
  g.gain.linearRampToValueAtTime(gain, c.currentTime + when + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + when + dur)
  o.connect(g).connect(c.destination)
  o.start(c.currentTime + when)
  o.stop(c.currentTime + when + dur + 0.05)
}

export const sfx = {
  click(): void { tone(700, 0.06, 'square', 0.03) },
  ok(): void { tone(523, 0.12, 'triangle', 0.05); tone(659, 0.14, 'triangle', 0.05, 0.09); tone(784, 0.2, 'triangle', 0.05, 0.18) },
  bad(): void { tone(196, 0.25, 'sawtooth', 0.05); tone(147, 0.3, 'sawtooth', 0.05, 0.12) },
  war(): void { tone(98, 0.5, 'sawtooth', 0.07); tone(110, 0.5, 'sawtooth', 0.06, 0.15); tone(82, 0.7, 'sawtooth', 0.07, 0.3) },
  treaty(): void { tone(587, 0.15, 'sine', 0.05); tone(880, 0.25, 'sine', 0.05, 0.12) },
  turn(): void { tone(440, 0.05, 'sine', 0.02) },
}
