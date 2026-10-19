export const initialShipmentState = {
  phase: 'idle', // idle | loading | ready | notFound | error
  id: '',
  data: null, // latest server response for GET /shipment/:id
  metrics: null,
  integrity: null,
  error: '',
  viewVersion: null, // null = latest; otherwise the version being inspected (time travel)
  historical: null, // server state at viewVersion
  historicalLoading: false,
  command: { busy: false, error: null },
}

export function shipmentReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...initialShipmentState, phase: 'loading', id: action.id }
    case 'LOAD_OK':
      return {
        ...state,
        phase: 'ready',
        data: action.data,
        metrics: action.metrics,
        error: '',
        viewVersion: null,
        historical: null,
        historicalLoading: false,
        command: { busy: false, error: null },
      }
    case 'REFRESH_OK':
      // Keeps the user's place in time-travel if possible, but never beyond the new history.
      return {
        ...state,
        phase: 'ready',
        data: action.data,
        metrics: action.metrics,
        viewVersion: null,
        historical: null,
        command: { busy: false, error: null },
      }
    case 'LOAD_NOT_FOUND':
      return { ...initialShipmentState, phase: 'notFound', id: action.id }
    case 'LOAD_ERROR':
      return { ...initialShipmentState, phase: 'error', id: state.id, error: action.message }
    case 'SCRUB': {
      const latest = state.data?.latestVersion ?? 0
      const version = action.version >= latest ? null : Math.max(0, action.version)
      return { ...state, viewVersion: version, historical: version === null ? null : state.historical, historicalLoading: version !== null }
    }
    case 'HISTORICAL_OK':
      if (state.viewVersion !== action.version) return state // stale response
      return { ...state, historical: action.state, historicalLoading: false }
    case 'HISTORICAL_ERROR':
      return { ...state, historicalLoading: false, error: action.message }
    case 'INTEGRITY_OK':
      return { ...state, integrity: action.result }
    case 'COMMAND_START':
      return { ...state, command: { busy: true, error: null } }
    case 'COMMAND_ERROR':
      return { ...state, command: { busy: false, error: action.error } }
    case 'DISMISS_ERROR':
      return { ...state, error: '', command: { ...state.command, error: null } }
    default:
      return state
  }
}

/** The state to display: the server's time-travelled state when scrubbing, otherwise the latest. */
export function displayedState(state) {
  if (state.viewVersion !== null && state.historical) return state.historical
  return state.data?.currentState ?? null
}
