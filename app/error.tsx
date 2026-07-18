"use client";

/** Route-level error boundary. Shows a safe message and a retry control. */
export default function GlobalError({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-3xl px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-bold text-text">Something went wrong</h1>
      <p className="mt-3 text-muted">
        We hit an unexpected error. Your data is safe — please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Try again
      </button>
    </div>
  );
}
