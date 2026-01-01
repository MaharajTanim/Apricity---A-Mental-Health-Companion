/**
 * In-Memory Job Queue Service
 *
 * Simple job queue implementation for processing ML analysis tasks.
 * Jobs are processed sequentially with retry logic.
 *
 * TODO: Replace with Bull + Redis for production use
 * - Bull provides persistent queue storage
 * - Redis enables distributed job processing across multiple servers
 * - Better error handling and job monitoring
 * - Priority queues and scheduled jobs
 * - Job progress tracking and status updates
 *
 * For production migration:
 * 1. Install: npm install bull redis
 * 2. Replace this file with Bull queue implementation
 * 3. Set up Redis server
 * 4. Update REDIS_URL in .env
 */

class InMemoryJobQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.workers = new Map(); // Track job handlers
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds between retries

    console.log("[JobQueue] In-memory job queue initialized");
    console.log(
      "[JobQueue] ⚠️  TODO: Replace with Bull + Redis for production"
    );
  }

  /**
   * Register a worker function for a specific job type
   * @param {String} jobType - Type of job (e.g., 'ml-analysis')
   * @param {Function} handler - Async function to process the job
   */
  registerWorker(jobType, handler) {
    this.workers.set(jobType, handler);
    console.log(`[JobQueue] Registered worker for job type: ${jobType}`);
  }

  /**
   * Add a job to the queue
   * @param {String} jobType - Type of job to process
   * @param {Object} data - Job data
   * @param {Object} options - Job options (priority, delay, etc.)
   * @returns {Object} Job object with ID and status
   */
  enqueue(jobType, data, options = {}) {
    const job = {
      id: `${jobType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      data,
      attempts: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      createdAt: new Date(),
      status: "queued",
      error: null,
    };

    this.queue.push(job);
    console.log(`[JobQueue] Job enqueued: ${job.id} (type: ${jobType})`);
    console.log(`[JobQueue] Queue size: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processNext();
    }

    return {
      id: job.id,
      status: job.status,
      queuePosition: this.queue.length,
    };
  }

  /**
   * Process the next job in the queue
   */
  processNext() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const job = this.queue.shift();

    console.log(
      `[JobQueue] Processing job: ${job.id} (attempt ${job.attempts + 1}/${
        job.maxRetries
      })`
    );
    job.status = "processing";
    job.attempts++;

    // Use setImmediate to avoid blocking the event loop
    setImmediate(async () => {
      try {
        const worker = this.workers.get(job.type);

        if (!worker) {
          throw new Error(`No worker registered for job type: ${job.type}`);
        }

        // Execute the job handler
        await worker(job.data);

        // Job completed successfully
        job.status = "completed";
        console.log(`[JobQueue] ✅ Job completed successfully: ${job.id}`);
        console.log(`[JobQueue] Remaining jobs in queue: ${this.queue.length}`);
      } catch (error) {
        // Job failed
        console.error(`[JobQueue] ❌ Job failed: ${job.id}`, error.message);
        job.error = error.message;
        job.status = "failed";

        // Retry logic
        if (job.attempts < job.maxRetries) {
          console.log(
            `[JobQueue] Retrying job ${job.id} in ${this.retryDelay}ms...`
          );
          job.status = "retry";

          // Re-queue the job after delay
          setTimeout(() => {
            job.status = "queued";
            this.queue.push(job);
            console.log(
              `[JobQueue] Job re-queued: ${job.id} (retry ${job.attempts}/${job.maxRetries})`
            );
          }, this.retryDelay);
        } else {
          console.error(
            `[JobQueue] Job failed after ${job.maxRetries} attempts: ${job.id}`
          );
          // TODO: Store failed jobs in database for manual review
        }
      } finally {
        // Mark as not processing and continue with next job
        this.processing = false;

        // Process next job if queue is not empty
        if (this.queue.length > 0) {
          // Use setImmediate to avoid deep recursion
          setImmediate(() => this.processNext());
        } else {
          console.log("[JobQueue] Queue empty, worker idle");
        }
      }
    });
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue stats
   */
  getStats() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      registeredWorkers: Array.from(this.workers.keys()),
      jobs: this.queue.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt,
      })),
    };
  }

  /**
   * Clear all jobs from queue (for testing/maintenance)
   */
  clear() {
    const count = this.queue.length;
    this.queue = [];
    console.log(`[JobQueue] Cleared ${count} jobs from queue`);
    return count;
  }
}

// Singleton instance
const jobQueue = new InMemoryJobQueue();

module.exports = jobQueue;
