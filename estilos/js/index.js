const botao = document.getElementById("botao")
const key = 'laQUTbkbRZHvE99chEF5U8VBcDOnqgHcBH2zlnDI'

let imgContainer = document.getElementById("imagem-apod")
let tituloElement = document.getElementById("titulo-imagem")
let textoExplicativo = document.getElementById("texto-explicativo")
let dataInfo = document.getElementById("data-info")
let copyrightInfo = document.getElementById("copyright-info")
let loadingElement = document.getElementById("loading")

const traducaoCache = new Map()
const CHUNK_MAX_CHARS = 480

const termosProtegidos = [
    ['James Webb Space Telescope', 'Telescópio Espacial James Webb'],
    ['Hubble Space Telescope', 'Telescópio Espacial Hubble'],
    ['International Space Station', 'Estação Espacial Internacional'],
    ['Milky Way Galaxy', 'Galáxia Via Láctea'],
    ['Milky Way', 'Via Láctea'],
    ['Andromeda Galaxy', 'Galáxia de Andrômeda'],
    ['Solar System', 'Sistema Solar'],
    ['Big Bang', 'Big Bang'],
    ['Black Hole', 'Buraco Negro'],
    ['Dark Matter', 'Matéria Escura'],
    ['Dark Energy', 'Energia Escura'],
    ['North America', 'América do Norte'],
    ['South America', 'América do Sul'],
    ['New Horizons', 'New Horizons'],
    ['Voyager', 'Voyager'],
    ['Cassini', 'Cassini'],
    ['NASA', 'NASA'],
    ['ESA', 'ESA'],
    ['APOD', 'APOD'],
    ['Hubble', 'Hubble'],
    ['Spitzer', 'Spitzer'],
    ['Chandra', 'Chandra'],
    ['Kepler', 'Kepler'],
    ['Perseverance', 'Perseverance'],
    ['Curiosity', 'Curiosity'],
    ['ISS', 'EEI'],
    ['SDSS', 'SDSS'],
    ['JWST', 'JWST']
]

function limparTexto(texto) {
    return (texto || '').replace(/\s+/g, ' ').trim()
}

function protegerTermos(texto) {
    const mapa = new Map()
    let protegido = texto

    termosProtegidos
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([en, pt], index) => {
            const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(escaped, 'gi')
            if (!protegido.match(regex)) return

            const token = `__TERM${index}__`
            mapa.set(token, pt)
            protegido = protegido.replace(regex, token)
        })

    return { texto: protegido, mapa }
}

function restaurarTermos(texto, mapa) {
    let restaurado = texto
    mapa.forEach((pt, token) => {
        restaurado = restaurado.replaceAll(token, pt)
    })
    return restaurado
}

function dividirEmChunks(texto, max = CHUNK_MAX_CHARS) {
    if (texto.length <= max) return [texto]

    const chunks = []
    const frases = texto.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [texto]
    let atual = ''

    for (const frase of frases) {
        const pedaco = frase.trim()
        if (!pedaco) continue

        const candidato = atual ? `${atual} ${pedaco}` : pedaco

        if (candidato.length <= max) {
            atual = candidato
            continue
        }

        if (atual) chunks.push(atual)

        if (pedaco.length <= max) {
            atual = pedaco
            continue
        }

        const palavras = pedaco.split(' ')
        atual = ''
        for (const palavra of palavras) {
            const bloco = atual ? `${atual} ${palavra}` : palavra
            if (bloco.length <= max) {
                atual = bloco
            } else {
                if (atual) chunks.push(atual)
                atual = palavra
            }
        }
    }

    if (atual) chunks.push(atual)
    return chunks.length ? chunks : [texto]
}

function traducaoInvalida(texto) {
    if (!texto) return true
    const aviso = /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i
    return aviso.test(texto)
}

async function traduzirComGoogle(texto) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`
    const response = await fetch(url)

    if (!response.ok) return null

    const data = await response.json()
    const traducao = data?.[0]?.map(item => item[0]).join('')

    if (!traducao || traducaoInvalida(traducao)) return null
    return traducao
}

async function traduzirComMyMemory(texto) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|pt-BR`
    const response = await fetch(url)

    if (!response.ok) return null

    const data = await response.json()
    const traducao = data?.responseData?.translatedText

    if (data.responseStatus !== 200 || traducaoInvalida(traducao)) return null
    return traducao
}

async function traduzirComLingva(texto) {
    const url = `https://lingva.ml/api/v1/en/pt/${encodeURIComponent(texto)}`
    const response = await fetch(url)

    if (!response.ok) return null

    const data = await response.json()
    const traducao = data?.translation

    if (!traducao || traducaoInvalida(traducao)) return null
    return traducao
}

async function traduzirComLibreTranslate(texto) {
    const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            q: texto,
            source: 'en',
            target: 'pt',
            format: 'text'
        })
    })

    if (!response.ok) return null

    const data = await response.json()
    const traducao = data?.translatedText

    if (!traducao || traducaoInvalida(traducao)) return null
    return traducao
}

async function traduzirChunk(texto) {
    const servicos = [
        traduzirComGoogle,
        traduzirComMyMemory,
        traduzirComLingva,
        traduzirComLibreTranslate
    ]

    for (const servico of servicos) {
        try {
            const traducao = await servico(texto)
            if (traducao) return traducao
        } catch (error) {
            console.warn('Serviço de tradução indisponível:', error.message)
        }
    }

    return texto
}

function posProcessarTraducao(texto) {
    return texto
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/([(\[])\s+/g, '$1')
        .replace(/\s+([)\]])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim()
}

async function traduzirTexto(texto) {
    const textoLimpo = limparTexto(texto)
    if (!textoLimpo) return textoLimpo

    if (traducaoCache.has(textoLimpo)) {
        return traducaoCache.get(textoLimpo)
    }

    const { texto: textoProtegido, mapa } = protegerTermos(textoLimpo)
    const chunks = dividirEmChunks(textoProtegido)
    const traducoes = await Promise.all(chunks.map(traduzirChunk))
    const resultado = posProcessarTraducao(restaurarTermos(traducoes.join(' '), mapa))

    traducaoCache.set(textoLimpo, resultado)
    return resultado
}

async function traduzirConteudoAPOD(titulo, explicacao) {
    const [tituloTraduzido, explicacaoTraduzida] = await Promise.all([
        traduzirTexto(titulo),
        traduzirTexto(explicacao)
    ])

    return { tituloTraduzido, explicacaoTraduzida }
}

// Função para exibir dados da APOD
async function exibirAPOD(dados) {
    try {
        // Esconder loading com animação
        if (loadingElement) {
            loadingElement.style.opacity = '0'
            setTimeout(() => {
                loadingElement.style.display = 'none'
            }, 300)
        }
        
        // Verificar se há dados válidos
        if (!dados || !dados.url) {
            throw new Error('Dados inválidos recebidos da API')
        }
        
        // Pegar texto completo da explicação (sem limitar tamanho)
        const explicacaoCompleta = dados.explanation || 'Descrição não disponível.'
        const tituloCompleto = dados.title || 'Título não disponível'

        if (textoExplicativo) {
            textoExplicativo.textContent = 'Traduzindo conteúdo...'
        }

        const { tituloTraduzido, explicacaoTraduzida } = await traduzirConteudoAPOD(
            tituloCompleto,
            explicacaoCompleta
        )
        
        // Verificar se é vídeo ou imagem
        let mediaElement = ''
        if (dados.media_type === 'video') {
            mediaElement = `
                <div class="video-container">
                    <iframe src="${dados.url}" 
                            title="${tituloTraduzido}" 
                            frameborder="0" 
                            allowfullscreen
                            class="apod-video"></iframe>
                    <p class="media-info">🎥 Vídeo astronômico</p>
                </div>`
        } else {
            mediaElement = `<img src="${dados.url}" 
                                title="${tituloTraduzido}" 
                                class="img-apod" 
                                id="imagem" 
                                alt="${tituloTraduzido}"
                                loading="lazy">`
        }
        
        // Exibir mídia com efeito de carregamento
        imgContainer.innerHTML = mediaElement
        
        // Animar entrada da mídia
        const mediaEl = imgContainer.querySelector('.img-apod, .apod-video')
        if (mediaEl) {
            mediaEl.style.opacity = '0'
            mediaEl.style.transition = 'opacity 0.5s ease'
            mediaEl.onload = () => {
                mediaEl.style.opacity = '1'
            }
            // Para vídeos, mostrar imediatamente
            if (dados.media_type === 'video') {
                setTimeout(() => {
                    mediaEl.style.opacity = '1'
                }, 500)
            }
        }
        
        // Exibir título com animação
        if (tituloElement) {
            tituloElement.style.opacity = '0'
            tituloElement.textContent = tituloTraduzido
            setTimeout(() => {
                tituloElement.style.opacity = '1'
                tituloElement.style.transition = 'opacity 0.5s ease'
            }, 200)
        }
        
        // Exibir explicação traduzida completa com animação
        if (textoExplicativo) {
            textoExplicativo.style.opacity = '0'
            textoExplicativo.innerHTML = formatarTextoExplicativo(explicacaoTraduzida)
            setTimeout(() => {
                textoExplicativo.style.opacity = '1'
                textoExplicativo.style.transition = 'opacity 0.5s ease'
            }, 400)
        }
        
        // Exibir informações adicionais
        if (dataInfo && dados.date) {
            const dataFormatada = new Date(dados.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            dataInfo.textContent = `${dataFormatada}`
            dataInfo.style.opacity = '0'
            setTimeout(() => {
                dataInfo.style.opacity = '1'
                dataInfo.style.transition = 'opacity 0.5s ease'
            }, 600)
        }
        
        if (copyrightInfo) {
            let creditoTexto = ''
            if (dados.copyright) {
                creditoTexto = `Créditos: ${dados.copyright}`
            } else {
                creditoTexto = 'Imagem de domínio público - NASA/APOD'
            }
            
            copyrightInfo.textContent = creditoTexto
            copyrightInfo.style.opacity = '0'
            setTimeout(() => {
                copyrightInfo.style.opacity = '1'
                copyrightInfo.style.transition = 'opacity 0.5s ease'
            }, 800)
        }
        
    } catch (error) {
        console.error('Erro ao exibir APOD:', error)
        
        if (loadingElement) {
            loadingElement.textContent = 'Erro ao carregar conteúdo. Tente novamente.'
            loadingElement.style.color = '#ff4444'
            loadingElement.style.display = 'block'
        }
        
        if (textoExplicativo) {
            textoExplicativo.innerHTML = `
                <div class="error-message">
                    <h4>⚠️ Erro ao carregar</h4>
                    <p>Não foi possível carregar a descrição. Verifique sua conexão e tente novamente.</p>
                    <p><small>Erro: ${error.message}</small></p>
                </div>`
        }
    }
}

// Função para formatar o texto explicativo
function formatarTextoExplicativo(texto) {
    const paragrafos = texto
        .split(/\n{2,}/)
        .flatMap(bloco => bloco.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú"(\[])/))
        .map(p => p.trim())
        .filter(p => p.length > 0)

    if (!paragrafos.length) {
        return `<p>${texto}</p>`
    }

    return paragrafos
        .map(p => `<p>${p}${/[.!?]$/.test(p) ? '' : '.'}</p>`)
        .join('')
}

// Menu mobile toggle
const menuToggle = document.getElementById('menu-toggle')
const navMenu = document.getElementById('nav-menu')

menuToggle.addEventListener('click', function() {
    navMenu.classList.toggle('active')
})

// Fechar menu ao clicar em um link (mobile)
const navLinks = document.querySelectorAll('nav ul li a')
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            navMenu.classList.remove('active')
        }
    })
})

// Fechar menu ao clicar fora dele (mobile)
document.addEventListener('click', function(event) {
    const isClickInsideNav = navMenu.contains(event.target)
    const isClickOnToggle = menuToggle.contains(event.target)
    
    if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active')
    }
})

// carregando foto de hoje da APOD 
function carregarImagemHoje() {
    const req = new XMLHttpRequest()
    req.open('GET', `https://api.nasa.gov/planetary/apod?api_key=${key}`, true)
    req.addEventListener("load", async function () {
        if ( this.status === 200 && this.readyState === 4 ) {
            const dados = JSON.parse(req.responseText)
            await exibirAPOD(dados)
        } else {
            console.error('Erro ao carregar imagem do dia')
            if (loadingElement) {
                loadingElement.textContent = 'Erro ao carregar imagem. Tente novamente.'
            }
        }
    })
    req.send()
}

// Chamar a função para carregar a imagem
carregarImagemHoje()

// botao para data especifica
botao.addEventListener("click", async function () {
    let date = document.getElementById("data").value
    
    if (!date) {
        alert('Por favor, selecione uma data!')
        return
    }
    
    // Mostrar loading
    if (loadingElement) {
        loadingElement.style.display = 'block'
        loadingElement.textContent = '🚀 Buscando imagem da data selecionada...'
    }
    
    const newReq = new XMLHttpRequest()
    newReq.onreadystatechange = async function () {
        if ( this.status === 200 && this.readyState === 4 ) {
            const dados = JSON.parse(newReq.responseText)
            await exibirAPOD(dados)
        } else if (this.readyState === 4) {
            console.error('Erro ao buscar imagem da data')
            if (loadingElement) {
                loadingElement.textContent = 'Erro ao buscar imagem. Verifique a data e tente novamente.'
            }
        }
    }
    newReq.open('GET', `https://api.nasa.gov/planetary/apod?api_key=${key}&date=${date}`, true)
    newReq.send()
})