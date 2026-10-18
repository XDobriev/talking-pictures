import { Howler } from 'howler';
import { setMusicMuted, startMusic } from './music';
import { resumeSfx, setSfxMuted, unlockSfx } from './sfx';
import { setVoiceMuted } from './voice';

export { playSfx } from './sfx';
export { say, stopVoice } from './voice';

const reasons = new Set<string>();

/** Глушит весь звук по причине (пауза площадки, реклама, скрытая вкладка). Причины складываются. */
export function muteFor(reason: string) {
  reasons.add(reason);
  applyMute();
}
export function unmuteFor(reason: string) {
  reasons.delete(reason);
  if (!reasons.size) {
    // iOS Safari: после звонка/блокировки контекст «interrupted», обычный unmute не помогает.
    resumeSfx();
    const ctx = (Howler as unknown as { ctx?: AudioContext }).ctx;
    if (ctx && ctx.state !== 'running') void ctx.resume();
  }
  applyMute();
}

function applyMute() {
  const m = reasons.size > 0;
  Howler.mute(m);
  setSfxMuted(m);
  setMusicMuted(m);
  setVoiceMuted(m);
}

/** Первый жест пользователя: разблокировать звук и запустить музыку. */
export function unlockAudio() {
  unlockSfx();
  const ctx = (Howler as unknown as { ctx?: AudioContext }).ctx;
  if (ctx && ctx.state !== 'running') void ctx.resume();
  startMusic();
}
