import React from "react";

// Dummy data matching the NEW real-API shape (Day 14: shape only, not live yet)
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

// Props now match the real API response shape: { currentState, eventHistory }
function Timeline({ currentState = dummyTimelineData.currentState, eventHistory = dummyTimelineData.eventHistory }) {
  return (
    <div className="timeline-container">
      <div className="timeline-current-state">
        <h3>Current State</h3>
        <p><strong>Container:</strong> {currentState.containerId}</p>
        <p><strong>Status:</strong> {currentState.status}</p>
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
