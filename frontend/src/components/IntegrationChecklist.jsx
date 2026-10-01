import { useState } from 'react'

const STEPS = [
  {
    title: 'Sync on timing with the team',
    description: "This is a whole-team final integration test — confirm with Keshav when it's happening today so you're online and available at the right time.",
    details: [
      'Message Keshav to confirm the integration test time.',
      'Keep the team channel open and be ready to join the test.',
    ],
  },
  {
    title: 'Have your backend live and current',
    description: "Have your backend running and your `Vinay` branch fully merged/up to date so the team is testing your actual final route, not something stale.",
    details: [
      'Pull the latest changes and confirm your branch is up to date.',
      'Start the backend and verify the final route responds before the team begins.',
    ],
  },
  {
    title: 'Be on standby for the write-side of the flow',
    description: "As the team walks through the full flow (frontend → your POST /move → EventStore → V. Divyesh's GET/:id → Praveen's Timeline), be ready to jump in immediately if anything on the write side misbehaves.",
    details: [
      'Watch the POST /move request and backend logs during the walkthrough.',
      'Check that events reach EventStore with the expected shipment ID and payload.',
    ],
  },
  {
    title: "Fix anything found today, don't defer it",
    description: "This is the last real bug-fixing opportunity before Day 24's final commit — if something breaks, fix it today, don't let it slide to tomorrow.",
    details: [
      'Reproduce the failure and identify whether it is in the route, validation, or event write.',
      'Make the smallest safe fix, then ask the tester to retry the failing step.',
    ],
  },
  {
    title: 'Re-verify fixes with the team live',
    description: 'After each fix, quickly re-verify with whoever’s testing that the flow now works end-to-end again.',
    details: [
      'Repeat the same end-to-end steps that exposed the issue.',
      'Confirm the timeline reflects the newly written event before moving on.',
    ],
  },
  {
    title: 'Commit Day 23 if changes were made',
    description: "If you made any fixes, commit them with a clear message like 'Fix issue found during final team integration test'. If truly nothing broke on your end, that's a great sign — no commit strictly needed today, but a short 'verified in final integration test, no changes needed' note is fine too.",
    details: [
      'Review the diff and commit any fixes with a specific message.',
      'If there were no changes, record that the final integration test passed.',
    ],
  },
]

function IntegrationChecklist({ light }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className={`rounded-xl border p-5 sm:p-6 ${light ? 'border-[#E8DFC9] bg-white/70' : 'border-[#303030] bg-[#191919]'}`} aria-labelledby="integration-checklist-title">
      <h2 id="integration-checklist-title" className={`mb-5 text-lg font-semibold ${light ? 'text-[#3B3021]' : 'text-[#F3F4F6]'}`}>
        Final team integration checklist
      </h2>
      <ol className="space-y-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${light ? 'bg-[#F0E9D8] text-[#8A7F6A]' : 'bg-[#262626] text-[#B9B9B9]'}`}>
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className={`text-[15px] font-semibold leading-5 ${light ? 'text-[#3B3021]' : 'text-[#F3F4F6]'}`}>{step.title}</h3>
              <p className={`mt-2 text-sm leading-[1.45] ${light ? 'text-[#6F6657]' : 'text-[#C4C4C4]'}`}>{step.description}</p>
              {expanded && (
                <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm leading-[1.45] ${light ? 'text-[#8A7F6A]' : 'text-[#A3A3A3]'}`}>
                  {step.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className={`ml-10 mt-5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${light ? 'bg-[#F0E9D8] text-[#3B3021] hover:bg-[#E8DFC9]' : 'bg-[#303030] text-[#F3F4F6] hover:bg-[#3A3A3A]'}`}
      >
        {expanded ? 'Hide step details' : 'View step by step'}
      </button>
    </section>
  )
}

export default IntegrationChecklist
