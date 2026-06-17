export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <header>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
