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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Event Timeline for {shipmentId}
      </h2>
      <ul className="space-y-3">
        {events.map((event) => (
          <li
            key={event._id}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-600">{event.eventType}</span>
              <span className="text-xs text-gray-400">{event.timestamp}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {JSON.stringify(event.payload)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Timeline
