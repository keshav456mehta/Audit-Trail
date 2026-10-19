import { useCallback, useEffect, useReducer, useRef } from 'react'
import { api } from '../api/client'
import { initialShipmentState, shipmentReducer } from './shipmentReducer'

const SCRUB_DEBOUNCE_MS = 150

const newKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(16).slice(2)}`

export function useShipment({ onChanged } = {}) {
  const [state, dispatch] = useReducer(shipmentReducer, initialShipmentState)
  const loadSeq = useRef(0)
  const scrubTimer = useRef(null)
  const idRef = useRef('')

  useEffect(() => () => clearTimeout(scrubTimer.current), [])

  const fetchAll = useCallback(async (id) => {
    const [data, metrics] = await Promise.all([api.getShipment(id), api.getMetrics(id)])
    return { data, metrics }
  }, [])

  const verify = useCallback(async (id) => {
    try {
      dispatch({ type: 'INTEGRITY_OK', result: await api.verify(id) })
    } catch {
      dispatch({ type: 'INTEGRITY_OK', result: null })
    }
  }, [])

  const load = useCallback(
    async (rawId) => {
      const id = rawId.trim()
      if (!id) return
      const seq = (loadSeq.current += 1)
      idRef.current = id
      dispatch({ type: 'LOAD_START', id })
      try {
        const { data, metrics } = await fetchAll(id)
        if (seq !== loadSeq.current) return // a newer search superseded this one
        dispatch({ type: 'LOAD_OK', data, metrics })
        verify(id)
      } catch (error) {
        if (seq !== loadSeq.current) return
        if (error.status === 404) dispatch({ type: 'LOAD_NOT_FOUND', id })
        else dispatch({ type: 'LOAD_ERROR', message: error.message })
      }
    },
    [fetchAll, verify],
  )

  const scrub = useCallback(
    (version) => {
      dispatch({ type: 'SCRUB', version })
      clearTimeout(scrubTimer.current)
      scrubTimer.current = setTimeout(async () => {
        try {
          const response = await api.getShipment(idRef.current, { version })
          dispatch({ type: 'HISTORICAL_OK', version, state: response.currentState })
        } catch (error) {
          dispatch({ type: 'HISTORICAL_ERROR', message: error.message })
        }
      }, SCRUB_DEBOUNCE_MS)
    },
    [],
  )

  const runCommand = useCallback(
    async ({ eventType, payload }) => {
      const id = idRef.current
      dispatch({ type: 'COMMAND_START' })
      try {
        await api.move({
          aggregateId: id,
          eventType,
          payload,
          expectedVersion: state.data?.latestVersion ?? 0, // the version this user actually saw
          idempotencyKey: newKey(),
        })
      } catch (error) {
        const kind = error.code === 'VERSION_CONFLICT' ? 'conflict' : error.status === 422 || error.status === 400 ? 'rejected' : 'error'
        dispatch({ type: 'COMMAND_ERROR', error: { kind, message: error.message, currentVersion: error.details?.currentVersion } })
        return false
      }
      try {
        const { data, metrics } = await fetchAll(id)
        dispatch({ type: 'REFRESH_OK', data, metrics })
        verify(id)
      } catch (error) {
        dispatch({ type: 'LOAD_ERROR', message: error.message })
      }
      onChanged?.()
      return true
    },
    [state.data, fetchAll, verify, onChanged],
  )

  const reload = useCallback(() => load(idRef.current), [load])

  return { state, load, reload, scrub, runCommand, verify: () => verify(idRef.current), dismiss: () => dispatch({ type: 'DISMISS_ERROR' }) }
}
