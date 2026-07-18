  // ── CONFIG — fill these in ──────────────────────────────
  const SUPABASE_URL = 'https://wrsqsrouliceqewkxvpw.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyc3Fzcm91bGljZXFld2t4dnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMDg0NTEsImV4cCI6MjA5NjY4NDQ1MX0.rCLfPy5wzwY76lttpoFPimYHwzh4igbMsAJr9WnMIoY'
  const PIN_HASH = 'd59a23c3feff6c21bbd651244d14c5639d3aa704751d4ce7aaa481712a18456d' // generate below, then paste here
  // ────────────────────────────────────────────────────────

  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, storageKey: 'hd_session' }
  })

  const $ = id => document.getElementById(id)

  // ── TOAST ────────────────────────────────────────────────
  // single shared timer — a second toast within 2.5s would otherwise be
  // hidden early by the first toast's still-pending timeout
  let toastTimer = null
  function showToast(msg, isError = false) {
    const t = $('toast')
    t.textContent = msg
    t.className = 'toast' + (isError ? ' error' : '')
    t.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500)
  }

  // ── AUTH ─────────────────────────────────────────────────
  async function initAuth() {
    // wait for supabase to restore session from storage
    await new Promise(resolve => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') {
          subscription.unsubscribe()
          resolve(session)
        }
      })
    })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) await supabase.auth.signInAnonymously()
    $('loading').classList.add('hidden')
    $('pin-screen').classList.remove('hidden')
  }

  // ── PIN ──────────────────────────────────────────────────
  async function hashPin(pin) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
  }

  let pinEntry = ''

  function updateDots() {
    for (let i = 0; i < 4; i++) $(`d${i}`).classList.toggle('filled', i < pinEntry.length)
  }

  async function handlePinInput(n) {
    if (pinEntry.length >= 4) return
    pinEntry += n
    updateDots()
    $('pin-error').textContent = ''
    if (pinEntry.length === 4) {
      const h = await hashPin(pinEntry)
      if (h === PIN_HASH) {
        $('pin-screen').classList.add('hidden')
        $('app').classList.add('visible')
        renderCalendar()
        loadTodayTab()
      } else {
        $('pin-error').textContent = 'Incorrect PIN'
        pinEntry = ''
        updateDots()
      }
    }
  }

  document.querySelectorAll('.pin-key[data-n]').forEach(btn => {
    btn.addEventListener('click', () => handlePinInput(btn.dataset.n))
  })

  $('pin-del').addEventListener('click', () => {
    if (pinEntry.length > 0) { pinEntry = pinEntry.slice(0, -1); updateDots(); $('pin-error').textContent = '' }
  })

  // ── TABS ─────────────────────────────────────────────────
  const tabTitles = { calendar:'Calendar', today:'Today', finance:'Finance', health:'Health', analytics:'Analytics', settings:'Settings' }
  let activeTab = 'calendar'

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
    $(`tab-${name}`).classList.add('active')
    const nb = document.querySelector(`.nav-item[data-tab="${name}"]`)
    if (nb) nb.classList.add('active')
    $('top-title').textContent = tabTitles[name]
    activeTab = name
    if (name === 'calendar') {
      $('day-view').classList.remove('active')
      $('calendar-view').style.display = ''
      // reload dots if data changed since last render
      if (calNeedsRefresh) { calNeedsRefresh = false; renderCalendar() }
    }
    if (name === 'today' && todayNeedsRefresh) {
      todayNeedsRefresh = false; loadTodayTab()
    }
    if (name === 'health' && hlthLoaded && hlthNeedsRefresh) {
      hlthNeedsRefresh = false; loadHlthData()
    }
    if (name === 'analytics' && anlLoaded && anlNeedsRefresh) {
      anlNeedsRefresh = false; loadAnalytics()
    }
  }

  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)))
  $('settings-btn').addEventListener('click', () => switchTab('settings'))

  // ── PULL-TO-REFRESH ──────────────────────────────────────
  ;(function() {
    const content = $('content'), bar = $('ptr-bar'), msg = $('ptr-msg')
    const THRESHOLD = 65
    let startY = 0, pulling = false

    function refreshCurrentTab() {
      switch (activeTab) {
        case 'calendar':   renderCalendar(); break
        case 'today':      loadTodayTab(); break
        case 'finance':    loadFinanceData(); break
        case 'health':     loadHlthData(); break
        case 'analytics':  loadAnalytics(); break
        case 'settings':   loadSettCategories(); loadSettCards(); loadSettSupplements(); break
      }
    }

    content.addEventListener('touchstart', e => {
      if (content.scrollTop === 0) { startY = e.touches[0].clientY; pulling = true }
    }, { passive: true })

    content.addEventListener('touchmove', e => {
      if (!pulling) return
      const delta = e.touches[0].clientY - startY
      if (delta <= 0) { pulling = false; bar.style.height = '0'; bar.className = ''; return }
      const h = Math.min(delta * 0.5, THRESHOLD * 0.8)
      bar.style.height = h + 'px'
      bar.className = delta >= THRESHOLD ? 'ptr-ready' : ''
      msg.textContent = delta >= THRESHOLD ? '↑ Release to refresh' : '↓ Pull to refresh'
    }, { passive: true })

    content.addEventListener('touchend', e => {
      if (!pulling) return
      pulling = false
      const delta = e.changedTouches[0].clientY - startY
      if (delta >= THRESHOLD) {
        bar.style.height = '42px'
        bar.className = 'ptr-loading'
        msg.textContent = 'Refreshing…'
        refreshCurrentTab()
        setTimeout(() => { bar.style.height = '0'; bar.className = ''; msg.textContent = '↓ Pull to refresh' }, 800)
      } else {
        bar.style.height = '0'; bar.className = ''
      }
    }, { passive: true })
  })()

  // ── DATE UTILS ───────────────────────────────────────────
  function toDateStr(y, m, d) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }

  function todayStr() {
    const n = new Date()
    return toDateStr(n.getFullYear(), n.getMonth(), n.getDate())
  }

  // ── TOGGLE HELPER ────────────────────────────────────────
  function setToggle(id, val) {
    const el = $(id)
    if (!el) return
    el.classList.toggle('on', !!val)
  }

  function getToggle(id) {
    const el = $(id)
    return el ? el.classList.contains('on') : false
  }

  function bindToggle(id) {
    const el = $(id)
    if (!el) return
    el.addEventListener('click', () => el.classList.toggle('on'))
  }

  // bind all toggles
  const prayerKeys = ['fajr','dhuhr','asr','maghrib','isha']
  const mealKeys = ['breakfast','lunch','dinner']

  ;[...prayerKeys, ...mealKeys, 'reading'].forEach(k => {
    bindToggle(`tog-${k}`)
    bindToggle(`ttog-${k}`)
  })

  // ── SUPPLEMENTS ──────────────────────────────────────────
  // supplements state: { id (from DB or temp), name, active (bool for this day) }
  let suppState = []   // for calendar day view
  let tsuppState = []  // for today tab

  function renderSuppRows(cardId, state, prefix, saveCtx) {
    const card = $(cardId)
    const addBtn = $(prefix === '' ? 'add-supp-btn' : 'tadd-supp-btn')
    // remove existing supp rows
    card.querySelectorAll('.supp-row').forEach(r => r.remove())
    // insert before add button
    state.forEach((s, i) => {
      const row = document.createElement('div')
      row.className = 'log-row supp-row'
      row.innerHTML = `<span class="log-row-label">${escHtml(s.name)}</span><button class="toggle${s.taken ? ' on' : ''}" data-supp-idx="${i}"><div class="toggle-thumb"></div></button>`
      row.querySelector('button').addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('on')
        state[i].taken = e.currentTarget.classList.contains('on')
        // auto-save on supplement toggle
        if (saveCtx) scheduleAutoSave(saveCtx.dateStr, saveCtx.prefix, saveCtx.stateRef)
      })
      card.insertBefore(row, addBtn)
    })
  }

  function bindAddSupp(addBtnId, inputRowId, inputId, confirmId, cardId, stateRef, renderPrefix, getSaveCtx) {
    const addBtn = $(addBtnId)
    const inputRow = $(inputRowId)
    const input = $(inputId)
    const confirmBtn = $(confirmId)
    if (!addBtn || !inputRow || !input || !confirmBtn) return

    addBtn.addEventListener('click', () => {
      inputRow.style.display = 'flex'
      input.focus()
      addBtn.style.display = 'none'
    })

    async function doAdd() {
      const name = input.value.trim()
      if (!name) return
      const { data, error } = await supabase.from('supplement_list').insert({ name, active: true }).select().maybeSingle()
      if (error) { showToast('Could not add supplement', true); return }
      stateRef.push({ id: data.id, name, taken: false })
      input.value = ''
      inputRow.style.display = 'none'
      addBtn.style.display = 'flex'
      // re-render with a live save context — otherwise toggles on the rows
      // rendered after an add never trigger auto-save for this day
      renderSuppRows(cardId, stateRef, renderPrefix, getSaveCtx ? getSaveCtx() : null)
    }

    confirmBtn.addEventListener('click', doAdd)
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd() })
  }

  bindAddSupp('add-supp-btn', 'add-supp-input-row', 'add-supp-input', 'add-supp-confirm', 'supp-card', suppState, '',
    () => ({ dateStr: currentDayStr, prefix: '', stateRef: suppState }))
  bindAddSupp('tadd-supp-btn', 'tadd-supp-input-row', 'tadd-supp-input', 'tadd-supp-confirm', 'tsupp-card', tsuppState, 'tadd-supp-',
    () => ({ dateStr: todayStr(), prefix: 't', stateRef: tsuppState }))

  // ── LOAD DAY DATA ────────────────────────────────────────
  async function loadDayData(dateStr, prefix, stateRef, cardId) {
    // reset UI
    ;[...prayerKeys, ...mealKeys, 'reading'].forEach(k => setToggle(`${prefix}tog-${k}`, false))
    stateRef.length = 0

    // load supplement list
    const { data: suppList } = await supabase.from('supplement_list').select('*').eq('active', true).order('name')
    const supplements = suppList || []

    // load taken status for this day
    const { data: takenRows } = await supabase.from('supplements').select('*').eq('date', dateStr)
    const takenMap = {}
    ;(takenRows || []).forEach(r => { takenMap[r.supplement_id] = r.taken })

    supplements.forEach(s => {
      stateRef.push({ id: s.id, name: s.name, taken: !!takenMap[s.id] })
    })
    const saveCtx = { dateStr, prefix, stateRef }
    renderSuppRows(cardId, stateRef, prefix === '' ? '' : 'tadd-supp-', saveCtx)

    // load prayers
    const { data: prayers } = await supabase.from('prayers').select('*').eq('date', dateStr).maybeSingle()
    if (prayers) prayerKeys.forEach(k => setToggle(`${prefix}tog-${k}`, prayers[k]))

    // load meals
    const { data: meals } = await supabase.from('meals').select('*').eq('date', dateStr).maybeSingle()
    if (meals) mealKeys.forEach(k => setToggle(`${prefix}tog-${k}`, meals[k]))

    // load daily tracking
    const { data: dt } = await supabase.from('daily_tracking').select('*').eq('date', dateStr).maybeSingle()
    if (dt) {
      setToggle(`${prefix}tog-reading`, dt.reading || false)
      if (prefix === '') {
        $('notes-today').value = dt.notes || ''
        $('notes-tomorrow').value = dt.notes_tomorrow || ''
      } else {
        $('tnotes-today').value = dt.notes || ''
        $('tnotes-tomorrow').value = dt.notes_tomorrow || ''
      }
    } else {
      if (prefix === '') { $('notes-today').value = ''; $('notes-tomorrow').value = '' }
      else { $('tnotes-today').value = ''; $('tnotes-tomorrow').value = '' }
    }
  }

  // ── SAVE DAY DATA ────────────────────────────────────────
  // Captures the current UI state up front so a save always writes what was
  // on screen when it was triggered, even if the user has since navigated to
  // another day and the shared DOM/steppers/stateRef have moved on.
  function captureDaySnapshot(prefix, stateRef) {
    return {
      toggles: Object.fromEntries(
        [...prayerKeys, ...mealKeys, 'reading'].map(k => [k, getToggle(`${prefix}tog-${k}`)])
      ),
      notes: prefix === '' ? $('notes-today').value : $('tnotes-today').value,
      notesTomorrow: prefix === '' ? $('notes-tomorrow').value : $('tnotes-tomorrow').value,
      supplements: stateRef.map(s => ({ id: s.id, taken: s.taken })),
    }
  }

  async function saveDayData(dateStr, prefix, snapshot, silent = false) {
    const btn = $(`${prefix === '' ? '' : 't'}save-btn`)
    if (!silent) { btn.disabled = true; btn.textContent = 'Saving...' }

    try {
      // prayers upsert
      await supabase.from('prayers').upsert({
        date: dateStr,
        ...Object.fromEntries(prayerKeys.map(k => [k, snapshot.toggles[k]]))
      }, { onConflict: 'date' })

      // meals upsert
      await supabase.from('meals').upsert({
        date: dateStr,
        ...Object.fromEntries(mealKeys.map(k => [k, snapshot.toggles[k]]))
      }, { onConflict: 'date' })

      // daily tracking upsert
      await supabase.from('daily_tracking').upsert({
        date: dateStr,
        reading: snapshot.toggles.reading,
        notes: snapshot.notes,
        notes_tomorrow: snapshot.notesTomorrow,
      }, { onConflict: 'date' })

      // supplements: delete existing for this day, re-insert
      await supabase.from('supplements').delete().eq('date', dateStr)
      if (snapshot.supplements.length > 0) {
        await supabase.from('supplements').insert(
          snapshot.supplements.map(s => ({ date: dateStr, supplement_id: s.id, taken: s.taken }))
        )
      }

      calNeedsRefresh = true
      anlNeedsRefresh = true
      if (!silent) showToast('Saved ✓')
    } catch (e) {
      if (!silent) showToast('Save failed', true)
    }

    if (!silent) { btn.disabled = false; btn.textContent = 'Save' }
  }

  // ── CALENDAR ─────────────────────────────────────────────
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS = ['S','M','T','W','T','F','S']
  let calYear, calMonth
  let calDotData = {} // key: 'YYYY-MM-DD', value: { prayers, meals, reading }
  let calNeedsRefresh = false   // set true after any day save
  let todayNeedsRefresh = false  // set true after any day save
  let hlthNeedsRefresh = false   // set true after health session add/delete
  let anlNeedsRefresh = false    // set true after any day save

  // ── AUTO-SAVE ─────────────────────────────────────────────
  const autoSaveTimers = {}
  function scheduleAutoSave(dateStr, prefix, stateRef) {
    // Keyed by date (not just prefix) so navigating to a different day
    // doesn't cancel a still-pending save for the day just left, and the
    // snapshot is captured now — before the shared DOM/stateRef can be
    // reset by opening another day — so a delayed save can't write the
    // wrong day's data.
    const key = `${prefix || 'day'}:${dateStr}`
    const snapshot = captureDaySnapshot(prefix, stateRef)
    clearTimeout(autoSaveTimers[key])
    autoSaveTimers[key] = setTimeout(() => {
      delete autoSaveTimers[key]
      saveDayData(dateStr, prefix, snapshot, true)
    }, 100)
  }

  async function loadCalDots(year, month) {
    const ym = `${year}-${String(month+1).padStart(2,'0')}`
    const start = `${ym}-01`
    const lastDay = new Date(year, month + 1, 0).getDate() // actual number of days in month
    const end = `${ym}-${String(lastDay).padStart(2, '0')}` // local date string — avoids toISOString UTC shift dropping the last day
    const [prayRes, mealRes, dtRes] = await Promise.all([
      supabase.from('prayers').select('*').filter('date','gte',start).filter('date','lte',end),
      supabase.from('meals').select('*').filter('date','gte',start).filter('date','lte',end),
      supabase.from('daily_tracking').select('*').filter('date','gte',start).filter('date','lte',end),
    ])
    calDotData = {}
    // fractions (0..1), not booleans — ring arc length shows day completion
    ;(prayRes.data||[]).forEach(r => {
      if (!calDotData[r.date]) calDotData[r.date] = {}
      calDotData[r.date].prayers = prayerKeys.reduce((s,k) => s + (r[k] ? 1 : 0), 0) / prayerKeys.length
    })
    ;(mealRes.data||[]).forEach(r => {
      if (!calDotData[r.date]) calDotData[r.date] = {}
      calDotData[r.date].meals = mealKeys.reduce((s,k) => s + (r[k] ? 1 : 0), 0) / mealKeys.length
    })
    ;(dtRes.data||[]).forEach(r => {
      if (!calDotData[r.date]) calDotData[r.date] = {}
      calDotData[r.date].reading = r.reading ? 1 : 0
    })
  }

  async function renderCalendar() {
    const now = new Date()
    if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth() }
    $('cal-month-label').textContent = `${MONTHS[calMonth]} ${calYear}`
    // "Today" jump chip — only shown when viewing another month
    const todayBtn = $('cal-today-btn')
    if (todayBtn) todayBtn.style.display =
      (calYear === now.getFullYear() && calMonth === now.getMonth()) ? 'none' : ''
    await loadCalDots(calYear, calMonth)
    const grid = $('cal-grid')
    grid.innerHTML = ''
    DAYS.forEach(d => {
      const el = document.createElement('div')
      el.className = 'cal-dow'
      el.textContent = d
      grid.appendChild(el)
    })
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div'); el.className = 'cal-cell-wrap empty'; grid.appendChild(el)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dots = calDotData[dateStr] || {}
      const isToday = calYear === now.getFullYear() && calMonth === now.getMonth() && d === now.getDate()
      const isFuture = new Date(calYear, calMonth, d) > now && !isToday
      const wrap = document.createElement('div')
      wrap.className = 'cal-cell-wrap' + (isToday ? ' today' : '') + (isFuture ? ' future' : '')

      // Activity-style concentric rings — one ring per type at a fixed
      // radius, arc length = fraction of the day completed (3/5 prayers =
      // 60% of the purple ring); a faint track completes partial rings
      const svgNS = 'http://www.w3.org/2000/svg'
      const svg = document.createElementNS(svgNS, 'svg')
      svg.setAttribute('viewBox', '0 0 100 100')
      svg.setAttribute('class', 'cal-rings')

      // today: small accent disc behind the number, inside the rings
      if (isToday) {
        const bg = document.createElementNS(svgNS, 'circle')
        bg.setAttribute('cx','50'); bg.setAttribute('cy','50'); bg.setAttribute('r','23')
        bg.setAttribute('fill', 'var(--accent)')
        svg.appendChild(bg)
      }

      const RING_DEFS = [
        { key: 'prayers', color: '#a855f7', r: 46 },   // outer
        { key: 'meals',   color: '#f97316', r: 37.5 }, // middle
        { key: 'reading', color: '#3b82f6', r: 29 },   // inner
      ]
      const cx = 50, cy = 50, sw = 6
      let drewRing = false
      RING_DEFS.forEach(({ key, color, r }) => {
        const frac = Math.min(dots[key] || 0, 1)
        if (frac <= 0) return
        drewRing = true
        if (frac >= 1) {
          // complete — full circle (an SVG arc can't represent 360°)
          const circ = document.createElementNS(svgNS, 'circle')
          circ.setAttribute('cx', cx); circ.setAttribute('cy', cy); circ.setAttribute('r', r)
          circ.setAttribute('fill', 'none')
          circ.setAttribute('stroke', color)
          circ.setAttribute('stroke-width', sw)
          svg.appendChild(circ)
          return
        }
        const track = document.createElementNS(svgNS, 'circle')
        track.setAttribute('cx', cx); track.setAttribute('cy', cy); track.setAttribute('r', r)
        track.setAttribute('fill', 'none')
        track.setAttribute('stroke', color)
        track.setAttribute('stroke-width', sw)
        track.setAttribute('opacity', '0.2')
        svg.appendChild(track)
        const start = -90 * Math.PI / 180
        const end = (-90 + frac * 360) * Math.PI / 180
        const path = document.createElementNS(svgNS, 'path')
        path.setAttribute('d', `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}`)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', sw)
        path.setAttribute('stroke-linecap', 'round')
        svg.appendChild(path)
      })
      if (drewRing || isToday) wrap.appendChild(svg)

      const num = document.createElement('div')
      num.className = 'cal-num'; num.textContent = d
      wrap.appendChild(num)
      wrap.addEventListener('click', () => openDayView(calYear, calMonth, d))
      grid.appendChild(wrap)
    }

    // re-trigger the fade-in on every render (class alone only animates once)
    grid.classList.remove('cal-anim')
    void grid.offsetWidth
    grid.classList.add('cal-anim')
  }

  $('cal-prev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear-- } renderCalendar() })
  $('cal-next').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++ } renderCalendar() })
  $('cal-today-btn').addEventListener('click', () => {
    const now = new Date()
    calYear = now.getFullYear(); calMonth = now.getMonth()
    renderCalendar()
  })

  // ── DAY VIEW ─────────────────────────────────────────────
  let currentDayStr = ''

  // Wired once per prefix (not per day-open) — `getDateStr` is read at click
  // time so these listeners, which stay attached to the same static DOM
  // elements for the life of the page, always target whichever day is
  // currently displayed instead of accumulating stale per-visit closures.
  function wireAutoSave(prefix, getDateStr, stateRef) {
    // Toggles
    const toggleIds = [...prayerKeys, ...mealKeys, 'reading'].map(k => `${prefix}tog-${k}`)
    toggleIds.forEach(id => {
      const el = $(id); if (!el) return
      el.addEventListener('click', () => scheduleAutoSave(getDateStr(), prefix, stateRef), { capture: true })
    })
    // Notes
    const notesId = prefix === '' ? 'notes-today' : 'tnotes-today'
    const tmrwId  = prefix === '' ? 'notes-tomorrow' : 'tnotes-tomorrow'
    ;[notesId, tmrwId].forEach(id => {
      const el = $(id); if (!el) return
      el.addEventListener('input', () => scheduleAutoSave(getDateStr(), prefix, stateRef))
    })
  }
  wireAutoSave('', () => currentDayStr, suppState)
  wireAutoSave('t', () => todayStr(), tsuppState)

  async function openDayView(y, m, d) {
    currentDayStr = toDateStr(y, m, d)
    const date = new Date(y, m, d)
    $('day-date-label').textContent = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    $('calendar-view').style.display = 'none'
    $('day-view').classList.add('active')
    $('top-title').textContent = 'Day'
    await loadDayData(currentDayStr, '', suppState, 'supp-card')
  }

  $('day-back').addEventListener('click', () => {
    $('day-view').classList.remove('active')
    $('calendar-view').style.display = ''
    $('top-title').textContent = 'Calendar'
  })

  $('save-btn').addEventListener('click', () => saveDayData(currentDayStr, '', captureDaySnapshot('', suppState)))

  // ── TODAY TAB ────────────────────────────────────────────
  async function loadTodayTab() {
    const now = new Date()
    $('today-date-label').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    await loadDayData(todayStr(), 't', tsuppState, 'tsupp-card')
  }

  $('tsave-btn').addEventListener('click', () => saveDayData(todayStr(), 't', captureDaySnapshot('t', tsuppState)))

  // reload today data when switching to today tab

  // ── FINANCE ──────────────────────────────────────────────
  const FIN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const CAT_COLORS = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#6b7280']

  let finMonth = ''
  let finCategories = []
  let finBudget = null
  let finExpenses = []
  let finChartInstance = null
  let finLoaded = false
  let finTxnsLoaded = false
  let finCycles = [] // { month, started_at } sorted by started_at asc
  let finCycleStartConfirming = false
  let selectedCatName = null
  let selectedCatColor = '#6b7280'
  let newCatColor = CAT_COLORS[0]
  let pendingDeleteId = null
  let finCards = []
  let finAllTxns = []
  let finMonthTxns = []
  let pendingTxnDeleteId = null
  let finCardCollapsed = {}
  let finCardTxnType = {}
  let finCardTxnCat = {}
  let finCardCharts = {}
  let cardDocClickBound = false

  function finMonthLabel(ym) {
    const [y, m] = ym.split('-').map(Number)
    return `${FIN_MONTHS[m - 1]} ${y}`
  }
  function currentYM() {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`
  }
  function currentPeriodYM() {
    if (!finCycles.length) return currentYM()
    // local date, not toISOString() — UTC would lag behind Bahrain (UTC+3)
    // between midnight and 3am and briefly resurrect the previous cycle
    const today = todayStr()
    const active = finCycles.filter(c => c.started_at <= today)
    if (!active.length) return currentYM()
    return active[active.length - 1].month
  }
  function getPeriodDates(ym) {
    const cycle = finCycles.find(c => c.month === ym)
    if (!cycle || !cycle.started_at) {
      const monthStart = `${ym}-01`
      const monthEnd = firstDayOfNextMonth(ym)
      const cap = finCycles.find(c => c.started_at > monthStart && c.started_at < monthEnd)
      return { start: monthStart, end: cap ? cap.started_at : monthEnd, open: false }
    }
    const idx = finCycles.indexOf(cycle)
    const next = finCycles[idx + 1]
    return { start: cycle.started_at, end: next ? next.started_at : null, open: !next }
  }
  function getPeriodTxns(txns, ym) {
    const { start: ps, end: pe, open: po } = getPeriodDates(ym)
    return txns.filter(t => t.date >= ps && (po || t.date < pe))
  }
  function fmtAmount(n) { return `BHD ${Number(n).toFixed(3)}` }
  function fmtDateShort(ds) {
    const [y,m,d] = ds.split('-').map(Number)
    return new Date(y, m-1, d).toLocaleDateString('en-US', { month:'short', day:'numeric' })
  }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  }
  function firstDayOfNextMonth(ym) {
    const [y,m] = ym.split('-').map(Number)
    return m === 12 ? `${y+1}-01-01` : `${y}-${String(m+1).padStart(2,'0')}-01`
  }

  // ── BUDGET ───────────────────────────────────────────────
  const BUDGET_COLOR = '#8b5cf6'
  function renderBudgetBar() {
    const wrap = $('budget-wrap')
    if (!wrap) return
    wrap.style.background = darkTint(BUDGET_COLOR, 0.16)
    wrap.style.border = `1px solid ${hexA(BUDGET_COLOR, 0.25)}`
    wrap.style.borderRadius = 'var(--radius)'
    wrap.style.padding = '14px'
    wrap.style.boxShadow = `0 2px 12px ${hexA(BUDGET_COLOR, 0.08)}`
    wrap.style.transition = 'background .12s, border-color .12s'
    const totalSpent = finExpenses.reduce((s,e) => s + Number(e.amount), 0)

    if (finBudget === null) {
      wrap.innerHTML = `
        <div class="budget-not-set" id="budget-not-set">Budget not set — tap to set</div>
        <div class="budget-edit-row" id="budget-input-row" style="display:none">
          <input class="budget-edit-input" id="budget-input" type="number" min="0" step="0.001" placeholder="0.000" inputmode="decimal">
          <button class="fin-add-btn" id="budget-save-btn">Set</button>
        </div>`
      $('budget-not-set').addEventListener('click', showBudgetInput)
      bindBudgetSave()
      return
    }

    const pct = Math.min((totalSpent / finBudget) * 100, 100)
    const over = totalSpent > finBudget
    const remaining = finBudget - totalSpent
    wrap.innerHTML = `
      <div class="budget-header">
        <span>Remaining</span>
        <span class="card-tile-balance" style="${over ? 'color:var(--danger)' : ''}">${fmtAmount(Math.abs(remaining))}</span>
      </div>
      <div class="budget-track"><div class="budget-fill${over ? ' over' : ''}" style="width:${pct.toFixed(1)}%"></div></div>
      <div class="budget-sub">
        of <span class="budget-amount-val" id="budget-limit-lbl">${fmtAmount(finBudget)}</span> budget${over ? ' &nbsp;·&nbsp; <span style="color:var(--danger);font-weight:500">over budget</span>' : ''}
      </div>
      <div class="budget-edit-row" id="budget-input-row" style="display:none">
        <input class="budget-edit-input" id="budget-input" type="number" min="0" step="0.001" value="${finBudget}" inputmode="decimal">
        <button class="fin-add-btn" id="budget-save-btn">Update</button>
      </div>`
    const lbl = $('budget-limit-lbl')
    if (lbl) lbl.addEventListener('click', showBudgetInput)
    bindBudgetSave()
  }

  function showBudgetInput() {
    const row = $('budget-input-row')
    if (!row) return
    row.style.display = 'flex'
    const inp = $('budget-input')
    if (inp) { inp.focus(); inp.select() }
  }

  function bindBudgetSave() {
    const btn = $('budget-save-btn')
    const inp = $('budget-input')
    if (!btn || !inp) return
    async function saveBudget() {
      const val = parseFloat(inp.value)
      const newTotal = (!isNaN(val) && val > 0) ? val : null
      const { data: existing } = await supabase.from('budget_settings').select('id').eq('month', finMonth).maybeSingle()
      if (existing) {
        await supabase.from('budget_settings').update({ total: newTotal }).eq('month', finMonth)
      } else {
        await supabase.from('budget_settings').insert({ month: finMonth, total: newTotal })
      }
      finBudget = newTotal
      renderBudgetBar()
    }
    btn.addEventListener('click', saveBudget)
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') saveBudget() })
  }

  // ── DONUT CHART (shared by Finance, Cards, Analytics) ────
  const DONUT_OTHER_COLOR = '#6b7280'

  // totals map → sorted segment list, folding the tail beyond the top 6 AND
  // any sliver under 2.5% into "Other" — sub-2.5% arcs are too short to
  // render as recognizable segments and turn into pinched blobs
  function donutEntries(catTotals, colorFor, maxSegs = 6, minShare = 0.025) {
    const sorted = Object.entries(catTotals).sort((a,b) => b[1] - a[1])
    const total = sorted.reduce((s,[,v]) => s+v, 0)
    const entries = [], fold = []
    // each entry carries `cats`: the underlying category name(s) it represents,
    // so tapping a segment can filter the expense list — the folded "Other"
    // segment covers several categories at once.
    sorted.forEach(([name, value], i) => {
      if (i < maxSegs && (total === 0 || value / total >= minShare)) entries.push({ name, value, color: colorFor(name), cats: [name] })
      else fold.push([name, value])
    })
    if (fold.length === 1) {
      const [name, value] = fold[0]
      entries.push({ name, value, color: colorFor(name), cats: [name] })
    } else if (fold.length > 1) {
      const foldValue = fold.reduce((s,[,v]) => s+v, 0)
      const foldCats = fold.map(([n]) => n)
      // If a genuine "Other" category is already shown, merge the folded tail
      // into it rather than adding a second "Other (N)" row (duplicate legend).
      const existingOther = entries.find(e => e.name === 'Other')
      if (existingOther) {
        existingOther.value += foldValue
        existingOther.cats = existingOther.cats.concat(foldCats)
      } else {
        entries.push({ name: `Other (${fold.length})`, value: foldValue, color: DONUT_OTHER_COLOR, cats: foldCats })
      }
    }
    return entries
  }

  // Draws a rounded-segment donut with a live center readout and a tappable
  // legend. Tap a segment (or legend row) to spotlight it; tap again to reset.
  // `legendItems` (optional) drives the legend independently of the donut arcs:
  // pass the full per-category list so every category shows by name even when
  // the donut folds small slivers into one gray "Other" arc. Each item is
  // { name, value, color, cats:[names], seg } where `seg` is the arc index to
  // spotlight on tap. Omit it and the legend mirrors the folded arcs 1:1.
  function buildDonut(canvas, entries, { cutout = '70%', centerEl, legendEl, centerLabel = 'total', onSelect, legendItems } = {}) {
    if (!canvas || typeof Chart === 'undefined') return null
    const total = entries.reduce((s,e) => s + e.value, 0)
    const single = entries.length === 1
    let selected = null   // selection key: null, arc index, or a category name

    function setCenter(name, value) {
      if (!centerEl) return
      const amount = value == null ? total : value
      const label = name == null ? centerLabel : `${name} · ${total ? Math.round(value / total * 100) : 0}%`
      centerEl.innerHTML = `<div class="donut-center-amount">${fmtAmount(amount)}</div><div class="donut-center-label">${escHtml(label)}</div>`
    }
    setCenter(null, null)

    // rounding scaled to segment size — a fixed radius turns short arcs into
    // pinched pebble shapes, so small segments get near-flat ends
    const segRadius = ctx => {
      const share = total ? entries[ctx.dataIndex].value / total : 0
      return share < 0.05 ? 1 : share < 0.1 ? 2 : 4
    }

    // Segment gaps via a surface-colored border, NOT `spacing` — spacing
    // offsets each arc radially from the center, so the gaps around a
    // dominant arc render much wider than those between small ones.
    // The gap must match the backdrop the chart actually sits on (page bg,
    // white card, tinted card section), so walk up from the canvas to the
    // first opaque background — canvas can't interpret 'var(--bg2)' itself.
    let surface = ''
    for (let n = canvas; n && n !== document.documentElement; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') { surface = bg; break }
    }
    if (!surface) surface = getComputedStyle(document.body).backgroundColor || '#1c1c1e'

    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: entries.map(e => e.name),
        datasets: [{
          data: entries.map(e => e.value),
          backgroundColor: entries.map(e => e.color),
          borderWidth: single ? 0 : 2,
          borderColor: surface,
          spacing: 0,
          borderRadius: single ? 0 : segRadius,
          hoverOffset: 5,
        }]
      },
      options: {
        cutout,
        layout: { padding: 6 },
        animation: { duration: 500, easing: 'easeOutQuart' },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        onHover: (evt, els) => {
          if (evt.native?.target) evt.native.target.style.cursor = els.length ? 'pointer' : 'default'
        },
        onClick: (evt, els) => onArcClick(els.length ? els[0].index : null),
      }
    })

    function spotlight(seg) {
      chart.setActiveElements(seg == null ? [] : [{ datasetIndex: 0, index: seg }])
      chart.update()
    }

    // Highlight legend rows: active when the row's category is in `activeCats`
    // (spreads a folded "Other" arc across its members) or matches `activeName`
    // (the row's own label, so a single folded legend row still lights up).
    function highlight(activeCats, activeName) {
      if (!legendEl) return
      legendEl.querySelectorAll('.donut-legend-row').forEach(r => {
        const c = r.dataset.cat
        r.classList.toggle('active', (!!activeCats && activeCats.includes(c)) || c === activeName)
      })
    }

    // Tapping a donut arc selects that arc (a real category, or the folded
    // "Other" group). Tapping the same arc again clears.
    function onArcClick(idx) {
      const e = idx == null ? null : entries[idx]
      selected = (e == null || selected === idx) ? null : idx
      const on = selected != null
      spotlight(on ? idx : null)
      setCenter(on ? e.name : null, on ? e.value : null)
      highlight(on ? e.cats : null, on ? e.name : null)
      if (onSelect) onSelect(on ? { cats: e.cats, name: e.name } : null)
    }

    // Full-category legend (Finance): every category listed by name; a folded
    // small category still spotlights the shared "Other" arc when tapped.
    function onCatClick(item) {
      selected = (item == null || selected === item.name) ? null : item.name
      const on = selected != null
      spotlight(on ? item.seg : null)
      setCenter(on ? item.name : null, on ? item.value : null)
      highlight(on ? item.cats : null, on ? item.name : null)
      if (onSelect) onSelect(on ? { cats: item.cats, name: item.name } : null)
    }

    const rows = legendItems || entries.map((e, i) => ({ name: e.name, value: e.value, color: e.color, cats: e.cats, seg: i }))
    if (legendEl) {
      legendEl.innerHTML = rows.map(it => `
        <div class="donut-legend-row" data-cat="${escHtml(it.name)}">
          <span class="donut-legend-dot" style="background:${it.color}"></span>
          <span class="donut-legend-name">${escHtml(it.name)}</span>
          <span class="donut-legend-pct">${total ? Math.round(it.value / total * 100) : 0}%</span>
          <span class="donut-legend-amt">${fmtAmount(it.value)}</span>
        </div>`).join('')
      legendEl.querySelectorAll('.donut-legend-row').forEach(row => {
        row.addEventListener('click', () => onCatClick(rows.find(it => it.name === row.dataset.cat)))
      })
    }

    chart.clearSelection = () => onArcClick(null)   // reset selection + fire onSelect(null)
    return chart
  }

  function renderDonutChart() {
    const section = $('fin-chart-section')
    if (!section) return
    finCatFilter = null   // rebuilding the chart clears any tapped-category filter
    if (finExpenses.length === 0) {
      section.style.display = 'none'
      if (finChartInstance) { finChartInstance.destroy(); finChartInstance = null }
      return
    }
    const expWrap = $('budget-section-wrap')
    if (expWrap && expWrap.style.display === 'none') return
    section.style.display = 'block'

    const colorFor = n => finCategories.find(c => c.name === n)?.color || DONUT_OTHER_COLOR
    const catTotals = {}
    finExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category]||0) + Number(e.amount) })
    const entries = donutEntries(catTotals, colorFor)

    // Legend lists EVERY category by name (even ones the donut folds into the
    // gray "Other" arc). Map each category to the arc it should spotlight.
    const segOf = {}
    entries.forEach((e, i) => e.cats.forEach(c => { segOf[c] = i }))
    const legendItems = Object.entries(catTotals)
      .sort((a,b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, cats: [name], color: colorFor(name), seg: segOf[name] }))

    if (finChartInstance) { finChartInstance.destroy(); finChartInstance = null }
    finChartInstance = buildDonut($('fin-chart'), entries, {
      centerEl: $('donut-center'),
      legendEl: $('fin-legend'),
      legendItems,
      onSelect: sel => {
        // tap a category → show only its expenses; tap again to clear
        finCatFilter = sel ? sel.cats : null
        renderExpenseList()
      },
    })
    renderExpenseList()
  }

  // ── EXPENSE LIST ─────────────────────────────────────────
  let finExpensesCollapsed = true
  let finCatFilter = null   // null = show all; else array of category names to show

  function renderExpenseList() {
    const container = $('expense-list')
    if (!container) return

    if (finExpenses.length === 0) {
      container.innerHTML = '<div class="fin-empty">No expenses this month</div>'
      return
    }

    const filtered = finCatFilter ? finExpenses.filter(e => finCatFilter.includes(e.category)) : finExpenses
    const filterLabel = finCatFilter ? (finCatFilter.length === 1 ? finCatFilter[0] : 'Other') : ''
    const filterBar = finCatFilter
      ? `<div class="expense-filter-bar">
           <span class="expense-filter-label">Showing <b>${escHtml(filterLabel)}</b> · ${filtered.length}</span>
           <button class="expense-filter-clear" id="expense-filter-clear">All categories</button>
         </div>`
      : ''

    if (finCatFilter && filtered.length === 0) {
      container.innerHTML = filterBar + '<div class="fin-empty">No expenses in this category</div>'
      $('expense-filter-clear')?.addEventListener('click', clearCatFilter)
      return
    }

    container.innerHTML = filterBar + `<div class="log-card">${filtered.map(e => {
      const cat = finCategories.find(c => c.name === e.category)
      const color = cat ? cat.color : '#6b7280'
      return `<div class="expense-row" data-id="${e.id}">
        <div class="expense-cat-dot" style="background:${color}"></div>
        <div class="expense-meta">
          <div class="expense-label">${escHtml(e.label)}</div>
          <div class="expense-cat-date">${escHtml(e.category)} · ${fmtDateShort(e.date)}</div>
        </div>
        <div class="expense-amount">${fmtAmount(e.amount)}</div>
        <button class="expense-del-btn" data-del="${e.id}" aria-label="Delete">×</button>
      </div>`
    }).join('')}</div>`

    // tap row to edit
    container.querySelectorAll('.expense-row').forEach(row => {
      row.addEventListener('click', ev => {
        if (ev.target.closest('.expense-del-btn')) return
        showExpenseEditForm(row.dataset.id)
      })
    })
    container.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', ev => { ev.stopPropagation(); showDeleteConfirm(btn.dataset.del) })
    })
    $('expense-filter-clear')?.addEventListener('click', clearCatFilter)
  }

  // Clear the tapped-category filter and de-select the donut segment.
  // clearSelection() resets the donut's internal state, restores the center
  // readout and legend, and fires onSelect(null) → which re-renders the list.
  function clearCatFilter() {
    if (finChartInstance && finChartInstance.clearSelection) {
      finChartInstance.clearSelection()
    } else {
      finCatFilter = null
      renderExpenseList()
    }
  }

  function showExpenseEditForm(id) {
    const e = finExpenses.find(x => x.id === id); if (!e) return
    const row = document.querySelector(`.expense-row[data-id="${id}"]`); if (!row) return
    const cat = finCategories.find(c => c.name === e.category)
    const color = cat ? cat.color : '#6b7280'
    const form = document.createElement('div')
    form.className = 'expense-edit-form'
    form.dataset.editId = id
    form.innerHTML = `
      <div class="expense-edit-grid">
        <div class="expense-edit-row">
          <input class="expense-edit-inp" id="ee-label" value="${escHtml(e.label)}" placeholder="Label" maxlength="80">
          <input class="expense-edit-inp" id="ee-amount" type="number" value="${e.amount}" step="0.001" min="0" style="max-width:90px" inputmode="decimal">
        </div>
        <div class="expense-edit-row">
          <input class="expense-edit-inp" id="ee-date" type="date" value="${e.date}" style="max-width:140px">
          <select class="expense-edit-inp" id="ee-cat">
            ${finCategories.map(c => `<option value="${escHtml(c.name)}" ${c.name === e.category ? 'selected' : ''}>${escHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="expense-edit-row" style="justify-content:flex-end">
          <button class="expense-edit-cancel" id="ee-cancel">Cancel</button>
          <button class="expense-edit-save" id="ee-save">Save</button>
        </div>
      </div>`
    row.replaceWith(form)
    form.querySelector('#ee-cancel').addEventListener('click', () => renderExpenseList())
    form.querySelector('#ee-save').addEventListener('click', async () => {
      const label = form.querySelector('#ee-label').value.trim(); if (!label) return
      const amount = parseFloat(form.querySelector('#ee-amount').value); if (isNaN(amount)) return
      const date = form.querySelector('#ee-date').value
      const category = form.querySelector('#ee-cat').value
      const btn = form.querySelector('#ee-save'); btn.textContent = 'Saving...'; btn.disabled = true
      const { error } = await supabase.from('expenses').update({ label, amount, date, category }).eq('id', id)
      if (error) { btn.textContent = 'Save'; btn.disabled = false; showToast('Update failed', true); return }
      const idx = finExpenses.findIndex(x => x.id === id)
      if (idx !== -1) finExpenses[idx] = { ...finExpenses[idx], label, amount, date, category }
      renderBudgetBar(); renderExpenseList(); renderDonutChart()
    })
  }

  function showDeleteConfirm(id) {
    cancelDeleteConfirm()
    pendingDeleteId = id
    const row = document.querySelector(`.expense-row[data-id="${id}"]`)
    if (!row) return
    const conf = document.createElement('div')
    conf.className = 'expense-confirm-row'
    conf.id = `del-conf-${id}`
    conf.innerHTML = `
      <span class="expense-confirm-text">Delete this expense?</span>
      <button class="expense-confirm-no">Cancel</button>
      <button class="expense-confirm-yes">Delete</button>`
    row.replaceWith(conf)
    conf.querySelector('.expense-confirm-no').addEventListener('click', () => { pendingDeleteId = null; renderExpenseList() })
    conf.querySelector('.expense-confirm-yes').addEventListener('click', async () => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) { showToast('Delete failed', true); return }
      finExpenses = finExpenses.filter(e => e.id !== id)
      pendingDeleteId = null
      renderBudgetBar(); renderExpenseList(); renderDonutChart()
    })
  }

  function cancelDeleteConfirm() {
    if (!pendingDeleteId) return
    const el = $(`del-conf-${pendingDeleteId}`)
    if (el) el.remove()
    pendingDeleteId = null
  }

  // ── CATEGORY PICKER ──────────────────────────────────────
  function renderCatDropdown() {
    const dd = $('cat-dropdown')
    if (!dd) return
    let html = finCategories.map(cat => `
      <div class="cat-option${cat.name === selectedCatName ? ' selected' : ''}" data-cat="${escHtml(cat.name)}" data-color="${cat.color}">
        <div class="cat-option-dot" style="background:${cat.color}"></div>
        ${escHtml(cat.name)}
      </div>`).join('')
    html += `
      <div class="cat-new-option" id="cat-new-trigger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New category
      </div>
      <div class="cat-new-form" id="cat-new-form" style="display:none">
        <input class="cat-new-input" id="cat-new-input" type="text" placeholder="Category name" maxlength="30">
        <div class="color-palette" id="cat-color-palette"></div>
        <div class="cat-new-actions">
          <button class="cat-save-btn" id="cat-new-save" type="button">Add</button>
          <button class="cat-cancel-btn" id="cat-new-cancel" type="button">Cancel</button>
        </div>
      </div>`
    dd.innerHTML = html

    dd.querySelectorAll('.cat-option').forEach(opt => {
      opt.addEventListener('click', () => { selectCategory(opt.dataset.cat, opt.dataset.color); dd.style.display = 'none' })
    })
    $('cat-new-trigger').addEventListener('click', () => {
      $('cat-new-form').style.display = 'block'
      $('cat-new-trigger').style.display = 'none'
      buildColorPalette()
      $('cat-new-input').focus()
    })
    $('cat-new-cancel').addEventListener('click', () => {
      $('cat-new-form').style.display = 'none'
      $('cat-new-trigger').style.display = 'flex'
    })
    $('cat-new-save').addEventListener('click', saveNewCategory)
    $('cat-new-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveNewCategory() })
  }

  function buildColorPalette() {
    const palette = $('cat-color-palette')
    if (!palette) return
    palette.innerHTML = CAT_COLORS.map(c => `
      <div class="color-swatch${c === newCatColor ? ' selected' : ''}" style="background:${c}" data-color="${c}"></div>`).join('')
    palette.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        newCatColor = sw.dataset.color
        palette.querySelectorAll('.color-swatch').forEach(s => s.classList.toggle('selected', s.dataset.color === newCatColor))
      })
    })
  }

  async function saveNewCategory() {
    const inp = $('cat-new-input')
    if (!inp) return
    const name = inp.value.trim()
    if (!name) return
    if (finCategories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      showToast('Category already exists', true); return
    }
    const { data, error } = await supabase.from('categories').insert({ name, color: newCatColor }).select().maybeSingle()
    if (error) { showToast('Could not save category', true); return }
    finCategories.push(data)
    finCategories.sort((a,b) => a.name.localeCompare(b.name))
    selectCategory(data.name, data.color)
    const dd = $('cat-dropdown')
    if (dd) dd.style.display = 'none'
  }

  function selectCategory(name, color) {
    selectedCatName = name
    selectedCatColor = color
    const dot = $('cat-picker-dot'), txt = $('cat-picker-text')
    if (dot) dot.style.background = color
    if (txt) txt.textContent = name
    validateExpenseForm()
  }

  // ── ADD EXPENSE FORM (bound once) ────────────────────────
  function bindExpenseForm() {
    const addBtn = $('fin-add-btn'), form = $('add-expense-form')
    const cancelBtn = $('fin-cancel-btn'), amtInp = $('fin-amount'), lblInp = $('fin-label')
    const pickerBtn = $('cat-picker-btn'), dropdown = $('cat-dropdown')
    if (!addBtn) return

    // The budget gray box is the tap target — tapping it expands Cash Expenses
    const budgetBox = $('budget-wrap')
    if (budgetBox) {
      budgetBox.addEventListener('click', ev => {
        // let budget-edit affordances work without toggling
        if (ev.target.closest('.budget-amount-val') || ev.target.closest('.budget-not-set') ||
            ev.target.closest('.budget-edit-row') || ev.target.closest('input') || ev.target.closest('button')) return
        finExpensesCollapsed = !finExpensesCollapsed
        const wrap = $('budget-section-wrap')
        if (wrap) wrap.style.display = finExpensesCollapsed ? 'none' : ''
        if (!finExpensesCollapsed) renderDonutChart()
      })
    }

    addBtn.addEventListener('click', () => {
      if (finExpensesCollapsed) {
        finExpensesCollapsed = false
        const wrap = $('budget-section-wrap')
        if (wrap) wrap.style.display = ''
        renderDonutChart()
      }
      form.style.display = 'block'
      addBtn.style.display = 'none'
      $('fin-date').value = todayStr()
      renderCatDropdown()
      amtInp.focus()
    })

    cancelBtn.addEventListener('click', closeExpenseForm)

    pickerBtn.addEventListener('click', ev => {
      ev.stopPropagation()
      const open = dropdown.style.display !== 'none'
      if (open) { dropdown.style.display = 'none'; return }
      renderCatDropdown()
      dropdown.style.display = 'block'
    })

    document.addEventListener('click', ev => {
      const wrap = $('cat-picker-wrap')
      if (wrap && !wrap.contains(ev.target) && dropdown) dropdown.style.display = 'none'
    })

    amtInp.addEventListener('input', validateExpenseForm)
    lblInp.addEventListener('input', validateExpenseForm)
    $('fin-confirm-btn').addEventListener('click', submitExpense)
  }

  function validateExpenseForm() {
    const btn = $('fin-confirm-btn')
    if (!btn) return
    const amt = parseFloat($('fin-amount')?.value)
    const lbl = $('fin-label')?.value?.trim()
    btn.disabled = !(amt > 0 && lbl && selectedCatName)
  }

  async function submitExpense() {
    const btn = $('fin-confirm-btn')
    btn.disabled = true; btn.textContent = 'Saving...'
    const amount = Math.round(parseFloat($('fin-amount').value) * 1000) / 1000
    const label = $('fin-label').value.trim()
    const date = $('fin-date').value || todayStr()
    const notes = $('fin-notes').value.trim() || null
    const { data, error } = await supabase.from('expenses')
      .insert({ date, label, amount, category: selectedCatName, notes })
      .select().maybeSingle()
    if (error) {
      showToast('Could not add expense', true)
      btn.disabled = false; btn.textContent = 'Save'; return
    }
    const { start: ps, end: pe, open: po } = getPeriodDates(finMonth)
    if (data.date >= ps && (po || data.date < pe)) {
      finExpenses.unshift(data)
      finExpenses.sort((a,b) => b.date.localeCompare(a.date) || (b.created_at||'').localeCompare(a.created_at||''))
    }
    closeExpenseForm()
    renderBudgetBar(); renderExpenseList(); renderDonutChart()
    showToast('Expense added ✓')
  }

  function closeExpenseForm() {
    const form = $('add-expense-form'), addBtn = $('fin-add-btn')
    if (form) form.style.display = 'none'
    if (addBtn) addBtn.style.display = ''
    const btn = $('fin-confirm-btn')
    if (btn) { btn.disabled = true; btn.textContent = 'Save' }
    ;['fin-amount','fin-label','fin-notes'].forEach(id => { const el = $(id); if (el) el.value = '' })
    const dd = $('cat-dropdown'); if (dd) dd.style.display = 'none'
  }

  // ── LOAD FINANCE DATA ────────────────────────────────────
  async function loadFinanceCycles() {
    const { data } = await supabase.from('budget_settings')
      .select('month, started_at')
      .not('started_at', 'is', null)
      .order('started_at', { ascending: true })
    finCycles = data || []
  }

  async function loadFinanceData() {
    if (finCategories.length === 0) {
      const { data } = await supabase.from('categories').select('*').order('name')
      finCategories = data || []
    }
    const { start: periodStart, end: periodEnd, open } = getPeriodDates(finMonth)
    let expQuery = supabase.from('expenses').select('*').gte('date', periodStart)
    if (!open) expQuery = expQuery.lt('date', periodEnd)
    expQuery = expQuery.order('date', { ascending: false }).order('created_at', { ascending: false })
    const [{ data: budget }, { data: expenses }] = await Promise.all([
      supabase.from('budget_settings').select('*').eq('month', finMonth).maybeSingle(),
      expQuery
    ])
    finBudget = budget ? Number(budget.total) : null
    finExpenses = expenses || []
    renderBudgetBar(); renderExpenseList(); renderDonutChart()
    // load cards + transactions once; updated in-memory on add/delete
    if (finCards.length === 0) {
      const { data: cards } = await supabase.from('cards').select('*').eq('visible', true).order('name')
      finCards = cards || []
    }
    if (finCards.length > 0 && !finTxnsLoaded) {
      const { data: allTxns } = await supabase.from('card_transactions').select('*').order('date', { ascending: false })
      finAllTxns = allTxns || []
      finTxnsLoaded = true
      finMonthTxns = getPeriodTxns(finAllTxns, finMonth)
      renderCardSections()
    } else if (finCards.length > 0) {
      finMonthTxns = getPeriodTxns(finAllTxns, finMonth)
      renderCardSections()
    }
  }

  // ── FINANCE MONTH NAV ────────────────────────────────────
  function setFinMonth(ym) {
    finMonth = ym
    const lbl = $('fin-month-label')
    if (lbl) lbl.textContent = finMonthLabel(ym)
    const nextBtn = $('fin-next')
    if (nextBtn) nextBtn.disabled = ym >= currentPeriodYM()
    const startBtn = $('fin-cycle-start-btn')
    if (startBtn) startBtn.style.display = ym === currentPeriodYM() ? '' : 'none'
    cancelDeleteConfirm()
    closeExpenseForm()
    finMonthTxns = getPeriodTxns(finAllTxns, ym)
  }

  $('fin-prev').addEventListener('click', () => {
    if (!finMonth) return
    const [y,m] = finMonth.split('-').map(Number)
    const prev = m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`
    setFinMonth(prev); loadFinanceData()
  })

  $('fin-next').addEventListener('click', () => {
    if (!finMonth) return
    const [y,m] = finMonth.split('-').map(Number)
    const next = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,'0')}`
    if (next > currentPeriodYM()) return
    setFinMonth(next); loadFinanceData()
  })

  async function initFinanceTab() {
    await loadFinanceCycles()
    setFinMonth(currentPeriodYM())
    bindExpenseForm()
    bindCycleStartBtn()
    await loadFinanceData()
  }

  function bindCycleStartBtn() {
    const btn = $('fin-cycle-start-btn')
    if (!btn) return
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (!finCycleStartConfirming) {
        finCycleStartConfirming = true
        btn.textContent = 'Confirm?'
        btn.style.background = 'var(--danger)'
        return
      }
      finCycleStartConfirming = false
      btn.textContent = 'Start New Month'
      btn.style.background = ''
      btn.disabled = true
      const [y, m] = finMonth.split('-').map(Number)
      const nextM = m === 12 ? 1 : m + 1
      const nextY = m === 12 ? y + 1 : y
      const nextYM = `${nextY}-${String(nextM).padStart(2,'0')}`
      const today = todayStr() // local date — toISOString() is UTC and can be yesterday

      const { data: existing } = await supabase.from('budget_settings').select('*').eq('month', nextYM).maybeSingle()
      if (existing) {
        await supabase.from('budget_settings').update({ started_at: today }).eq('month', nextYM)
      } else {
        await supabase.from('budget_settings').insert({ month: nextYM, started_at: today, total: null })
      }
      btn.disabled = false
      await loadFinanceCycles()
      setFinMonth(nextYM)
      await loadFinanceData()
    })
    document.addEventListener('click', () => {
      if (!finCycleStartConfirming) return
      finCycleStartConfirming = false
      btn.textContent = 'Start New Month'
      btn.style.background = ''
    })
  }

  document.querySelector('.nav-item[data-tab="finance"]').addEventListener('click', () => {
    if (!finLoaded) { finLoaded = true; initFinanceTab() }
  })

  // ── CARDS (per-card collapsible sections) ────────────────
  function renderCardSections() {
    const container = $('fin-cards-container')
    if (!container) return
    Object.values(finCardCharts).forEach(ch => { try { ch.destroy() } catch {} })
    finCardCharts = {}
    if (finCards.length === 0) { container.innerHTML = ''; return }
    container.innerHTML = finCards.map(card => renderCardSectionHTML(card)).join('')
    finCards.forEach(card => { if (finCardCollapsed[card.id] === false) drawCardDonut(card.id) })
    wireCardEvents()
  }

  // hex → rgba string for translucent borders/glows
  function hexA(hex, a) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
    return `rgba(${r},${g},${b},${a})`
  }
  // hex → dark solid tint for the card background (blend accent toward near-black navy)
  function darkTint(hex, w) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
    const base = [8, 11, 18]
    const mix = (c, i) => Math.round(base[i] * (1 - w) + c * w)
    return `rgb(${mix(r,0)},${mix(g,1)},${mix(b,2)})`
  }
  // Per-card accent: CREDIMAX→blue, ILA→green, others→stable palette pick by name
  function cardTheme(name) {
    const n = (name || '').trim().toLowerCase()
    if (n === 'credimax') return { accent:'#3b82f6', accent2:'#2563eb' } // blue
    if (n === 'ila')      return { accent:'#22c55e', accent2:'#16a34a' } // green
    const palette = [
      { accent:'#3b82f6', accent2:'#2563eb' },
      { accent:'#a855f7', accent2:'#7c3aed' },
      { accent:'#f97316', accent2:'#ea580c' },
      { accent:'#ec4899', accent2:'#db2777' },
      { accent:'#14b8a6', accent2:'#0d9488' }
    ]
    let h = 0
    for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return palette[h % palette.length]
  }

  function renderCardSectionHTML(card) {
    const txns = finAllTxns.filter(t => t.card_id === card.id)
    const monthTxns = finMonthTxns.filter(t => t.card_id === card.id)
    const charged = txns.filter(t => t.type === 'charge').reduce((s,t) => s + Number(t.amount), 0)
    const paid    = txns.filter(t => t.type === 'payment').reduce((s,t) => s + Number(t.amount), 0)
    const balance = charged - paid
    const limit   = Number(card.limit)
    const available = Math.max(limit - balance, 0)
    const pct = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0
    const collapsed = finCardCollapsed[card.id] !== false
    const txnType = finCardTxnType[card.id] || 'charge'
    const txnCat = finCardTxnCat[card.id]
    const theme = cardTheme(card.name)
    const cardVars = `--card-accent:${theme.accent};--card-accent-2:${theme.accent2};--card-bg:${darkTint(theme.accent,0.16)};--card-active:${darkTint(theme.accent,0.30)};--card-border:${hexA(theme.accent,0.32)};--card-glow:${hexA(theme.accent,0.12)}`
    return `<div class="fin-section card-section" data-card-id="${card.id}" style="${cardVars}">
      <div class="fin-section-row fin-toggle-row card-toggle-hdr" data-card-id="${card.id}" style="align-items:flex-start">
        <div style="flex:1;min-width:0">
          <div class="card-tile-header">
            <span class="card-tile-name">${escHtml(card.name)}</span>
            <span class="card-tile-balance">${fmtAmount(balance)}</span>
          </div>
          <div class="card-tile-track" style="margin-bottom:4px"><div class="card-tile-fill${pct > 80 ? ' danger' : ''}" style="width:${pct.toFixed(1)}%"></div></div>
          <div class="card-tile-meta">
            <span class="card-limit-tap" data-card-id="${card.id}" data-limit="${limit}" title="Tap to edit">Limit <span class="card-limit-val">${fmtAmount(limit)}</span> ✎</span>
            <span>Available ${fmtAmount(available)}</span>
          </div>
        </div>
      </div>
      <div id="card-body-${card.id}" style="display:${collapsed ? 'none' : 'block'}">
        <div id="card-donut-area-${card.id}"></div>
        <div class="fin-section-row" style="margin-top:12px;margin-bottom:4px">
          <span class="log-section-title" style="margin-bottom:0">Transactions</span>
          <button class="fin-add-btn card-add-btn" data-card-id="${card.id}">+ Add</button>
        </div>
        <div class="add-expense-form card-txn-form" id="card-form-${card.id}" style="display:none;margin-top:8px">
          <div class="fin-form-row">
            <span class="fin-form-label">Type</span>
            <div class="txn-type-toggle">
              <button class="txn-type-btn charge${txnType==='charge'?' selected':''}" data-card-id="${card.id}" data-type="charge" type="button">Charge</button>
              <button class="txn-type-btn payment${txnType==='payment'?' selected':''}" data-card-id="${card.id}" data-type="payment" type="button">Payment</button>
            </div>
          </div>
          <div class="fin-form-row">
            <span class="fin-form-label">Amount</span>
            <input class="fin-form-input" id="card-amt-${card.id}" type="number" min="0" step="0.001" placeholder="0.000" inputmode="decimal">
          </div>
          <div class="fin-form-row">
            <span class="fin-form-label">Label</span>
            <input class="fin-form-input" id="card-lbl-${card.id}" type="text" placeholder="What was this?" maxlength="80">
          </div>
          <div class="fin-form-row">
            <span class="fin-form-label">Category</span>
            <div class="cat-picker-wrap" id="card-cat-wrap-${card.id}">
              <button class="cat-picker-btn" id="card-cat-btn-${card.id}" type="button">
                <span class="cat-picker-dot" id="card-cat-dot-${card.id}" style="background:${txnCat?.color || '#6b7280'}"></span>
                <span id="card-cat-txt-${card.id}">${txnCat?.name || 'None'}</span>
                <span class="cat-picker-chevron">▾</span>
              </button>
              <div class="cat-dropdown" id="card-cat-dd-${card.id}" style="display:none"></div>
            </div>
          </div>
          <div class="fin-form-row">
            <span class="fin-form-label">Date</span>
            <input class="fin-form-input" id="card-date-${card.id}" type="date" value="${todayStr()}">
          </div>
          <div class="fin-form-row">
            <span class="fin-form-label">Notes</span>
            <textarea class="fin-form-input" id="card-notes-${card.id}" placeholder="Optional..." rows="2" style="resize:none"></textarea>
          </div>
          <div class="fin-form-actions">
            <button class="fin-confirm-btn card-txn-save" id="card-save-${card.id}" data-card-id="${card.id}" disabled>Save</button>
            <button class="fin-cancel-link card-txn-cancel" data-card-id="${card.id}" type="button">Cancel</button>
          </div>
        </div>
        <div id="card-list-${card.id}" style="margin-top:8px">${cardTxnListHTML(card.id, monthTxns)}</div>
      </div>
    </div>`
  }

  function cardTxnListHTML(cardId, txns) {
    if (!txns.length) return '<div class="fin-empty">No transactions this month</div>'
    return `<div class="log-card">${txns.map(t => {
      const isPayment = t.type === 'payment'
      return `<div class="txn-row" data-id="${t.id}" data-card-id="${cardId}">
        <span class="txn-sign ${t.type}">${isPayment ? '+' : '−'}</span>
        <div class="txn-meta">
          <div class="txn-label">${escHtml(t.label)}</div>
          <div class="txn-sub">${t.category ? escHtml(t.category) + ' · ' : ''}${fmtDateShort(t.date)}</div>
        </div>
        <div class="txn-amount ${t.type}">${fmtAmount(t.amount)}</div>
        <button class="txn-del-btn" data-del="${t.id}" aria-label="Delete">×</button>
      </div>`
    }).join('')}</div>`
  }

  function drawCardDonut(cardId) {
    const area = $(`card-donut-area-${cardId}`)
    if (!area) return
    const catTotals = {}
    finAllTxns.filter(t => t.card_id === cardId && t.type === 'charge').forEach(t => {
      catTotals[t.category || 'Other'] = (catTotals[t.category || 'Other'] || 0) + Number(t.amount)
    })
    if (!Object.keys(catTotals).length) { area.innerHTML = ''; return }
    const entries = donutEntries(catTotals, n => finCategories.find(c => c.name === n)?.color || DONUT_OTHER_COLOR)
    area.innerHTML = `
      <div class="donut-wrap donut-wrap-sm">
        <canvas id="card-donut-${cardId}"></canvas>
        <div class="donut-center" id="card-donut-ctr-${cardId}"></div>
      </div>
      <div class="donut-legend" id="card-donut-leg-${cardId}"></div>`
    finCardCharts[cardId] = buildDonut($(`card-donut-${cardId}`), entries, {
      centerEl: $(`card-donut-ctr-${cardId}`),
      legendEl: $(`card-donut-leg-${cardId}`),
      centerLabel: 'charges',
    })
  }

  function wireCardEvents() {
    const container = $('fin-cards-container')
    if (!container) return

    container.querySelectorAll('.card-toggle-hdr').forEach(hdr => {
      hdr.addEventListener('click', ev => {
        if (ev.target.closest('.card-limit-tap') || ev.target.closest('input')) return
        const cardId = hdr.dataset.cardId
        const body = $(`card-body-${cardId}`)
        const isCollapsed = finCardCollapsed[cardId] !== false
        finCardCollapsed[cardId] = !isCollapsed
        if (body) body.style.display = isCollapsed ? 'block' : 'none'
        if (isCollapsed) drawCardDonut(cardId)
        else { if (finCardCharts[cardId]) { finCardCharts[cardId].destroy(); delete finCardCharts[cardId] } }
      })
    })

    container.querySelectorAll('.card-limit-tap').forEach(el => {
      el.style.cursor = 'pointer'
      el.addEventListener('click', async () => {
        const cardId = el.dataset.cardId
        const inp = document.createElement('input')
        inp.type = 'number'; inp.step = '0.001'; inp.min = '0'
        inp.value = Number(el.dataset.limit).toFixed(3)
        inp.style.cssText = 'width:100px;font-size:11px;padding:2px 5px;border-radius:4px;border:1px solid var(--accent);background:var(--bg);color:var(--text);font-family:inherit'
        el.replaceWith(inp); inp.focus(); inp.select()
        async function commitLimit() {
          const newVal = parseFloat(inp.value)
          if (!isNaN(newVal) && newVal >= 0) {
            await supabase.from('cards').update({ limit: newVal }).eq('id', cardId)
            const card = finCards.find(c => c.id === cardId)
            if (card) card.limit = newVal
          }
          renderCardSections()
        }
        inp.addEventListener('blur', commitLimit)
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') renderCardSections() })
      })
    })

    container.querySelectorAll('.card-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cardId = btn.dataset.cardId
        const form = $(`card-form-${cardId}`)
        if (!form) return
        container.querySelectorAll('.card-txn-form').forEach(f => {
          if (f.id !== `card-form-${cardId}`) {
            f.style.display = 'none'
            const cid = f.id.replace('card-form-', '')
            const ob = container.querySelector(`.card-add-btn[data-card-id="${cid}"]`)
            if (ob) ob.style.display = ''
          }
        })
        form.style.display = 'block'
        btn.style.display = 'none'
        const dateInp = $(`card-date-${cardId}`)
        if (dateInp) dateInp.value = todayStr()
        const amtInp = $(`card-amt-${cardId}`)
        if (amtInp) amtInp.focus()
      })
    })

    container.querySelectorAll('.card-txn-cancel').forEach(btn => {
      btn.addEventListener('click', () => closeCardForm(btn.dataset.cardId))
    })

    container.querySelectorAll('.txn-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cardId = btn.dataset.cardId, type = btn.dataset.type
        finCardTxnType[cardId] = type
        const form = $(`card-form-${cardId}`)
        if (form) form.querySelectorAll('.txn-type-btn').forEach(b => b.classList.toggle('selected', b.dataset.type === type))
      })
    })

    container.querySelectorAll('.card-txn-form').forEach(form => {
      const cardId = form.id.replace('card-form-', '')
      const amtInp = $(`card-amt-${cardId}`), lblInp = $(`card-lbl-${cardId}`)
      if (amtInp) amtInp.addEventListener('input', () => validateCardForm(cardId))
      if (lblInp) lblInp.addEventListener('input', () => validateCardForm(cardId))
    })

    container.querySelectorAll('.card-txn-save').forEach(btn => {
      btn.addEventListener('click', () => submitCardTransaction(btn.dataset.cardId))
    })

    container.querySelectorAll('[id^="card-cat-btn-"]').forEach(btn => {
      const cardId = btn.id.replace('card-cat-btn-', '')
      const dropdown = $(`card-cat-dd-${cardId}`)
      if (!dropdown) return
      btn.addEventListener('click', ev => {
        ev.stopPropagation()
        if (dropdown.style.display !== 'none') { dropdown.style.display = 'none'; return }
        const currentCat = finCardTxnCat[cardId]?.name || null
        let html = `<div class="cat-option${!currentCat?' selected':''}" data-cat="" data-color="#6b7280"><div class="cat-option-dot" style="background:#6b7280"></div>None</div>`
        html += finCategories.map(cat => `<div class="cat-option${cat.name===currentCat?' selected':''}" data-cat="${escHtml(cat.name)}" data-color="${cat.color}"><div class="cat-option-dot" style="background:${cat.color}"></div>${escHtml(cat.name)}</div>`).join('')
        dropdown.innerHTML = html
        dropdown.querySelectorAll('.cat-option').forEach(opt => {
          opt.addEventListener('click', () => {
            finCardTxnCat[cardId] = { name: opt.dataset.cat || null, color: opt.dataset.color }
            const dot = $(`card-cat-dot-${cardId}`), txt = $(`card-cat-txt-${cardId}`)
            if (dot) dot.style.background = opt.dataset.color
            if (txt) txt.textContent = opt.dataset.cat || 'None'
            dropdown.style.display = 'none'
          })
        })
        dropdown.style.display = 'block'
      })
    })

    // bind the outside-click dropdown-closer ONCE (wireCardEvents runs on every render)
    if (!cardDocClickBound) {
      cardDocClickBound = true
      document.addEventListener('click', ev => {
        const c = $('fin-cards-container')
        if (!c) return
        c.querySelectorAll('[id^="card-cat-dd-"]').forEach(dd => {
          const cid = dd.id.replace('card-cat-dd-', '')
          const wrap = $(`card-cat-wrap-${cid}`)
          if (wrap && !wrap.contains(ev.target)) dd.style.display = 'none'
        })
      })
    }

    container.querySelectorAll('.txn-row').forEach(row => {
      row.addEventListener('click', ev => {
        if (ev.target.closest('.txn-del-btn')) return
        showTxnEditForm(row.dataset.id)
      })
    })

    container.querySelectorAll('.txn-del-btn').forEach(btn => {
      btn.addEventListener('click', ev => { ev.stopPropagation(); showTxnDeleteConfirm(btn.dataset.del) })
    })
  }

  function validateCardForm(cardId) {
    const btn = $(`card-save-${cardId}`); if (!btn) return
    const amt = parseFloat($(`card-amt-${cardId}`)?.value)
    const lbl = $(`card-lbl-${cardId}`)?.value?.trim()
    btn.disabled = !(amt > 0 && lbl)
  }

  function closeCardForm(cardId) {
    const form = $(`card-form-${cardId}`)
    const addBtn = document.querySelector(`.card-add-btn[data-card-id="${cardId}"]`)
    if (form) form.style.display = 'none'
    if (addBtn) addBtn.style.display = ''
    const saveBtn = $(`card-save-${cardId}`)
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Save' }
    ;[$(`card-amt-${cardId}`), $(`card-lbl-${cardId}`), $(`card-notes-${cardId}`)].forEach(el => { if (el) el.value = '' })
    const dd = $(`card-cat-dd-${cardId}`); if (dd) dd.style.display = 'none'
    finCardTxnCat[cardId] = null
    const dot = $(`card-cat-dot-${cardId}`), txt = $(`card-cat-txt-${cardId}`)
    if (dot) dot.style.background = '#6b7280'
    if (txt) txt.textContent = 'None'
  }

  async function submitCardTransaction(cardId) {
    const btn = $(`card-save-${cardId}`); if (!btn) return
    btn.disabled = true; btn.textContent = 'Saving...'
    const amount = Math.round(parseFloat($(`card-amt-${cardId}`)?.value) * 1000) / 1000
    const label = $(`card-lbl-${cardId}`)?.value.trim()
    const date = $(`card-date-${cardId}`)?.value || todayStr()
    const notes = $(`card-notes-${cardId}`)?.value.trim() || null
    const txnType = finCardTxnType[cardId] || 'charge'
    const catName = finCardTxnCat[cardId]?.name || null
    const { data, error } = await supabase.from('card_transactions')
      .insert({ card_id: cardId, type: txnType, amount, label, category: catName, date, notes })
      .select().maybeSingle()
    if (error) { showToast('Could not add transaction', true); btn.disabled = false; btn.textContent = 'Save'; return }
    finAllTxns.unshift(data)
    finAllTxns.sort((a,b) => b.date.localeCompare(a.date))
    finMonthTxns = getPeriodTxns(finAllTxns, finMonth)
    closeCardForm(cardId)
    renderCardSections()
    showToast('Transaction added ✓')
  }

  function showTxnEditForm(id) {
    const t = finAllTxns.find(x => x.id === id); if (!t) return
    const row = document.querySelector(`.txn-row[data-id="${id}"]`); if (!row) return
    const form = document.createElement('div')
    form.className = 'expense-edit-form'
    form.dataset.editId = id
    const cardOpts = finCards.map(c => `<option value="${c.id}"${c.id === t.card_id ? ' selected' : ''}>${escHtml(c.name)}</option>`).join('')
    const catOpts = `<option value="">None</option>` + finCategories.map(c => `<option value="${escHtml(c.name)}"${c.name === t.category ? ' selected' : ''}>${escHtml(c.name)}</option>`).join('')
    form.innerHTML = `
      <div class="expense-edit-grid">
        <div class="expense-edit-row">
          <select class="expense-edit-inp" id="te-card">${cardOpts}</select>
          <select class="expense-edit-inp" id="te-type" style="max-width:110px">
            <option value="charge"${t.type==='charge'?' selected':''}>Charge</option>
            <option value="payment"${t.type==='payment'?' selected':''}>Payment</option>
          </select>
        </div>
        <div class="expense-edit-row">
          <input class="expense-edit-inp" id="te-label" value="${escHtml(t.label)}" placeholder="Label" maxlength="80">
          <input class="expense-edit-inp" id="te-amount" type="number" value="${t.amount}" step="0.001" min="0" style="max-width:90px" inputmode="decimal">
        </div>
        <div class="expense-edit-row">
          <input class="expense-edit-inp" id="te-date" type="date" value="${t.date}" style="max-width:140px">
          <select class="expense-edit-inp" id="te-cat">${catOpts}</select>
        </div>
        <div class="expense-edit-row" style="justify-content:flex-end">
          <button class="expense-edit-cancel" id="te-cancel">Cancel</button>
          <button class="expense-edit-save" id="te-save">Save</button>
        </div>
      </div>`
    row.replaceWith(form)
    form.querySelector('#te-cancel').addEventListener('click', () => renderCardSections())
    form.querySelector('#te-save').addEventListener('click', async () => {
      const label = form.querySelector('#te-label').value.trim(); if (!label) return
      const amount = parseFloat(form.querySelector('#te-amount').value); if (isNaN(amount)) return
      const date = form.querySelector('#te-date').value
      const card_id = form.querySelector('#te-card').value
      const type = form.querySelector('#te-type').value
      const category = form.querySelector('#te-cat').value || null
      const btn = form.querySelector('#te-save'); btn.textContent = 'Saving...'; btn.disabled = true
      const { error } = await supabase.from('card_transactions').update({ label, amount, date, card_id, type, category }).eq('id', id)
      if (error) { btn.textContent = 'Save'; btn.disabled = false; showToast('Update failed', true); return }
      const idx = finAllTxns.findIndex(x => x.id === id)
      if (idx !== -1) finAllTxns[idx] = { ...finAllTxns[idx], label, amount, date, card_id, type, category }
      finMonthTxns = getPeriodTxns(finAllTxns, finMonth)
      renderCardSections()
    })
  }

  function showTxnDeleteConfirm(id) {
    cancelTxnDeleteConfirm()
    pendingTxnDeleteId = id
    const row = document.querySelector(`.txn-row[data-id="${id}"]`)
    if (!row) return
    const conf = document.createElement('div')
    conf.className = 'expense-confirm-row'; conf.id = `txn-conf-${id}`
    conf.innerHTML = `<span class="expense-confirm-text">Delete this transaction?</span><button class="expense-confirm-no">Cancel</button><button class="expense-confirm-yes">Delete</button>`
    row.replaceWith(conf)
    conf.querySelector('.expense-confirm-no').addEventListener('click', () => { pendingTxnDeleteId = null; renderCardSections() })
    conf.querySelector('.expense-confirm-yes').addEventListener('click', async () => {
      const { error } = await supabase.from('card_transactions').delete().eq('id', id)
      if (error) { showToast('Delete failed', true); return }
      finAllTxns = finAllTxns.filter(t => t.id !== id)
      finMonthTxns = getPeriodTxns(finAllTxns, finMonth)
      pendingTxnDeleteId = null
      renderCardSections()
    })
  }

  function cancelTxnDeleteConfirm() {
    if (!pendingTxnDeleteId) return
    const el = $(`txn-conf-${pendingTxnDeleteId}`); if (el) el.remove()
    pendingTxnDeleteId = null
  }

  // ── HEALTH ────────────────────────────────────────────────
  const HLTH_TYPES = [
    { key: 'gym',     label: 'Gym',     emoji: '🏋️' },
    { key: 'physio',  label: 'Physio',  emoji: '🦴' },
    { key: 'psycho',  label: 'Psycho',  emoji: '🧠' },
    { key: 'dentist', label: 'Dentist', emoji: '🦷' },
    { key: 'other',   label: 'Other',   emoji: '✦'  },
  ]
  const HLTH_CHIP = {
    gym:     'rgba(34,197,94,.15);color:#22c55e',
    physio:  'rgba(59,130,246,.15);color:#3b82f6',
    psycho:  'rgba(168,85,247,.15);color:#a855f7',
    dentist: 'rgba(249,115,22,.15);color:#f97316',
    other:   'rgba(107,114,128,.15);color:#6b7280',
  }
  const HLTH_BORDER = {
    gym:'#22c55e', physio:'#3b82f6', psycho:'#a855f7', dentist:'#f97316', other:'#6b7280'
  }
  const HLTH_HIDDEN_KEY = 'hassan-hlth-hidden'
  const HLTH_PRIVATE_KEY = 'hassan-hlth-private'
  let hlthPrivateTypes = new Set() // types hidden from analytics + data

  let hlthMonth = '', hlthSessions = [], hlthLoaded = false
  let hlthHiddenTypes = new Set(), selectedHlthType = 'gym', pendingHlthDeleteId = null

  function hlthNormalizeType(raw) {
    const known = HLTH_TYPES.map(t => t.key)
    const lower = (raw || '').toLowerCase()
    return known.includes(lower) ? lower : 'other'
  }
  function hlthChipStyle(key) { return `background:${HLTH_CHIP[key] || HLTH_CHIP.other}` }

  function hlthLoadHidden() {
    try { const r = localStorage.getItem(HLTH_HIDDEN_KEY); if (r) hlthHiddenTypes = new Set(JSON.parse(r)) } catch {}
    try { const r = localStorage.getItem(HLTH_PRIVATE_KEY); if (r) hlthPrivateTypes = new Set(JSON.parse(r)) } catch {}
  }
  function hlthSaveHidden() {
    localStorage.setItem(HLTH_HIDDEN_KEY, JSON.stringify([...hlthHiddenTypes]))
  }
  function hlthSavePrivate() {
    localStorage.setItem(HLTH_PRIVATE_KEY, JSON.stringify([...hlthPrivateTypes]))
  }

  function renderHlthTypes() {
    const grid = $('hlth-types-grid'); if (!grid) return
    const counts = {}
    hlthSessions.forEach(s => { const k = hlthNormalizeType(s.type); counts[k] = (counts[k]||0)+1 })

    const visibleTypes = HLTH_TYPES.filter(t => !hlthHiddenTypes.has(t.key))
    const hiddenTypes  = HLTH_TYPES.filter(t =>  hlthHiddenTypes.has(t.key))

    // render visible tiles
    grid.innerHTML = visibleTypes.map(t => {
      const border = HLTH_BORDER[t.key]
      const subLabel = counts[t.key] ? `${counts[t.key]} this month` : 'No sessions this month'
      return `<div class="hlth-type-tile" data-type="${t.key}" style="border-color:${border}33;--tile-accent:${border}">
        <div class="hlth-type-tile-bar" style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${border};border-radius:var(--radius) 0 0 var(--radius)"></div>
        <div class="hlth-type-icon">${t.emoji}</div>
        <div class="hlth-type-info">
          <div class="hlth-type-label">${t.label}</div>
          <div class="hlth-type-sub">${subLabel}</div>
        </div>
        <div class="hlth-type-count">${counts[t.key] || 0}</div>
      </div>`
    }).join('')
    grid.querySelectorAll('.hlth-type-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        hlthHiddenTypes.add(tile.dataset.type)
        hlthSaveHidden(); renderHlthTypes(); renderHlthList()
      })
    })

    // hidden section
    const wrap  = $('hlth-hidden-wrap')
    const hgrid = $('hlth-hidden-grid')
    const lbl   = $('hlth-hidden-label-text')
    if (!wrap || !hgrid) return

    if (hiddenTypes.length === 0) {
      wrap.style.display = 'none'
    } else {
      wrap.style.display = 'block'
      if (lbl) lbl.textContent = `Hidden (${hiddenTypes.length})`
      hgrid.innerHTML = hiddenTypes.map(t => `
        <div class="hlth-type-tile" data-type="${t.key}" style="border-color:var(--border)">
          <div class="hlth-type-tile-bar" style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${HLTH_BORDER[t.key]};border-radius:var(--radius) 0 0 var(--radius)"></div>
          <div class="hlth-type-icon">${t.emoji}</div>
          <div class="hlth-type-info">
            <div class="hlth-type-label">${t.label}</div>
            <div class="hlth-type-sub">Hidden — tap to show</div>
          </div>
          <div class="hlth-type-count">${counts[t.key] || 0}</div>
        </div>`).join('')
      hgrid.querySelectorAll('.hlth-type-tile').forEach(tile => {
        tile.addEventListener('click', () => {
          hlthHiddenTypes.delete(tile.dataset.type)
          hlthSaveHidden(); renderHlthTypes(); renderHlthList()
        })
      })
    }
  }

  function renderHlthList() {
    const container = $('hlth-session-list'); if (!container) return
    const visible = hlthSessions.filter(s => !hlthHiddenTypes.has(hlthNormalizeType(s.type)))
    const hidden  = hlthSessions.filter(s =>  hlthHiddenTypes.has(hlthNormalizeType(s.type)))

    if (visible.length === 0) {
      container.innerHTML = '<div class="fin-empty">No sessions this month</div>'
    } else {
      container.innerHTML = `<div class="log-card">${visible.map(s => {
        const key = hlthNormalizeType(s.type)
        return `<div class="hlth-session-row" data-id="${s.id}" style="cursor:pointer">
          <span class="hlth-type-chip" style="${hlthChipStyle(key)}">${escHtml(s.type || 'Session')}</span>
          <div class="hlth-session-meta">
            <div class="hlth-session-date">${fmtDateShort(s.date)}</div>
            ${s.notes ? `<div class="hlth-session-notes">${escHtml(s.notes)}</div>` : ''}
          </div>
          <button class="hlth-del-btn" data-del="${s.id}" aria-label="Delete">×</button>
        </div>`
      }).join('')}</div>`
      container.querySelectorAll('.hlth-session-row').forEach(row => {
        row.addEventListener('click', ev => {
          if (ev.target.closest('.hlth-del-btn')) return
          showHlthEditForm(row.dataset.id)
        })
      })
      container.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', ev => { ev.stopPropagation(); showHlthDeleteConfirm(btn.dataset.del) })
      })
    }

    // render hidden sessions inside the hidden section
    const hgrid = $('hlth-hidden-grid')
    if (hgrid && hidden.length > 0) {
      // find or create a hidden sessions list below the hidden tiles
      let hiddenList = $('hlth-hidden-session-list')
      if (!hiddenList) {
        hiddenList = document.createElement('div')
        hiddenList.id = 'hlth-hidden-session-list'
        $('hlth-hidden-section')?.appendChild(hiddenList)
      }
      hiddenList.innerHTML = `<div class="log-card" style="opacity:.6">${hidden.map(s => {
        const key = hlthNormalizeType(s.type)
        return `<div class="hlth-session-row" data-id="${s.id}">
          <span class="hlth-type-chip" style="${hlthChipStyle(key)}">${escHtml(s.type || 'Session')}</span>
          <div class="hlth-session-meta">
            <div class="hlth-session-date">${fmtDateShort(s.date)}</div>
            ${s.notes ? `<div class="hlth-session-notes">${escHtml(s.notes)}</div>` : ''}
          </div>
          <button class="hlth-del-btn" data-del="${s.id}" aria-label="Delete">×</button>
        </div>`
      }).join('')}</div>`
      hiddenList.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', ev => { ev.stopPropagation(); showHlthDeleteConfirm(btn.dataset.del) })
      })
    } else {
      const hiddenList = $('hlth-hidden-session-list')
      if (hiddenList) hiddenList.innerHTML = ''
    }
  }

  function showHlthEditForm(id) {
    const s = hlthSessions.find(x => x.id === id); if (!s) return
    const row = document.querySelector(`.hlth-session-row[data-id="${id}"]`); if (!row) return
    const form = document.createElement('div')
    form.className = 'expense-edit-form'
    form.dataset.editId = id
    form.innerHTML = `
      <div class="expense-edit-grid">
        <div class="expense-edit-row">
          <select class="expense-edit-inp" id="he-type">
            ${HLTH_TYPES.map(t => `<option value="${t.key}"${hlthNormalizeType(s.type) === t.key ? ' selected' : ''}>${t.label}</option>`).join('')}
          </select>
          <input class="expense-edit-inp" id="he-date" type="date" value="${s.date}" style="max-width:140px">
        </div>
        <div class="expense-edit-row">
          <input class="expense-edit-inp" id="he-notes" value="${escHtml(s.notes || '')}" placeholder="Notes (optional)">
        </div>
        <div class="expense-edit-row" style="justify-content:flex-end">
          <button class="expense-edit-cancel" id="he-cancel">Cancel</button>
          <button class="expense-edit-save" id="he-save">Save</button>
        </div>
      </div>`
    row.replaceWith(form)
    form.querySelector('#he-cancel').addEventListener('click', () => renderHlthList())
    form.querySelector('#he-save').addEventListener('click', async () => {
      const type = form.querySelector('#he-type').value
      const date = form.querySelector('#he-date').value
      const notes = form.querySelector('#he-notes').value.trim() || null
      const btn = form.querySelector('#he-save'); btn.textContent = 'Saving...'; btn.disabled = true
      const { error } = await supabase.from('health_sessions').update({ type, date, notes }).eq('id', id)
      if (error) { btn.textContent = 'Save'; btn.disabled = false; showToast('Update failed', true); return }
      const idx = hlthSessions.findIndex(x => x.id === id)
      if (idx !== -1) hlthSessions[idx] = { ...hlthSessions[idx], type, date, notes }
      hlthSessions.sort((a, b) => b.date.localeCompare(a.date))
      renderHlthTypes(); renderHlthList()
    })
  }

  function showHlthDeleteConfirm(id) {
    cancelHlthDeleteConfirm(); pendingHlthDeleteId = id
    const row = document.querySelector(`.hlth-session-row[data-id="${id}"]`); if (!row) return
    const conf = document.createElement('div')
    conf.className = 'expense-confirm-row'; conf.id = `hlth-conf-${id}`
    conf.innerHTML = `<span class="expense-confirm-text">Delete this session?</span><button class="expense-confirm-no">Cancel</button><button class="expense-confirm-yes">Delete</button>`
    row.replaceWith(conf)
    conf.querySelector('.expense-confirm-no').addEventListener('click', () => { pendingHlthDeleteId = null; renderHlthList() })
    conf.querySelector('.expense-confirm-yes').addEventListener('click', async () => {
      const { error } = await supabase.from('health_sessions').delete().eq('id', id)
      if (error) { showToast('Delete failed', true); return }
      hlthSessions = hlthSessions.filter(s => s.id !== id)
      hlthNeedsRefresh = true; anlNeedsRefresh = true
      pendingHlthDeleteId = null; renderHlthTypes(); renderHlthList()
    })
  }

  function cancelHlthDeleteConfirm() {
    if (!pendingHlthDeleteId) return
    const el = $(`hlth-conf-${pendingHlthDeleteId}`); if (el) el.remove()
    pendingHlthDeleteId = null
  }

  function buildHlthTypeSelector() {
    const sel = $('hlth-type-selector'); if (!sel) return
    sel.innerHTML = HLTH_TYPES.map(t => `<div class="type-opt${t.key === selectedHlthType ? ' selected' : ''}" data-type="${t.key}">${t.label}</div>`).join('')
    sel.querySelectorAll('.type-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedHlthType = opt.dataset.type
        sel.querySelectorAll('.type-opt').forEach(o => o.classList.toggle('selected', o.dataset.type === selectedHlthType))
        const row = $('hlth-custom-row')
        if (row) row.style.display = selectedHlthType === 'other' ? 'flex' : 'none'
      })
    })
  }

  function bindHlthForm() {
    const addBtn = $('hlth-add-btn'), form = $('hlth-add-form'), cancelBtn = $('hlth-cancel-btn')
    if (!addBtn) return
    addBtn.addEventListener('click', () => {
      form.style.display = 'block'; addBtn.style.display = 'none'
      $('hlth-date').value = todayStr(); buildHlthTypeSelector()
    })
    cancelBtn.addEventListener('click', closeHlthForm)
    $('hlth-confirm-btn').addEventListener('click', submitHlthSession)
  }

  async function submitHlthSession() {
    const btn = $('hlth-confirm-btn')
    btn.disabled = true; btn.textContent = 'Saving...'
    let type = selectedHlthType
    if (type === 'other') { const v = $('hlth-custom-input')?.value.trim(); type = v || 'Other' }
    const date = $('hlth-date').value || todayStr()
    const notes = $('hlth-notes').value.trim() || null
    const { data, error } = await supabase.from('health_sessions').insert({ type, date, notes, visible: true }).select().maybeSingle()
    if (error) { showToast('Could not add session', true); btn.disabled = false; btn.textContent = 'Save'; return }
    if (date.startsWith(hlthMonth)) {
      hlthSessions.unshift(data); hlthSessions.sort((a,b) => b.date.localeCompare(a.date))
    }
    hlthNeedsRefresh = true; anlNeedsRefresh = true
    closeHlthForm(); renderHlthTypes(); renderHlthList(); showToast('Session added ✓')
  }

  function closeHlthForm() {
    const form = $('hlth-add-form'), addBtn = $('hlth-add-btn')
    if (form) form.style.display = 'none'
    if (addBtn) addBtn.style.display = ''
    const btn = $('hlth-confirm-btn'); if (btn) { btn.disabled = false; btn.textContent = 'Save' }
    if ($('hlth-notes')) $('hlth-notes').value = ''
    if ($('hlth-custom-input')) $('hlth-custom-input').value = ''
    const cr = $('hlth-custom-row'); if (cr) cr.style.display = 'none'
  }

  async function loadHlthData() {
    const { data } = await supabase.from('health_sessions').select('*')
      .gte('date', `${hlthMonth}-01`).lt('date', firstDayOfNextMonth(hlthMonth))
      .order('date', { ascending: false })
    hlthSessions = data || []
    renderHlthTypes(); renderHlthList()
  }

  function setHlthMonth(ym) {
    hlthMonth = ym
    const lbl = $('hlth-month-label'); if (lbl) lbl.textContent = finMonthLabel(ym)
    const nextBtn = $('hlth-next'); if (nextBtn) nextBtn.disabled = ym >= currentYM()
    cancelHlthDeleteConfirm(); closeHlthForm()
  }

  $('hlth-prev').addEventListener('click', () => {
    if (!hlthMonth) return
    const [y,m] = hlthMonth.split('-').map(Number)
    const prev = m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`
    setHlthMonth(prev); loadHlthData()
  })

  $('hlth-next').addEventListener('click', () => {
    if (!hlthMonth) return
    const [y,m] = hlthMonth.split('-').map(Number)
    const next = m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,'0')}`
    if (next > currentYM()) return
    setHlthMonth(next); loadHlthData()
  })

  async function initHlthTab() {
    hlthLoadHidden(); setHlthMonth(currentYM()); bindHlthForm()
    // bind hidden section toggle
    const toggle = $('hlth-hidden-toggle')
    if (toggle) {
      toggle.addEventListener('click', () => {
        const section = $('hlth-hidden-section'), chevron = $('hlth-hidden-chevron')
        const open = section.classList.toggle('open')
        if (chevron) chevron.classList.toggle('open', open)
      })
    }
    await loadHlthData()
  }

  document.querySelector('.nav-item[data-tab="health"]').addEventListener('click', () => {
    if (!hlthLoaded) { hlthLoaded = true; initHlthTab() }
  })


  // ── ANALYTICS ────────────────────────────────────────────
  let anlLoaded = false
  let anlMonth = null // set to currentPeriodYM() after cycles load on first visit
  let anlPeriodYM = null // cached cap for next-button; set in loadAnalytics
  let anlSpendChart = null, anlTrendChart = null
  let anlExpensesAll = [], anlPrayersAll = []

  const PRAYER_KEYS = ['fajr','dhuhr','asr','maghrib','isha']
  const PRAYER_LABELS = { fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' }

  function fmtDateMed(ds) {
    const [y,m,d] = ds.split('-').map(Number)
    return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  }

  function renderMissedPrayers(rows) {
    const today = todayStr()
    const missed = rows.filter(r => r.date < today && PRAYER_KEYS.some(k => !r[k]))

    const totals = { fajr:0, dhuhr:0, asr:0, maghrib:0, isha:0 }
    missed.forEach(r => PRAYER_KEYS.forEach(k => { if (!r[k]) totals[k]++ }))
    const totalMissed = PRAYER_KEYS.reduce((s,k) => s + totals[k], 0)

    const totalsEl = $('prayer-totals')
    if (totalsEl) {
      if (totalMissed === 0) {
        totalsEl.innerHTML = '<div class="prayer-all-done">All prayers up to date ✓</div>'
      } else {
        totalsEl.innerHTML = `<div class="prayer-totals-grid">${PRAYER_KEYS.map(k => `
          <div class="prayer-total-tile${totals[k] === 0 ? ' done' : ''}">
            <div class="prayer-total-count">${totals[k]}</div>
            <div class="prayer-total-label">${PRAYER_LABELS[k]}</div>
          </div>`).join('')}</div>`
      }
    }

    const listEl = $('prayer-missed-list')
    if (!listEl) return
    if (missed.length === 0) { listEl.innerHTML = ''; return }

    listEl.innerHTML = `<div class="log-card" style="margin-top:12px">${missed.slice(0, 90).map(r => {
      const missedPrayers = PRAYER_KEYS.filter(k => !r[k])
      return `<div class="prayer-missed-row" data-date="${r.date}">
        <div class="prayer-missed-date">${fmtDateMed(r.date)}</div>
        <div class="prayer-missed-chips">${missedPrayers.map(k => `<span class="prayer-chip missed">${PRAYER_LABELS[k]}</span>`).join('')}</div>
      </div>`
    }).join('')}</div>`

    listEl.querySelectorAll('.prayer-missed-row').forEach(row => {
      row.addEventListener('click', () => {
        const [y,m,d] = row.dataset.date.split('-').map(Number)
        switchTab('calendar')
        openDayView(y, m - 1, d)
      })
    })
  }

  function anlFmtMonth(ym) {
    const [y,m] = ym.split('-')
    return new Date(y, m-1, 1).toLocaleDateString('en-US', {month:'short', year:'numeric'})
  }

  async function initAnalytics() {
    // apply visibility
    const readCard = document.getElementById('anl-reading-card')
    if (readCard) readCard.style.display = showReadingInAnalytics ? '' : 'none'

    // month nav
    $('anl-prev-btn').addEventListener('click', () => {
      const [y,m] = anlMonth.split('-').map(Number)
      let pm = m - 1; let py = y
      if (pm < 1) { pm = 12; py-- }
      anlMonth = `${py}-${String(pm).padStart(2,'0')}`
      loadAnalytics()
    })
    $('anl-next-btn').addEventListener('click', () => {
      if (!anlPeriodYM || anlMonth >= anlPeriodYM) return
      const [y,m] = anlMonth.split('-').map(Number)
      let nm = m + 1; let ny = y
      if (nm > 12) { nm = 1; ny++ }
      anlMonth = `${ny}-${String(nm).padStart(2,'0')}`
      loadAnalytics()
    })
    await loadAnalytics()
  }

  async function loadAnalytics() {
    // ensure salary cycles are loaded so donut uses period boundaries, not calendar month
    if (!finCycles.length) await loadFinanceCycles()

    // default to current salary period on first visit (not necessarily the calendar month)
    if (!anlMonth) anlMonth = currentPeriodYM()

    $('anl-month-lbl').textContent = anlFmtMonth(anlMonth)

    // cap next at current period — period can be ahead of calendar month when cycle starts mid-month
    anlPeriodYM = currentPeriodYM()
    $('anl-next-btn').disabled = anlMonth >= anlPeriodYM
    $('anl-next-btn').style.opacity = anlMonth >= anlPeriodYM ? '0.3' : '1'

    // fetch in parallel — all expenses for quarterly + trend; prayers for missed section
    const [dtAll, expensesAll, cats, prayersAll] = await Promise.all([
      supabase.from('daily_tracking').select('*').order('date', {ascending:false}),
      supabase.from('expenses').select('date,amount,category').order('date'),
      supabase.from('categories').select('name,color'),
      supabase.from('prayers').select('*').lt('date', todayStr()).order('date', {ascending:false}),
    ])

    anlExpensesAll = expensesAll.data || []
    anlPrayersAll  = prayersAll.data  || []
    renderMissedPrayers(anlPrayersAll)
    renderReadingStats(dtAll.data || [], currentYM())
    renderSpendChart(anlExpensesAll, cats.data || [], anlMonth)
    renderTrendChart(anlExpensesAll, cats.data || [])
  }

  function localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function renderReadingStats(rows, month) {
    if (!showReadingInAnalytics) return
    const readRows = rows.filter(r => r.reading)
    const readSet = new Set(readRows.map(r => r.date))
    const loggedSet = new Set(rows.map(r => r.date))

    // streak = logged reading days in a row from most recent — gaps (unlogged days) don't break it
    const sortedDates = [...loggedSet].sort().reverse()
    let streak = 0
    for (const ds of sortedDates) {
      if (!readSet.has(ds)) break
      streak++
    }

    const monthCount = rows.filter(r => r.date.startsWith(month) && r.reading).length
    const total = readRows.length

    $('anl-reading-streak').textContent = streak
    $('anl-reading-month').textContent = monthCount
    $('anl-reading-total').textContent = total

    const card = document.getElementById('anl-reading-card')
    const statEls = card ? card.querySelectorAll('.anl-stat') : []
    if (statEls[0]) statEls[0].className = 'anl-stat ' + (streak > 0 ? 'anl-smoke-free' : '')
    if (statEls[1]) statEls[1].className = 'anl-stat'
    if (statEls[2]) statEls[2].className = 'anl-stat ' + (total > 0 ? 'anl-smoke-free' : '')
  }


  function renderSpendChart(expenses, cats, month) {
    const monthExp = getPeriodTxns(expenses, month)
    const catMap = {}
    cats.forEach(c => catMap[c.name] = c.color)

    const totals = {}
    monthExp.forEach(e => { totals[e.category] = (totals[e.category]||0) + Number(e.amount) })

    if (anlSpendChart) { anlSpendChart.destroy(); anlSpendChart = null }
    const canvas = $('anl-spend-canvas'), center = $('anl-spend-center'), leg = $('anl-spend-legend')

    if (Object.keys(totals).length === 0) {
      leg.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:16px 0">No expenses this month</div>'
      canvas.style.display = 'none'
      if (center) center.innerHTML = ''
      return
    }
    canvas.style.display = ''

    const entries = donutEntries(totals, n => catMap[n] || DONUT_OTHER_COLOR)
    anlSpendChart = buildDonut(canvas, entries, { centerEl: center, legendEl: leg })
  }

  function renderTrendChart(expenses, cats) {
    // one bar per month — full current year Jan–Dec
    const year = new Date().getFullYear()
    const months = Array.from({length:12}, (_,i) => `${year}-${String(i+1).padStart(2,'0')}`)
    const labels = months.map(m => { const [y,mo] = m.split('-'); return new Date(y,mo-1,1).toLocaleDateString('en-US',{month:'short'}) })
    const totals = months.map(m => parseFloat(getPeriodTxns(expenses, m).reduce((s,e)=>s+Number(e.amount),0).toFixed(3)))

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const textColor = isDark ? '#999999' : '#666666'
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

    if (anlTrendChart) { anlTrendChart.destroy(); anlTrendChart = null }
    const ctx = $('anl-trend-canvas').getContext('2d')
    anlTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: totals,
          backgroundColor: months.map(m => m === anlMonth ? '#3b82f6' : 'rgba(59,130,246,0.35)'),
          borderRadius: 5,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 }, autoSkip: false, maxRotation: 0 } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: v => v === 0 ? '0' : 'BD '+v } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` BHD ${Number(ctx.raw).toFixed(3)}` } }
        }
      }
    })
  }



  // ── EXPORT (Excel / multi-sheet) ─────────────────────────
  async function exportData() {
    const btn = $('sett-export-btn')
    if (!btn) return
    btn.textContent = 'Exporting...'
    btn.disabled = true
    try {
      const [dt, prayersD, meals, expenses, cards, txns, health, suppList, supps] = await Promise.all([
        supabase.from('daily_tracking').select('*').order('date'),
        supabase.from('prayers').select('*').order('date'),
        supabase.from('meals').select('*').order('date'),
        supabase.from('expenses').select('*').order('date'),
        supabase.from('cards').select('*').order('name'),
        supabase.from('card_transactions').select('*').order('date'),
        supabase.from('health_sessions').select('*').order('date'),
        supabase.from('supplement_list').select('*').order('name'),
        supabase.from('supplements').select('*').order('date'),
      ])

      const cardName = {}; (cards.data || []).forEach(c => cardName[c.id] = c.name)
      const suppName = {}; (suppList.data || []).forEach(s => suppName[s.id] = s.name)
      const yn = v => v == null ? '' : (v ? 'Yes' : 'No')
      const addSheet = (wb, rows, name) =>
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{}]), name)

      const wb = XLSX.utils.book_new()

      addSheet(wb, (expenses.data || []).map(r => ({
        Date: r.date, Label: r.label, Amount: r.amount, Category: r.category || '', Notes: r.notes || ''
      })), 'Expenses')

      addSheet(wb, (txns.data || []).map(r => ({
        Card: cardName[r.card_id] || '', Date: r.date, Type: r.type, Label: r.label,
        Amount: r.amount, Category: r.category || '', Notes: r.notes || ''
      })), 'Card Transactions')

      addSheet(wb, (dt.data || []).map(r => ({
        Date: r.date, Reading: yn(r.reading),
        Notes: r.notes || '', 'Notes Tomorrow': r.notes_tomorrow || ''
      })), 'Daily Tracking')

      addSheet(wb, (prayersD.data || []).map(r => ({
        Date: r.date, Fajr: yn(r.fajr), Dhuhr: yn(r.dhuhr), Asr: yn(r.asr),
        Maghrib: yn(r.maghrib), Isha: yn(r.isha)
      })), 'Prayers')

      addSheet(wb, (meals.data || []).map(r => ({
        Date: r.date, Breakfast: r.breakfast || '', Lunch: r.lunch || '', Dinner: r.dinner || ''
      })), 'Meals')

      addSheet(wb, (health.data || []).map(r => ({
        Date: r.date, Type: r.type, Notes: r.notes || ''
      })), 'Health')

      addSheet(wb, (supps.data || []).map(r => ({
        Date: r.date, Supplement: suppName[r.supplement_id] || '', Taken: yn(r.taken)
      })), 'Supplements')

      addSheet(wb, (suppList.data || []).map(r => ({
        Name: r.name, Active: yn(r.active)
      })), 'Supplement List')

      addSheet(wb, (cards.data || []).map(r => ({
        Name: r.name, Limit: r.limit, Visible: yn(r.visible)
      })), 'Cards')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `dashboard-${localDateStr(new Date())}.xlsx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Excel export downloaded ✓')
    } catch (e) {
      console.error(e)
      showToast('Export failed', true)
    }
    btn.textContent = 'Export All Data (Excel)'
    btn.disabled = false
  }

  // ── SETTINGS ─────────────────────────────────────────────
  let settLoaded = false

  async function initSettings() {
    await Promise.all([loadSettCategories(), loadSettSupplements(), loadSettCards()])
    wireSettEvents()
  }

  // ── Categories ──
  async function loadSettCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) {
      // sync finCategories if finance already loaded
      finCategories = data
      renderSettCatList(data)
    }
  }

  const SETT_CAT_PALETTE = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#6b7280']

  function renderSettCatList(cats) {
    const el = document.getElementById('sett-cat-list')
    if (!el) return
    if (!cats.length) { el.innerHTML = '<div style="padding:12px 14px;font-size:13px;color:var(--text3);background:var(--bg2);border-radius:var(--radius)">No categories yet</div>'; return }
    el.innerHTML = cats.map(c => `
      <div class="sett-row" data-cat-id="${c.id}" style="flex-wrap:wrap;gap:6px;align-items:center">
        <button class="sett-dot" data-cat-color-btn="${c.id}" data-current-color="${c.color}" style="background:${c.color};cursor:pointer;border:none;width:22px;height:22px;border-radius:50%;flex-shrink:0" title="Change color"></button>
        <input class="sett-rename-input" data-cat-name-inp="${c.id}" data-original-name="${escHtml(c.name)}" value="${escHtml(c.name)}" maxlength="40" style="flex:1;min-width:80px">
        <button class="sett-add-btn" data-cat-save="${c.id}" style="padding:5px 10px;font-size:12px">Save</button>
        <button class="sett-del-btn" data-cat-del="${c.id}" title="Delete">×</button>
        <div data-cat-palette="${c.id}" style="display:none;width:100%;padding:6px 0 2px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${SETT_CAT_PALETTE.map(hex => `<button data-pick-color="${hex}" data-pick-for="${c.id}" style="width:24px;height:24px;border-radius:50%;background:${hex};border:2px solid ${hex === c.color ? '#fff' : 'transparent'};cursor:pointer"></button>`).join('')}
          </div>
        </div>
      </div>`).join('')

    // color button toggle palette
    el.querySelectorAll('[data-cat-color-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.catColorBtn
        const palette = el.querySelector(`[data-cat-palette="${id}"]`)
        palette.style.display = palette.style.display === 'none' ? '' : 'none'
      })
    })

    // pick color swatch
    el.querySelectorAll('[data-pick-color]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.pickColor
        const id = swatch.dataset.pickFor
        const colorBtn = el.querySelector(`[data-cat-color-btn="${id}"]`)
        colorBtn.style.background = color
        colorBtn.dataset.currentColor = color
        // highlight selected
        el.querySelectorAll(`[data-pick-for="${id}"]`).forEach(s => s.style.border = `2px solid ${s.dataset.pickColor === color ? '#fff' : 'transparent'}`)
      })
    })

    // save
    el.querySelectorAll('[data-cat-save]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.catSave
        const nameInp = el.querySelector(`[data-cat-name-inp="${id}"]`)
        const colorBtn = el.querySelector(`[data-cat-color-btn="${id}"]`)
        const name = nameInp.value.trim(); if (!name) return
        const oldName = nameInp.dataset.originalName
        // dataset.currentColor is always a hex — style.background would
        // come back as "rgb(...)" and pollute the DB color format
        const color = colorBtn.dataset.currentColor
        btn.textContent = '✓'; btn.disabled = true
        await supabase.from('categories').update({ name, color }).eq('id', id)
        if (oldName && oldName !== name) {
          await Promise.all([
            supabase.from('expenses').update({ category: name }).eq('category', oldName),
            supabase.from('card_transactions').update({ category: name }).eq('category', oldName),
          ])
        }
        nameInp.dataset.originalName = name
        const cat = finCategories.find(c => c.id === id)
        if (cat) { cat.name = name; cat.color = color }
        setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false }, 800)
      })
    })

    // delete
    el.querySelectorAll('[data-cat-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.textContent === '×') { btn.textContent = '✓'; btn.title = 'Confirm delete'; return }
        const id = btn.dataset.catDel
        await supabase.from('categories').delete().eq('id', id)
        finCategories = finCategories.filter(c => c.id !== id)
        await loadSettCategories()
      })
    })
  }

  // ── Supplements ──
  async function loadSettSupplements() {
    const { data } = await supabase.from('supplement_list').select('*').order('name')
    renderSettSuppList(data || [])
  }

  function renderSettSuppList(supps) {
    const el = document.getElementById('sett-supp-list')
    if (!el) return
    if (!supps.length) { el.innerHTML = '<div style="padding:12px 14px;font-size:13px;color:var(--text3);background:var(--bg2);border-radius:var(--radius)">No supplements yet</div>'; return }
    el.innerHTML = supps.map(s => `
      <div class="sett-row" data-supp-id="${s.id}">
        <div class="sett-row-label">${escHtml(s.name)}</div>
        <button class="sett-toggle ${s.active ? 'on' : ''}" data-supp-toggle="${s.id}" data-active="${s.active}" style="margin-right:8px"></button>
        <button class="sett-del-btn" data-supp-del="${s.id}" title="Delete">×</button>
      </div>`).join('')
    el.querySelectorAll('[data-supp-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.suppToggle
        const newActive = btn.dataset.active !== 'true'
        await supabase.from('supplement_list').update({ active: newActive }).eq('id', id)
        btn.dataset.active = newActive
        btn.classList.toggle('on', newActive)
        todayNeedsRefresh = true
      })
    })
    el.querySelectorAll('[data-supp-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.textContent === '×') { btn.textContent = '✓'; btn.title = 'Confirm delete'; return }
        const id = btn.dataset.suppDel
        await supabase.from('supplement_list').delete().eq('id', id)
        todayNeedsRefresh = true
        await loadSettSupplements()
      })
    })
  }

  // ── Cards ──
  async function loadSettCards() {
    const { data } = await supabase.from('cards').select('*').order('name')
    renderSettCardList(data || [])
  }

  function renderSettCardList(cards) {
    const el = document.getElementById('sett-card-list')
    if (!el) return
    if (!cards.length) { el.innerHTML = '<div style="padding:12px 14px;font-size:13px;color:var(--text3);background:var(--bg2);border-radius:var(--radius)">No cards yet</div>'; return }
    el.innerHTML = cards.map(c => `
      <div class="sett-row" data-card-id="${c.id}">
        <div>
          <div class="sett-row-label">${escHtml(c.name)}</div>
          <div class="sett-row-sub sett-card-limit">Limit BHD ${Number(c.limit).toFixed(3)}</div>
        </div>
        <div style="flex:1"></div>
        <span style="font-size:12px;color:var(--text3);margin-right:8px" data-card-vis-lbl="${c.id}">${c.visible ? 'Visible' : 'Hidden'}</span>
        <button class="sett-toggle ${c.visible ? 'on' : ''}" data-card-toggle="${c.id}" data-visible="${c.visible}" style="margin-right:8px"></button>
        <button class="sett-del-btn" data-card-del="${c.id}" data-del-step="0" title="Delete">×</button>
      </div>`).join('')
    el.querySelectorAll('[data-card-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.cardToggle
        const newVis = btn.dataset.visible !== 'true'
        await supabase.from('cards').update({ visible: newVis }).eq('id', id)
        btn.dataset.visible = newVis
        btn.classList.toggle('on', newVis)
        el.querySelector(`[data-card-vis-lbl="${id}"]`).textContent = newVis ? 'Visible' : 'Hidden'
        const card = finCards.find(c => c.id === id)
        if (card) { card.visible = newVis; if (finLoaded) renderCardSections() }
      })
    })
    el.querySelectorAll('[data-card-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const step = parseInt(btn.dataset.delStep || '0')
        if (step === 0) { btn.textContent = '?'; btn.dataset.delStep = '1'; btn.title = 'Tap again to confirm'; return }
        if (step === 1) { btn.textContent = '✓'; btn.dataset.delStep = '2'; btn.style.color = 'var(--danger)'; btn.title = 'Final confirm — deletes all data'; return }
        const id = btn.dataset.cardDel
        await supabase.from('card_transactions').delete().eq('card_id', id)
        await supabase.from('cards').delete().eq('id', id)
        finCards = finCards.filter(c => c.id !== id)
        if (finLoaded) renderCardSections()
        await loadSettCards()
      })
    })
  }

  // ── Analytics Visibility ──
  const READING_ANL_KEY = 'hassan-reading-anl-show'
  let showReadingInAnalytics = localStorage.getItem(READING_ANL_KEY) !== 'false' // default: show

  function renderSettAnalytics() {
    // Reading toggle
    const readBtn = document.getElementById('sett-reading-analytics-toggle')
    if (readBtn) {
      readBtn.classList.toggle('on', showReadingInAnalytics)
      readBtn.addEventListener('click', () => {
        showReadingInAnalytics = !showReadingInAnalytics
        localStorage.setItem(READING_ANL_KEY, showReadingInAnalytics)
        readBtn.classList.toggle('on', showReadingInAnalytics)
        const card = document.getElementById('anl-reading-card')
        if (card) card.style.display = showReadingInAnalytics ? '' : 'none'
      })
    }
  }

  // ── Custom Log Types ──

  // ── Wire add buttons ──
  function wireSettEvents() {
    renderSettAnalytics()

    // Export
    const exportBtn = document.getElementById('sett-export-btn')
    if (exportBtn) exportBtn.addEventListener('click', exportData)

    // Add category
    const catAddBtn = document.getElementById('sett-cat-add-btn')
    const catNameInp = document.getElementById('sett-cat-name')
    const catErr = document.getElementById('sett-cat-error')
    catAddBtn.addEventListener('click', async () => {
      const name = catNameInp.value.trim()
      if (!name) return
      if (finCategories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        catErr.textContent = 'Name already exists'; return
      }
      catErr.textContent = ''
      // use a default color, cycling through palette
      const palette = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#6b7280']
      const color = palette[finCategories.length % palette.length]
      const { data, error } = await supabase.from('categories').insert({ name, color }).select().maybeSingle()
      if (error || !data) { catErr.textContent = 'Could not add category'; return }
      finCategories.push(data); finCategories.sort((a,b)=>a.name.localeCompare(b.name))
      catNameInp.value = ''
      await loadSettCategories()
    })

    // Add supplement
    const suppAddBtn = document.getElementById('sett-supp-add-btn')
    const suppNameInp = document.getElementById('sett-supp-name')
    suppAddBtn.addEventListener('click', async () => {
      const name = suppNameInp.value.trim(); if (!name) return
      const { error } = await supabase.from('supplement_list').insert({ name, active: true })
      if (!error) { suppNameInp.value = ''; todayNeedsRefresh = true; await loadSettSupplements() }
    })

    // Add card
    const cardAddBtn = document.getElementById('sett-card-add-btn')
    const cardNameInp = document.getElementById('sett-card-name')
    const cardLimitInp = document.getElementById('sett-card-limit-inp')
    cardAddBtn.addEventListener('click', async () => {
      const name = cardNameInp.value.trim(); if (!name) return
      const limit = parseFloat(cardLimitInp.value) || 0
      const { data, error } = await supabase.from('cards').insert({ name, limit, paid: 0, visible: true }).select().maybeSingle()
      if (!error && data) {
        finCards.push(data)
        cardNameInp.value = ''; cardLimitInp.value = ''
        await loadSettCards()
        if (finLoaded) renderCardSections()
      }
    })
  }

  document.querySelector('#settings-btn').addEventListener('click', () => {
    if (!settLoaded) { settLoaded = true; initSettings() }
    else { loadSettCategories(); loadSettSupplements(); loadSettCards() }
  })

  document.querySelector('.nav-item[data-tab="analytics"]').addEventListener('click', () => {
    if (!anlLoaded) { anlLoaded = true; initAnalytics() }
  })

  // ── INIT ─────────────────────────────────────────────────
  // re-render charts when the OS theme flips — canvas colors (segment gap
  // borders, axis ticks) are resolved at draw time and don't track CSS vars
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (finLoaded) { renderDonutChart(); renderCardSections() }
    if (anlLoaded) loadAnalytics()
  })

  initAuth()
