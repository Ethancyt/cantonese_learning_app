// Serialize draft changes within this app process, including audio batches.
const queues = new Map<string, Promise<unknown>>();
export async function withLessonLock<T>(id: string, task: () => Promise<T>) {
  const job = (queues.get(id) || Promise.resolve()).catch(() => {}).then(task);
  queues.set(id, job);
  try {
    return await job;
  } finally {
    if (queues.get(id) === job) queues.delete(id);
  }
}
