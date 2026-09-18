function Timeline() {
  const dummyEvents = [
    {
      id: 1,
      type: 'CONTAINER_CREATED',
      timestamp: '2026-09-10T08:00:00Z',
      details: 'Container CNT-4521 created at Mumbai warehouse',
    },
    {
      id: 2,
      type: 'LOADED_ON_SHIP',
      timestamp: '2026-09-11T14:30:00Z',
      details: 'Loaded onto vessel MSC Aurora at Nhava Sheva Port',
    },
    {
      id: 3,
      type: 'TEMPERATURE_SPIKE',
      timestamp: '2026-09-12T22:15:00Z',
      details: 'Temperature spiked to 8°C (threshold: 4°C)',
    },
  ]

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Event Timeline
      </h2>
      <div className="relative pl-6">
        {/* vertical connecting line */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        <div className="space-y-6">
          {dummyEvents.map((event) => (
            <div key={event.id} className="relative">
              {/* dot marker on the line */}
              <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-blue-600 text-sm">
                    {event.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{event.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Timeline