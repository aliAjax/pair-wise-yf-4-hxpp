import type { WindowScene, Direction, DirectionFilter, ReturnMarks } from '@/types'

/** 时间先后顺序：早 -> 晚（同时间按 id 兜底，保证结果稳定） */
function byChronological(a: WindowScene, b: WindowScene): number {
  return (
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() ||
    a.id.localeCompare(b.id)
  )
}

/**
 * 判断某条记录能否作为返程开端：
 * 按时间序排列后，它前面和后面都必须各有一条记录。
 * 标记记录必须仍在该线路记录中，否则视为无效（条件不足）。
 */
export function canMarkReturnStart(
  routeScenes: WindowScene[],
  sceneId: string
): boolean {
  const chrono = [...routeScenes].sort(byChronological)
  const index = chrono.findIndex((s) => s.id === sceneId)
  return index > 0 && index < chrono.length - 1
}

/** 一条线路拆分后的两段，均按时间序（早 -> 晚）排列 */
export interface RouteSegments {
  /** 返程开端之前的记录（不含标记记录） */
  outbound: WindowScene[]
  /** 自返程开端起的记录（含标记记录） */
  inbound: WindowScene[]
  /** 生效中的返程开端记录，无标记或标记失效时为 null */
  markedScene: WindowScene | null
}

/**
 * 按当前返程标记把一条线路拆成去程 / 回程。
 * 无标记或标记记录已不存在时，整条线路合为一条时间线（outbound 全量）。
 */
export function splitRoute(
  routeScenes: WindowScene[],
  markId: string | undefined
): RouteSegments {
  const chrono = [...routeScenes].sort(byChronological)
  const markIndex = markId ? chrono.findIndex((s) => s.id === markId) : -1

  if (markIndex < 0) {
    return { outbound: chrono, inbound: [], markedScene: null }
  }

  return {
    outbound: chrono.slice(0, markIndex),
    inbound: chrono.slice(markIndex),
    markedScene: chrono[markIndex],
  }
}

/**
 * 判定单条记录所属分段。
 * 仅当该记录所在线路存在生效标记时才有去程/回程之分，否则返回 null（未分段）。
 */
export function getSceneDirection(
  scene: WindowScene,
  allScenes: WindowScene[],
  marks: ReturnMarks
): Direction | null {
  const markId = marks[scene.routeName]
  if (!markId) return null
  return getDirectionMap(allScenes, marks)[scene.id] ?? null
}

/**
 * 批量计算记录 id -> 分段。只覆盖存在生效标记的线路：
 * 标记记录及之后为回程，标记之前为去程；未分段线路不参与去程/回程筛选。
 */
export function getDirectionMap(
  allScenes: WindowScene[],
  marks: ReturnMarks
): Record<string, Direction> {
  const map: Record<string, Direction> = {}
  const byRoute = new Map<string, WindowScene[]>()
  for (const scene of allScenes) {
    const list = byRoute.get(scene.routeName) ?? []
    list.push(scene)
    byRoute.set(scene.routeName, list)
  }
  for (const [routeName, scenes] of byRoute) {
    const { outbound, inbound, markedScene } = splitRoute(
      scenes,
      marks[routeName]
    )
    // 无生效标记的线路是一条完整时间线，不写入去程/回程映射
    if (!markedScene) continue
    outbound.forEach((s) => {
      map[s.id] = 'outbound'
    })
    inbound.forEach((s) => {
      map[s.id] = 'inbound'
    })
  }
  return map
}

/** 按分段筛选记录；filter 为 all 时原样返回 */
export function filterByDirection(
  scenes: WindowScene[],
  marks: ReturnMarks,
  filter: DirectionFilter
): WindowScene[] {
  if (filter === 'all') return scenes
  const dirMap = getDirectionMap(scenes, marks)
  return scenes.filter((s) => dirMap[s.id] === filter)
}

export const DIRECTION_LABEL: Record<Direction, string> = {
  outbound: '去程',
  inbound: '回程',
}
