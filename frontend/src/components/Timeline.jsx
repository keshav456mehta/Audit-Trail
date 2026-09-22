function Timeline({ events, shipmentId, loading, error }) {
  const eventStyles = {
    ShipmentCreated: { dot: 'bg-green-500', text: 'text-green-600' },
    ShipmentPacked: { dot: 'bg-blue-500', text: 'text-blue-600' },
    ShipmentShipped: { dot: 'bg-purple-500', text: 'text-purple-600' },
    ShipmentDelivered: { dot: 'bg-emerald-600', text: 'text-emerald-700' },
  }

  if (loading) {
    return (
      <div className="mt-8 px-2 sm:px-0">
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          Searching...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 px-2 sm:px-0">
        <div className="border border-red-300 rounded-lg p-8 text-center text-red-500">
          {error}
        </div>
      </div>
    )
  }

  if (!events) {
    return (
      <div className="mt-8 px-2 sm:px-0">
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          Search a shipment ID...
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="mt-8 px-2 sm:px-0">
        <p className="text-sm text-gray-500">
          No events found for "{shipmentId}"
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 px-2 sm:px-0">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Event Timeline for {shipmentId}
      </h2>
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300"></div>
        <div className="space-y-6">
          {events.map((event) => {
            const style = eventStyles[event.eventType] || {
              dot: 'bg-gray-400',
              text: 'text-gray-600',
            }
            return (
              <div key={event._id} className="relative">
                <div
                  className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ${style.dot} border-2 border-white shadow`}
                ></div>
                <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1">
                    <span className={`font-medium text-sm ${style.text}`}>
                      {event.eventType}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{JSON.stringify(event.payload)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Timeline
