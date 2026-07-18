import Link from "next/link";

/** 404 page shown for unknown routes. */
export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-text">Page not found</h1>
      <p className="mt-3 text-muted">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Return to the command center
      </Link>
    </div>
  );
}
