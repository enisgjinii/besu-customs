export function PaymentPauseOverlay() {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="payment-pause-title"
      aria-describedby="payment-pause-description"
    >
      <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-zinc-900/95 p-8 text-center shadow-2xl">
        <h1
          id="payment-pause-title"
          className="text-2xl font-bold tracking-wide text-white md:text-3xl"
        >
          PAUSED UNTIL WE HAVE AGGREMENT TO PAYMENT
        </h1>
        <p
          id="payment-pause-description"
          className="mt-4 text-sm leading-relaxed text-zinc-200 md:text-base"
        >
          Access is temporarily locked. Please contact the owner to continue.
        </p>
      </div>
    </div>
  );
}