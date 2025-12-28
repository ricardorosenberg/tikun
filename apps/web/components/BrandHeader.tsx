export default function BrandHeader() {
  return (
    <header className="flex items-center justify-between rounded-full border border-slate-200 bg-white/90 px-6 py-4 shadow-soft backdrop-blur">
      <div className="text-lg font-semibold text-slate-900">Tikun</div>
      <nav className="flex items-center gap-4 text-sm text-slate-600">
        <a className="hover:text-slate-900" href="/dashboard">
          My Sounds
        </a>
        <a className="hover:text-slate-900" href="/listening">
          Listening
        </a>
        <a className="hover:text-slate-900" href="/">
          Home
        </a>
      </nav>
    </header>
  );
}
