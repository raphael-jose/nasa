const botao = document.getElementById("botao")
const botaoHoje = document.getElementById("hoje")
const key = 'laQUTbkbRZHvE99chEF5U8VBcDOnqgHcBH2zlnDI'

let imgContainer = document.getElementById("imagem-apod")

const req = new XMLHttpRequest()

// carregando foto de hoje da APOD 
req.open('GET', `https://api.nasa.gov/planetary/apod?api_key=${key}`, false)
req.addEventListener("load", function () {
    if ( this.status === 200 && this.readyState === 4 ) {
        let dados = JSON.parse(req.responseText)
        let img = dados.url

        imgContainer.innerHTML += `<img src="${img}" title="${dados.title}" class="img-apod" id="imagem">`
    }
})
req.send()

const newReq = new XMLHttpRequest()

// botao para data especifica
botao.addEventListener("click", function () {
    let date = document.getElementById("data").value
    
    newReq.onreadystatechange = function () {
        if ( this.status === 200 && this.readyState === 4 ) {
            let dados = JSON.parse(newReq.responseText)
            let img = dados.url
            imagem.src = img
            imagem.title = dados.title
        }
    }
    newReq.open('GET', `https://api.nasa.gov/planetary/apod?api_key=${key}&date=${date}`, false)
    newReq.send()
})
