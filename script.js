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
  function showToast(msg, isError = false) {
    const t = $('toast')
    t.textContent = msg
    t.className = 'toast' + (isError ? ' error' : '')
    t.classList.add('show')
    setTimeout(() => t.classList.remove('show'), 2500)
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

  ;[...prayerKeys, ...mealKeys, 'smoked', 'reading'].forEach(k => {
    bindToggle(`tog-${k}`)
    bindToggle(`ttog-${k}`)
  })

  // ── STEPPER HELPER ───────────────────────────────────────
  function bindStepper(decId, incId, valId) {
    let v = 0
    $(decId).addEventListener('click', () => { if (v > 0) { v--; $(valId).textContent = v } })
    $(incId).addEventListener('click', () => { v++; $(valId).textContent = v })
    return { get: () => v, set: (n) => { v = n; $(valId).textContent = v } }
  }

  const patchesStepper = bindStepper('patches-dec', 'patches-inc', 'patches-val')
  const tpatchesStepper = bindStepper('tpatches-dec', 'tpatches-inc', 'tpatches-val')

  // ── SUPPLEMENTS ──────────────────────────────────────────
  // supplements state: { id (from DB or temp), name, active (bool for this day) }
  let suppState = []   // for calendar day view
  let tsuppState = []  // for today tab

  function renderSuppRows(cardId, state, prefix, saveCtx) {
    const card = $(cardId)
    // addBtn id: '' → 'add-supp-btn', 'tadd-supp-' → 'tadd-supp-btn'
    const addBtnId = prefix === '' ? 'add-supp-btn' : prefix.replace(/-$/, '-btn').replace('tadd-supp', 'tadd-supp')
    const addBtn = $(prefix === '' ? 'add-supp-btn' : 'tadd-supp-btn')
    // remove existing supp rows
    card.querySelectorAll('.supp-row').forEach(r => r.remove())
    // insert before add button
    state.forEach((s, i) => {
      const row = document.createElement('div')
      row.className = 'log-row supp-row'
      row.innerHTML = `<span class="log-row-label">${s.name}</span><button class="toggle${s.taken ? ' on' : ''}" data-supp-idx="${i}"><div class="toggle-thumb"></div></button>`
      row.querySelector('button').addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('on')
        state[i].taken = e.currentTarget.classList.contains('on')
        // auto-save on supplement toggle
        if (saveCtx) scheduleAutoSave(saveCtx.dateStr, saveCtx.prefix, saveCtx.stepperCtrl, saveCtx.stateRef)
      })
      card.insertBefore(row, addBtn)
    })
  }

  function bindAddSupp(addBtnId, inputRowId, inputId, confirmId, cardId, stateRef, renderPrefix) {
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
      renderSuppRows(cardId, stateRef, renderPrefix, null)
    }

    confirmBtn.addEventListener('click', doAdd)
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd() })
  }

  bindAddSupp('add-supp-btn', 'add-supp-input-row', 'add-supp-input', 'add-supp-confirm', 'supp-card', suppState, '')
  bindAddSupp('tadd-supp-btn', 'tadd-supp-input-row', 'tadd-supp-input', 'tadd-supp-confirm', 'tsupp-card', tsuppState, 'tadd-supp-')

  // ── LOAD DAY DATA ────────────────────────────────────────
  async function loadDayData(dateStr, prefix, stepperCtrl, stateRef, cardId) {
    // reset UI
    ;[...prayerKeys, ...mealKeys, 'smoked', 'reading'].forEach(k => setToggle(`${prefix}tog-${k}`, false))
    stepperCtrl.set(0)
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
    const saveCtx = { dateStr, prefix, stepperCtrl, stateRef }
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
      setToggle(`${prefix}tog-smoked`, dt.smoked)
      setToggle(`${prefix}tog-reading`, dt.reading || false)
      stepperCtrl.set(dt.patches || 0)
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
  async function saveDayData(dateStr, prefix, stepperCtrl, stateRef, silent = false) {
    const btn = $(`${prefix === '' ? '' : 't'}save-btn`)
    if (!silent) { btn.disabled = true; btn.textContent = 'Saving...' }

    try {
      // prayers upsert
      await supabase.from('prayers').upsert({
        date: dateStr,
        ...Object.fromEntries(prayerKeys.map(k => [k, getToggle(`${prefix}tog-${k}`)]))
      }, { onConflict: 'date' })

      // meals upsert
      await supabase.from('meals').upsert({
        date: dateStr,
        ...Object.fromEntries(mealKeys.map(k => [k, getToggle(`${prefix}tog-${k}`)]))
      }, { onConflict: 'date' })

      // daily tracking upsert
      await supabase.from('daily_tracking').upsert({
        date: dateStr,
        smoked: getToggle(`${prefix}tog-smoked`),
        reading: getToggle(`${prefix}tog-reading`),
        patches: stepperCtrl.get(),
        notes: prefix === '' ? $('notes-today').value : $('tnotes-today').value,
        notes_tomorrow: prefix === '' ? $('notes-tomorrow').value : $('tnotes-tomorrow').value,
      }, { onConflict: 'date' })

      // supplements: delete existing for this day, re-insert
      await supabase.from('supplements').delete().eq('date', dateStr)
      if (stateRef.length > 0) {
        await supabase.from('supplements').insert(
          stateRef.map(s => ({ date: dateStr, supplement_id: s.id, taken: s.taken }))
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
  let calDotData = {} // key: 'YYYY-MM-DD', value: { prayers, meals, smoke, reading }
  let calNeedsRefresh = false   // set true after any day save
  let todayNeedsRefresh = false  // set true after any day save
  let hlthNeedsRefresh = false   // set true after health session add/delete
  let anlNeedsRefresh = false    // set true after any day save

  // ── AUTO-SAVE ─────────────────────────────────────────────
  const autoSaveTimers = {}
  function scheduleAutoSave(dateStr, prefix, stepperCtrl, stateRef) {
    const key = prefix || 'day'
    clearTimeout(autoSaveTimers[key])
    autoSaveTimers[key] = setTimeout(() => {
      saveDayData(dateStr, prefix, stepperCtrl, stateRef, true)
    }, 100)
  }

  async function loadCalDots(year, month) {
    const ym = `${year}-${String(month+1).padStart(2,'0')}`
    const start = `${ym}-01`
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10) // actual last day of month
    const [prayRes, mealRes, dtRes] = await Promise.all([
      supabase.from('prayers').select('*').filter('date','gte',start).filter('date','lte',end),
      supabase.from('meals').select('*').filter('date','gte',start).filter('date','lte',end),
      supabase.from('daily_tracking').select('*').filter('date','gte',start).filter('date','lte',end),
    ])
    calDotData = {}
    ;(prayRes.data||[]).forEach(r => {
      if (!calDotData[r.date]) calDotData[r.date] = {}
      calDotData[r.date].prayers = r.fajr||r.dhuhr||r.asr||r.maghrib||r.isha
    })
    ;(mealRes.data||[]).forEach(r => {
      if (!calDotData[r.date]) calDotData[r.date] = {}
      calDotData[r.date].meals = r.breakfast||r.lunch||r.dinner
    })
    ;(dtRes.data||[]).forEach(r => {
      if (!calDotData[r.date]) calDotData[r.date] = {}
      calDotData[r.date].smoke = r.smoked
      calDotData[r.date].reading = r.reading || false
    })
  }

  async function renderCalendar() {
    const now = new Date()
    if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth() }
    $('cal-month-label').textContent = `${MONTHS[calMonth]} ${calYear}`
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

      // SVG rings — each active indicator adds a concentric ring
      // Build one segmented ring: each active indicator = one arc segment
      const segments = []
      if (dots.prayers) segments.push('#a855f7')
      if (dots.meals)   segments.push('#f97316')
      if (dots.smoke)   segments.push('#ef4444')
      if (dots.reading) segments.push('#3b82f6')

      const svgNS = 'http://www.w3.org/2000/svg'
      const svg = document.createElementNS(svgNS, 'svg')
      svg.setAttribute('viewBox', '0 0 100 100')
      svg.setAttribute('class', 'cal-rings')

      // today: solid accent fill background
      if (isToday) {
        const bg = document.createElementNS(svgNS, 'circle')
        bg.setAttribute('cx','50'); bg.setAttribute('cy','50'); bg.setAttribute('r','38')
        bg.setAttribute('fill', 'var(--accent)')
        svg.appendChild(bg)
      }

      if (segments.length > 0) {
        const r = 46
        const cx = 50, cy = 50
        const gap = segments.length > 1 ? 3 : 0
        const totalAngle = 360
        const segAngle = (totalAngle - gap * segments.length) / segments.length

        if (segments.length === 1) {
          // single log — draw full circle (SVG arc can't represent 360°)
          const circ = document.createElementNS(svgNS, 'circle')
          circ.setAttribute('cx', cx); circ.setAttribute('cy', cy); circ.setAttribute('r', r)
          circ.setAttribute('fill', 'none')
          circ.setAttribute('stroke', segments[0])
          circ.setAttribute('stroke-width', '5')
          circ.setAttribute('opacity', isToday ? '0.75' : '1')
          svg.appendChild(circ)
        } else {
          segments.forEach((color, i) => {
            const startDeg = -90 + i * (segAngle + gap)
            const endDeg = startDeg + segAngle
            const start = startDeg * Math.PI / 180
            const end = endDeg * Math.PI / 180
            const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
            const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end)
            const largeArc = segAngle > 180 ? 1 : 0
            const path = document.createElementNS(svgNS, 'path')
            path.setAttribute('d', `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`)
            path.setAttribute('fill', 'none')
            path.setAttribute('stroke', color)
            path.setAttribute('stroke-width', '5')
            path.setAttribute('stroke-linecap', 'round')
            path.setAttribute('opacity', isToday ? '0.75' : '1')
            svg.appendChild(path)
          })
        }
        wrap.appendChild(svg)
      } else if (isToday) {
        wrap.appendChild(svg)
      }

      const num = document.createElement('div')
      num.className = 'cal-num'; num.textContent = d
      wrap.appendChild(num)
      wrap.addEventListener('click', () => openDayView(calYear, calMonth, d))
      grid.appendChild(wrap)
    }
  }

  $('cal-prev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear-- } renderCalendar() })
  $('cal-next').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++ } renderCalendar() })

  // ── DAY VIEW ─────────────────────────────────────────────
  let currentDayStr = ''

  function wireAutoSave(prefix, dateStr, stepperCtrl, stateRef) {
    // Toggles
    const toggleIds = [...prayerKeys, ...mealKeys, 'smoked', 'reading'].map(k => `${prefix}tog-${k}`)
    toggleIds.forEach(id => {
      const el = $(id); if (!el) return
      el.addEventListener('click', () => scheduleAutoSave(dateStr, prefix, stepperCtrl, stateRef), { capture: true })
    })
    // Stepper
    const decId = prefix === '' ? 'dec-patches' : 'tdec-patches'
    const incId = prefix === '' ? 'inc-patches' : 'tinc-patches'
    ;[decId, incId].forEach(id => {
      const el = $(id); if (!el) return
      el.addEventListener('click', () => scheduleAutoSave(dateStr, prefix, stepperCtrl, stateRef))
    })
    // Notes
    const notesId = prefix === '' ? 'notes-today' : 'tnotes-today'
    const tmrwId  = prefix === '' ? 'notes-tomorrow' : 'tnotes-tomorrow'
    ;[notesId, tmrwId].forEach(id => {
      const el = $(id); if (!el) return
      el.addEventListener('input', () => scheduleAutoSave(dateStr, prefix, stepperCtrl, stateRef))
    })
  }

  async function openDayView(y, m, d) {
    currentDayStr = toDateStr(y, m, d)
    const date = new Date(y, m, d)
    $('day-date-label').textContent = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    $('calendar-view').style.display = 'none'
    $('day-view').classList.add('active')
    $('top-title').textContent = 'Day'
    await loadDayData(currentDayStr, '', patchesStepper, suppState, 'supp-card')
    wireAutoSave('', currentDayStr, patchesStepper, suppState)
  }

  $('day-back').addEventListener('click', () => {
    $('day-view').classList.remove('active')
    $('calendar-view').style.display = ''
    $('top-title').textContent = 'Calendar'
  })

  $('save-btn').addEventListener('click', () => saveDayData(currentDayStr, '', patchesStepper, suppState))

  // ── TODAY TAB ────────────────────────────────────────────
  async function loadTodayTab() {
    const now = new Date()
    $('today-date-label').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    await loadDayData(todayStr(), 't', tpatchesStepper, tsuppState, 'tsupp-card')
    wireAutoSave('t', todayStr(), tpatchesStepper, tsuppState)
  }

  $('tsave-btn').addEventListener('click', () => saveDayData(todayStr(), 't', tpatchesStepper, tsuppState))

  // reload today data when switching to today tab

  // ── FINANCE ──────────────────────────────────────────────
  const FIN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const CAT_COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ef4444','#eab308','#ec4899','#6b7280']

  let finMonth = ''
  let finCategories = []
  let finBudget = null
  let finExpenses = []
  let finChartInstance = null
  let finLoaded = false
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

  function finMonthLabel(ym) {
    const [y, m] = ym.split('-').map(Number)
    return `${FIN_MONTHS[m - 1]} ${y}`
  }
  function currentYM() {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`
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
  function renderBudgetBar() {
    const wrap = $('budget-wrap')
    if (!wrap) return
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
    wrap.innerHTML = `
      <div class="budget-header">
        <span>Spent</span>
        <span>${fmtAmount(totalSpent)}</span>
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
      await supabase.from('budget_settings').delete().eq('month', finMonth)
      if (!isNaN(val) && val > 0) {
        await supabase.from('budget_settings').insert({ month: finMonth, total: val })
        finBudget = val
      } else {
        finBudget = null
      }
      renderBudgetBar()
    }
    btn.addEventListener('click', saveBudget)
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') saveBudget() })
  }

  // ── DONUT CHART ──────────────────────────────────────────
  function renderDonutChart() {
    const section = $('fin-chart-section')
    if (!section) return
    if (finExpenses.length === 0) {
      section.style.display = 'none'
      if (finChartInstance) { finChartInstance.destroy(); finChartInstance = null }
      return
    }
    const expWrap = $('expense-section-wrap')
    if (expWrap && expWrap.style.display === 'none') return
    section.style.display = 'block'

    const catTotals = {}
    finExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category]||0) + Number(e.amount) })
    const labels = Object.keys(catTotals)
    const values = labels.map(l => catTotals[l])
    const colors = labels.map(l => { const c = finCategories.find(x => x.name===l); return c ? c.color : '#6b7280' })
    const total = values.reduce((s,v) => s+v, 0)

    const center = $('donut-center')
    if (center) center.innerHTML = `<div class="donut-center-amount">${fmtAmount(total)}</div><div class="donut-center-label">total</div>`

    if (finChartInstance) { finChartInstance.destroy(); finChartInstance = null }
    const canvas = $('fin-chart')
    if (!canvas || typeof Chart === 'undefined') return

    finChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
      options: {
        cutout: '66%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 350 }
      }
    })

    const legend = $('fin-legend')
    if (legend) {
      legend.innerHTML = labels.map((l,i) => `
        <div class="fin-legend-row">
          <div class="fin-legend-dot" style="background:${colors[i]}"></div>
          <span class="fin-legend-name">${escHtml(l)}</span>
          <span class="fin-legend-amt">${fmtAmount(values[i])}</span>
        </div>`).join('')
    }
  }

  // ── EXPENSE LIST ─────────────────────────────────────────
  let finBudgetCollapsed = true
  let finExpensesCollapsed = true

  function renderExpenseList() {
    const container = $('expense-list')
    const colBtn = $('expense-collapse-btn')
    if (!container) return

    if (finExpenses.length === 0) {
      container.innerHTML = '<div class="fin-empty">No expenses this month</div>'
      return
    }

    container.innerHTML = `<div class="log-card">${finExpenses.map(e => {
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

    const expToggle = $('expense-toggle')
    if (expToggle) {
      expToggle.addEventListener('click', ev => {
        if (ev.target.closest('.fin-add-btn')) return
        finExpensesCollapsed = !finExpensesCollapsed
        const wrap = $('expense-section-wrap')
        if (wrap) wrap.style.display = finExpensesCollapsed ? 'none' : ''
        if (!finExpensesCollapsed) renderDonutChart()
      })
    }

    addBtn.addEventListener('click', () => {
      if (finExpensesCollapsed) {
        finExpensesCollapsed = false
        const wrap = $('expense-section-wrap')
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
      const rect = pickerBtn.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      dropdown.style.display = 'block'
      dropdown.style.width = rect.width + 'px'
      if (spaceBelow < 240) {
        dropdown.style.top = (rect.top - dropdown.offsetHeight - 4) + 'px'
      } else {
        dropdown.style.top = (rect.bottom + 4) + 'px'
      }
      dropdown.style.left = rect.left + 'px'
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
    if (date.startsWith(finMonth)) {
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
  async function loadFinanceData() {
    if (finCategories.length === 0) {
      const { data } = await supabase.from('categories').select('*').order('name')
      finCategories = data || []
    }
    const { data: budget } = await supabase.from('budget_settings').select('*').eq('month', finMonth).maybeSingle()
    finBudget = budget ? Number(budget.total) : null
    const { data: expenses } = await supabase.from('expenses').select('*')
      .gte('date', `${finMonth}-01`)
      .lt('date', firstDayOfNextMonth(finMonth))
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    finExpenses = expenses || []
    renderBudgetBar(); renderExpenseList(); renderDonutChart()
    // load cards once
    if (finCards.length === 0) {
      const { data: cards } = await supabase.from('cards').select('*').eq('visible', true).order('name')
      finCards = cards || []
    }
    if (finCards.length > 0) {
      const { data: allTxns } = await supabase.from('card_transactions').select('*').order('date', { ascending: false })
      finAllTxns = allTxns || []
      finMonthTxns = finAllTxns.filter(t => t.date.startsWith(finMonth))
      renderCardSections()
    }
  }

  // ── FINANCE MONTH NAV ────────────────────────────────────
  function setFinMonth(ym) {
    finMonth = ym
    const lbl = $('fin-month-label')
    if (lbl) lbl.textContent = finMonthLabel(ym)
    const nextBtn = $('fin-next')
    if (nextBtn) nextBtn.disabled = ym >= currentYM()
    cancelDeleteConfirm()
    closeExpenseForm()
    finMonthTxns = finAllTxns.filter(t => t.date.startsWith(ym))
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
    if (next > currentYM()) return
    setFinMonth(next); loadFinanceData()
  })

  async function initFinanceTab() {
    setFinMonth(currentYM())
    bindExpenseForm()
    const budgetToggle = $('budget-toggle')
    if (budgetToggle) {
      budgetToggle.addEventListener('click', () => {
        finBudgetCollapsed = !finBudgetCollapsed
        const wrap = $('budget-section-wrap')
        if (wrap) wrap.style.display = finBudgetCollapsed ? 'none' : ''
      })
    }
    await loadFinanceData()
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
    return `<div class="fin-section card-section" data-card-id="${card.id}">
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
        <div class="add-expense-form" id="card-form-${card.id}" style="display:none;margin-top:8px">
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
    const txns = finAllTxns.filter(t => t.card_id === cardId)
    const catTotals = {}
    txns.filter(t => t.type === 'charge').forEach(t => {
      catTotals[t.category || 'Other'] = (catTotals[t.category || 'Other'] || 0) + Number(t.amount)
    })
    const entries = Object.entries(catTotals).sort((a,b) => b[1]-a[1])
    if (!entries.length) { area.innerHTML = ''; return }
    const palette = ['#f97316','#3b82f6','#22c55e','#a855f7','#ef4444','#eab308','#ec4899','#6b7280']
    const colors = entries.map(([name],i) => finCategories.find(c=>c.name===name)?.color || palette[i%8])
    area.innerHTML = `<div style="position:relative;height:140px;display:flex;align-items:center;justify-content:center;margin-top:10px"><canvas id="card-donut-${cardId}" style="max-width:140px;max-height:140px"></canvas></div><div id="card-donut-leg-${cardId}" style="margin-top:8px"></div>`
    const ctx = document.getElementById(`card-donut-${cardId}`).getContext('2d')
    finCardCharts[cardId] = new Chart(ctx, { type:'doughnut', data:{ labels:entries.map(([n])=>n), datasets:[{ data:entries.map(([,v])=>v), backgroundColor:colors, borderWidth:2, borderColor:'var(--bg2)' }] }, options:{ cutout:'65%', plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` BHD ${Number(c.raw).toFixed(3)}`}} } } })
    document.getElementById(`card-donut-leg-${cardId}`).innerHTML = entries.map(([name,amt],i)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:12px"><div style="width:8px;height:8px;border-radius:50%;background:${colors[i]};flex-shrink:0"></div><span style="flex:1;color:var(--text)">${escHtml(name)}</span><span style="color:var(--text2);font-family:monospace">BHD ${amt.toFixed(3)}</span></div>`).join('')
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
        const rect = btn.getBoundingClientRect()
        dropdown.style.display = 'block'
        dropdown.style.width = rect.width + 'px'
        const spaceBelow = window.innerHeight - rect.bottom
        dropdown.style.top = (spaceBelow < 240 ? rect.top - dropdown.offsetHeight - 4 : rect.bottom + 4) + 'px'
        dropdown.style.left = rect.left + 'px'
      })
    })

    document.addEventListener('click', ev => {
      container.querySelectorAll('[id^="card-cat-dd-"]').forEach(dd => {
        const cid = dd.id.replace('card-cat-dd-', '')
        const wrap = $(`card-cat-wrap-${cid}`)
        if (wrap && !wrap.contains(ev.target)) dd.style.display = 'none'
      })
    })

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
    finMonthTxns = finAllTxns.filter(t => t.date.startsWith(finMonth))
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
      finMonthTxns = finAllTxns.filter(t => t.date.startsWith(finMonth))
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
      finMonthTxns = finAllTxns.filter(t => t.date.startsWith(finMonth))
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
  let anlMonth = new Date().toISOString().slice(0,7)
  let anlSpendChart = null, anlTrendChart = null, anlQtrChart = null
  let anlQtrYear = new Date().getFullYear()
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
    const smokeCard = document.getElementById('anl-smoke-card')
    if (smokeCard) smokeCard.style.display = showSmokeInAnalytics ? '' : 'none'
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
      const cur = new Date().toISOString().slice(0,7)
      if (anlMonth >= cur) return
      const [y,m] = anlMonth.split('-').map(Number)
      let nm = m + 1; let ny = y
      if (nm > 12) { nm = 1; ny++ }
      anlMonth = `${ny}-${String(nm).padStart(2,'0')}`
      loadAnalytics()
    })
    // quarterly year nav
    $('anl-qtr-prev').addEventListener('click', () => {
      anlQtrYear--
      renderQuarterlyAnalytics(anlExpensesAll)
    })
    $('anl-qtr-next').addEventListener('click', () => {
      if (anlQtrYear >= new Date().getFullYear()) return
      anlQtrYear++
      renderQuarterlyAnalytics(anlExpensesAll)
    })
    await loadAnalytics()
  }

  async function loadAnalytics() {
    $('anl-month-lbl').textContent = anlFmtMonth(anlMonth)

    // disable next if at current month
    const cur = new Date().toISOString().slice(0,7)
    $('anl-next-btn').disabled = anlMonth >= cur
    $('anl-next-btn').style.opacity = anlMonth >= cur ? '0.3' : '1'

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
    renderSmokeStats(dtAll.data || [], anlMonth)
    renderReadingStats(dtAll.data || [], anlMonth)
    renderSpendChart(anlExpensesAll, cats.data || [], anlMonth)
    renderTrendChart(anlExpensesAll, cats.data || [])
    renderQuarterlyAnalytics(anlExpensesAll)
  }

  function get6mStart() {
    const d = new Date()
    d.setMonth(d.getMonth() - 5)
    d.setDate(1)
    return d.toISOString().slice(0,10)
  }

  function renderSmokeStats(rows, month) {
    // streak = consecutive smoke-free days ending today going backwards
    const smokeSet = new Set(rows.filter(r => r.smoked).map(r => r.date))
    const loggedSet = new Set(rows.map(r => r.date))
    let streak = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().slice(0,10)
      if (!loggedSet.has(ds)) break
      if (smokeSet.has(ds)) break
      streak++
      d.setDate(d.getDate() - 1)
    }

    const monthRows = rows.filter(r => r.date.startsWith(month))
    const smokedDays = monthRows.filter(r => r.smoked).length
    const freeDays = monthRows.filter(r => !r.smoked).length

    $('anl-smoke-free-streak').textContent = streak
    $('anl-smoke-free-month').textContent = freeDays
    $('anl-smoke-days-month').textContent = smokedDays

    const statEls = document.querySelectorAll('#anl-smoke-card .anl-stat')
    statEls[0].className = 'anl-stat ' + (streak > 0 ? 'anl-smoke-free' : 'anl-smoke-bad')
    statEls[1].className = 'anl-stat anl-smoke-free'
    statEls[2].className = 'anl-stat ' + (smokedDays > 0 ? 'anl-smoke-bad' : '')
  }

  function renderReadingStats(rows, month) {
    if (!showReadingInAnalytics) return
    const readRows = rows.filter(r => r.reading)
    const readSet = new Set(readRows.map(r => r.date))
    const loggedSet = new Set(rows.map(r => r.date))

    // streak: consecutive days with reading=true going back from today
    let streak = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().slice(0,10)
      if (!loggedSet.has(ds)) break
      if (!readSet.has(ds)) break
      streak++
      d.setDate(d.getDate() - 1)
    }

    const monthCount = rows.filter(r => r.date.startsWith(month) && r.reading).length
    const total = readRows.length

    $('anl-reading-streak').textContent = streak
    $('anl-reading-month').textContent = monthCount
    $('anl-reading-total').textContent = total

    const card = document.getElementById('anl-reading-card')
    const statEls = card ? card.querySelectorAll('.anl-stat') : []
    if (statEls[0]) statEls[0].className = 'anl-stat ' + (streak > 0 ? 'anl-smoke-free' : '')
    if (statEls[1]) statEls[1].className = 'anl-stat ' + (monthCount > 0 ? 'anl-smoke-free' : '')
  }


  function renderSpendChart(expenses, cats, month) {
    const monthExp = expenses.filter(e => e.date.startsWith(month))
    const catMap = {}
    cats.forEach(c => catMap[c.name] = c.color)

    const totals = {}
    monthExp.forEach(e => { totals[e.category] = (totals[e.category]||0) + Number(e.amount) })
    const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1])

    // legend
    const leg = $('anl-spend-legend')
    if (sorted.length === 0) {
      leg.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:16px 0">No expenses this month</div>'
    } else {
      leg.innerHTML = sorted.map(([name, amt]) =>
        `<div class="anl-legend-row"><div class="anl-legend-dot" style="background:${catMap[name]||'#6b7280'}"></div><span class="anl-legend-name">${escHtml(name)}</span><span class="anl-legend-amt">BHD ${amt.toFixed(3)}</span></div>`
      ).join('')
    }

    if (anlSpendChart) { anlSpendChart.destroy(); anlSpendChart = null }
    if (sorted.length === 0) { $('anl-spend-canvas').style.display='none'; return }
    $('anl-spend-canvas').style.display = ''

    const ctx = $('anl-spend-canvas').getContext('2d')
    anlSpendChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sorted.map(([n])=>n),
        datasets: [{ data: sorted.map(([,v])=>v), backgroundColor: sorted.map(([n])=>catMap[n]||'#6b7280'), borderWidth: 2, borderColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#111111' : '#ffffff' }]
      },
      options: { cutout: '68%', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` BHD ${Number(ctx.raw).toFixed(3)}` } } } }
    })
  }

  function renderTrendChart(expenses, cats) {
    // simple total spend per month — one bar per month
    const months = []
    for (let i=5; i>=0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-i)
      months.push(d.toISOString().slice(0,7))
    }
    const labels = months.map(m => { const [y,mo] = m.split('-'); return new Date(y,mo-1,1).toLocaleDateString('en-US',{month:'short'}) })
    const totals = months.map(m => parseFloat(expenses.filter(e => e.date.startsWith(m)).reduce((s,e)=>s+Number(e.amount),0).toFixed(3)))

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
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 12 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: v => v === 0 ? '0' : 'BD '+v } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` BHD ${Number(ctx.raw).toFixed(3)}` } }
        }
      }
    })
  }


  // ── QUARTERLY ANALYTICS ───────────────────────────────────
  function renderQuarterlyAnalytics(expenses) {
    const yearLabel = $('anl-qtr-year')
    if (yearLabel) yearLabel.textContent = anlQtrYear
    const nextBtn = $('anl-qtr-next')
    if (nextBtn) nextBtn.disabled = anlQtrYear >= new Date().getFullYear()

    const quarters = [
      { label: 'Q1', months: ['01','02','03'], name: 'Jan · Feb · Mar' },
      { label: 'Q2', months: ['04','05','06'], name: 'Apr · May · Jun' },
      { label: 'Q3', months: ['07','08','09'], name: 'Jul · Aug · Sep' },
      { label: 'Q4', months: ['10','11','12'], name: 'Oct · Nov · Dec' },
    ]
    const yearStr = String(anlQtrYear)
    const qTotals = quarters.map(q =>
      expenses
        .filter(e => e.date.startsWith(yearStr) && q.months.some(m => e.date.startsWith(`${yearStr}-${m}`)))
        .reduce((s, e) => s + Number(e.amount), 0)
    )

    const grid = $('anl-quarter-grid')
    if (grid) {
      const curQ = Math.floor(new Date().getMonth() / 3)
      grid.innerHTML = quarters.map((q, i) => {
        const isCurrent = i === curQ && anlQtrYear === new Date().getFullYear()
        return `<div class="anl-quarter-tile${isCurrent ? '" style="outline:2px solid var(--accent)' : ''}">
          <div class="anl-quarter-label">${q.label}</div>
          <div class="anl-quarter-amount">BHD ${qTotals[i].toFixed(3)}</div>
          <div class="anl-quarter-sub">${q.name}</div>
        </div>`
      }).join('')
    }

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const textColor = isDark ? '#999999' : '#666666'
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

    if (anlQtrChart) { anlQtrChart.destroy(); anlQtrChart = null }
    const canvas = $('anl-qtr-canvas')
    if (!canvas) return
    const curQ = Math.floor(new Date().getMonth() / 3)
    anlQtrChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: quarters.map(q => q.label),
        datasets: [{
          data: qTotals,
          backgroundColor: qTotals.map((_, i) =>
            i === curQ && anlQtrYear === new Date().getFullYear() ? '#3b82f6' : 'rgba(59,130,246,0.35)'
          ),
          borderRadius: 5,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 12 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, callback: v => v === 0 ? '0' : 'BD '+v } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` BHD ${Number(ctx.raw).toFixed(3)}` } }
        }
      }
    })
  }

  // ── EXPORT (CSV + ZIP) ───────────────────────────────────
  function tableToCSV(rows, columns) {
    const esc = v => { const s = String(v ?? ''); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g,'""')}"` : s }
    return [columns.join(','), ...(rows.map(r => columns.map(c => esc(r[c])).join(',')))].join('\n')
  }

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
      const zip = new JSZip()
      zip.file('expenses.csv',         tableToCSV(expenses.data || [],  ['id','date','label','amount','category','notes','created_at']))
      zip.file('card_transactions.csv',tableToCSV(txns.data || [],      ['id','card_id','date','type','label','amount','category','notes']))
      zip.file('daily_tracking.csv',   tableToCSV(dt.data || [],        ['id','date','smoked','patches','reading','notes','notes_tomorrow','created_at']))
      zip.file('prayers.csv',          tableToCSV(prayersD.data || [],  ['id','date','fajr','dhuhr','asr','maghrib','isha']))
      zip.file('meals.csv',            tableToCSV(meals.data || [],     ['id','date','breakfast','lunch','dinner']))
      zip.file('health_sessions.csv',  tableToCSV(health.data || [],    ['id','date','type','notes']))
      zip.file('supplement_list.csv',  tableToCSV(suppList.data || [],  ['id','name','active']))
      zip.file('supplements.csv',      tableToCSV(supps.data || [],     ['id','date','supplement_id','taken']))
      zip.file('cards.csv',            tableToCSV(cards.data || [],     ['id','name','limit','visible']))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-${new Date().toISOString().slice(0,10)}.zip`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('CSV export downloaded ✓')
    } catch (e) {
      console.error(e)
      showToast('Export failed', true)
    }
    btn.textContent = 'Export All Data (CSV)'
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

  const SETT_CAT_PALETTE = ['#f97316','#3b82f6','#22c55e','#a855f7','#ef4444','#eab308','#ec4899','#6b7280']

  function renderSettCatList(cats) {
    const el = document.getElementById('sett-cat-list')
    if (!el) return
    if (!cats.length) { el.innerHTML = '<div style="padding:12px 14px;font-size:13px;color:var(--text3);background:var(--bg2);border-radius:var(--radius)">No categories yet</div>'; return }
    el.innerHTML = cats.map(c => `
      <div class="sett-row" data-cat-id="${c.id}" style="flex-wrap:wrap;gap:6px;align-items:center">
        <button class="sett-dot" data-cat-color-btn="${c.id}" style="background:${c.color};cursor:pointer;border:none;width:22px;height:22px;border-radius:50%;flex-shrink:0" title="Change color"></button>
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
        const color = colorBtn.dataset.currentColor || colorBtn.style.background
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
  const SMOKE_ANL_KEY = 'hassan-smoke-anl-show'
  let showSmokeInAnalytics = localStorage.getItem(SMOKE_ANL_KEY) !== 'false' // default: show
  const READING_ANL_KEY = 'hassan-reading-anl-show'
  let showReadingInAnalytics = localStorage.getItem(READING_ANL_KEY) !== 'false' // default: show

  function renderSettAnalytics() {
    // Smoke toggle
    const smokeBtn = document.getElementById('sett-smoke-analytics-toggle')
    if (smokeBtn) {
      smokeBtn.classList.toggle('on', showSmokeInAnalytics)
      smokeBtn.addEventListener('click', () => {
        showSmokeInAnalytics = !showSmokeInAnalytics
        localStorage.setItem(SMOKE_ANL_KEY, showSmokeInAnalytics)
        smokeBtn.classList.toggle('on', showSmokeInAnalytics)
        const card = document.getElementById('anl-smoke-card')
        if (card) card.style.display = showSmokeInAnalytics ? '' : 'none'
      })
    }
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
      const palette = ['#f97316','#3b82f6','#22c55e','#a855f7','#ef4444','#eab308','#ec4899','#6b7280']
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
  initAuth()
