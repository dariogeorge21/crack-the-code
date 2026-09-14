// Web Audio API sound generator - Sound feature disabled
class SoundEffects {
  public toggleMute(): boolean {
    return true;
  }

  public getMuted(): boolean {
    return true;
  }

  public setMuted(_muted: boolean): void {}

  public playClick(_freq = 900): void {}

  public playUnlock(): void {}

  public playLock(): void {}

  public playDenied(): void {}

  public playSuccess(): void {}
}

export const sound = new SoundEffects();

