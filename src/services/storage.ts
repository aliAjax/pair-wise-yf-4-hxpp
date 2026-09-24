import type { WindowScene, RouteSplitMap, SegmentFilter } from '@/types'
import { filterScenesBySegment } from '@/utils/segmentation'

const STORAGE_KEY = 'bus_window_scenes'
const SPLIT_KEY = 'bus_window_route_splits'

export function getAllScenes(): WindowScene[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WindowScene[]
  } catch {
    return []
  }
}

export function saveScene(scene: WindowScene): void {
  const scenes = getAllScenes()
  scenes.push(scene)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes))
}

export function deleteScene(id: string): void {
  const scenes = getAllScenes()
  const target = scenes.find((s) => s.id === id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes.filter((s) => s.id !== id)))
  // 被删记录若是返程起点，一并撤下标记，线路重新合成一条时间线
  if (target && getRouteSplits()[target.routeName] === id) {
    clearRouteSplit(target.routeName)
  }
}

export function getScenesByRoute(routeName: string): WindowScene[] {
  return getAllScenes()
    .filter((s) => s.routeName === routeName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getAllRouteNames(): string[] {
  const scenes = getAllScenes()
  const routeSet = new Set(scenes.map((s) => s.routeName))
  return Array.from(routeSet).sort()
}

export function getRandomScene(filter: SegmentFilter = 'all'): WindowScene | null {
  const scenes = filterScenesBySegment(getAllScenes(), getRouteSplits(), filter)
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}

export function getRouteSplits(): RouteSplitMap {
  try {
    const raw = localStorage.getItem(SPLIT_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as RouteSplitMap
  } catch {
    return {}
  }
}

export function setRouteSplit(routeName: string, sceneId: string): void {
  const splits = getRouteSplits()
  splits[routeName] = sceneId
  localStorage.setItem(SPLIT_KEY, JSON.stringify(splits))
}

export function clearRouteSplit(routeName: string): void {
  const splits = getRouteSplits()
  if (!(routeName in splits)) return
  delete splits[routeName]
  localStorage.setItem(SPLIT_KEY, JSON.stringify(splits))
}
