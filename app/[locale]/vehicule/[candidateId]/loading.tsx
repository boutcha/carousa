export default function VehicleDetailLoading() {
  return (
    <main className="tarmac min-h-screen bg-asphalte px-4 py-8 text-signal sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="h-5 w-40 animate-pulse bg-signal/10" />
        <div className="mt-6 h-24 max-w-3xl animate-pulse bg-signal/10" />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="h-44 animate-pulse bg-signal/10" />
          <div className="h-44 animate-pulse bg-signal/10" />
          <div className="h-44 animate-pulse bg-signal/10" />
        </div>
      </div>
    </main>
  )
}
