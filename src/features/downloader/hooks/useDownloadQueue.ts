import { useEffect, useRef, useState } from "react";
import {
  cancelDownload,
  chooseSavePath,
  pauseDownload,
  resolveOutput,
  startDownload,
} from "../api/downloaderApi";
import { loadJobs, saveJobs } from "../api/downloadsStore";
import { expandTemplate } from "../utils/naming";
import type {
  DownloadEvent,
  DownloadJob,
  DownloadRequest,
  SaveTarget,
} from "../types";

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export interface UseDownloadQueueOptions {
  onComplete?: (request: DownloadRequest, filePath: string) => void;
  getMaxConcurrent: () => number;
}

export interface UseDownloadQueue {
  jobs: DownloadJob[];
  enqueue: (request: DownloadRequest, target: SaveTarget) => Promise<void>;
  pause: (id: string) => void;
  resume: (id: string) => void;
  retry: (id: string) => void;
  cancel: (id: string) => void;
  remove: (id: string) => void;
  reorder: (orderedIds: string[]) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  cancelAll: () => void;
  removeCompleted: () => void;
  removeFailed: () => void;
}

/**
 * Parallel download queue with full lifecycle control (pause/resume/retry/
 * cancel) and reordering. Runs up to `getMaxConcurrent()` jobs at once.
 */
export function useDownloadQueue(
  options: UseDownloadQueueOptions,
): UseDownloadQueue {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);

  const jobsRef = useRef<DownloadJob[]>([]);
  const startedRef = useRef<Set<string>>(new Set());
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;
  const getMaxRef = useRef(options.getMaxConcurrent);
  getMaxRef.current = options.getMaxConcurrent;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadedRef = useRef(false);

  // Restore the persisted list once on mount.
  useEffect(() => {
    void (async () => {
      const restored = await loadJobs();
      loadedRef.current = true;
      if (restored.length) commit(restored);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced so frequent progress ticks don't hammer the disk.
  function schedulePersist() {
    if (!loadedRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveJobs(jobsRef.current);
    }, 800);
  }

  function commit(next: DownloadJob[]) {
    jobsRef.current = next;
    setJobs(next);
    schedulePersist();
  }

  function patchJob(id: string, patch: Partial<DownloadJob>) {
    commit(jobsRef.current.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  function findJob(id: string): DownloadJob | undefined {
    return jobsRef.current.find((j) => j.id === id);
  }

  function pump() {
    const current = jobsRef.current;
    const active = current.filter((j) => j.status === "active").length;
    const slots = getMaxRef.current() - active;
    if (slots <= 0) return;

    const next = current
      .filter((j) => j.status === "queued" && !startedRef.current.has(j.id))
      .slice(0, slots);

    for (const job of next) {
      startedRef.current.add(job.id);
      runJob(job);
    }
  }

  function settle(id: string) {
    startedRef.current.delete(id);
    pump();
  }

  function handleEvent(job: DownloadJob, event: DownloadEvent) {
    switch (event.type) {
      case "progress":
        patchJob(job.id, {
          status: "active",
          stage: event.stage,
          percent: event.percent,
          speed: event.speed,
          eta: event.eta,
          downloaded: event.downloaded,
          total: event.total,
        });
        break;
      case "merging":
        patchJob(job.id, { status: "active", stage: "merging", eta: null });
        break;
      case "paused":
        patchJob(job.id, { status: "paused", speed: null, eta: null });
        settle(job.id);
        break;
      case "cancelled":
        patchJob(job.id, { status: "cancelled", finishedAt: Date.now() });
        settle(job.id);
        break;
      case "done":
        patchJob(job.id, {
          status: "done",
          stage: null,
          percent: 100,
          filePath: event.path,
          finishedAt: Date.now(),
        });
        onCompleteRef.current?.(job.request, event.path);
        settle(job.id);
        break;
      case "error":
        patchJob(job.id, {
          status: "error",
          error: event.message,
          finishedAt: Date.now(),
        });
        settle(job.id);
        break;
    }
  }

  function runJob(job: DownloadJob) {
    patchJob(job.id, {
      status: "active",
      error: null,
      startedAt: job.startedAt ?? Date.now(),
    });
    startDownload({
      id: job.id,
      url: job.request.url,
      formatId: job.request.formatId,
      kind: job.request.kind,
      needsMux: job.request.needsMux,
      maxHeight: job.request.maxHeight,
      outputPath: job.outputPath,
      onEvent: (event) => handleEvent(job, event),
    }).catch((err) => {
      handleEvent(job, {
        type: "error",
        message: typeof err === "string" ? err : "Download failed.",
      });
    });
  }

  async function enqueue(request: DownloadRequest, target: SaveTarget) {
    const defaultName = expandTemplate(
      target.template,
      request.title,
      request.uploader,
    );

    let outputPath: string;
    if (target.askEachTime || !target.destination) {
      const explicit = await chooseSavePath(defaultName, request.ext);
      if (!explicit) return; // cancelled
      outputPath = explicit;
    } else {
      outputPath = await resolveOutput({
        destination: target.destination,
        template: target.template,
        title: request.title,
        uploader: request.uploader ?? null,
        ext: request.ext,
      });
    }

    const job: DownloadJob = {
      id: makeId(),
      request,
      outputPath,
      status: "queued",
      stage: null,
      percent: 0,
      speed: null,
      eta: null,
      downloaded: 0,
      total: 0,
      startedAt: null,
      finishedAt: null,
      filePath: null,
      error: null,
    };
    commit([...jobsRef.current, job]);
    pump();
  }

  function pause(id: string) {
    if (findJob(id)?.status === "active") void pauseDownload(id);
  }

  function resume(id: string) {
    const job = findJob(id);
    if (!job || (job.status !== "paused" && job.status !== "queued")) return;
    patchJob(id, { status: "queued" });
    pump();
  }

  function retry(id: string) {
    const job = findJob(id);
    if (!job) return;
    startedRef.current.delete(id);
    patchJob(id, {
      status: "queued",
      error: null,
      percent: 0,
      downloaded: 0,
      total: 0,
      finishedAt: null,
    });
    pump();
  }

  function cancel(id: string) {
    const job = findJob(id);
    if (!job) return;
    if (job.status === "active") {
      void cancelDownload(id); // backend kills + cleans up + emits cancelled
    } else {
      patchJob(id, { status: "cancelled", finishedAt: Date.now() });
      settle(id);
    }
  }

  function remove(id: string) {
    const job = findJob(id);
    if (job?.status === "active") void cancelDownload(id);
    startedRef.current.delete(id);
    commit(jobsRef.current.filter((j) => j.id !== id));
    pump();
  }

  function reorder(orderedIds: string[]) {
    const byId = new Map(jobsRef.current.map((j) => [j.id, j]));
    const next = orderedIds
      .map((id) => byId.get(id))
      .filter((j): j is DownloadJob => Boolean(j));
    // Keep any jobs not present in the ordered list (safety).
    for (const j of jobsRef.current) {
      if (!orderedIds.includes(j.id)) next.push(j);
    }
    commit(next);
  }

  function pauseAll() {
    for (const j of jobsRef.current) if (j.status === "active") pause(j.id);
  }

  function resumeAll() {
    for (const j of jobsRef.current) if (j.status === "paused") resume(j.id);
  }

  function cancelAll() {
    for (const j of jobsRef.current) {
      if (j.status === "active" || j.status === "queued" || j.status === "paused") {
        cancel(j.id);
      }
    }
  }

  function removeCompleted() {
    commit(jobsRef.current.filter((j) => j.status !== "done"));
  }

  function removeFailed() {
    commit(
      jobsRef.current.filter(
        (j) => j.status !== "error" && j.status !== "cancelled",
      ),
    );
  }

  return {
    jobs,
    enqueue,
    pause,
    resume,
    retry,
    cancel,
    remove,
    reorder,
    pauseAll,
    resumeAll,
    cancelAll,
    removeCompleted,
    removeFailed,
  };
}
