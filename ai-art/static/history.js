(function(){
  const AA = window.AA
  const $ = AA.$
  const dom = AA.dom
  const state = AA.state
  const constants = AA.constants

  function openHistoryDB(){
    return new Promise(function(resolve, reject){
      const request = indexedDB.open(constants.HISTORY_DB, 1)
      request.onupgradeneeded = function(){ request.result.createObjectStore(constants.HISTORY_STORE, {keyPath: "id"}) }
      request.onsuccess = function(){ resolve(request.result) }
      request.onerror = function(){ reject(request.error) }
    })
  }

  async function loadHistory(){
    try{
      const db = await openHistoryDB()
      const tx = db.transaction(constants.HISTORY_STORE, "readonly")
      const request = tx.objectStore(constants.HISTORY_STORE).getAll()
      state.history.items = await new Promise(function(resolve, reject){
        request.onsuccess = function(){ resolve(request.result || []) }
        request.onerror = function(){ reject(request.error) }
      })
      state.history.items.sort(function(a, b){ return b.id - a.id })
    }catch(error){
      try{
        state.history.items = JSON.parse(localStorage.getItem("aa_history")) || []
      }catch(parseError){
        state.history.items = []
      }
    }
    renderHistory()
    migrateLocalHistory()
  }

  async function saveHistory(){
    try{
      const db = await openHistoryDB()
      const tx = db.transaction(constants.HISTORY_STORE, "readwrite")
      const store = tx.objectStore(constants.HISTORY_STORE)
      state.history.items.slice(0, 12).forEach(function(item){ store.put(item) })
      state.history.items.slice(12).forEach(function(item){ store.delete(item.id) })
    }catch(error){}
  }

  async function migrateLocalHistory(){
    try{
      const old = JSON.parse(localStorage.getItem("aa_history")) || []
      if(!old.length) return
      const known = new Set(state.history.items.map(function(item){ return item.id }))
      state.history.items = state.history.items.concat(old.filter(function(item){ return !known.has(item.id) }))
      state.history.items.sort(function(a, b){ return b.id - a.id })
      state.history.items = state.history.items.slice(0, 12)
      await saveHistory()
      localStorage.removeItem("aa_history")
      renderHistory()
    }catch(error){}
  }

  async function addHistory(url){
    state.history.items.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      url: url,
      prompt: dom.prompt.value.trim(),
      negative: dom.negative.value.trim(),
      theme: state.selections.theme,
      style: state.selections.style,
      size: state.selections.size,
      model: state.settings.image.model || "",
    })
    state.history.items = state.history.items.slice(0, 12)
    await saveHistory()
    renderHistory()
  }

  function restoreHistory(item){
    if(!item) return
    state.selections.theme = item.theme || state.selections.theme
    state.selections.style = item.style || state.selections.style
    state.selections.size = item.size || state.selections.size
    dom.prompt.value = item.prompt || ""
    dom.negative.value = item.negative || ""
    AA.ui.showImage(item.url)
    AA.ui.renderDropdown(dom.themeSelect, AA.data.themes, state.selections.theme, function(id){ state.selections.theme = id })
    AA.ui.renderDropdown(dom.styleSelect, AA.data.styles, state.selections.style, function(id){ state.selections.style = id })
    AA.ui.renderSizeChips()
  }

  function openHistoryPreview(item){
    if(!item) return
    state.history.previewItem = item
    dom.historyPreviewImg.src = item.url
    dom.historyPreviewPrompt.textContent = item.prompt || "未命名作品"
    resetHistoryView()
    dom.historyPreviewOverlay.classList.add("show")
  }

  function closeHistoryPreview(){
    dom.historyPreviewOverlay.classList.remove("show")
    dom.historyPreviewImg.classList.remove("no-anim")
    $("history-preview-stage").classList.remove("dragging")
  }

  function setHistoryZoom(value){
    state.history.zoom = Math.max(0.5, Math.min(3, value))
    AA.ui.renderHistoryTransform()
  }

  function resetHistoryView(){
    state.history.panX = 0
    state.history.panY = 0
    state.history.zoom = 1
    AA.ui.renderHistoryTransform(false)
  }

  function renderHistory(){
    if(!dom.historySection || !dom.historyGrid) return
    dom.historySection.style.display = state.history.items.length ? "block" : "none"
    dom.historyGrid.innerHTML = state.history.items.map(function(item){
      return '<button class="history-card" type="button" data-id="' + item.id + '"><img src="' + item.url + '" alt="历史图"><span>' + ((item.prompt || "未命名作品").slice(0, 36)) + "</span></button>"
    }).join("")
    dom.historyGrid.querySelectorAll(".history-card").forEach(function(card){
      card.onclick = function(){
        openHistoryPreview(state.history.items.find(function(item){ return String(item.id) === card.dataset.id }))
      }
    })
  }

  async function clearHistory(){
    state.history.items = []
    try{
      const db = await openHistoryDB()
      db.transaction(constants.HISTORY_STORE, "readwrite").objectStore(constants.HISTORY_STORE).clear()
    }catch(error){}
    localStorage.removeItem("aa_history")
    renderHistory()
  }

  AA.history = {
    loadHistory: loadHistory,
    addHistory: addHistory,
    restoreHistory: restoreHistory,
    openHistoryPreview: openHistoryPreview,
    closeHistoryPreview: closeHistoryPreview,
    setHistoryZoom: setHistoryZoom,
    resetHistoryView: resetHistoryView,
    renderHistory: renderHistory,
    clearHistory: clearHistory,
  }
})()
