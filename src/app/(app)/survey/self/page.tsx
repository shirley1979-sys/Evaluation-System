'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Topbar from '@/components/layout/Topbar'
import { useQuestionsStore } from '@/store/questions'
import { useSelfEvalStore, calcSelfProgress, type SelfProject, type SelfEvalEntry, type EvidenceLink } from '@/store/selfEval'
import { useEvalCycleStore, isSelfEvalClosed } from '@/store/cycle'

function newProject(): SelfProject {
  return { id: crypto.randomUUID(), name: '', role: '', deliverable: '', evidenceLinks: [] }
}

function emptyEntry(userId: string): SelfEvalEntry {
  return {
    userId, projects: [newProject()], strengths: '', improvements: '', requests: '',
    scores: {}, textAnswers: {}, status: 'DRAFT', updatedAt: null, submittedAt: null,
  }
}

export default function SelfSurveyPage() {
  const user      = useAuthStore((s) => s.user)
  const questions = useQuestionsStore((s) =>
    s.questions.filter((q) => q.isActive && (q.type === 'COMMON' || q.type === 'SELF' || q.type === 'TEXT'))
  )
  const scaleQuestions = questions.filter((q) => q.type !== 'TEXT')
  const textQuestions  = questions.filter((q) => q.type === 'TEXT')

  const { getEntry, saveEntry, submitEntry } = useSelfEvalStore()
  const selfEvalCloseAt = useEvalCycleStore((s) => s.selfEvalCloseAt)

  const [form, setForm] = useState<SelfEvalEntry>(() => {
    if (!user) return emptyEntry('')
    return getEntry(user.id) ?? emptyEntry(user.id)
  })
  const [saveMsg, setSaveMsg] = useState('')

  if (!user) return null

  const isSubmitted = form.status === 'SUBMITTED'
  const isClosed    = isSelfEvalClosed(selfEvalCloseAt)
  const isLocked    = isSubmitted || isClosed
  const progress    = calcSelfProgress(form, scaleQuestions.length)

  // ── 업데이트 헬퍼
  function update(partial: Partial<SelfEvalEntry>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function updateProject(id: string, field: keyof SelfProject, value: string) {
    update({ projects: form.projects.map((p) => p.id === id ? { ...p, [field]: value } : p) })
  }

  function addProject() {
    update({ projects: [...form.projects, newProject()] })
  }

  function removeProject(id: string) {
    if (form.projects.length <= 1) return
    update({ projects: form.projects.filter((p) => p.id !== id) })
  }

  function addLink(projectId: string, link: Omit<EvidenceLink, 'id'>) {
    update({
      projects: form.projects.map((p) =>
        p.id === projectId ? { ...p, evidenceLinks: [...p.evidenceLinks, { id: crypto.randomUUID(), ...link }] } : p
      ),
    })
  }

  function removeLink(projectId: string, linkId: string) {
    update({
      projects: form.projects.map((p) =>
        p.id === projectId ? { ...p, evidenceLinks: p.evidenceLinks.filter((l) => l.id !== linkId) } : p
      ),
    })
  }

  function setScore(qId: string, val: number) {
    update({ scores: { ...form.scores, [qId]: val } })
  }

  function setTextAnswer(qId: string, val: string) {
    update({ textAnswers: { ...form.textAnswers, [qId]: val } })
  }

  function handleSave() {
    saveEntry(form)
    setSaveMsg('임시 저장되었습니다')
    setTimeout(() => setSaveMsg(''), 2500)
  }

  function handleSubmit() {
    if (isClosed) { alert('셀프평가 기간이 마감되어 제출할 수 없습니다.'); return }
    if (progress < 50) { alert('최소 50% 이상 작성 후 제출할 수 있습니다.'); return }
    if (!window.confirm('최종 제출하시겠습니까? 제출 후에는 수정이 불가합니다.')) return
    const final = { ...form, status: 'SUBMITTED' as const }
    saveEntry(final)
    submitEntry(user!.id)
    setForm((prev) => ({ ...prev, status: 'SUBMITTED' }))
  }

  return (
    <>
      <Topbar title="셀프 평가" subtitle={isSubmitted ? '제출 완료' : isClosed ? '마감됨' : `작성 중 ${progress}%`} />
      <div className="flex-1 overflow-y-auto p-7">
        <div className="max-w-2xl space-y-5">

          {/* 진행률 바 */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#192628]">작성 진행률</p>
              <span className="text-sm font-bold text-mint-600">{progress}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-mint-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: '프로젝트', ok: form.projects.length > 0 && form.projects.every((p) => p.name && p.role) },
                { label: '강점',    ok: form.strengths.length >= 10 },
                { label: '개선점',  ok: form.improvements.length >= 10 },
                { label: '척도',    ok: Object.keys(form.scores).length > 0 },
              ].map(({ label, ok }) => (
                <div key={label} className={`flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-green-600' : 'text-[#8896A8]'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {ok && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* 제출 완료 배너 */}
          {isSubmitted && (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              셀프 평가가 최종 제출되었습니다. 수정이 불가합니다.
            </div>
          )}

          {/* 기간 마감 배너 (미제출 상태로 마감된 경우) */}
          {!isSubmitted && isClosed && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              셀프평가 기간이 마감되어 더 이상 작성·수정할 수 없습니다.
            </div>
          )}

          {/* ── 섹션 1: 프로젝트별 자기평가 ── */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#192628]">프로젝트별 자기평가</h3>
                <p className="text-xs text-[#8896A8] mt-0.5">참여한 프로젝트별로 작성하세요 (최소 1개)</p>
              </div>
              {!isLocked && (
                <button
                  onClick={addProject}
                  className="text-xs font-semibold text-mint-600 border border-mint-200 bg-mint-50 px-3 py-1.5 rounded-lg hover:bg-mint-100 transition-colors"
                >
                  + 프로젝트 추가
                </button>
              )}
            </div>
            <div className="space-y-4">
              {form.projects.map((proj, idx) => (
                <ProjectCard
                  key={proj.id}
                  proj={proj}
                  index={idx}
                  disabled={isLocked}
                  canRemove={form.projects.length > 1}
                  onChange={(field, val) => updateProject(proj.id, field, val)}
                  onRemove={() => removeProject(proj.id)}
                  onAddLink={(link) => addLink(proj.id, link)}
                  onRemoveLink={(linkId) => removeLink(proj.id, linkId)}
                />
              ))}
            </div>
          </div>

          {/* ── 섹션 2: 전반적 자기평가 ── */}
          <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-[#192628] mb-0.5">전반적 자기평가</h3>
              <p className="text-xs text-[#8896A8]">올해 전체적인 업무 관점에서 작성하세요</p>
            </div>
            {[
              { field: 'strengths'   as const, label: '잘한 점 / 강점', placeholder: '올해 가장 잘 수행한 업무나 발휘한 강점을 구체적으로 서술하세요 (10자 이상)', required: true },
              { field: 'improvements' as const, label: '개선할 점', placeholder: '더 잘하기 위해 개선이 필요한 부분을 솔직하게 서술하세요 (10자 이상)', required: true },
              { field: 'requests'     as const, label: '회사에 요청할 것', placeholder: '업무 수행을 위해 회사 또는 조직에 필요한 지원이나 개선사항 (선택)', required: false },
            ].map(({ field, label, placeholder, required }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-[#192628] mb-1.5">{label}</label>
                <textarea
                  value={form[field]}
                  onChange={(e) => update({ [field]: e.target.value })}
                  disabled={isLocked}
                  rows={3}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 disabled:bg-gray-50"
                />
                {required && form[field].length > 0 && form[field].length < 10 && (
                  <p className="text-xs text-amber-500 mt-1">최소 10자 이상 입력하세요 ({form[field].length}/10)</p>
                )}
              </div>
            ))}
          </div>

          {/* ── 섹션 3: 척도 평가 ── */}
          {scaleQuestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-semibold text-[#192628] mb-1">역량 척도 평가</h3>
              <p className="text-xs text-[#8896A8] mb-4">1(매우 부족) ~ 5(매우 우수)</p>
              <div className="space-y-5">
                {scaleQuestions.map((q) => (
                  <div key={q.id}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-[#192628] flex-1 pr-4">{q.text}</p>
                      {form.scores[q.id] && (
                        <span className="text-xs font-bold text-mint-600 flex-shrink-0">{form.scores[q.id]}점</span>
                      )}
                    </div>
                    {q.description && <p className="text-xs text-[#8896A8] mb-2 leading-relaxed">{q.description}</p>}
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => !isLocked && setScore(q.id, v)}
                          disabled={isLocked}
                          className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-all ${
                            form.scores[q.id] === v
                              ? 'bg-mint-500 border-mint-500 text-white'
                              : 'border-[#DDE3EE] text-[#4A5568] hover:border-mint-300 hover:bg-mint-50 disabled:cursor-default'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {(q.anchor1 || q.anchor5) && (
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-[#8896A8]">{q.anchor1}</span>
                        <span className="text-[10px] text-[#8896A8]">{q.anchor5}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 섹션 4: 주관식 질문 (TEXT 타입) ── */}
          {textQuestions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-[#192628] mb-0.5">주관식 응답</h3>
                <p className="text-xs text-[#8896A8]">아래 질문에 자유롭게 답변하세요</p>
              </div>
              {textQuestions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-[#192628] mb-1.5">{q.text}</label>
                  {q.description && <p className="text-xs text-[#8896A8] mb-2">{q.description}</p>}
                  <textarea
                    value={form.textAnswers[q.id] ?? ''}
                    onChange={(e) => setTextAnswer(q.id, e.target.value)}
                    disabled={isLocked}
                    rows={3}
                    placeholder="자유롭게 작성하세요"
                    className="w-full px-4 py-3 border border-[#DDE3EE] rounded-xl text-sm resize-none focus:outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100 disabled:bg-gray-50"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 버튼 영역 */}
          {!isLocked && (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 h-11 border border-mint-300 text-mint-600 font-semibold text-sm rounded-xl hover:bg-mint-50 transition-colors"
              >
                임시 저장
              </button>
              <button
                onClick={handleSubmit}
                disabled={progress < 50}
                className="flex-1 h-11 bg-mint-500 text-white font-semibold text-sm rounded-xl hover:bg-mint-600 disabled:opacity-40 transition-colors"
              >
                최종 제출 ({progress}%)
              </button>
            </div>
          )}
          {saveMsg && (
            <p className="text-center text-xs text-green-600 font-medium">{saveMsg}</p>
          )}
        </div>
      </div>
    </>
  )
}

// ── 프로젝트 카드 컴포넌트 ────────────────────────
function detectLinkSource(url: string): { name: string; color: string } {
  const u = url.toLowerCase()
  if (u.includes('atlassian.net') || u.includes('jira')) return { name: 'Jira', color: 'bg-blue-50 text-blue-600 border-blue-200' }
  if (u.includes('notion.so') || u.includes('notion.site')) return { name: 'Notion', color: 'bg-gray-100 text-gray-600 border-gray-200' }
  if (u.includes('zoom.us') || u.includes('youtube.com') || u.includes('youtu.be') || u.includes('festa.io') || u.includes('onoffmix.com')) return { name: '컨퍼런스', color: 'bg-slate-100 text-slate-600 border-slate-200' }
  if (u.includes('docs.google.com') || u.includes('drive.google.com')) return { name: 'Google', color: 'bg-amber-50 text-amber-600 border-amber-200' }
  if (u.includes('figma.com')) return { name: 'Figma', color: 'bg-purple-50 text-purple-600 border-purple-200' }
  return { name: '링크', color: 'bg-mint-50 text-mint-700 border-mint-200' }
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function ProjectCard({
  proj, index, disabled, canRemove, onChange, onRemove, onAddLink, onRemoveLink,
}: {
  proj: SelfProject
  index: number
  disabled: boolean
  canRemove: boolean
  onChange: (field: keyof SelfProject, val: string) => void
  onRemove: () => void
  onAddLink: (link: { label: string; url: string }) => void
  onRemoveLink: (linkId: string) => void
}) {
  const [open, setOpen] = useState(index === 0)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const filled = proj.name && proj.role

  function handleAddLink() {
    if (!linkUrl.trim()) return
    if (!isValidUrl(linkUrl.trim())) {
      setLinkError('http:// 또는 https://로 시작하는 올바른 URL을 입력하세요')
      return
    }
    onAddLink({ label: proj.name.trim() || `프로젝트 ${index + 1}`, url: linkUrl.trim() })
    setLinkUrl('')
    setLinkError('')
  }

  return (
    <div className="border border-[#DDE3EE] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFD] hover:bg-[#F0F4FA] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${filled ? 'bg-green-500' : 'bg-gray-200'}`}>
            {filled && <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>}
          </span>
          <span className="text-sm font-semibold text-[#192628]">
            {proj.name || `프로젝트 ${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && !disabled && (
            <span
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="text-xs text-red-400 hover:text-red-600 px-1"
            >
              삭제
            </span>
          )}
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8896A8" strokeWidth={2}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {[
            { field: 'name'         as const, label: '프로젝트명 *',      placeholder: '프로젝트 또는 업무명' },
            { field: 'role'         as const, label: '담당 역할 *',       placeholder: '이 프로젝트에서 본인의 역할' },
            { field: 'deliverable'  as const, label: '주요 산출물',        placeholder: '구체적인 산출물 또는 결과물' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-[#4A5568] mb-1">{label}</label>
              <textarea
                value={proj[field]}
                onChange={(e) => onChange(field, e.target.value)}
                disabled={disabled}
                rows={1}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-[#DDE3EE] rounded-lg text-sm resize-none focus:outline-none focus:border-mint-400 disabled:bg-gray-50"
              />
            </div>
          ))}

          {/* 업무 증빙 링크 */}
          <div>
            <label className="block text-xs font-medium text-[#4A5568] mb-1">업무 증빙 링크 (Jira, Notion, 컨퍼런스 등)</label>

            {proj.evidenceLinks.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {proj.evidenceLinks.map((link) => {
                  const source = detectLinkSource(link.url)
                  return (
                    <div key={link.id} className="flex items-center gap-2 px-3 py-2 border border-[#DDE3EE] rounded-lg bg-[#F8FAFD]">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${source.color}`}>
                        {source.name}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-mint-600 hover:underline truncate flex-1"
                      >
                        {proj.name.trim() || `프로젝트 ${index + 1}`}
                      </a>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => onRemoveLink(link.id)}
                          className="text-xs text-[#8896A8] hover:text-red-500 flex-shrink-0"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {!disabled && (
              <div className="flex gap-2">
                <input
                  value={linkUrl}
                  onChange={(e) => { setLinkUrl(e.target.value); setLinkError('') }}
                  placeholder="https://..."
                  className="flex-1 px-2.5 py-1.5 border border-[#DDE3EE] rounded-lg text-xs focus:outline-none focus:border-mint-400"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-xs font-semibold text-mint-600 border border-mint-200 bg-mint-50 px-3 py-1.5 rounded-lg hover:bg-mint-100 transition-colors flex-shrink-0"
                >
                  추가
                </button>
              </div>
            )}
            {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
