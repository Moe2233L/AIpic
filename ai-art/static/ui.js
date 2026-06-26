(function(){
  const AA = window.AA
  const $ = AA.$
  const dom = AA.dom
  const state = AA.state
  const data = AA.data

  function initDom(){
    dom.themeSelect = $("theme-select")
    dom.styleSelect = $("style-select")
    dom.presetSelect = $("preset-select")
    dom.sizeGrid = $("size-grid")
    dom.imageModeGrid = $("image-mode-grid")
    dom.prompt = $("prompt")
    dom.negative = $("negative")
    dom.generateBtn = $("generate-btn")
    dom.errorMsg = $("error-msg")
    dom.previewImg = $("preview-img")
    dom.previewPlaceholder = $("preview-placeholder")
    dom.loading = $("loading")
    dom.downloadBtn = $("download-btn")
    dom.negativePresets = $("negative-presets")
    dom.referenceInput = $("reference-input")
    dom.referencePreview = $("reference-preview")
    dom.historySection = $("history-section")
    dom.historyGrid = $("history-grid")
    dom.historyPreviewOverlay = $("history-preview-overlay")
    dom.historyPreviewImg = $("history-preview-img")
    dom.historyPreviewPrompt = $("history-preview-prompt")
    dom.historyZoomValue = $("history-zoom-value")
    dom.settingsOverlay = $("settings-overlay")
    dom.settingsModal = $("settings-modal")
    dom.sProvider = $("s-provider")
    dom.sKey = $("s-key")
    dom.sUrl = $("s-url")
    dom.sModelChips = $("s-model-chips")
    dom.sModelCustom = $("s-model-custom")
    dom.sEnhanceKey = $("s-enhance-key")
    dom.sEnhanceUrl = $("s-enhance-url")
    dom.sEnhanceModel = $("s-enhance-model")
  }

  function bindDragPan(stage){
    let dragging = false
    let startX = 0
    let startY = 0
    let startPanX = 0
    let startPanY = 0
    let pointerId = null

    function stopDrag(){
      if(!dragging) return
      dragging = false
      stage.classList.remove("dragging")
      if(pointerId !== null){
        try{ stage.releasePointerCapture(pointerId) }catch(error){}
      }
      pointerId = null
    }

    stage.onpointerdown = function(event){
      if(event.button !== undefined && event.button !== 0) return
      event.preventDefault()
      dragging = true
      pointerId = event.pointerId
      stage.classList.add("dragging")
      try{ stage.setPointerCapture(pointerId) }catch(error){}
      startX = event.clientX
      startY = event.clientY
      startPanX = state.history.panX
      startPanY = state.history.panY
    }

    stage.onpointermove = function(event){
      if(!dragging) return
      event.preventDefault()
      state.history.panX = startPanX + event.clientX - startX
      state.history.panY = startPanY + event.clientY - startY
      renderHistoryTransform(false)
    }

    stage.onpointerup = stopDrag
    stage.onpointercancel = stopDrag
    window.addEventListener("pointerup", stopDrag)
    window.addEventListener("pointercancel", stopDrag)
    window.addEventListener("blur", stopDrag)
  }

  function renderAll(){
    renderDropdown(dom.themeSelect, data.themes, state.selections.theme, function(id){ state.selections.theme = id })
    renderDropdown(dom.styleSelect, data.styles, state.selections.style, function(id){ state.selections.style = id })
    renderDropdown(dom.presetSelect, data.presets, state.selections.preset, applyPreset)
    renderSizeChips()
    renderImageModeChips()
    renderNegativePresets()
    AA.history.renderHistory()
  }

  function renderSizeChips(){
    if(!dom.sizeGrid) return
    dom.sizeGrid.querySelectorAll(".chip").forEach(function(button){
      button.classList.toggle("active", button.dataset.size === state.selections.size)
      button.onclick = function(){
        state.selections.size = button.dataset.size
        renderSizeChips()
      }
    })
  }

  function renderImageModeChips(){
    if(!dom.imageModeGrid) return
    dom.imageModeGrid.querySelectorAll(".chip").forEach(function(button){
      button.classList.toggle("active", button.dataset.mode === state.selections.imageMode)
      button.onclick = function(){
        state.selections.imageMode = button.dataset.mode
        renderImageModeChips()
      }
    })
  }

  function handleReferenceUpload(){
    const file = dom.referenceInput.files && dom.referenceInput.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = function(){
      state.selections.referenceImage = reader.result
      dom.referencePreview.src = state.selections.referenceImage
      dom.referencePreview.style.display = "block"
      $("reference-clear-btn").style.display = "inline-block"
    }
    reader.readAsDataURL(file)
  }

  function clearReferenceImage(){
    state.selections.referenceImage = ""
    dom.referenceInput.value = ""
    dom.referencePreview.removeAttribute("src")
    dom.referencePreview.style.display = "none"
    $("reference-clear-btn").style.display = "none"
  }

  function appendText(el, text){
    const current = el.value.trim()
    if(!text) return
    el.value = current ? current + ", " + text : text
  }

  function applyPreset(id){
    state.selections.preset = id
    const preset = data.presets.find(function(item){ return item.id === id })
    if(!preset || preset.id === "none") return
    if(preset.theme) state.selections.theme = preset.theme
    if(preset.style) state.selections.style = preset.style
    appendText(dom.prompt, preset.prompt)
    renderDropdown(dom.themeSelect, data.themes, state.selections.theme, function(nextId){ state.selections.theme = nextId })
    renderDropdown(dom.styleSelect, data.styles, state.selections.style, function(nextId){ state.selections.style = nextId })
  }

  function renderNegativePresets(){
    dom.negativePresets.innerHTML = data.negativePresets.map(function(item){
      return '<button class="mini-chip" type="button" data-id="' + item.id + '">' + item.label + "</button>"
    }).join("")
    dom.negativePresets.querySelectorAll(".mini-chip").forEach(function(button){
      button.onclick = function(){
        appendText(dom.negative, (data.negativePresets.find(function(item){ return item.id === button.dataset.id }) || {}).text)
      }
    })
  }

  function closeDropdowns(except){
    document.querySelectorAll(".comic-dropdown.open").forEach(function(el){
      if(el !== except) el.classList.remove("open")
    })
  }

  function renderDropdown(el, list, active, onChange){
    const current = list.find(function(item){ return item.id === active }) || list[0]
    el.innerHTML = '<button class="dropdown-trigger" type="button"><span>' + current.label + '</span></button><div class="dropdown-menu"></div>'
    const trigger = el.querySelector(".dropdown-trigger")
    const menu = el.querySelector(".dropdown-menu")
    menu.innerHTML = list.map(function(item){
      return '<button class="dropdown-item' + (item.id === active ? " active" : "") + '" type="button" data-value="' + item.id + '">' + item.label + "</button>"
    }).join("")
    trigger.onclick = function(event){
      event.stopPropagation()
      el.classList.toggle("open")
      closeDropdowns(el)
    }
    menu.querySelectorAll(".dropdown-item").forEach(function(item){
      item.onclick = function(event){
        event.stopPropagation()
        onChange(item.dataset.value)
        trigger.querySelector("span").textContent = item.textContent
        menu.querySelectorAll(".dropdown-item").forEach(function(node){
          node.classList.toggle("active", node === item)
        })
        el.classList.remove("open")
      }
    })
  }

  function setBusy(isBusy){
    dom.loading.style.display = isBusy ? "flex" : "none"
    dom.previewPlaceholder.style.display = isBusy ? "none" : "block"
    dom.previewImg.style.display = "none"
    dom.downloadBtn.style.display = "none"
    dom.generateBtn.disabled = isBusy
  }

  function showImage(url){
    state.preview.imageUrl = url
    dom.previewImg.onload = function(){
      dom.loading.style.display = "none"
      dom.downloadBtn.style.display = "block"
    }
    dom.previewImg.onerror = function(){
      dom.errorMsg.textContent = "图片地址已返回，但浏览器无法加载"
      setBusy(false)
    }
    dom.previewImg.src = url
    dom.previewImg.style.display = "block"
    dom.previewPlaceholder.style.display = "none"
    dom.loading.style.display = "none"
    dom.downloadBtn.style.display = "block"
  }

  function renderHistoryTransform(animated){
    const shouldAnimate = animated !== false
    dom.historyPreviewImg.classList.toggle("no-anim", !shouldAnimate)
    dom.historyPreviewImg.style.transform = "translate3d(" + state.history.panX + "px," + state.history.panY + "px,0) scale(" + state.history.zoom + ")"
    dom.historyZoomValue.textContent = Math.round(state.history.zoom * 100) + "%"
    if(!shouldAnimate){
      requestAnimationFrame(function(){ dom.historyPreviewImg.classList.remove("no-anim") })
    }
  }

  function spawnParticles(){
    const el = $("particles")
    if(!el) return
    for(let i = 0; i < 30; i += 1){
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.style.left = Math.random() * 100 + "%"
      particle.style.width = particle.style.height = 2 + Math.random() * 6 + "px"
      particle.style.animationDuration = 8 + Math.random() * 12 + "s"
      particle.style.animationDelay = Math.random() * 10 + "s"
      el.appendChild(particle)
    }
  }

  function spawnBursts(){
    const el = $("bursts")
    if(!el) return
    for(let i = 0; i < 6; i += 1){
      const star = document.createElement("div")
      const size = 20 + Math.random() * 60
      star.className = "burst-star"
      star.style.width = size + "px"
      star.style.height = size + "px"
      star.style.setProperty("--sx", Math.random() * 100 + "vw")
      star.style.setProperty("--sy", Math.random() * 100 + "vh")
      star.style.setProperty("--ex", Math.random() * 100 + "vw")
      star.style.setProperty("--ey", Math.random() * 100 + "vh")
      el.appendChild(star)
    }
  }

  let sfxTimer = null
  function bindSfx(){
    $("generate-btn").addEventListener("mouseenter", function(){
      clearTimeout(sfxTimer)
      const roll = Math.random()
      const id = roll < 0.33 ? "sfx-pow" : roll < 0.66 ? "sfx-bam" : "sfx-zap"
      const el = $(id)
      el.classList.add("show")
      sfxTimer = setTimeout(function(){ el.classList.remove("show") }, 800)
    })
  }

  AA.ui = {
    initDom: initDom,
    bindDragPan: bindDragPan,
    renderAll: renderAll,
    renderDropdown: renderDropdown,
    renderSizeChips: renderSizeChips,
    renderImageModeChips: renderImageModeChips,
    handleReferenceUpload: handleReferenceUpload,
    clearReferenceImage: clearReferenceImage,
    closeDropdowns: closeDropdowns,
    setBusy: setBusy,
    showImage: showImage,
    renderHistoryTransform: renderHistoryTransform,
    spawnParticles: spawnParticles,
    spawnBursts: spawnBursts,
    bindSfx: bindSfx,
  }
})()
