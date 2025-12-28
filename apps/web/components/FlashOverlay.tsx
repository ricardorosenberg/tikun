export default function FlashOverlay({ text }: { text: string }) {
  return (
    <div className="flash-overlay pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-tikun-500/90 text-center">
      <span className="text-5xl font-bold tracking-widest text-white">{text}</span>
    </div>
  );
}
