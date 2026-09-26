import React from "react";
import "./Timeline.css";

const dummyTimelineData = {
  currentState: {
    containerId: "CNT-2024-001",
    status: "ARRIVED_AT_PORT",
    location: "Port of Rotterdam",
    lastUpdated: "2026-09-20T14:30:00Z"
  },
  eventHistory: [
    { eventId: "evt-1", eventType: "CONTAINER_CREATED", timestamp: "2026-09-15T08:00:00Z", payload: { origin: "Mumbai" } },
    { eventId: "evt-2", eventType: "LOADED_ON_SHIP", timestamp: "2026-09-16T10:00:00Z", payload: { vessel: "MV Horizon" } },
    { eventId: "evt-3", eventType: "TEMPERATURE_SPIKE", timestamp: "2026-09-18T22:15:00Z", payload: { tempC: 32 } },
    { eventId: "evt-4", eventType: "ARRIVED_AT_PORT", timestamp: "2026-09-20T14:30:00Z", payload: { port: "Rotterdam" } }
  ]
};

const dummyNotFoundData = {
  currentState: null,
  eventHistory: []
};

function ShipmentNotFound({ containerId }) {
  return (
    <div className="shipment-not-found">
      <div className="not-found-icon">⚠️</div>
      <h3>Shipment Not Found</h3>
      <p>
        We couldn't find any records for container
        {containerId ? <strong> "{containerId}"</strong> : " this container"}.
      </p>
      <p className="not-found-hint">
        Please check the container ID and try again, or contact support if you believe this is an error.
      </p>
    </div>
  );
}

// NEW (Day 16): maps each status to a badge color class
const statusColorMap = {
  CONTAINER_CREATED: "status-neutral",
  LOADED_ON_SHIP: "status-info",
  TEMPERATURE_SPIKE: "status-warning",
  ARRIVED_AT_PORT: "status-success"
};

// NEW (Day 16): current status badge/header
function CurrentStatusBadge({ status }) {
  const colorClass = statusColorMap[status] || "status-neutral";
  return (
    <div className="current-status-header">
      <span className="current-status-label">Current Status</span>
      <span className={`current-status-badge ${colorClass}`}>{status}</span>
    </div>
  );
}

function Timeline({
  currentState = dummyTimelineData.currentState,
  eventHistory = dummyTimelineData.eventHistory,
  containerId
}) {
  if (!currentState) {
    return <ShipmentNotFound containerId={containerId} />;
  }

  return (
    <div className="timeline-container">
      {/* NEW (Day 16): status badge/header above the timeline */}
      <CurrentStatusBadge status={currentState.status} />

      <div className="timeline-current-state">
        <h3>Current State</h3>
        <p><strong>Container:</strong> {currentState.containerId}</p>
        <p><strong>Location:</strong> {currentState.location}</p>
        <p><strong>Last Updated:</strong> {new Date(currentState.lastUpdated).toLocaleString()}</p>
      </div>

      <div className="timeline-events">
        <h3>Event History</h3>
        <ul>
          {eventHistory.map((event) => (
            <li key={event.eventId}>
              <span className="event-type">{event.eventType}</span>
              <span className="event-time">{new Date(event.timestamp).toLocaleString()}</span>
              <pre className="event-payload">{JSON.stringify(event.payload, null, 2)}</pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Timeline;
export { dummyNotFoundData, dummyTimelineData };