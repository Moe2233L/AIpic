(function(){
  const AA = window.AA
  const state = AA.state
  const data = AA.data
  const constants = AA.constants

  async function apiFetch(url, options){
    try{
      return await fetch(constants.API_BASE + url, options)
    }catch(error){
      throw new Error("无法连接本地后端服务，请确认 http://127.0.0.1:8000 正在运行，并刷新页面重试")
    }
  }

  async function fetchProviders(){
    try{
      const response = await fetch(constants.API_BASE + "/api/providers")
      const text = await response.text()
      const list = JSON.parse(text)
      state.providers = Array.isArray(list) && list.length ? list : data.fallbackProviders
    }catch(error){
      state.providers = data.fallbackProviders
    }
  }

  function buildPrompt(prompt){
    const themePrefix = data.themePrompts[state.selections.theme] || ""
    const stylePrompt = data.stylePrompts[state.selections.style] || ""
    return [themePrefix, prompt, stylePrompt].filter(Boolean).join(", ")
  }

  async function requestEnhance(rawPrompt){
    const promptSettings = state.settings.prompt
    const response = await apiFetch("/api/enhance", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        prompt: rawPrompt,
        negative: AA.dom.negative.value.trim(),
        theme: (data.themes.find(function(item){ return item.id === state.selections.theme }) || {}).label || state.selections.theme,
        style: (data.styles.find(function(item){ return item.id === state.selections.style }) || {}).label || state.selections.style,
        key: promptSettings.key,
        url: promptSettings.url,
        model: promptSettings.model,
      }),
    })
    const text = await response.text()
    let payload
    try{
      payload = JSON.parse(text)
    }catch(error){
      throw new Error(text.slice(0, 200) || "服务返回异常")
    }
    if(!response.ok) throw new Error(payload.detail || "提示词优化失败")
    return payload
  }

  async function requestImageOnce(prompt){
    const imageSettings = state.settings.image
    const response = await apiFetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        provider_id: imageSettings.provider,
        model: imageSettings.model,
        key: imageSettings.key,
        url: imageSettings.url,
        prompt: prompt,
        size: state.selections.size,
        n: 1,
        reference_image: state.selections.referenceImage || null,
        image_mode: state.selections.imageMode,
      }),
    })

    const text = await response.text()
    let payload
    try{
      payload = JSON.parse(text)
    }catch(error){
      throw new Error(text.slice(0, 200) || "服务返回异常")
    }
    if(!response.ok) throw new Error(payload.detail || payload.code || "生成失败")
    const urls = payload.image_urls || [payload.image_url].filter(Boolean)
    if(!urls.length) throw new Error("API 返回为空")
    return urls[0]
  }

  async function requestImage(prompt){
    const imageSettings = state.settings.image

    if(!imageSettings.key){
      await new Promise(function(resolve){ setTimeout(resolve, 1200) })
      return "https://picsum.photos/seed/" + btoa(prompt).slice(0, 8) + "/1024/1024"
    }

    return requestImageOnce(prompt)
  }

  AA.api = {
    apiFetch: apiFetch,
    fetchProviders: fetchProviders,
    buildPrompt: buildPrompt,
    requestEnhance: requestEnhance,
    requestImage: requestImage,
  }
})()
