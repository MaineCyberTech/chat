export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}

export class PushClient {
  private static instance: PushClient | null = null;
  private vapidPublicKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): PushClient {
    if (!PushClient.instance) {
      PushClient.instance = new PushClient();
    }
    return PushClient.instance;
  }

  async init(): Promise<void> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      await this.fetchVapidKey();
    } catch (err) {
      console.error("Push client init failed:", err);
    }
  }

  private async fetchVapidKey(): Promise<void> {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiBase}/v1/notifications/push-subscriptions/vapid-key`);
      if (res.ok) {
        const data = await res.json();
        this.vapidPublicKey = data.publicKey;
      }
    } catch (err) {
      console.error("Failed to fetch VAPID key:", err);
    }
  }

  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration || !this.vapidPublicKey) {
      throw new Error("Push client not initialized or VAPID key missing");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    const subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource,
    });

    const subData = subscription.toJSON() as PushSubscriptionJSON;
    return {
      endpoint: subData.endpoint,
      p256dh: subData.keys.p256dh,
      auth: subData.keys.auth,
      user_agent: navigator.userAgent,
    };
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) return false;

    const subscription = await this.registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  }

  async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.registration) return null;

    const subscription = await this.registration.pushManager.getSubscription();
    if (!subscription) return null;

    const subData = subscription.toJSON() as PushSubscriptionJSON;
    return {
      endpoint: subData.endpoint,
      p256dh: subData.keys.p256dh,
      auth: subData.keys.auth,
    };
  }

  isSupported(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window;
  }

  getPermissionState(): NotificationPermission {
    return Notification.permission;
  }
}

export const pushClient = PushClient.getInstance();
