export type PendingConsume = {
  localId: string;
  subscriptionId: string;
  clientName?: string;
  formulaName?: string;
  queuedAt: string;
};

const STORAGE_KEY = "jamila_pending_consumes";

function read(): PendingConsume[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingConsume[]) : [];
  } catch {
    return [];
  }
}

function write(items: PendingConsume[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getPendingConsumes(): PendingConsume[] {
  return read();
}

export function enqueueConsume(
  item: Omit<PendingConsume, "localId" | "queuedAt">
): PendingConsume {
  const entry: PendingConsume = {
    ...item,
    localId: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
  };
  const queue = read();
  queue.push(entry);
  write(queue);
  return entry;
}

export function removePendingConsume(localId: string) {
  write(read().filter((i) => i.localId !== localId));
}

export function pendingCount(): number {
  return read().length;
}
