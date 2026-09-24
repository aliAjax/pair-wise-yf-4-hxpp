import { useEffect, useState } from 'react'
import {
  Search,
  Route,
  X,
  Trash2,
  Clock,
  MapPin,
  Flag,
  ArrowDownUp,
  CornerDownRight,
  History,
} from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'
import {
  splitRoute,
  DIRECTION_LABEL,
} from '@/utils/timelineSegments'
import type { WindowScene, Direction } from '@/types'

type NewestFirst = WindowScene[]

export default function TimelinePage() {
  const {
    routeNames,
    selectedRoute,
    currentRouteScenes,
    returnMarks,
    selectRoute,
    loadAll,
    deleteScene,
    markReturnStart,
    unmarkRoute,
  } = useSceneStore()
  const [search, setSearch] = useState('')
  const [detailScene, setDetailScene] = useState<WindowScene | null>(null)
  const [markError, setMarkError] = useState('')

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filteredRoutes = routeNames.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  // 线路筛选按当前分段读取：有标记则拆成去程 / 回程，没有标记则合成一条时间线
  const segments = selectedRoute
    ? splitRoute(currentRouteScenes, returnMarks[selectedRoute])
    : null
  const hasMark = Boolean(segments?.markedScene)
  const inbound: NewestFirst = segments
    ? [...segments.inbound].reverse()
    : []
  const outbound: NewestFirst = segments
    ? [...segments.outbound].reverse()
    : []
  const singleLine: NewestFirst = segments ? [...segments.outbound].reverse() : []

  const isMarked = (scene: WindowScene) =>
    hasMark && segments?.markedScene?.id === scene.id

  const handleMark = (scene: WindowScene) => {
    setMarkError('')
    if (isMarked(scene)) {
      unmarkRoute(scene.routeName)
      return
    }
    const ok = markReturnStart(scene.id)
    // 条件不足已退回并保留原位置，页面只提示原因
    if (!ok) {
      setMarkError('标记需要它之前和之后各有一条记录，先把这条线路的记录补齐吧')
    }
  }

  const handleDelete = (id: string) => {
    deleteScene(id)
    setDetailScene(null)
    setMarkError('')
  }

  const renderCard = (scene: WindowScene, direction?: Direction) => (
    <div key={scene.id} className="relative flex gap-4">
      <div
        className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-teal-950 ${
          isMarked(scene) ? 'bg-dusk-300' : 'bg-dusk-400'
        }`}
      />
      <div className="w-20 shrink-0 pt-0.5 text-right">
        <p className="text-xs text-dusk-400">{formatTimestamp(scene.timestamp)}</p>
        <p className="mt-0.5 text-[10px] text-mist-500">
          {getTimeOfDay(scene.timestamp)}
        </p>
      </div>
      <button
        onClick={() => {
          setDetailScene(scene)
          setMarkError('')
        }}
        className="group flex-1 rounded-xl border border-teal-800 bg-teal-900/50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-dusk-400/40 hover:shadow-lg hover:shadow-dusk-400/10"
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {getWeatherIcon(scene.weather)}
          <span className="text-sm font-semibold text-mist-100">
            {scene.segment}
          </span>
          {isMarked(scene) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-dusk-400/20 px-2 py-0.5 text-[10px] text-dusk-300">
              <Flag className="w-2.5 h-2.5" />
              返程开端
            </span>
          )}
          {!isMarked(scene) && direction && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                direction === 'inbound'
                  ? 'bg-dusk-400/10 text-dusk-300'
                  : 'bg-teal-800/70 text-mist-300'
              }`}
            >
              {DIRECTION_LABEL[direction]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mb-1.5 text-mist-400">
          <MapPin className="w-3 h-3" />
          <span className="text-xs">{scene.routeName}</span>
          <span className="mx-1 text-teal-700">·</span>
          <span className="text-xs">{scene.seatDirection}侧</span>
        </div>
        {scene.note && (
          <p className="text-xs text-mist-400 line-clamp-2">{scene.note}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          {getTreeIcon(scene.treeDensity)}
          {getPedestrianIcon(scene.pedestrianStatus)}
          {scene.signText && (
            <span className="rounded bg-teal-800/60 px-1.5 py-0.5 text-[10px] text-mist-300">
              {scene.signText}
            </span>
          )}
        </div>
      </button>
    </div>
  )

  const renderTimeline = (
    list: NewestFirst,
    direction: Direction | undefined
  ) => (
    <div className="space-y-6">
      {list.map((scene) => renderCard(scene, hasMark ? direction : undefined))}
    </div>
  )

  return (
    <div className="min-h-screen bg-teal-950 font-serif text-mist-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-wide text-dusk-400">
          窗景时间线
        </h1>

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索路线..."
              className="w-full rounded-lg border border-teal-800 bg-teal-900/60 py-2.5 pl-10 pr-4 text-sm text-mist-100 placeholder:text-mist-500 focus:border-dusk-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectRoute('')}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                !selectedRoute
                  ? 'bg-dusk-400 text-teal-950'
                  : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
              }`}
            >
              全部
            </button>
            {filteredRoutes.map((name) => (
              <button
                key={name}
                onClick={() => selectRoute(name)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  selectedRoute === name
                    ? 'bg-dusk-400 text-teal-950'
                    : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
                }`}
              >
                <Route className="mr-1 inline w-3 h-3" />
                {name}
                {returnMarks[name] && (
                  <Flag className="ml-1 inline w-3 h-3 opacity-70" />
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedRoute && currentRouteScenes.length > 0 && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-teal-800/70 bg-teal-900/40 px-3 py-2 text-xs leading-relaxed text-mist-400">
            {hasMark ? (
              <>
                <CornerDownRight className="mt-0.5 w-3.5 h-3.5 shrink-0 text-dusk-400" />
                <span>
                  以「返程开端」为界：标记之前算
                  <span className="text-mist-200">去程</span>，自它起算
                  <span className="text-dusk-300">回程</span>。在卡片详情里可撤掉标记，撤掉后重新合成一条时间线。
                </span>
              </>
            ) : (
              <>
                <History className="mt-0.5 w-3.5 h-3.5 shrink-0 text-mist-400" />
                <span>
                  同一路线到终点后折返会混在一条时间线里。打开任意一条记录，可把它
                  <span className="text-dusk-300">标成返程开端</span>
                  （它前后各需有一条记录）。
                </span>
              </>
            )}
          </div>
        )}

        {!selectedRoute || currentRouteScenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-mist-400">
            <div className="mb-4 text-6xl opacity-30">🪟</div>
            <p className="text-lg">
              {selectedRoute ? '该路线暂无窗景记录' : '选择一条路线，开始浏览窗景'}
            </p>
          </div>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-teal-800" />
            {hasMark ? (
              <div className="space-y-8">
                <section>
                  <SectionLabel tone="inbound">
                    回程 · 自返程开端起
                  </SectionLabel>
                  {renderTimeline(inbound, 'inbound')}
                </section>

                <div className="relative flex items-center gap-3 py-1">
                  <div className="absolute -left-[1.38rem] top-1/2 z-10 -translate-y-1/2 rounded-full border border-dusk-400/40 bg-teal-950 p-1">
                    <ArrowDownUp className="h-3 w-3 text-dusk-400" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-dusk-400/40 via-teal-800 to-teal-800" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-dusk-400/15 px-2.5 py-0.5 text-[10px] text-dusk-300">
                    <Flag className="w-2.5 h-2.5" />
                    终点站 · 折返
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-dusk-400/40 via-teal-800 to-teal-800" />
                </div>

                <section>
                  <SectionLabel tone="outbound">
                    去程 · 返程开端之前
                  </SectionLabel>
                  {outbound.length > 0 ? (
                    renderTimeline(outbound, 'outbound')
                  ) : (
                    <p className="rounded-xl border border-dashed border-teal-800 py-6 text-center text-xs text-mist-500">
                      去程暂无记录
                    </p>
                  )}
                </section>
              </div>
            ) : (
              renderTimeline(singleLine, undefined)
            )}
          </div>
        )}
      </div>

      {detailScene && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setDetailScene(null)
            setMarkError('')
          }}
        >
          <div
            className="relative mx-4 w-full max-w-md animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setDetailScene(null)
                setMarkError('')
              }}
              className="absolute right-4 top-4 text-mist-400 hover:text-mist-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              {getWeatherIcon(detailScene.weather)}
              <h2 className="text-xl font-bold text-dusk-400">
                {detailScene.segment}
              </h2>
              {isMarked(detailScene) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dusk-400/20 px-2 py-0.5 text-[10px] text-dusk-300">
                  <Flag className="w-2.5 h-2.5" />
                  返程开端
                </span>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-mist-300">
                <MapPin className="w-4 h-4 text-dusk-400" />
                <span>{detailScene.routeName}</span>
                <span className="text-teal-600">·</span>
                <span>{detailScene.seatDirection}侧</span>
                {hasMark && !isMarked(detailScene) && (
                  <>
                    <span className="text-teal-600">·</span>
                    <DirectionTag scene={detailScene} />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-mist-300">
                <Clock className="w-4 h-4 text-dusk-400" />
                <span>{formatTimestamp(detailScene.timestamp)}</span>
                <span className="text-teal-600">·</span>
                <span>{getTimeOfDay(detailScene.timestamp)}</span>
              </div>
              <div className="flex items-center gap-3 text-mist-300">
                {getTreeIcon(detailScene.treeDensity)}
                <span>{detailScene.treeDensity}</span>
                {getPedestrianIcon(detailScene.pedestrianStatus)}
                <span>{detailScene.pedestrianStatus}</span>
              </div>
              {detailScene.signText && (
                <div className="rounded-lg bg-teal-800/50 px-3 py-2 text-mist-200">
                  招牌: {detailScene.signText}
                </div>
              )}
              {detailScene.note && (
                <div className="rounded-lg border border-teal-800 px-3 py-2 text-mist-300">
                  {detailScene.note}
                </div>
              )}
            </div>

            {markError && (
              <p className="mt-4 rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-300">
                {markError}
              </p>
            )}

            <button
              onClick={() => handleMark(detailScene)}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition-colors ${
                isMarked(detailScene)
                  ? 'bg-teal-800/70 text-mist-200 hover:bg-teal-800'
                  : 'bg-dusk-400/15 text-dusk-300 hover:bg-dusk-400/25'
              }`}
            >
              <Flag className="w-4 h-4" />
              {isMarked(detailScene)
                ? '撤掉返程标记（重新合成一条时间线）'
                : '把这条记录标为返程开端'}
            </button>

            <button
              onClick={() => handleDelete(detailScene.id)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
            >
              <Trash2 className="w-4 h-4" />
              删除此窗景
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function DirectionTag({ scene }: { scene: WindowScene }) {
    const dir =
      segments &&
      (segments.inbound.some((s) => s.id === scene.id)
        ? 'inbound'
        : segments.outbound.some((s) => s.id === scene.id)
          ? 'outbound'
          : null)
    if (!dir) return null
    return (
      <span
        className={dir === 'inbound' ? 'text-dusk-300' : 'text-mist-300'}
      >
        {DIRECTION_LABEL[dir]}
      </span>
    )
  }
}

function SectionLabel({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: Direction
}) {
  return (
    <p
      className={`mb-4 text-xs tracking-widest ${
        tone === 'inbound' ? 'text-dusk-300' : 'text-mist-400'
      }`}
    >
      {children}
    </p>
  )
}
