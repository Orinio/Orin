export default function FeedLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-100 rounded-2xl" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="flex gap-6 pt-2">
            <div className="h-8 w-16 bg-gray-100 rounded-xl" />
            <div className="h-8 w-16 bg-gray-100 rounded-xl" />
            <div className="h-8 w-16 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
