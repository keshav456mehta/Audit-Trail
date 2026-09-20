import { useState } from 'react'

function Timeline() {
  const [hasSearched, setHasSearched] = useState(false)

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

  const eventStyles = {
    CONTAINER_CREATED: { dot: 'bg-green-500', text: 'text-green-600' },
    LOADED_ON_SHIP: { dot: 'bg-blue-500', text: 'text-blue-600' },
    TEMPERATURE_SPIKE: { dot: 'bg-red-500', text: 'text-red-600' },
    ARRIVED_AT_PORT: { dot: 'bg-purple-500', text: 'text-purple-600' },
  }

  if (!hasSearched) {
    return (
      <div className="mt-8 px-2 sm:px-0">
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
          Search a shipment ID...
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 px-2 sm:px-0">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Event Timeline
      </h2>
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        <div className="space-y-6">
          {dummyEvents.map((event) => {
            const style = eventStyles[event.type] || {
              dot: 'bg-gray-400',
              text: 'text-gray-600',
            }
            return (
              <div key={event.id} className="relative">
                <div
                  className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ${style.dot} border-2 border-white shadow`}
                ></div>

                <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1">
                    <span className={`font-medium text-sm ${style.text}`}>
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.details}</p>
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