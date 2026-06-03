import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type DiscoveryStatus = '発芽' | '育成中' | '発酵中' | '収穫済み'

type Discovery = {
  id: string
  title: string
  memo: string
  source: string
  tags: string[]
  status: DiscoveryStatus
  date: string
  createdAt: string
}

type DiscoveryForm = Omit<Discovery, 'id' | 'tags' | 'createdAt'> & {
  tags: string
}

const storageKey = 'discovery-labo-discoveries'

const sources = [
  '日常',
  'Threads',
  'note',
  'ドラマ',
  '映画',
  '本',
  'ゲーム',
  '訪看',
  'AI',
  'その他',
]

const tagSeeds = [
  '回復期',
  'AI',
  'Threads向き',
  'note向き',
  '日常',
  '未分類',
]

const statuses: Array<{
  value: DiscoveryStatus
  icon: string
  hint: string
}> = [
  { value: '発芽', icon: '🌱', hint: 'まだ小さな気づき' },
  { value: '育成中', icon: '🌿', hint: '少し広げたい種' },
  { value: '発酵中', icon: '🫙', hint: '寝かせて深めるもの' },
  { value: '収穫済み', icon: '🍎', hint: '発信に使えたもの' },
]

const emptyForm: DiscoveryForm = {
  title: '',
  memo: '',
  source: '日常',
  tags: '未分類',
  status: '発芽',
  date: new Date().toISOString().slice(0, 10),
}

const sampleDiscoveries: Discovery[] = [
  {
    id: 'sample-1',
    title: '小さな違和感ほど、あとから言葉になる',
    memo: 'すぐ結論にしないで、気になった温度だけ置いておく。',
    source: '日常',
    tags: ['日常', 'note向き'],
    status: '発芽',
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
]

function parseTags(value: string) {
  const tags = value
    .split(/[,\s、]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)

  return Array.from(new Set(tags.length > 0 ? tags : ['未分類']))
}

function App() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>(() => {
    const saved = localStorage.getItem(storageKey)

    if (!saved) {
      return sampleDiscoveries
    }

    try {
      return JSON.parse(saved) as Discovery[]
    } catch {
      return sampleDiscoveries
    }
  })
  const [form, setForm] = useState<DiscoveryForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'すべて' | DiscoveryStatus>(
    'すべて',
  )
  const [tagFilter, setTagFilter] = useState('すべて')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(discoveries))
  }, [discoveries])

  const allTags = useMemo(() => {
    const collected = new Set(tagSeeds)

    discoveries.forEach((discovery) => {
      discovery.tags.forEach((tag) => collected.add(tag))
    })

    return ['すべて', ...Array.from(collected)]
  }, [discoveries])

  const filteredDiscoveries = discoveries.filter((discovery) => {
    const matchesStatus =
      statusFilter === 'すべて' || discovery.status === statusFilter
    const matchesTag = tagFilter === 'すべて' || discovery.tags.includes(tagFilter)

    return matchesStatus && matchesTag
  })

  const statusCounts = useMemo(() => {
    return statuses.reduce(
      (counts, status) => ({
        ...counts,
        [status.value]: discoveries.filter(
          (discovery) => discovery.status === status.value,
        ).length,
      }),
      {} as Record<DiscoveryStatus, number>,
    )
  }, [discoveries])

  function updateForm(name: keyof DiscoveryForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = form.title.trim()
    const trimmedMemo = form.memo.trim()

    if (!trimmedTitle) {
      return
    }

    const discovery: Discovery = {
      id: editingId ?? crypto.randomUUID(),
      title: trimmedTitle,
      memo: trimmedMemo,
      source: form.source,
      tags: parseTags(form.tags),
      status: form.status,
      date: form.date,
      createdAt:
        discoveries.find((item) => item.id === editingId)?.createdAt ??
        new Date().toISOString(),
    }

    setDiscoveries((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? discovery : item))
      }

      return [discovery, ...current]
    })
    resetForm()
  }

  function startEditing(discovery: Discovery) {
    setEditingId(discovery.id)
    setForm({
      title: discovery.title,
      memo: discovery.memo,
      source: discovery.source,
      tags: discovery.tags.join('、'),
      status: discovery.status,
      date: discovery.date,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteDiscovery(id: string) {
    setDiscoveries((current) => current.filter((item) => item.id !== id))

    if (editingId === id) {
      resetForm()
    }
  }

  function changeStatus(id: string, status: DiscoveryStatus) {
    setDiscoveries((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Discovery Labo</p>
          <h1>まだ形にならない発見を、そっと育てる場所</h1>
          <p className="lead">
            気づき、違和感、反応、ひらめきを一時的に置いておくための小さなラボです。
          </p>
        </div>
        <div className="status-garden" aria-label="状態別の件数">
          <button
            className="status-stat status-stat-all"
            onClick={() => setStatusFilter('すべて')}
            type="button"
          >
            <span>🌼</span>
            <strong>{discoveries.length}</strong>
            <small>すべて</small>
          </button>
          {statuses.map((status) => (
            <button
              className="status-stat"
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              type="button"
            >
              <span>{status.icon}</span>
              <strong>{statusCounts[status.value] ?? 0}</strong>
              <small>{status.value}</small>
            </button>
          ))}
        </div>
      </header>

      <section className="workspace">
        <form className="entry-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editingId ? '編集中' : '新規登録'}</p>
              <h2>{editingId ? '種を少し整える' : '発見の種を置く'}</h2>
            </div>
            {editingId && (
              <button className="ghost-button" type="button" onClick={resetForm}>
                解除
              </button>
            )}
          </div>

          <label>
            <span>タイトル</span>
            <input
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              placeholder="例：なぜか引っかかった一言"
              required
            />
          </label>

          <label>
            <span>一言メモ</span>
            <textarea
              value={form.memo}
              onChange={(event) => updateForm('memo', event.target.value)}
              placeholder="まだまとまっていない温度のままでOK"
              rows={4}
            />
          </label>

          <div className="form-grid">
            <label>
              <span>発生源</span>
              <select
                value={form.source}
                onChange={(event) => updateForm('source', event.target.value)}
              >
                {sources.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </label>

            <label>
              <span>日付</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateForm('date', event.target.value)}
              />
            </label>
          </div>

          <fieldset>
            <legend>状態</legend>
            <div className="status-options">
              {statuses.map((status) => (
                <label className="status-option" key={status.value}>
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={form.status === status.value}
                    onChange={(event) =>
                      updateForm('status', event.target.value)
                    }
                  />
                  <span>{status.icon}</span>
                  <strong>{status.value}</strong>
                  <small>{status.hint}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            <span>タグ</span>
            <input
              value={form.tags}
              onChange={(event) => updateForm('tags', event.target.value)}
              placeholder="回復期、AI、Threads向き"
              list="tag-seeds"
            />
            <datalist id="tag-seeds">
              {tagSeeds.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </label>

          <button className="primary-button" type="submit">
            {editingId ? '更新する' : '登録する'}
          </button>
        </form>

        <section className="list-panel" aria-label="発見一覧">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">発見一覧</p>
              <h2>あとで育てる種たち</h2>
            </div>
            <span className="total-count">{filteredDiscoveries.length}件</span>
          </div>

          <div className="filters">
            <label>
              <span>状態別フィルター</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as 'すべて' | DiscoveryStatus,
                  )
                }
              >
                <option>すべて</option>
                {statuses.map((status) => (
                  <option key={status.value}>{status.value}</option>
                ))}
              </select>
            </label>

            <label>
              <span>タグ別フィルター</span>
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
              >
                {allTags.map((tag) => (
                  <option key={tag}>{tag}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="discovery-list">
            {filteredDiscoveries.length === 0 ? (
              <div className="empty-state">
                <strong>今の条件に合う発見はありません。</strong>
                <p>フィルターをゆるめるか、新しい種を置いてみてください。</p>
              </div>
            ) : (
              filteredDiscoveries.map((discovery) => {
                const status = statuses.find(
                  (item) => item.value === discovery.status,
                )

                return (
                  <article className="discovery-card" key={discovery.id}>
                    <div className="card-main">
                      <div className="card-topline">
                        <span className="status-pill">
                          {status?.icon} {discovery.status}
                        </span>
                        <time>{discovery.date}</time>
                      </div>
                      <h3>{discovery.title}</h3>
                      {discovery.memo && <p>{discovery.memo}</p>}
                      <div className="meta-row">
                        <span>{discovery.source}</span>
                        {discovery.tags.map((tag) => (
                          <button
                            className="tag-chip"
                            key={tag}
                            type="button"
                            onClick={() => setTagFilter(tag)}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="card-actions">
                      <select
                        aria-label={`${discovery.title}の状態を変更`}
                        value={discovery.status}
                        onChange={(event) =>
                          changeStatus(
                            discovery.id,
                            event.target.value as DiscoveryStatus,
                          )
                        }
                      >
                        {statuses.map((item) => (
                          <option key={item.value}>{item.value}</option>
                        ))}
                      </select>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => startEditing(discovery)}
                      >
                        編集
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => deleteDiscovery(discovery.id)}
                      >
                        削除
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
