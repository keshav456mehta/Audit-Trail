export type EventType =
  | "CONTAINER_CREATED"
  | "LOADED_ON_SHIP"
  | "TEMPERATURE_SPIKE"
  | "ARRIVED_AT_PORT";

export interface ContainerCurrentState {
  containerId: string;
  location: string;
  temperature: number | null;
  status: "IN_TRANSIT" | "ARRIVED" | "DELAYED";
  lastUpdated: string; // ISO 8601
}

export interface ContainerEvent {
  eventType: EventType;
  timestamp: string; // ISO 8601
  payload: Record<string, unknown>; // varies per eventType
}

export interface ContainerApiResponse {
  currentState: ContainerCurrentState;
  eventHistory: ContainerEvent[];
}