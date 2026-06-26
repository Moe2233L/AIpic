(function(){
  const AA = window.AA
  const dom = AA.dom
  const state = AA.state
  const data = AA.data

  function loadSettings(){
    try{
      const old = JSON.parse(localStorage.getItem("aa_settings"))
      if(old){
        state.settings.image = {
          provider: old.provider || state.settings.image.provider,
          key: old.key || "",
          url: old.url || "",
          model: old.model || "",
        }
        state.settings.prompt = {
          key: old.enhanceKey || "",
          url: old.enhanceUrl || "",
          model: old.enhanceModel || "",
        }
      }
      const image = JSON.parse(localStorage.getItem("aa_image_settings"))
      const prompt = JSON.parse(localStorage.getItem("aa_prompt_settings"))
      if(image) state.settings.image = Object.assign({}, state.settings.image, image)
      if(prompt) state.settings.prompt = Object.assign({}, state.settings.prompt, prompt)
    }catch(error){}
  }

  async function toggleSettings(){
    dom.settingsOverlay.classList.toggle("show")
    if(!dom.settingsOverlay.classList.contains("show")) return
    if(!state.providers.length) await AA.api.fetchProviders()
    dom.sKey.value = state.settings.image.key
    dom.sUrl.value = state.settings.image.url
    dom.sModelCustom.value = state.settings.image.model
    dom.sEnhanceKey.value = state.settings.prompt.key
    dom.sEnhanceUrl.value = state.settings.prompt.url
    dom.sEnhanceModel.value = state.settings.prompt.model
    renderProviderSelect()
    onProviderChange()
  }

  function renderProviderSelect(){
    const list = state.providers.length ? state.providers : data.fallbackProviders
    if(!list.some(function(item){ return item.id === state.settings.image.provider })){
      state.settings.image.provider = "openai"
    }
    dom.sProvider.innerHTML = list.map(function(item){
      return '<option value="' + item.id + '"' + (item.id === state.settings.image.provider ? " selected" : "") + ">" + item.name + "</option>"
    }).join("")
  }

  function onProviderChange(){
    const providerId = dom.sProvider.value
    const provider = state.providers.find(function(item){ return item.id === providerId }) || {}
    const sameProvider = providerId === state.settings.image.provider
    const models = provider.models || []
    const activeModel = sameProvider && state.settings.image.model ? state.settings.image.model : ((models[0] || {}).id || "")
    dom.sUrl.value = sameProvider && state.settings.image.url ? state.settings.image.url : (provider.url || "")
    dom.sModelCustom.value = activeModel
    dom.sModelChips.innerHTML = models.map(function(model){
      return '<button class="chip-mini' + (model.id === activeModel ? " active" : "") + '" type="button" data-model="' + model.id + '">' + model.name + "</button>"
    }).join("")
    dom.sModelChips.querySelectorAll(".chip-mini").forEach(function(button){
      button.onclick = function(){
        dom.sModelCustom.value = button.dataset.model
        dom.sModelChips.querySelectorAll(".chip-mini").forEach(function(node){
          node.classList.toggle("active", node.dataset.model === button.dataset.model)
        })
      }
    })
  }

  function saveSettings(){
    state.settings.image = {
      provider: dom.sProvider.value,
      key: dom.sKey.value.trim(),
      url: dom.sUrl.value.trim(),
      model: dom.sModelCustom.value.trim(),
    }
    state.settings.prompt = {
      key: dom.sEnhanceKey.value.trim(),
      url: dom.sEnhanceUrl.value.trim(),
      model: dom.sEnhanceModel.value.trim(),
    }
    localStorage.setItem("aa_image_settings", JSON.stringify(state.settings.image))
    localStorage.setItem("aa_prompt_settings", JSON.stringify(state.settings.prompt))
    toggleSettings()
  }

  AA.settings = {
    loadSettings: loadSettings,
    toggleSettings: toggleSettings,
    onProviderChange: onProviderChange,
    saveSettings: saveSettings,
  }
})()
