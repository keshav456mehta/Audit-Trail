import "./Timeline.css";
import Timeline, {
  dummyTimelineData,
  dummyNotFoundData,
  dummyEmptyHistoryData,
  dummySingleEventData,
  dummyLongHistoryData
} from "./Timeline";


function ShipmentNotFound({ shipmentId }) {
  return (
    <div className="shipment-not-found">
      <div className="not-found-icon">??</div>
      <h3>Shipment Not Found</h3>
      <p>
        We couldn't find any records for
        {shipmentId ? <strong> "{shipmentId}"</strong> : " this shipment"}.
      </p>
      <p className="not-found-hint">
        Please check the shipment ID and try again.
      </p>
    </div>
  );
}

// 1. Empty history — container exists but has zero recorded events
const dummyEmptyHistoryData = {
  currentState: {
    containerId: "CNT-2024-002",
    status: "CONTAINER_CREATED",
    location: "Mumbai Port",
    lastUpdated: "2026-09-25T09:00:00Z"
  },
  eventHistory: []
};

// 2. Single event — just created, nothing else happened yet
const dummySingleEventData = {
  currentState: {
    containerId: "CNT-2024-003",
    status: "CONTAINER_CREATED",
    location: "Mumbai Port",
    lastUpdated: "2026-09-26T07:00:00Z"
  },
  eventHistory: [
    { eventId: "evt-1", eventType: "CONTAINER_CREATED", timestamp: "2026-09-26T07:00:00Z", payload: { origin: "Mumbai" } }
  ]
};

// 3. Long history — many events, tests scroll/overflow behavior
const dummyLongHistoryData = {
  currentState: {
    containerId: "CNT-2024-004",
    status: "ARRIVED_AT_PORT",
    location: "Port of Singapore",
    lastUpdated: "2026-09-27T18:00:00Z"
  },
  eventHistory: [
    { eventId: "evt-1", eventType: "CONTAINER_CREATED", timestamp: "2026-09-10T08:00:00Z", payload: { origin: "Chennai" } },
    { eventId: "evt-2", eventType: "LOADED_ON_SHIP", timestamp: "2026-09-11T10:00:00Z", payload: { vessel: "MV Pacific" } },
    { eventId: "evt-3", eventType: "TEMPERATURE_SPIKE", timestamp: "2026-09-13T22:00:00Z", payload: { tempC: 30 } },
    { eventId: "evt-4", eventType: "TEMPERATURE_SPIKE", timestamp: "2026-09-15T02:00:00Z", payload: { tempC: 33 } },
    { eventId: "evt-5", eventType: "LOADED_ON_SHIP", timestamp: "2026-09-17T06:00:00Z", payload: { vessel: "MV Pacific - Transshipment" } },
    { eventId: "evt-6", eventType: "TEMPERATURE_SPIKE", timestamp: "2026-09-19T14:00:00Z", payload: { tempC: 29 } },
    { eventId: "evt-7", eventType: "LOADED_ON_SHIP", timestamp: "2026-09-21T09:00:00Z", payload: { vessel: "MV Pacific - Final Leg" } },
    { eventId: "evt-8", eventType: "ARRIVED_AT_PORT", timestamp: "2026-09-27T18:00:00Z", payload: { port: "Singapore" } }
  ]
};


<div className="timeline-events">
  <h3>Event History</h3>
  {eventHistory.length === 0 ? (
    <p className="no-events-message">No events recorded yet for this container.</p>
  ) : (
    <ul>
      {eventHistory.map((event) => (
        <li key={event.eventId}>
          <span className="event-type">{event.eventType}</span>
          <span className="event-time">{new Date(event.timestamp).toLocaleString()}</span>
          <pre className="event-payload">{JSON.stringify(event.payload, null, 2)}</pre>
        </li>
      ))}
    </ul>
  )}
</div>

const statusColorMap = {
  ShipmentCreated: "status-neutral",
  ShipmentPacked: "status-info",
  ShipmentShipped: "status-warning",
  ShipmentDelivered: "status-success",
};

function CurrentStatusBadge({ status }) {
  const colorClass = statusColorMap[status] || "status-neutral";
  return (
    <div className="current-status-header">
      <span className="current-status-label">Current Status</span>
      <span className={`current-status-badge ${colorClass}`}>{status}</span>
    </div>
  );
}

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
        <ShipmentNotFound shipmentId={shipmentId} />
      </div>
    )
  }

  const latestStatus = events[events.length - 1].eventType

  return (
    <div className="mt-8 px-2 sm:px-0">
      <CurrentStatusBadge status={latestStatus} />
      <h2 className="text-lg font-semibold text-gray-800 mb-6 mt-4">
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
