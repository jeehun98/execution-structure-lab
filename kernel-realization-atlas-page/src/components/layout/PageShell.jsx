import TopNavBar from "./TopNavBar";

export default function PageShell({ children, hero = null, fullWidth = false }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <TopNavBar />

      {hero ? (
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">{hero}</div>
        </section>
      ) : null}

      <main
        className={[
          "mx-auto px-4 py-10 lg:px-6",
          fullWidth ? "max-w-7xl" : "max-w-6xl",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}