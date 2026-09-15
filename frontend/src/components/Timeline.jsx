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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Event Timeline
      </h2>
      <ul className="space-y-3">
        {dummyEvents.map((event) => (
          <li
            key={event.id}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-600">{event.type}</span>
              <span className="text-xs text-gray-400">{event.timestamp}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{event.details}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Timeline