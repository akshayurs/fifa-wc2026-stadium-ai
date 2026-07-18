import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTextStream } from "@/lib/response-stream";

/** State and controls returned by {@link useTextStream}. */
export interface TextStreamState {
  readonly text: string;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly run: (body: unknown) => Promise<void>;
}

/**
 * Manages a single streaming request to an API endpoint.
 *
 * Accumulates streamed text into state, exposes loading and error flags, and
 * cancels any in-flight request when a new one starts or the component
 * unmounts — preventing wasted work and state updates after teardown.
 */
export function useTextStream(
  url: string,
  errorMessage: string,
): TextStreamState {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (body: unknown) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setIsLoading(true);
      setError(null);
      setText("");

      try {
        await fetchTextStream(
          { url, body, signal: controller.signal },
          (chunk) => setText((previous) => previous + chunk),
        );
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [url, errorMessage],
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { text, isLoading, error, run };
}
