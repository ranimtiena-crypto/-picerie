import { useEffect, useState } from "react";
import { db } from "./db.ts";
import { flushSync, pendingCount } from "./sync.ts";
function useSyncStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);
  const [pendingSales, setPendingSales] = useState(0);
  const [errors, setErrors] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState("");
  useEffect(() => {
    const refresh = async () => {
      setPending(await pendingCount());
      setPendingSales(await db.sales.filter((sale) => !sale.synced).count());
      setErrors(await db.syncQueue.where("status").equals("failed").count());
    };
    const onOnline = () => {
      setOnline(true);
      if (localStorage.getItem("epicerie.token")) void flushSync().catch((error) => setLastError(error instanceof Error ? error.message : "UNKNOWN"));
    };
    const onOffline = () => setOnline(false);
    const onMessage = (event) => {
      if (event.data?.type === "SYNC_NOW" && localStorage.getItem("epicerie.token")) void flushSync().catch((error) => setLastError(error instanceof Error ? error.message : "UNKNOWN"));
      void refresh();
    };
    void refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    const interval = window.setInterval(refresh, 1500);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      window.clearInterval(interval);
    };
  }, []);
  async function syncNow() {
    setSyncing(true);
    setLastError("");
    try {
      await flushSync();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "\xC9chec de la synchronisation.");
    } finally {
      setSyncing(false);
      setPending(await pendingCount());
      setPendingSales(await db.sales.filter((sale) => !sale.synced).count());
      setErrors(await db.syncQueue.where("status").equals("failed").count());
    }
  }
  return { online, pending, pendingSales, errors, syncing, lastError, syncNow };
}
export {
  useSyncStatus
};
