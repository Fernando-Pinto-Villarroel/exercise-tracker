import { Audio } from "expo-av";

const playSoundFile = async (file: number): Promise<void> => {
  try {
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(
      (status: { isLoaded: boolean; didJustFinish?: boolean }) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      },
    );
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};

export const playGeneralTimerCompleted = (): Promise<void> =>
  playSoundFile(
    require("../../assets/sounds/general_timer_completed.wav") as number,
  );

export const playRestTimerCompleted = (): Promise<void> =>
  playSoundFile(
    require("../../assets/sounds/rest_timer_completed.wav") as number,
  );
