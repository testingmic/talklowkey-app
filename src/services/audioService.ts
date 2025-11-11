import { Audio } from "expo-av";

class AudioService {
  private sound: Audio.Sound | null = null;
  private isLoaded = false;

  // Initialize audio service
  async initialize() {
    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      // console.error("Failed to initialize audio service:", error);
    }
  }

  // Load notification sound
  async loadNotificationSound() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://talklowkey.com/assets/media/notify.wav" },
        { shouldPlay: false, isLooping: false, volume: 0.5 }
      );

      this.sound = sound;
      this.isLoaded = true;
    } catch (error) {
      this.isLoaded = false;
    }
  }

  // Play notification sound
  async playNotificationSound() {
    try {
      if (!this.isLoaded) {
        await this.loadNotificationSound();
      }

      if (this.sound && this.isLoaded) {
        // Stop any currently playing sound
        await this.sound.stopAsync();
        // Reset to beginning
        await this.sound.setPositionAsync(0);
        // Play the sound
        await this.sound.playAsync();
      }
    } catch (error) {
      // console.error("Failed to play notification sound:", error);
    }
  }

  // Cleanup
  async cleanup() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.isLoaded = false;
      }
    } catch (error) {
      // console.error("Failed to cleanup audio service:", error);
    }
  }

  // Check if sound is loaded
  isReady(): boolean {
    return this.isLoaded && this.sound !== null;
  }
}

// Create singleton instance
export const audioService = new AudioService();
export default audioService;
