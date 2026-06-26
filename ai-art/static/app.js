(function(){
  const AA = window.AA
  const $ = AA.$
  const dom = AA.dom
  const state = AA.state

  function bindEvents(){
    dom.generateBtn.onclick = generate
    dom.downloadBtn.onclick = downloadImg
    $("enhance-btn").onclick = enhancePrompt
    $("reference-upload-btn").onclick = function(){ dom.referenceInput.click() }
    $("reference-clear-btn").onclick = AA.ui.clearReferenceImage
    dom.referenceInput.onchange = AA.ui.handleReferenceUpload
    $("negative-clear-btn").onclick = function(){ dom.negative.value = "" }
    $("history-clear-btn").onclick = AA.history.clearHistory
    $("history-preview-close").onclick = AA.history.closeHistoryPreview
    $("history-preview-use").onclick = function(){
      AA.history.restoreHistory(state.history.previewItem)
      AA.history.closeHistoryPreview()
    }
    $("history-preview-download").onclick = function(){
      if(state.history.previewItem) downloadUrl(state.history.previewItem.url)
    }
    $("history-zoom-in").onclick = function(){ AA.history.setHistoryZoom(state.history.zoom + 0.25) }
    $("history-zoom-out").onclick = function(){ AA.history.setHistoryZoom(state.history.zoom - 0.25) }
    $("history-zoom-reset").onclick = AA.history.resetHistoryView
    $("history-preview-stage").onwheel = function(e){
      e.preventDefault()
      AA.history.setHistoryZoom(state.history.zoom + (e.deltaY < 0 ? 0.15 : -0.15))
    }
    dom.historyPreviewOverlay.onclick = AA.history.closeHistoryPreview
    $("history-preview-modal").onclick = function(e){ e.stopPropagation() }
    dom.settingsOverlay.onclick = AA.settings.toggleSettings
    dom.settingsModal.onclick = function(e){ e.stopPropagation() }
    $("settings-btn").onclick = AA.settings.toggleSettings
    dom.sProvider.onchange = AA.settings.onProviderChange
    $("settings-save-btn").onclick = AA.settings.saveSettings
    document.addEventListener("keydown", function(e){
      if(e.key === "Enter" && e.ctrlKey) generate()
    })
    document.addEventListener("click", function(){ AA.ui.closeDropdowns() })
    AA.ui.bindDragPan($("history-preview-stage"))
  }

  async function enhancePrompt(){
    const raw = dom.prompt.value.trim()
    if(!raw){
      dom.errorMsg.textContent = "先写一句画面描述，再点增强"
      return
    }
    if(!state.settings.prompt.key || !state.settings.prompt.url || !state.settings.prompt.model){
      dom.errorMsg.textContent = "请先在设置里配置提示词优化 API"
      AA.settings.toggleSettings()
      return
    }

    const button = $("enhance-btn")
    button.disabled = true
    button.textContent = "优化中"
    dom.errorMsg.textContent = ""
    try{
      const result = await AA.api.requestEnhance(raw)
      dom.prompt.value = result.prompt || raw
      if(result.negative_prompt) dom.negative.value = result.negative_prompt
      dom.errorMsg.textContent = "提示词已由大模型优化"
    }catch(error){
      dom.errorMsg.textContent = "优化失败: " + error.message
    }
    button.disabled = false
    button.textContent = "增强"
  }

  async function generate(){
    const prompt = dom.prompt.value.trim()
    if(!state.settings.image.key && !prompt){
      dom.errorMsg.textContent = "请先配置生图 API Key"
      return
    }
    dom.errorMsg.textContent = ""
    AA.ui.setBusy(true)
    try{
      const finalPrompt = AA.api.buildPrompt(prompt)
      const url = await AA.api.requestImage(finalPrompt)
      AA.ui.showImage(url)
      await AA.history.addHistory(url)
    }catch(error){
      dom.errorMsg.textContent = "生成失败: " + error.message
      AA.ui.setBusy(false)
    }
    dom.generateBtn.disabled = false
  }

  function dataUrlToBlob(url){
    const parts = url.split(",")
    const mime = (parts[0].match(/data:([^;]+)/) || [])[1] || "image/png"
    const bytes = atob(parts.slice(1).join(","))
    const buffer = new Uint8Array(bytes.length)
    for(let i = 0; i < bytes.length; i += 1){
      buffer[i] = bytes.charCodeAt(i)
    }
    return new Blob([buffer], {type: mime})
  }

  async function imageToDownloadUrl(url){
    if(url.startsWith("data:")) return URL.createObjectURL(dataUrlToBlob(url))
    const response = await fetch(url, {mode: "cors"})
    if(!response.ok) throw new Error("下载失败")
    return URL.createObjectURL(await response.blob())
  }

  async function downloadUrl(url){
    const href = await imageToDownloadUrl(url)
    const a = document.createElement("a")
    a.href = href
    a.download = "ai-art-" + Date.now() + ".png"
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(function(){ URL.revokeObjectURL(href) }, 1000)
  }

  async function downloadImg(){
    if(!state.preview.imageUrl) return
    try{
      await downloadUrl(state.preview.imageUrl)
    }catch(error){
      window.open(state.preview.imageUrl, "_blank")
    }
  }

  async function init(){
    AA.ui.initDom()
    bindEvents()
    AA.settings.loadSettings()
    await AA.history.loadHistory()
    AA.ui.renderAll()
    await AA.api.fetchProviders()
    AA.ui.spawnParticles()
    AA.ui.spawnBursts()
    AA.ui.bindSfx()
  }

  document.addEventListener("DOMContentLoaded", init)
})()
