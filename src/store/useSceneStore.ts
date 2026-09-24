import { create } from 'zustand'
import type {
  WindowScene,
  SceneFormData,
  ReturnMarks,
  DirectionFilter,
} from '@/types'
import {
  getAllScenes,
  saveScene as storageSaveScene,
  deleteScene as storageDeleteScene,
  getScenesByRoute,
  getAllRouteNames,
  getReturnMarks,
  setReturnStart as storageSetReturnStart,
  clearReturnMark as storageClearReturnMark,
} from '@/services/storage'
import { canMarkReturnStart, filterByDirection } from '@/utils/timelineSegments'

interface SceneState {
  scenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  randomScene: WindowScene | null
  /** 各线路当前生效的返程开端标记 */
  returnMarks: ReturnMarks

  loadAll: () => void
  saveScene: (data: SceneFormData) => void
  deleteScene: (id: string) => void
  selectRoute: (routeName: string) => void
  /**
   * 把某条记录设为其线路的返程开端。条件不足（前后各需一条记录）时退回，
   * 保留原标记位置不动；成功时同一线路的旧标记自动撤下。
   * 返回是否设置成功，供页面给出反馈。
   */
  markReturnStart: (sceneId: string) => boolean
  /** 撤掉某条线路的标记，整条线路重新合成一条时间线 */
  unmarkRoute: (routeName: string) => void
  /** 灵感抽取按当前分段读取；all 不区分分段 */
  refreshRandom: (direction?: DirectionFilter) => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  routeNames: [],
  currentRouteScenes: [],
  selectedRoute: '',
  randomScene: null,
  returnMarks: {},

  loadAll: () => {
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    const returnMarks = getReturnMarks()
    set((state) => ({
      scenes,
      routeNames,
      returnMarks,
      currentRouteScenes: state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : [],
    }))
  },

  saveScene: (data: SceneFormData) => {
    const scene: WindowScene = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    storageSaveScene(scene)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    set((state) => {
      const currentRouteScenes = state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : []
      return { scenes, routeNames, currentRouteScenes }
    })
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    const returnMarks = getReturnMarks()
    set((state) => {
      const currentRouteScenes = state.selectedRoute
        ? getScenesByRoute(state.selectedRoute)
        : []
      return { scenes, routeNames, returnMarks, currentRouteScenes }
    })
  },

  selectRoute: (routeName: string) => {
    const currentRouteScenes = routeName ? getScenesByRoute(routeName) : []
    set({ selectedRoute: routeName, currentRouteScenes })
  },

  markReturnStart: (sceneId) => {
    const { scenes } = get()
    const target = scenes.find((s) => s.id === sceneId)
    if (!target) return false

    const routeScenes = scenes.filter((s) => s.routeName === target.routeName)
    // 条件不足就退回：不写存档，旧标记位置原样保留
    if (!canMarkReturnStart(routeScenes, sceneId)) return false

    storageSetReturnStart(target.routeName, sceneId)
    const returnMarks = getReturnMarks()
    set((state) => ({
      returnMarks,
      // 当前筛选的正是标记所在线路时，时间线按新分段重新读取
      currentRouteScenes:
        state.selectedRoute === target.routeName
          ? getScenesByRoute(target.routeName)
          : state.currentRouteScenes,
    }))
    return true
  },

  unmarkRoute: (routeName) => {
    storageClearReturnMark(routeName)
    const returnMarks = getReturnMarks()
    set((state) => ({
      returnMarks,
      currentRouteScenes:
        state.selectedRoute === routeName
          ? getScenesByRoute(routeName)
          : state.currentRouteScenes,
    }))
  },

  refreshRandom: (direction = 'all') => {
    const pool = filterByDirection(getAllScenes(), getReturnMarks(), direction)
    const randomScene =
      pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
    set({ randomScene })
  },
}))
