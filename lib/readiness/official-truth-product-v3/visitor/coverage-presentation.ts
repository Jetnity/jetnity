// Display coverage only: no proof, publication, freshness or authority of its own.
import { V3_CUSTOMER_INFORMATION_GROUPS, V3_CUSTOMER_INFORMATION_TOPICS,
  type V3CustomerInformationTopic } from '../customer-information/topics'
import type { V3VisitorViewResult } from './presentation'

type Accepted = Extract<V3VisitorViewResult, { status: 'accepted' }>

/** Build from the controller's current results every time, including after expiry.
 * There is deliberately no second positive cache to survive a removed statement.
 * Old/unknown DTO metadata cannot fill a topic by title or text matching.
 */
export function v3CustomerInformationCoverage(results: readonly V3VisitorViewResult[]) {
  const byTopic = new Map<V3CustomerInformationTopic, Accepted[]>()
  const related = new Map<V3CustomerInformationTopic, Array<Readonly<{ resultIndex: number; label: string }>>>()
  const unassigned: V3VisitorViewResult[] = []
  for (const [resultIndex, result] of results.entries()) {
    if (result.status !== 'accepted' || !result.informationTopic
      || !V3_CUSTOMER_INFORMATION_TOPICS.some(topic => topic.id === result.informationTopic)) {
      unassigned.push(result)
      continue
    }
    const previous = byTopic.get(result.informationTopic) ?? []
    byTopic.set(result.informationTopic, [...previous, result])
    const main = V3_CUSTOMER_INFORMATION_TOPICS.find(topic => topic.id === result.informationTopic)!
    for (const id of new Set(result.relatedInformationTopics ?? [])) {
      if (id === result.informationTopic || !V3_CUSTOMER_INFORMATION_TOPICS.some(topic => topic.id === id)) continue
      related.set(id, [...(related.get(id) ?? []), { resultIndex, label: main.label }])
    }
  }
  return {
    unassigned,
    groups: V3_CUSTOMER_INFORMATION_GROUPS.map(group => ({ ...group,
      topics: V3_CUSTOMER_INFORMATION_TOPICS.filter(topic => topic.group === group.id).map(topic => ({ ...topic,
        results: byTopic.get(topic.id) ?? [],
        related: related.get(topic.id) ?? [],
      })),
    })),
    hasConfirmedSource: results.some(result => result.status === 'accepted'),
  }
}
