function Timeline({ events, shipmentId }) {
  if (!events || events.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-sm text-gray-500">
          No events found for "{shipmentId}"
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Event Timeline for {shipmentId}
      </h2>
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        <div className="space-y-6">
          {events.map((event) => (
            <div key={event._id} className="relative">
              <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-blue-600 text-sm">
                    {event.eventType}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{JSON.stringify(event.payload)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Timeline
