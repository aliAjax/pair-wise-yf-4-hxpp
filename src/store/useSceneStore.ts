import { create } from 'zustand'
import type { WindowScene, SceneFormData, RouteSplitMap, SegmentFilter } from '@/types'
import {
  getAllScenes,
  saveScene as storageSaveScene,
  deleteScene as storageDeleteScene,
  getScenesByRoute,
  getAllRouteNames,
  getRandomScene,
  getRouteSplits,
  setRouteSplit as storageSetRouteSplit,
  clearRouteSplit as storageClearRouteSplit,
} from '@/services/storage'
import { canPlaceReturnStart } from '@/utils/segmentation'

interface SceneState {
  scenes: WindowScene[]
  routeNames: string[]
  currentRouteScenes: WindowScene[]
  selectedRoute: string
  randomScene: WindowScene | null
  routeSplits: RouteSplitMap

  loadAll: () => void
  saveScene: (data: SceneFormData) => void
  deleteScene: (id: string) => void
  selectRoute: (routeName: string) => void
  markReturnStart: (sceneId: string) => boolean
  clearReturnStart: (routeName: string) => void
  refreshRandom: (segment?: SegmentFilter) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: [],
  routeNames: [],
  currentRouteScenes: [],
  selectedRoute: '',
  randomScene: null,
  routeSplits: {},

  loadAll: () => {
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    const routeSplits = getRouteSplits()
    set({ scenes, routeNames, routeSplits })
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
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      return { scenes, routeNames, currentRouteScenes }
    })
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    const scenes = getAllScenes()
    const routeNames = getAllRouteNames()
    const routeSplits = getRouteSplits()
    set((state) => {
      const currentRouteScenes =
        state.selectedRoute ? getScenesByRoute(state.selectedRoute) : []
      return { scenes, routeNames, routeSplits, currentRouteScenes }
    })
  },

  selectRoute: (routeName: string) => {
    const currentRouteScenes = routeName ? getScenesByRoute(routeName) : []
    set({ selectedRoute: routeName, currentRouteScenes })
  },

  markReturnStart: (sceneId: string) => {
    const scene = getAllScenes().find((s) => s.id === sceneId)
    if (!scene) return false
    if (getRouteSplits()[scene.routeName] === sceneId) return true
    // 新位置前后记录不足时退回，保留原标记位置
    if (!canPlaceReturnStart(getScenesByRoute(scene.routeName), sceneId)) return false
    // 每条线路只留一个标记，写入即自动撤下旧标记
    storageSetRouteSplit(scene.routeName, sceneId)
    set({ routeSplits: getRouteSplits() })
    return true
  },

  clearReturnStart: (routeName: string) => {
    storageClearRouteSplit(routeName)
    set({ routeSplits: getRouteSplits() })
  },

  refreshRandom: (segment: SegmentFilter = 'all') => {
    const randomScene = getRandomScene(segment)
    set({ randomScene })
  },
}))
