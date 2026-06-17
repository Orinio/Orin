export default function AIChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-pulse">
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`h-16 ${i % 2 === 0 ? 'w-3/5' : 'w-2/5'} bg-gray-100 rounded-2xl`} />
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="h-12 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}
