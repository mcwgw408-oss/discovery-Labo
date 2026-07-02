import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { backupFilename, createBackup, downloadJson, validateBackup } from './backup'

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
  updatedAt?: string
  statusChangedAt?: string
}

type DiscoveryForm = Omit<Discovery, 'id' | 'tags' | 'createdAt' | 'updatedAt' | 'statusChangedAt'>

const storageKey = 'discovery-labo-discoveries'
const entrySourcesStorageKey = 'discovery-labo-entry-sources-v1'

const defaultSources = [
  '日常',
  'Substack',
  'note',
  'X',
  'Threads',
  'YouTube',
  'Voicy',
  'Podcast',
  'セミナー',
  '書籍',
  'ドラマ',
  '映画',
  'ゲーム',
  '訪看',
  'AI',
  'その他',
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

const globalNavLinks = [
  { label: '🏠 ダッシュボード', href: 'https://mcwgw408-oss.github.io/operation-dashboard/' },
  { label: 'Substack-Labo', href: 'https://mcwgw408-oss.github.io/substack-labo/' },
  { label: 'Discovery-Labo', href: 'https://mcwgw408-oss.github.io/discovery-Labo/', current: true },
  { label: '交流ログ', href: 'https://mcwgw408-oss.github.io/action-Labo/' },
  { label: '発信観察', href: 'https://mcwgw408-oss.github.io/observation-Labo/' },
  { label: 'ストック管理', href: 'https://mcwgw408-oss.github.io/Stock-Labo/' },
]

function GlobalNav() {
  return (
    <nav className="global-nav" aria-label="アプリ切り替え">
      {globalNavLinks.map((link) =>
        link.current ? (
          <span className="global-nav-link current" aria-current="page" key={link.label}>
            {link.label}
          </span>
        ) : (
          <a className="global-nav-link" href={link.href} key={link.label}>
            {link.label}
          </a>
        ),
      )}
    </nav>
  )
}

function loadSources(): string[] {
  const saved = localStorage.getItem(entrySourcesStorageKey)

  if (!saved) {
    return defaultSources
  }

  try {
    const parsed = JSON.parse(saved) as string[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultSources
  } catch {
    return defaultSources
  }
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
  const [sources, setSources] = useState<string[]>(loadSources)
  const [form, setForm] = useState<DiscoveryForm>(emptyForm)
  const [activeCardEditId, setActiveCardEditId] = useState<string | null>(null)
  const [cardEditForm, setCardEditForm] = useState<DiscoveryForm | null>(null)
  const [statusFilter, setStatusFilter] = useState<'すべて' | DiscoveryStatus>(
    'すべて',
  )
  const [sourceFilter, setSourceFilter] = useState('すべて')
  const [isEditingSources, setIsEditingSources] = useState(false)
  const [newSource, setNewSource] = useState('')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(discoveries))
  }, [discoveries])

  useEffect(() => {
    localStorage.setItem(entrySourcesStorageKey, JSON.stringify(sources))
  }, [sources])

  const listSources = useMemo(() => {
    const collected = new Set<string>()

    discoveries.forEach((discovery) => {
      if (discovery.source) {
        collected.add(discovery.source)
      }
    })

    return Array.from(collected)
  }, [discoveries])

  const formSources = useMemo(() => {
    if (form.source && !sources.includes(form.source)) {
      return [form.source, ...sources]
    }
    return sources
  }, [sources, form.source])

  const cardEditSources = useMemo(() => {
    if (cardEditForm?.source && !listSources.includes(cardEditForm.source)) {
      return [cardEditForm.source, ...listSources]
    }
    return listSources
  }, [listSources, cardEditForm])

  const filteredDiscoveries = discoveries.filter((discovery) => {
    const matchesStatus =
      statusFilter === 'すべて' || discovery.status === statusFilter
    const matchesSource =
      sourceFilter === 'すべて' || discovery.source === sourceFilter

    return matchesStatus && matchesSource
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
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) })
  }

  function updateCardEditForm(name: keyof DiscoveryForm, value: string) {
    setCardEditForm((current) => (current ? { ...current, [name]: value } : current))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = form.title.trim()
    const trimmedMemo = form.memo.trim()

    if (!trimmedTitle) {
      return
    }

    const discovery: Discovery = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      memo: trimmedMemo,
      source: form.source,
      tags: [],
      status: form.status,
      date: form.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusChangedAt: new Date().toISOString(),
    }

    setDiscoveries((current) => [discovery, ...current])
    resetForm()
  }

  function startCardEdit(discovery: Discovery) {
    setActiveCardEditId(discovery.id)
    setCardEditForm({
      title: discovery.title,
      memo: discovery.memo,
      source: discovery.source,
      status: discovery.status,
      date: discovery.date,
    })
  }

  function cancelCardEdit() {
    setActiveCardEditId(null)
    setCardEditForm(null)
  }

  function saveCardEdit(id: string) {
    if (!cardEditForm) {
      return
    }

    const trimmedTitle = cardEditForm.title.trim()
    const trimmedMemo = cardEditForm.memo.trim()

    if (!trimmedTitle) {
      return
    }

    setDiscoveries((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              title: trimmedTitle,
              memo: trimmedMemo,
              source: cardEditForm.source,
              status: cardEditForm.status,
              date: cardEditForm.date,
              updatedAt: new Date().toISOString(),
              ...(cardEditForm.status !== item.status
                ? { statusChangedAt: new Date().toISOString() }
                : {}),
            }
          : item,
      ),
    )
    cancelCardEdit()
  }

  function deleteDiscovery(id: string) {
    setDiscoveries((current) => current.filter((item) => item.id !== id))

    if (activeCardEditId === id) {
      cancelCardEdit()
    }
  }

  function changeStatus(id: string, status: DiscoveryStatus) {
    setDiscoveries((current) =>
      current.map((item) =>
        item.id === id && item.status !== status
          ? {
              ...item,
              status,
              updatedAt: new Date().toISOString(),
              statusChangedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }

  function addSource() {
    const trimmed = newSource.trim()

    if (!trimmed || sources.includes(trimmed)) {
      setNewSource('')
      return
    }

    setSources((current) => [...current, trimmed])
    setNewSource('')
  }

  function renameSource(index: number, value: string) {
    const before = sources[index]

    setSources((current) =>
      current.map((source, i) => (i === index ? value : source)),
    )

    const trimmed = value.trim()

    if (!trimmed || trimmed === before) {
      return
    }

    if (form.source === before) {
      setForm((current) => ({ ...current, source: trimmed }))
    }
  }

  function deleteSource(index: number) {
    const target = sources[index]

    if (!confirm(`発生源「${target}」を選択肢から削除しますか？\n（過去の記録はそのまま残ります）`)) {
      return
    }

    setSources((current) => current.filter((_, i) => i !== index))

    if (form.source === target) {
      setForm((current) => ({ ...current, source: sources.find((_, i) => i !== index) ?? '' }))
    }
  }

  const importInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    downloadJson(createBackup({ discoveries, sources }), backupFilename())
  }

  async function handleImportFile(file: File) {
    let parsed: unknown

    try {
      parsed = JSON.parse(await file.text())
    } catch {
      alert('JSONファイルとして読み取れませんでした。')
      return
    }

    const result = validateBackup(parsed)

    if (!result.ok) {
      alert(result.error)
      return
    }

    const incoming = result.backup.data.discoveries

    if (!Array.isArray(incoming)) {
      alert('ファイルにデータが入っていません。')
      return
    }

    // 取り込み前に、今のデータを自動でバックアップ
    downloadJson(createBackup({ discoveries, sources }), backupFilename(true))

    const nextDiscoveries = incoming.map((item) => {
      const candidate = (typeof item === 'object' && item !== null ? item : {}) as Partial<Discovery>
      return {
        ...candidate,
        id: candidate.id || crypto.randomUUID(),
        tags: Array.isArray(candidate.tags) ? candidate.tags : [],
      } as Discovery
    })

    const incomingSources = result.backup.data.sources
    const nextSources =
      Array.isArray(incomingSources) && incomingSources.length > 0
        ? incomingSources.filter((source): source is string => typeof source === 'string')
        : sources

    const accepted = confirm(
      `今のデータ（種${discoveries.length}件・発生源${sources.length}個）を、` +
        `ファイルの内容（種${nextDiscoveries.length}件・発生源${nextSources.length}個）で置き換えます。\n` +
        '直前のデータは自動バックアップとしてダウンロードされています。\nよろしいですか？',
    )

    if (!accepted) return

    setDiscoveries(nextDiscoveries)
    setSources(nextSources)
    cancelCardEdit()
    resetForm()
    alert(`取り込みが完了しました（種${nextDiscoveries.length}件）。`)
  }

  return (
    <main className="app-shell">
      <GlobalNav />
      <div className="backup-actions" aria-label="バックアップ">
        <button className="backup-button" type="button" onClick={handleExport}>
          書き出し
        </button>
        <button className="backup-button" type="button" onClick={() => importInputRef.current?.click()}>
          取り込み
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void handleImportFile(file)
          }}
        />
      </div>
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
              <p className="eyebrow">新規登録</p>
              <h2>発見の種を置く</h2>
            </div>
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
                {formSources.map((source) => (
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

          <div className="source-manager">
            <button
              className="ghost-button source-toggle"
              type="button"
              onClick={() => setIsEditingSources((current) => !current)}
            >
              {isEditingSources ? '発生源の編集を閉じる' : '発生源を追加・編集する'}
            </button>

            {isEditingSources && (
              <div className="source-editor">
                <p className="source-note">
                  ここで変わるのは左の新規登録フォームの選択肢だけです。右の記録は変わりません。
                </p>
                <ul className="source-list">
                  {sources.map((source, index) => (
                    <li key={index}>
                      <input
                        value={source}
                        onChange={(event) => renameSource(index, event.target.value)}
                        aria-label={`発生源${index + 1}`}
                      />
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => deleteSource(index)}
                      >
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="source-add-row">
                  <input
                    value={newSource}
                    onChange={(event) => setNewSource(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addSource()
                      }
                    }}
                    placeholder="新しい発生源（例：ラジオ）"
                    aria-label="新しい発生源"
                  />
                  <button className="ghost-button" type="button" onClick={addSource}>
                    追加
                  </button>
                </div>
              </div>
            )}
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

          <button className="primary-button" type="submit">
            登録する
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
              <span>発生源フィルター</span>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option>すべて</option>
                {listSources.map((source) => (
                  <option key={source}>{source}</option>
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
                const isEditingCard = activeCardEditId === discovery.id && cardEditForm

                return (
                  <article className="discovery-card" key={discovery.id}>
                    {isEditingCard ? (
                      <div className="card-edit-form">
                        <label>
                          <span>タイトル</span>
                          <input
                            value={cardEditForm.title}
                            onChange={(event) =>
                              updateCardEditForm('title', event.target.value)
                            }
                            required
                          />
                        </label>
                        <label>
                          <span>一言メモ</span>
                          <textarea
                            value={cardEditForm.memo}
                            onChange={(event) =>
                              updateCardEditForm('memo', event.target.value)
                            }
                            rows={3}
                          />
                        </label>
                        <div className="form-grid">
                          <label>
                            <span>発生源</span>
                            <select
                              value={cardEditForm.source}
                              onChange={(event) =>
                                updateCardEditForm('source', event.target.value)
                              }
                            >
                              {cardEditSources.map((source) => (
                                <option key={source}>{source}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>日付</span>
                            <input
                              type="date"
                              value={cardEditForm.date}
                              onChange={(event) =>
                                updateCardEditForm('date', event.target.value)
                              }
                            />
                          </label>
                        </div>
                        <label>
                          <span>状態</span>
                          <select
                            value={cardEditForm.status}
                            onChange={(event) =>
                              updateCardEditForm(
                                'status',
                                event.target.value as DiscoveryStatus,
                              )
                            }
                          >
                            {statuses.map((item) => (
                              <option key={item.value}>{item.value}</option>
                            ))}
                          </select>
                        </label>
                        <div className="card-edit-actions">
                          <button
                            className="primary-button"
                            type="button"
                            onClick={() => saveCardEdit(discovery.id)}
                          >
                            更新する
                          </button>
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={cancelCardEdit}
                          >
                            解除
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                        <button
                          className="source-chip"
                          type="button"
                          onClick={() => setSourceFilter(discovery.source)}
                        >
                          📍 {discovery.source}
                        </button>
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
                        onClick={() => startCardEdit(discovery)}
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
                      </>
                    )}
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
