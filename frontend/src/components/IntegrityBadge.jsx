import { shortHash } from '../lib/format'

const REASONS = {
  EVENT_CONTENT_MODIFIED: 'An event was changed after it was written.',
  PREVIOUS_HASH_MISMATCH: 'The link between two events is broken.',
  VERSION_GAP_OR_DUPLICATE: 'An event is missing or duplicated.',
  EVENTS_MISSING_READ_MODEL_AHEAD: 'Recent events were removed from the log.',
  READ_MODEL_HASH_MISMATCH: 'The newest event does not match its record.',
}

function IntegrityBadge({ integrity, onVerify, t }) {
  if (!integrity) {
    return (
      <p className={`text-xs font-mono ${t.faint}`} role="status">
        Verifying integrity…
      </p>
    )
  }
  const { valid } = integrity
  return (
    <div role="status" className={`rounded-lg px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 ${valid ? `border ${t.card}` : t.danger}`}>
      <span className={valid ? t.ok : ''}>
        {valid ? (
          <>
            ✓ Hash chain intact · {integrity.checked} events · head <span className="font-mono">#{shortHash(integrity.headHash)}</span>
          </>
        ) : (
          <>
            ✗ <strong>Tampering detected</strong> at v{integrity.brokenAtVersion}. {REASONS[integrity.reason] ?? integrity.reason}
          </>
        )}
      </span>
      <button onClick={onVerify} className={`px-2 py-1 rounded-md ${t.btnGhost}`}>
        Re-verify
      </button>
    </div>
  )
}

export default IntegrityBadge
