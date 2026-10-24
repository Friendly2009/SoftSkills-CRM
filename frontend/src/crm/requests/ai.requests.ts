/** TODO(API): Request an asynchronous AI report; return job id and quote before charge. */
export declare function requestAiReport(
  type: string,
  from: string,
  to: string,
): Promise<{ jobId: string }>;
/** TODO(API): Poll an authorized report job and return text only when complete. */
export declare function getAiReport(
  jobId: string,
): Promise<{ state: "pending" | "completed" | "failed"; text?: string }>;
/** TODO(API): Fetch actual AI usage totals for the selected period. */
export declare function getAiUsage(
  from: string,
  to: string,
): Promise<{ date: string; calls: number; reports: number }[]>;
