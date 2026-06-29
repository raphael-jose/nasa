const botao = document.getElementById("botao")
const key = 'laQUTbkbRZHvE99chEF5U8VBcDOnqgHcBH2zlnDI'

let imgContainer = document.getElementById("imagem-apod")
let tituloElement = document.getElementById("titulo-imagem")
let textoExplicativo = document.getElementById("texto-explicativo")
let dataInfo = document.getElementById("data-info")
let copyrightInfo = document.getElementById("copyright-info")
let loadingElement = document.getElementById("loading")

// Função para traduzir texto usando múltiplas APIs para melhor qualidade
async function traduzirTexto(texto) {
    // Limpar o texto primeiro
    const textoLimpo = texto.replace(/\s+/g, ' ').trim()
    
    try {
        // Primeira tentativa: LibreTranslate (melhor qualidade)
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            body: JSON.stringify({
                q: textoLimpo,
                source: 'en',
                target: 'pt',
                format: 'text',
                api_key: ''
            }),
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        if (response.ok) {
            const data = await response.json()
            if (data.translatedText && data.translatedText.length > 10) {
                return data.translatedText
            }
        }
        
    } catch (error) {
        console.log('LibreTranslate falhou, tentando API alternativa:', error)
    }
    
    try {
        // Segunda tentativa: MyMemory API (backup)
        const encodedText = encodeURIComponent(textoLimpo.substring(0, 1000)) // Limite para evitar erros
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|pt-br&de=your@email.com`)
        
        if (response.ok) {
            const data = await response.json()
            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                return data.responseData.translatedText
            }
        }
        
    } catch (error) {
        console.log('MyMemory falhou, tentando tradução local:', error)
    }
    
    try {
        // Terceira tentativa: Tradução simples usando dicionário básico
        const traducaoBasica = traduzirPalavrasComuns(textoLimpo)
        if (traducaoBasica !== textoLimpo) {
            return traducaoBasica
        }
    } catch (error) {
        console.log('Tradução básica falhou:', error)
    }
    
    // Se todas falharem, retorna o texto original
    return textoLimpo
}

// Função auxiliar para tradução básica de palavras comuns
function traduzirPalavrasComuns(texto) {
    const dicionario = {
        'and': 'e',
        'the': 'o/a',
        'of': 'de',
        'in': 'em',
        'to': 'para',
        'is': 'é',
        'was': 'foi',
        'are': 'são',
        'were': 'foram',
        'this': 'este/esta',
        'that': 'aquele/aquela',
        'with': 'com',
        'from': 'de',
        'by': 'por',
        'image': 'imagem',
        'galaxy': 'galáxia',
        'star': 'estrela',
        'planet': 'planeta',
        'space': 'espaço',
        'universe': 'universo',
        'nebula': 'nebulosa',
        'telescope': 'telescópio',
        'light': 'luz',
        'year': 'ano',
        'years': 'anos',
        'million': 'milhão',
        'billion': 'bilhão'
    }
    
    let textoTraduzido = texto
    for (const [en, pt] of Object.entries(dicionario)) {
        const regex = new RegExp(`\\b${en}\\b`, 'gi')
        textoTraduzido = textoTraduzido.replace(regex, pt)
    }
    
    return textoTraduzido
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
        
        console.log('Texto original completo:', explicacaoCompleta.length, 'caracteres')
        
        // Traduzir título e descrição completa
        const tituloTraduzido = await traduzirTexto(tituloCompleto)
        const explicacaoTraduzida = await traduzirTexto(explicacaoCompleta)
        
        console.log('Texto traduzido:', explicacaoTraduzida.length, 'caracteres')
        
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
    // Dividir o texto em parágrafos
    const paragrafos = texto.split(/\n\n|\. [A-Z]/).filter(p => p.trim().length > 0)
    
    if (paragrafos.length <= 1) {
        return `<p>${texto}</p>`
    }
    
    return paragrafos.map(p => `<p>${p.trim()}${p.endsWith('.') ? '' : '.'}</p>`).join('')
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