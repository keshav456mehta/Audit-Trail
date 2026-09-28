import "./Timeline.css"

const STAGES = ["ShipmentCreated", "ShipmentPacked", "ShipmentShipped", "ShipmentDelivered"]
const STAGE_LABELS = { ShipmentCreated: "Created", ShipmentPacked: "Packed", ShipmentShipped: "Shipped", ShipmentDelivered: "Delivered" }

const darkStyles = {
  ShipmentCreated: { dot: "#14B8A6", label: "text-[#14B8A6]" },
  ShipmentPacked: { dot: "#3B82F6", label: "text-[#3B82F6]" },
  ShipmentShipped: { dot: "#F59E0B", label: "text-[#F59E0B]" },
  ShipmentDelivered: { dot: "#10B981", label: "text-[#10B981]" },
}

const lightStyles = {
  ShipmentCreated: { dot: "#C2703D", label: "text-[#C2703D]" },
  ShipmentPacked: { dot: "#6D8B74", label: "text-[#6D8B74]" },
  ShipmentShipped: { dot: "#B08968", label: "text-[#B08968]" },
  ShipmentDelivered: { dot: "#4A7A5C", label: "text-[#4A7A5C]" },
}

function ProgressStepper({ currentStatus, light }) {
  const currentIndex = STAGES.indexOf(currentStatus)
  const fillPercent = currentIndex >= 0 ? (currentIndex / (STAGES.length - 1)) * 100 : 0
  const fillGradient = light ? "from-[#C2703D] to-[#4A7A5C]" : "from-[#14B8A6] to-[#F59E0B]"

  return (
    <div className="mb-10 px-2">
      <div className={`relative h-1.5 rounded-full mb-6 ${light ? "bg-[#EDE6D3]" : "bg-[#1F2937]"}`}>
        <div
          className={`stage-fill absolute inset-y-0 left-0 bg-gradient-to-r ${fillGradient} rounded-full`}
          style={{ width: `${fillPercent}%` }}
        ></div>
      </div>
      <div className="flex justify-between">
        {STAGES.map((stage, i) => {
          const done = i <= currentIndex
          const active = i === currentIndex
          const doneColor = light ? "#C2703D" : "#14B8A6"
          return (
            <div key={stage} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-4 h-4 rounded-full border-2 ${active ? "stage-active" : ""}`}
                style={{
                  backgroundColor: done ? doneColor : (light ? "#FAF6EE" : "#111827"),
                  borderColor: done ? doneColor : (light ? "#DDD3BE" : "#1F2937"),
                }}
              ></div>
              <span className={`text-[11px] font-mono ${done ? (light ? "text-[#3B3021]" : "text-[#E5E7EB]") : (light ? "text-[#B3A88F]" : "text-[#4B5563]")}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShipmentNotFound({ shipmentId, light }) {
  return (
    <div className={`text-center py-16 px-6 border border-dashed rounded-xl ${light ? "border-[#DDD3BE] bg-white/50" : "border-[#1F2937] bg-[#111827]/40"}`}>
      <div className="text-3xl mb-3">?</div>
      <h3 className={`font-semibold mb-1 ${light ? "text-[#B54A3C]" : "text-[#EF4444]"}`}>Shipment not found</h3>
      <p className={`text-sm ${light ? "text-[#8A7F6A]" : "text-[#9CA3AF]"}`}>
        No records for <span className={`font-mono ${light ? "text-[#3B3021]" : "text-[#E5E7EB]"}`}>"{shipmentId}"</span>. Check the ID and try again.
      </p>
    </div>
  )
}

function Timeline({ events, shipmentId, loading, error, light }) {
  const eventStyles = light ? lightStyles : darkStyles

  if (loading) {
    return (
      <div className={`mt-10 text-center py-16 border border-dashed rounded-xl font-mono text-sm ${light ? "border-[#DDD3BE] text-[#B3A88F]" : "border-[#1F2937] text-[#6B7280]"}`}>
        searching...
      </div>
    )
  }

  if (error) {
    return (
      <div className={`mt-10 text-center py-16 rounded-xl text-sm ${light ? "border border-[#E8B4A8] bg-[#FBEAE6] text-[#B54A3C]" : "border border-[#7F1D1D] bg-[#1F2937]/40 text-[#EF4444]"}`}>
        {error}
      </div>
    )
  }

  if (!events) {
    return (
      <div className={`mt-10 text-center py-16 border border-dashed rounded-xl text-sm ${light ? "border-[#DDD3BE] text-[#B3A88F]" : "border-[#1F2937] text-[#6B7280]"}`}>
        Enter a shipment ID to see its history
      </div>
    )
  }

  if (events.length === 0) {
    return <div className="mt-10"><ShipmentNotFound shipmentId={shipmentId} light={light} /></div>
  }

  const latestStatus = events[events.length - 1].eventType

  return (
    <div className="mt-10">
      <ProgressStepper currentStatus={latestStatus} light={light} />

      <h2 className={`text-sm font-semibold uppercase tracking-wide mb-4 ${light ? "text-[#8A7F6A]" : "text-[#9CA3AF]"}`}>
        Event history — <span className={`font-mono normal-case ${light ? "text-[#3B3021]" : "text-[#E5E7EB]"}`}>{shipmentId}</span>
      </h2>

      <div className="relative pl-6">
        <div className={`absolute left-[7px] top-1 bottom-1 w-px ${light ? "bg-[#E8DFC9]" : "bg-[#1F2937]"}`}></div>
        <div className="space-y-3">
          {events.map((event, i) => {
            const style = eventStyles[event.eventType] || { dot: light ? "#B3A88F" : "#6B7280", label: light ? "text-[#8A7F6A]" : "text-[#9CA3AF]" }
            return (
              <div key={event._id} className="event-card relative" style={{ animationDelay: `${i * 60}ms` }}>
                <div
                  className={`absolute -left-6 top-4 w-3 h-3 rounded-full border-2 ${light ? "border-[#FAF6EE]" : "border-black"}`}
                  style={{ backgroundColor: style.dot }}
                ></div>
                <div className={`rounded-lg p-4 border transition-colors ${light ? "bg-white border-[#E8DFC9] hover:border-[#C2703D]/50" : "bg-[#111827] border-[#1F2937] hover:border-[#14B8A6]/50"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold text-sm ${style.label}`}>{event.eventType}</span>
                    <span className={`text-xs font-mono ${light ? "text-[#B3A88F]" : "text-[#6B7280]"}`}>
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-xs font-mono ${light ? "text-[#8A7F6A]" : "text-[#9CA3AF]"}`}>{JSON.stringify(event.payload)}</p>
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
