"use client";

import { useId, useState, type FormEvent } from "react";
import { useTextStream } from "@/components/useTextStream";
import { MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH } from "@/lib/constants";

/** Client chat panel for the Gemini-powered fan assistant. */
export function AssistantPanel() {
  const { text, isLoading, error, run } = useTextStream(
    "/api/assistant",
    "Sorry, the assistant is unavailable right now. Please try again.",
  );
  const [message, setMessage] = useState("");
  const inputId = useId();
  const helpId = useId();

  const trimmed = message.trim();
  const canSubmit = trimmed.length >= MIN_MESSAGE_LENGTH && !isLoading;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    void run({ message: trimmed });
  };

  return (
    <section
      aria-labelledby="assistant-heading"
      className="rounded-xl border border-border bg-surface p-4"
    >
      <h3 id="assistant-heading" className="text-lg font-semibold text-text">
        Fan Assistant
      </h3>
      <p id={helpId} className="mt-1 text-sm text-muted">
        Ask about gates, seating, concessions, accessibility services, or
        transit. Powered by Gemini.
      </p>

      <form className="mt-3" onSubmit={onSubmit}>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text"
        >
          Your question
        </label>
        <textarea
          id={inputId}
          name="message"
          rows={2}
          value={message}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-describedby={helpId}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface p-2 text-text"
          placeholder="Where is the nearest step-free entrance to Gate C?"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={isLoading}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {isLoading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-crit">
          {error}
        </p>
      ) : null}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="mt-3 min-h-6 whitespace-pre-wrap text-sm leading-relaxed text-text"
      >
        {text}
      </div>
    </section>
  );
}
