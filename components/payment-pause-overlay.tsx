export function PaymentPauseOverlay() {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-slate-100/90 p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="payment-pause-title"
      aria-describedby="payment-pause-description"
    >
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-rose-300/30 blur-3xl" />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400" />

        <div className="p-8 text-center md:p-12">
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Testing Pause Notice
          </div>

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-8 w-8 text-slate-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
          </div>

          <h1
            id="payment-pause-title"
            className="text-2xl font-bold uppercase tracking-wide text-slate-900 md:text-4xl"
          >
            TESTING IS PAUSED UNTIL WE HAVE AGREEMENT ON PAYMENT
          </h1>

          <p
            id="payment-pause-description"
            className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base"
          >
            Platform testing is temporarily paused. Please contact the owner to
            continue.
          </p>

          <div className="mx-auto mt-7 max-w-xl rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              Notice
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Testing access is currently on hold due to payment agreement
              delays. You will be notified once testing resumes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}