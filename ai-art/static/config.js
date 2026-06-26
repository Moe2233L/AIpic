(function(){
  const AA = window.AA = window.AA || {}

  AA.$ = function(id){ return document.getElementById(id) }
  AA.dom = {}
  AA.constants = {
    API_BASE: location.origin && location.origin.startsWith("http") ? location.origin : "http://127.0.0.1:8000",
    HISTORY_DB: "ai-art-history",
    HISTORY_STORE: "items",
  }

  AA.state = {
    providers: [],
    selections: {
      theme: "portrait",
      style: "photorealistic",
      preset: "none",
      size: "1024x1024",
      imageMode: "style",
      referenceImage: "",
    },
    preview: {
      imageUrl: "",
    },
    history: {
      items: [],
      previewItem: null,
      zoom: 1,
      panX: 0,
      panY: 0,
    },
    settings: {
      image: { provider: "openai", key: "", url: "", model: "" },
      prompt: { key: "", url: "", model: "" },
    },
  }

  AA.data = {
    fallbackProviders: [
      {id:"openai",name:"OpenAI",url:"https://api.openai.com/v1/images/generations",models:[{id:"gpt-image-2",name:"gpt-image-2"},{id:"gpt-image-1",name:"gpt-image-1"},{id:"dall-e-3",name:"DALL-E 3"}]},
      {id:"nonabanana",name:"Nonabanana (Stability)",url:"https://api.stability.ai/v2beta/stable-image/generate",models:[{id:"stable-diffusion-3.5-large",name:"SD 3.5 Large"},{id:"stable-diffusion-3.5-medium",name:"SD 3.5 Medium"},{id:"stable-image-ultra",name:"Stable Image Ultra"}]},
      {id:"flux",name:"Flux (Black Forest Labs)",url:"https://api.bfl.ml/v1",models:[{id:"flux-pro-1.1-ultra",name:"Flux 1.1 Pro Ultra"},{id:"flux-pro-1.1",name:"Flux 1.1 Pro"},{id:"flux-schnell",name:"Flux 1 Schnell"}]},
      {id:"google",name:"Google Imagen",url:"https://generativelanguage.googleapis.com",models:[{id:"imagen-3.0-generate-001",name:"Imagen 3"},{id:"imagen-2.0-generate-001",name:"Imagen 2"}]},
      {id:"ideogram",name:"Ideogram",url:"https://api.ideogram.ai/generate",models:[{id:"V_2",name:"Ideogram V2"},{id:"V_2_TURBO",name:"Ideogram V2 Turbo"}]},
      {id:"recraft",name:"Recraft",url:"https://api.recraft.ai/v1/images/generations",models:[{id:"recraft-v3",name:"Recraft V3"},{id:"recraft-v3-svg",name:"Recraft V3 SVG"}]},
      {id:"midjourney",name:"Midjourney (via GoAPI)",url:"https://api.goapi.ai/mj/v2",models:[{id:"midjourney-v6.1",name:"MJ V6.1"},{id:"midjourney-niji-6",name:"Niji V6"}]},
      {id:"leonardo",name:"Leonardo AI",url:"https://cloud.leonardo.ai/api/rest/v1/generations",models:[{id:"phoenix",name:"Phoenix"},{id:"lightning-xl",name:"Lightning XL"}]},
      {id:"together",name:"Together AI",url:"https://api.together.xyz/v1/images/generations",models:[{id:"black-forest-labs/FLUX.1-schnell",name:"FLUX.1 Schnell"},{id:"black-forest-labs/FLUX.1-pro",name:"FLUX.1 Pro"}]},
      {id:"custom",name:"自定义 OpenAI 兼容",url:"https://api.openai.com/v1/images/generations",models:[{id:"",name:"手动输入模型"}]},
    ],
    themes: [
      {id:"portrait",label:"人像"},{id:"landscape",label:"风景"},{id:"animal",label:"动物"},
      {id:"fantasy",label:"奇幻"},{id:"scifi",label:"科幻"},{id:"food",label:"美食"},
      {id:"abstract",label:"抽象"},{id:"architecture",label:"建筑"},
      {id:"character",label:"角色"},{id:"product",label:"产品"},{id:"interior",label:"室内"},
      {id:"poster",label:"海报"},{id:"fashion",label:"时装"},{id:"vehicle",label:"载具"},
      {id:"logo",label:"Logo"},{id:"nature",label:"自然"},
    ],
    styles: [
      {id:"photorealistic",label:"写实"},{id:"oil-painting",label:"油画"},{id:"watercolor",label:"水彩"},
      {id:"anime",label:"动漫"},{id:"pixel-art",label:"像素"},{id:"3d-render",label:"3D渲染"},
      {id:"sketch",label:"素描"},{id:"cinematic",label:"电影"},
      {id:"comic",label:"漫画"},{id:"cyberpunk",label:"赛博朋克"},{id:"minimalist",label:"极简"},
      {id:"isometric",label:"等距"},{id:"low-poly",label:"低多边形"},{id:"clay",label:"黏土"},
      {id:"paper-cut",label:"剪纸"},{id:"line-art",label:"线稿"},
    ],
    stylePrompts: {
      photorealistic:"photorealistic, 8k, detailed",
      "oil-painting":"oil painting, thick brushstrokes",
      watercolor:"watercolor, soft edges",
      anime:"anime style, clean linework",
      "pixel-art":"pixel art, 16-bit",
      "3d-render":"3D render, octane render",
      sketch:"pencil sketch, hand drawn",
      cinematic:"cinematic, film grain, dramatic lighting",
      comic:"comic book style, bold ink, halftone shading",
      cyberpunk:"cyberpunk, neon lights, high contrast",
      minimalist:"minimalist, clean composition, simple shapes",
      isometric:"isometric illustration, crisp geometry",
      "low-poly":"low poly, geometric facets",
      clay:"clay render, soft studio lighting",
      "paper-cut":"paper cutout, layered paper texture",
      "line-art":"line art, clean black outlines",
    },
    themePrompts: {
      portrait:"portrait of",
      landscape:"landscape of",
      animal:"illustration of",
      fantasy:"fantasy scene of",
      scifi:"scifi scene of",
      food:"dish of",
      abstract:"abstract art of",
      architecture:"architecture of",
      character:"character design of",
      product:"product shot of",
      interior:"interior design of",
      poster:"poster design for",
      fashion:"fashion editorial of",
      vehicle:"vehicle concept of",
      logo:"logo design for",
      nature:"nature scene of",
    },
    presets: [
      {id:"none",label:"不使用",theme:null,style:null,prompt:""},
      {id:"movie-poster",label:"电影海报",theme:"poster",style:"cinematic",prompt:"epic movie poster, bold title-safe composition, dramatic key art, strong silhouette, premium theatrical lighting"},
      {id:"cyber-city",label:"赛博大片",theme:"scifi",style:"cyberpunk",prompt:"rainy neon megacity, reflective streets, dense futuristic signs, cinematic cyberpunk atmosphere"},
      {id:"product-shot",label:"高级产品摄影",theme:"product",style:"photorealistic",prompt:"premium commercial product shot, clean studio background, crisp reflections, luxury advertising look"},
      {id:"character-sheet",label:"角色设定",theme:"character",style:"anime",prompt:"character design sheet, readable silhouette, detailed costume, expressive pose, concept art presentation"},
      {id:"kids-3d",label:"皮克斯 3D",theme:"character",style:"3d-render",prompt:"charming animated film look, soft rounded shapes, expressive eyes, colorful family-friendly 3D render"},
      {id:"china-poster",label:"国潮插画",theme:"poster",style:"paper-cut",prompt:"modern Chinese poster design, auspicious decorative motifs, layered composition, bold red and gold accents"},
      {id:"magazine-room",label:"家居杂志",theme:"interior",style:"photorealistic",prompt:"editorial interior photography, tasteful furniture styling, natural window light, magazine-ready composition"},
    ],
    negativePresets: [
      {id:"quality",label:"质量",text:"low quality, blurry, noisy, jpeg artifacts, overexposed, underexposed"},
      {id:"body",label:"人物",text:"bad anatomy, deformed body, bad hands, extra fingers, missing fingers, distorted face"},
      {id:"text",label:"文字",text:"watermark, signature, logo, messy text, unreadable text, typo"},
      {id:"composition",label:"画面",text:"cropped subject, duplicate subject, cluttered background, poor composition"},
      {id:"realism",label:"真实感",text:"plastic skin, uncanny face, oversmoothed texture, unrealistic lighting"},
    ],
  }
})()
