export type SeatDirection = '左' | '右'

export type Weather = '晴' | '多云' | '阴' | '小雨' | '大雨' | '雪' | '雾'

export type TreeDensity = '稀疏' | '适中' | '茂密'

export type PedestrianStatus = '稀少' | '零星' | '密集'

export interface WindowScene {
  id: string
  routeName: string
  segment: string
  seatDirection: SeatDirection
  timestamp: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}

export interface SceneFormData {
  routeName: string
  segment: string
  seatDirection: SeatDirection
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}

/** 行程方向：去程（返程开端之前）/ 回程（自返程开端起） */
export type Direction = 'outbound' | 'inbound'

/** 灵感抽取的分段筛选，all 表示不区分分段 */
export type DirectionFilter = Direction | 'all'

/**
 * 返程开端标记：线路名 -> 被标记记录的 id。
 * 独立于窗景记录存储，原记录与笔记不做任何改动。
 */
export type ReturnMarks = Record<string, string>
