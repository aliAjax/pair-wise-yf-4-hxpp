import type { WindowScene, ReturnMarks } from '@/types'

const STORAGE_KEY = 'bus_window_scenes'
const RETURN_MARKS_KEY = 'bus_return_marks'

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
  const scenes = getAllScenes().filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes))
  // 标记记录被删后标记随之失效：撤掉指向它的标记，线路重新合成一条时间线
  pruneReturnMarks(scenes)
}

export function getScenesByRoute(routeName: string): WindowScene[] {
  return getAllScenes()
    .filter((s) => s.routeName === routeName)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * 读取全部返程开端标记（线路名 -> 记录 id）。
 * 顺带剔除悬空或归属错误的标记（指向已删除记录、或记录不在该线路下），
 * 避免脏数据影响分段。
 */
export function getReturnMarks(): ReturnMarks {
  const marks = readReturnMarksRaw()
  const allScenes = getAllScenes()
  const ownerRoute = new Map(allScenes.map((s) => [s.id, s.routeName]))
  let changed = false
  for (const [routeName, sceneId] of Object.entries(marks)) {
    if (ownerRoute.get(sceneId) !== routeName) {
      delete marks[routeName]
      changed = true
    }
  }
  if (changed) localStorage.setItem(RETURN_MARKS_KEY, JSON.stringify(marks))
  return marks
}

/**
 * 把某条记录设为其所在线路的返程开端。
 * 每条线路只保留一个标记，换到别的记录即自动撤下旧标记。
 * 资格（前后各有一条记录）由分段判定层校验，这里只负责写入。
 */
export function setReturnStart(routeName: string, sceneId: string): void {
  const marks = readReturnMarksRaw()
  marks[routeName] = sceneId
  localStorage.setItem(RETURN_MARKS_KEY, JSON.stringify(marks))
}

/** 撤掉某条线路的返程开端标记，整条线路重新合成一条时间线 */
export function clearReturnMark(routeName: string): void {
  const marks = readReturnMarksRaw()
  if (!(routeName in marks)) return
  delete marks[routeName]
  localStorage.setItem(RETURN_MARKS_KEY, JSON.stringify(marks))
}

function readReturnMarksRaw(): ReturnMarks {
  try {
    const raw = localStorage.getItem(RETURN_MARKS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ReturnMarks
    }
    return {}
  } catch {
    return {}
  }
}

/** 删除记录后清理失效标记（指向不存在记录、或记录归属线路不符） */
function pruneReturnMarks(existingScenes: WindowScene[]): void {
  const marks = readReturnMarksRaw()
  const ownerRoute = new Map(existingScenes.map((s) => [s.id, s.routeName]))
  let changed = false
  for (const [routeName, sceneId] of Object.entries(marks)) {
    if (ownerRoute.get(sceneId) !== routeName) {
      delete marks[routeName]
      changed = true
    }
  }
  if (changed) localStorage.setItem(RETURN_MARKS_KEY, JSON.stringify(marks))
}

export function getAllRouteNames(): string[] {
  const scenes = getAllScenes()
  const routeSet = new Set(scenes.map((s) => s.routeName))
  return Array.from(routeSet).sort()
}

export function getRandomScene(): WindowScene | null {
  const scenes = getAllScenes()
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}
