import { useRef, useState } from "react";
import { resolveOutputPath, startDownload } from "../api/downloaderApi";
import { sanitizeFilename } from "../utils/filename";
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
  /** Called when a job finishes successfully. */
  onComplete?: (request: DownloadRequest, filePath: string) => void;
  /** Reads the latest max-concurrent setting at scheduling time. */
  getMaxConcurrent: () => number;
}

export interface UseDownloadQueue {
  jobs: DownloadJob[];
  enqueue: (request: DownloadRequest, target: SaveTarget) => Promise<void>;
  remove: (id: string) => void;
}

/**
 * A parallel download queue. Runs up to `getMaxConcurrent()` jobs at once; as
 * each finishes the next queued job starts. Progress events update a job by id.
 *
 * The scheduler reads/writes a ref mirror of the job list so it can make
 * decisions synchronously (before React re-renders). Internal helpers are
 * hoisted function declarations so they can reference each other freely.
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

  function commit(next: DownloadJob[]) {
    jobsRef.current = next;
    setJobs(next);
  }

  function patchJob(id: string, patch: Partial<DownloadJob>) {
    commit(jobsRef.current.map((j) => (j.id === id ? { ...j, ...patch } : j)));
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
      patchJob(job.id, { status: "active" });
      runJob(job);
    }
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
        });
        break;
      case "merging":
        patchJob(job.id, { status: "active", stage: "merging", eta: null });
        break;
      case "done":
        patchJob(job.id, {
          status: "done",
          stage: null,
          percent: 100,
          filePath: event.path,
        });
        onCompleteRef.current?.(job.request, event.path);
        pump();
        break;
      case "error":
        patchJob(job.id, { status: "error", error: event.message });
        pump();
        break;
    }
  }

  function runJob(job: DownloadJob) {
    startDownload({
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
    const defaultName = sanitizeFilename(request.title);
    const outputPath = await resolveOutputPath(defaultName, request.ext, target);
    if (!outputPath) return; // cancelled

    const job: DownloadJob = {
      id: makeId(),
      request,
      outputPath,
      status: "queued",
      stage: null,
      percent: 0,
      speed: null,
      eta: null,
      filePath: null,
      error: null,
    };
    commit([...jobsRef.current, job]);
    pump();
  }

  function remove(id: string) {
    startedRef.current.delete(id);
    commit(jobsRef.current.filter((j) => j.id !== id));
  }

  return { jobs, enqueue, remove };
}
