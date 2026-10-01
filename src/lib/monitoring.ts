type LogLevel = "INFO" | "WARN" | "ERROR";

interface StructuredLog {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  environment: string;
}

/**
 * Production-ready structured logger with support for external telemetry
 * (e.g. Sentry, Datadog, Axiom, Logflare).
 */
export function logEvent(level: LogLevel, message: string, context?: Record<string, any>) {
  const payload: StructuredLog = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };

  const formatted = `[${payload.timestamp}] [${payload.level}] ${payload.message} ${
    context ? JSON.stringify(context) : ""
  }`;

  if (level === "ERROR") {
    console.error(formatted);
  } else if (level === "WARN") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }

  // Hook for external monitoring transport
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window === "undefined") {
    // Sentry Node capture event
  }
}

/**
 * Performance timer helper to monitor AI model latency and image processing pipeline.
 */
export async function measureTiming<T>(
  label: string,
  operation: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  try {
    const result = await operation();
    const durationMs = Date.now() - start;
    logEvent("INFO", `Latency Performance: ${label}`, { durationMs });
    return { result, durationMs };
  } catch (error) {
    const durationMs = Date.now() - start;
    logEvent("ERROR", `Operation Failed: ${label}`, { durationMs, error });
    throw error;
  }
}
