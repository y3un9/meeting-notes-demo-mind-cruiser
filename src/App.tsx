import React, { useEffect, useMemo, useState } from 'react'
import { isSameDay, parse, format } from 'date-fns'
import './App.css'
import logo from './asset/logo.svg'
import iconChevronUp from './asset/icon-chevron-up.svg'

export type Note = {
  /** 唯一ID */
  id: string,
  /** title */
  title: string,
  /** 持续时长，单位：秒 */
  duration: number,
  /** 创建时间 */
  create_time: string
}

export type Page = {
  /** 当前页 */
  page_now: number,
  /** 每页数据大小 */
  page_size: number,
  /** 总页数 */
  page_total: number,
  /** 所有数据总数 */
  total_num: 20000,
}

export type ApiResp<T> = {
  code: number,
  msg: string,
  data: T,
}

export type ApiListNoteResp = ApiResp<{ list: Note[], page: Page }>

export type FetchListResult = {
  list: Note[],
  loading: boolean,
}

export type ListSegmentItem = {
  dateText: string,
  date: Date,
  fold?: boolean,
  notes: ListNoteItem[],
}

export type ListNoteItem = Note & {
  dateCreateTime: Date,
  tsCreateTime: number,
  dateStartTime: Date,
  dateEndTime: Date,
  timeRangeText: string,
}

export const useFetchList = (url: string): FetchListResult => {
  const [list, setList] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let respData: ApiListNoteResp
      try {
        // // 接口调不通啊？
        // respData = await fetch(url, {
        //   mode: 'cors',
        // })
        //   .then((resp) => resp.json())
        //   .then((data) => data)

        // 笔试题文档里的数据
        if ('https://6cxx9pggi4.execute-api.us-east1.amazonaws.com/prod/mock/meeting-a/list' === url) {
          respData = await new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                "code": 0, // 0代表成功，非0代表失败
                "msg": "success", // 错误码描述
                "data": {
                  "list": [
                    {
                      "id": "6619deafdabc4707a470c3bb17e8b57e", //唯一ID
                      "title": "Police source protect", // title
                      "duration": 4593, // 持续时长，单位：秒
                      "create_time": "2022-02-28 19:01:19" // 创建时间
                    },
                    {
                      "id": "6619deafdabc4707a470c3bb17e8b57f", //唯一ID
                      "title": "asd qwe", // title
                      "duration": 6000, // 持续时长，单位：秒
                      "create_time": "2022-02-28 20:01:19" // 创建时间
                    }
                  ],
                  "page": {
                    "page_now": 1, // 当前页
                    "page_size": 3000, // 每页数据大小
                    "page_total": 7, // 总页数
                    "total_num": 20000 // 所有数据总数
                  }
                }
              })
            }, 3000)
          })
        } else if('https://6cxx9pggi4.execute-api.us-east1.amazonaws.com/prod/mock/meeting-b/list' === url) {
          respData = await new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                "code": 0, // 0代表成功，非0代表失败
                "msg": "success", // 错误码描述
                "data": {
                  "list": [
                    {
                      "id": "dc1e4811d8594f0bad6003307dd170b9",
                      "title": "Player but movie major put idea",
                      "duration": 1495,
                      "create_time": "2022-02-17 11:41:22"
                    }
                  ],
                  "page": {
                    "page_now": 1, // 当前页
                    "page_size": 3000, // 每页数据大小
                    "page_total": 7, // 总页数
                    "total_num": 20000 // 所有数据总数
                  }
                }
              })
            }, 5000)
          })
        } else {
          respData = {
            code: -1,
          }
        }
      } catch (err) {
        respData = {
          code: -1,
        }
      }
      console.log(url, respData)
      setLoading(false)
      const {
        code,
        msg,
        data,
      } = respData
      const list = data?.list
      const page = data?.page
      if (0 !== code) {
        setList([])
        return
      }
      setList(list!)
    }

    fetchData()
  }, [url])

  return {
    list,
    loading,
  }
}

export const useFetchAllList = (): FetchListResult => {
  // 分别获取请求，哪个请求先回来先显示（显示优先），但是等全部请求结束后才可交互
  const { list: listA, loading: loadingA } = useFetchList(`https://6cxx9pggi4.execute-api.us-east1.amazonaws.com/prod/mock/meeting-a/list`)
  const { list: listB, loading: loadingB } = useFetchList(`https://6cxx9pggi4.execute-api.us-east1.amazonaws.com/prod/mock/meeting-b/list`)
  const list = useMemo(() => {
    return [
    ...listA,
    ...listB,
    ]
  }, [listA, listB])
  return {
    list,
    loading: loadingA || loadingB,
  }
}

export const useComputeListSegments = (listData: Note[]): {
  listSegments: ListSegmentItem[],
  switchSegmentFold: (segment: ListSegmentItem) => any,
} => {
  const listSegments = useMemo(() => {
    // 先将列表数据按 create_time 顺序排列
    // 然后利用这个顺序，后面元素的时间一定比前面元素大，一次构造出按天分段的两层数组数据
    const listSegments: ListSegmentItem[] = []
    listData.forEach((v) => {
      const {
        create_time,
        duration,
      } = v
      const dateCreateTime = parse(create_time, 'yyyy-MM-dd HH:mm:ss', new Date())
      const tsCreateTime = dateCreateTime.getTime()
      const dateStartTime = new Date(dateCreateTime)
      const dateEndTime = new Date(dateStartTime.getTime() + duration * 1000)
      const dateStartTimeText = format(dateCreateTime, 'hh:mm aaa')
      const dateEndTimeText = format(dateEndTime, 'hh:mm aaa')
      const timeRangeText = `${dateStartTimeText} - ${dateEndTimeText}`
      const note = {
        ...v,
        dateCreateTime,
        tsCreateTime,
        dateStartTime,
        dateEndTime,
        timeRangeText,
      }

      const dateSegment = new Date(dateCreateTime)
      dateSegment.setHours(0,0,0,0)
      const dateSegmentText = format(dateSegment, 'EEEE, MMM dd')
      const segment = listSegments.find((s) => s['dateText'] === dateSegmentText)
      if (!segment) {
        listSegments.push({
          dateText: dateSegmentText,
          date: dateSegment,
          fold: false,
          notes: [
            note
          ],
        })
      } else {
        segment['notes'].push(note)
      }
      return note
    })
    return listSegments.sort((a, b) => b['date'].getTime() - a['date'].getTime())
  }, [listData]) // listSegments 只依赖 listData 更新，防止其它 state 的更新导致无谓计算，虽然没有其它 state :)

  const [segmentFold, setSegmentFold] = useState<{ [key: string]: boolean }>({})

  const listSegmentedWithFold = listSegments.map((segment) => ({
    ...segment,
    fold: segmentFold[segment['dateText']] ?? segment['fold'], // 控制折叠，支持默认展开或折叠
  }))

  const switchSegmentFold = (segment: ListSegmentItem) => {
    setSegmentFold((segmentFold) => ({ // 避免非同步的 setState 造成多次更新结果不一致
      ...segmentFold,
      [segment['dateText']]: !segmentFold[segment['dateText']],
    }))
  }

  return {
    listSegments: listSegmentedWithFold,
    switchSegmentFold,
  }
}

function App() {
  const { list, loading } = useFetchAllList() // 分次取得的全列表数据
  const {
    listSegments,
    switchSegmentFold,
  } = useComputeListSegments(list) // 按天分段
  const [activeNote, setActiveNote] = useState<ListNoteItem>(null!)

  const handleNoteClick = (note: ListNoteItem, segment: ListSegmentItem) => {
    console.log(note, segment)
    setActiveNote(() => note)
  }

  return (
    <>
      <div className="h-full overflow-hidden flex">
        {/* 应用级菜单栏，类似飞书 */}
        <div className="h-full flex flex-col" style={{ width: '56px', background: '#282B32' }}>
          <div className="py-6">
            <img className="w-6 h-6 mx-auto my-0 object-contain" src={logo} alt="" />
          </div>
          <div className="flex-1 h-0 flex flex-col">
            <div className="flex-1 h-0 overflow-auto flex flex-col items-center gap-2">
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#9f2aec' }}></div>
              </div>
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
            </div>
            <div className="pb-6 flex flex-col items-center gap-2">
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
              <div className="w-10 h-10 flex justify-center items-center">
                <div className="w-6 h-6 rounded-md" style={{ background: '#575d64' }}></div>
              </div>
            </div>
          </div>
        </div>
        {/* 具体功能模块 */}
        <div className="flex-1 h-full flex">
          {/* 具体功能内分类，相当于二级菜单 */}
          <div className="h-full flex flex-col overflow-hidden" style={{ width: '328px', background: '#1B1E28' }}>
            <div className="py-6 px-4 text-white font-medium" style={{ fontSize: '18px', lineHeight: '28px' }}>
              Meeting Notes
            </div>
            <div className="flex-1 h-0 px-4 pb-6 overflow-auto relative">
              <div className="list-time">
                {listSegments.map((segment) => {
                  return (
                    <div className={`item-time ${segment['fold'] ? 'fold' : ''}`} key={segment['dateText']}>
                      <div className="time-title" onClick={() => switchSegmentFold(segment)}>
                        <img className="icon w-4 h-4 object-contain" src={iconChevronUp} alt="" />
                        <div>{segment['dateText']}</div>
                      </div>
                      {segment['notes'].length > 0
                        ? (
                          <div className={`list-note ${segment['fold'] ? 'hidden' : ''}`}>
                            {segment['notes'].map((note) => {
                              return (
                                <div
                                  key={note['id']}
                                  className={`item-note ${activeNote?.id === note.id ? 'active' : ''}`}
                                  onClick={(e) => handleNoteClick(note, segment)}
                                >
                                  <div className="title">
                                    {note['title']}
                                  </div>
                                  <div className="time">
                                    {note['timeRangeText']}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                        : null
                      }
                    </div>
                  )
                })}
              </div>
              {loading && (
                <div
                  className="absolute top-0 bottom-0 left-0 right-0 text-white flex justify-center items-center transition-all"
                  style={{ backgroundColor: 'rgba(96,96,96,0.4)' }}
                >Loading...</div>
              )}
            </div>
          </div>
          {/* 具体功能内容显示，主内容区域，骨架屏加载 */}
          <div className="flex-1 h-full overflow-auto py-6" style={{ background: '#f6f7f9' }}>
            <div className="my-0 mx-auto h-10" style={{ maxWidth: '700px' }}>
              <div className="flex items-start gap-6 mb-6">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="rounded-s" style={{ width: '420px', height: '24px', background: '#eaedf0' }}></div>
                  <div className="rounded-s" style={{ width: '218.42px', height: '24px', background: '#eaedf0' }}></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ background: '#eaedf0' }}></div>
                  <div className="w-12 h-8 rounded-md" style={{ background: '#eaedf0' }}></div>
                  <div className="h-8 rounded-md" style={{ width: '108px', background: '#eaedf0' }}></div>
                </div>
              </div>
              <div className="">
                <div className="mb-4">
                  <div className="inline-block w-16 h-6 rounded-md" style={{ background: '#eaedf0' }}></div>
                </div>
                <div className="rounded-md" style={{ height: '240px', background: '#eaedf0' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
