import type { WindowScene, RouteSplitMap, SegmentFilter, SegmentKey } from '@/types'

export const SEGMENT_LABELS: Record<SegmentKey, string> = {
  outbound: '去程',
  return: '回程',
}

export function sortChronological(scenes: WindowScene[]): WindowScene[] {
  return [...scenes].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

// 返程起点前后各要有一条记录，否则不允许落标记
export function canPlaceReturnStart(routeScenes: WindowScene[], sceneId: string): boolean {
  const ordered = sortChronological(routeScenes)
  const idx = ordered.findIndex((s) => s.id === sceneId)
  return idx > 0 && idx < ordered.length - 1
}

// 标记之前算去程，从标记记录起算回程；无标记时整条线路合成一段
export function splitRouteScenes(
  routeScenes: WindowScene[],
  markerId?: string
): { outbound: WindowScene[]; return: WindowScene[] } {
  const ordered = sortChronological(routeScenes)
  const markerIdx = markerId ? ordered.findIndex((s) => s.id === markerId) : -1
  if (markerIdx === -1) return { outbound: ordered, return: [] }
  return { outbound: ordered.slice(0, markerIdx), return: ordered.slice(markerIdx) }
}

export function getSceneSegment(
  sceneId: string,
  routeScenes: WindowScene[],
  markerId?: string
): SegmentKey {
  const { return: returnScenes } = splitRouteScenes(routeScenes, markerId)
  return returnScenes.some((s) => s.id === sceneId) ? 'return' : 'outbound'
}

export function getSceneSegmentFromAll(
  scene: WindowScene,
  allScenes: WindowScene[],
  splits: RouteSplitMap
): SegmentKey {
  const routeScenes = allScenes.filter((s) => s.routeName === scene.routeName)
  return getSceneSegment(scene.id, routeScenes, splits[scene.routeName])
}

export function filterScenesBySegment(
  scenes: WindowScene[],
  splits: RouteSplitMap,
  filter: SegmentFilter
): WindowScene[] {
  if (filter === 'all') return scenes
  return scenes.filter((s) => getSceneSegmentFromAll(s, scenes, splits) === filter)
}
