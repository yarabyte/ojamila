"use client";

const PUSH_ENABLED_KEY = "jamila-push-enabled";

export type PushSubscribeResult =
  | "ok"
  | "unsupported"
  | "denied"
  | "unconfigured";

export async function getPushStatus(): Promise<{
  configured: boolean;
  subscribed: boolean;
  browserGranted: boolean;
}> {
  const browserGranted =
    typeof Notification !== "undefined" && Notification.permission === "granted";

  try {
    const res = await fetch("/api/push/status");
    if (!res.ok) {
      return { configured: false, subscribed: false, browserGranted };
    }
    const data = (await res.json()) as {
      configured: boolean;
      subscribed: boolean;
    };
    return {
      configured: data.configured,
      subscribed: data.subscribed,
      browserGranted,
    };
  } catch {
    return { configured: false, subscribed: false, browserGranted };
  }
}

export async function subscribeToPush(): Promise<PushSubscribeResult> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const vapidRes = await fetch("/api/push/vapid-public-key");
  const { publicKey } = await vapidRes.json();
  if (!publicKey) return "unconfigured";

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!res.ok) return "denied";

  try {
    localStorage.setItem(PUSH_ENABLED_KEY, "1");
  } catch {
    /* ignore */
  }

  return "ok";
}

export function isPushLikelyEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(PUSH_ENABLED_KEY) === "1" &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    );
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
