const SOUND_URL = "/sounds/notification.mp3";

let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;

async function loadSound(): Promise<AudioBuffer | null> {
  if (audioBuffer) return audioBuffer;
  try {
    const res = await fetch(SOUND_URL);
    const arrayBuffer = await res.arrayBuffer();
    audioContext = new AudioContext();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch {
    return null;
  }
}

export async function playNotificationSound(): Promise<void> {
  try {
    const buf = await loadSound();
    if (!buf || !audioContext) return;
    const source = audioContext.createBufferSource();
    source.buffer = buf;
    source.connect(audioContext.destination);
    source.start(0);
  } catch {
    /* ignore */
  }
}

export function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  if (Notification.permission === "denied") return Promise.resolve(false);
  return Notification.requestPermission().then((p) => p === "granted");
}

export function showDesktopNotification(title: string, body: string, onClick?: () => void): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico" });
    if (onClick)
      n.onclick = () => {
        n.close();
        onClick();
      };
  } catch {
    /* ignore */
  }
}
