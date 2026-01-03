'use client';

// Sound utility for focus alerts
export class AlertSound {
  private audioContext: AudioContext | null = null;

  private initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async playAlertSound() {
    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      // Create a simple notification beep sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure the sound
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800Hz tone
      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1); // Sweep up

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3); // Decay

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn('Could not play alert sound:', error);
      // Fallback to browser notification sound if available
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }
  }
}

// Singleton instance
export const alertSound = new AlertSound();
