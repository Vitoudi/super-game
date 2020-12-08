class Observer {
    update() {}
}

class Observable {
    subscribe(observer) {
        this.observers.push(observer)
    }

    notify(type, data) {
        this.observers.forEach(observer => {
            observer.update(type, data)
        })
    }
}

class Player extends Observable {
    constructor() {
        super()
        this.HTMLlocation;
        this.coords;
        this.score = 0
        this.loose = false
        this.observers = []
    }

    create() {
        const bord = document.querySelector('.bord')
        const player = document.createElement('div')
        player.classList.add('player')
        this.HTMLlocation = player
        this.playerMargin = player.style.padding

        bord.append(player)
    }

    move(direction) {
        const style =  this.HTMLlocation.style
        this.coords = this.HTMLlocation.getBoundingClientRect()
        const width = this.coords.width - 2
        
        switch(direction) {
            case 'down': style.marginTop = (this.getMargin('Top') + width) + 'px'
            break
            case 'right': style.marginLeft= (this.getMargin('Left') + width) + 'px'
            break
            case 'up': style.marginTop = (this.getMargin('Top') - width) + 'px'
            break
            case 'left': style.marginLeft= (this.getMargin('Left') - width) + 'px'
        }
    
        this.detectCollsion()
    }

    getMargin(type) {
        const pxString = String(this.HTMLlocation.style[`margin${type}`]).replace('px', '')
        return Number(pxString)
    }

    detectCollsion() {
        const player = document.querySelector('.player')
        let playerPosition = player.getBoundingClientRect()
        let gameElements = document.querySelectorAll('.gameElement')
        
        gameElements.forEach(element => {
            const fruitPosition = element.getBoundingClientRect()

            let xDistance = (playerPosition.x + 8) - fruitPosition.x + 2
            let yDistance = (playerPosition.y + 8) - fruitPosition.y + 2

            if(Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2)) <= this.coords.width - 2) {
                if(element.classList.contains('bomb')) {
                    this.loose = true
                    this.notify('loose', {
                        loose: this.loose,
                        score: this.score
                    })
                } else {
                    this.score++
                    this.deleteFood(element)
                    this.notify('score', {
                        loose: this.loose,
                        score: this.score
                    })
                }
            }
            
        })  
    }

    deleteFood(fruit) {
        fruit.remove()
    }
}

class Controler {
    constructor(player) {
        this.player = player
    }

    handleKey(e) {
        if(e.type === 'keydown') {
            const key = e.key
            if(key.includes('Arrow')) {
                const direction = key.replace('Arrow', '').toLowerCase()
                if(this.checkBorders(direction)) {
                    this.player.move(direction)
                }   
            }
        } else if(e.type === 'click') {
            const direction = e.target.getAttribute('data-command')
            if(this.checkBorders(direction)) this.player.move(direction)
        }
        
    }

    checkBorders(direction) {
        const bordInfo  = document.querySelector('.bord').getBoundingClientRect()
        if(this.player.getMargin('Top') >= bordInfo.width - 40  && direction === 'down') return
        if(this.player.getMargin('Left') >= bordInfo.width - 40  && direction === 'right') return
        if(this.player.getMargin('Top') <= 0 && direction === 'up') return
        if(this.player.getMargin('Left') <= 0 && direction === 'left') return
        return true
    }
}

class Food extends Observable {
    constructor() {
        super()
        this.type = 'food'
        this.bord = document.querySelector('.bord')
        this.bordPosition = this.bord.getBoundingClientRect()
        this.src = 'images/cererja.png'
        this.quantitity;
        this.reachMax = false
        this.observers = []
    }

    generate() {
        const food = document.createElement('img')
        food.setAttribute('src', this.src)
        food.classList.add(this.type)
        food.classList.add('gameElement')
        
        const bordInfo  = document.querySelector('.bord').getBoundingClientRect()
        this.bord.append(food)
        food.style.top = (this.bordPosition.y + window.scrollY) + getRandomNum(5, bordInfo.width - 20) + 'px'
        food.style.left = (this.bordPosition.x + window.scrollX) + getRandomNum(5, bordInfo.width - 20) + 'px'

        function getRandomNum(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        this.checkQuantity()
    }

    checkQuantity() {
        const maxQuantity = 300
        if(this.quantity > maxQuantity) {
            this.notify('stopGeneration', 'null')
            this.reachMax = true
        } else if(this.quantity === maxQuantity - 1 && this.reachMax) {
            this.notify('startGeneration', 'null')
        }
    }

    get quantity() {
        return document.querySelectorAll('.gameElement').length
    }
}

class Bomb extends Food {
    constructor() {
        super()
        this.type = 'bomb'
        this.src = 'images/bombi.png'
    }
}

class Store {
    constructor() {
        this.HTMLlocation = document.querySelector('.store')
        this.containerLocation = document.querySelector('.store-container')
        this.ready = false
    }

    toggle() {
        if(!this.ready) {
            this.makeRequest()
        }
        this.containerLocation.classList.toggle('hidden')
    }

    makeRequest() {
        this.ready = true
        fetch('skins.json')
            .then(rawData => rawData.json())
            .then(data => {
                this.displayItems(data)
                this.displayPoints()
            })
    }

    displayPoints() {
        const pointsPlace = document.querySelector('.points')
        pointsPlace.textContent = `your points: ${this.points}`
    }
    
    displayItems(data) {
        const items = data
        items.forEach(item => {
            
            if(localStorage.getItem('buyed')) {
                const buyed = JSON.parse(localStorage.getItem('buyed'))
                if(buyed.includes(item.name)) {
                    item.price = 0
                }
            }
            
            const itemsContainer = document.querySelector('.items-container')
            const itemElement = document.createElement('div')
            itemElement.classList.add('item')
            const msg = Number(item.price) === 0 ? 'select' : item.price + 'p'

            itemElement.innerHTML = `
            <label>
                <img src="images/skins/${item.name}.png">
                <p>${item.name}</p>
                <button class="${item.name}-btn" data-type="${item.type}" data-skin="${item.name}" data-price="${item.price}" data-msg="${msg}">${msg}</button>
            </label">
            `

            itemsContainer.append(itemElement)
            this.checkSelectedSkinBtn(item.name)
        })

        document.querySelector('.items-container').addEventListener('click', e => {
            if(e.target.tagName === 'BUTTON') {
                const price = Number(e.target.getAttribute('data-price'))
                const skinName = e.target.getAttribute('data-skin')
                if(price !== 0) {
                    this.buySkin(skinName, price)
                } else {
                    console.log('free')
                    this.toOriginalState()
                    this.changeSkin(skinName)
                }
            }
        })
    }

    toOriginalState() {
        const selectBtns = document.querySelectorAll('.item button')
        selectBtns.forEach(btn => {
            const msg = btn.getAttribute('data-msg')
            btn.classList.remove('selected')
            btn.textContent = msg
        })
    }

    setSelectedSkin() {
        const player = document.querySelector('.player')
        const skinName = this.selectedSkin
        player.style.cssText = `background-image: url('images/skins/${skinName}.png')`
    }

    changeSkin(skinName) {
        localStorage.setItem('skin', skinName)
        this.deleteMsg()
        this.setSelectedSkin()
        this.checkSelectedSkinBtn(skinName)
    }

    checkSelectedSkinBtn(skinName) {
        if(skinName === this.selectedSkin) {
            const selectedBtn = document.querySelector(`.${skinName}-btn`)
            selectedBtn.textContent = 'selected'
            selectedBtn.classList.add('selected')
        }

    }

    buySkin(skinName, price) {
        if(this.points >= price) {
            localStorage.setItem('allPoints', this.points - price)
            this.displayPoints()
            
            let buyed = JSON.parse(localStorage.getItem('buyed'))
            buyed.push(skinName)
            localStorage.setItem('buyed', JSON.stringify(buyed))
            
            const itemBtn = document.querySelector(`.${skinName}-btn`)
            itemBtn.setAttribute('data-price', 0)
            itemBtn.setAttribute('data-msg', 'select')
            
            this.toOriginalState()
            this.changeSkin(skinName)
        } else {
            this.showMsg('You don\'t have enough points')
        }
    }

    showMsg(msg) {
        const msgPlace = document.querySelector('.msg')
        msgPlace.textContent = msg
    }

    deleteMsg() {
        const msgPlace = document.querySelector('.msg')
        msgPlace.textContent = ''
    }

    get selectedSkin() {
        return localStorage.getItem('skin')
    }

    get points() {
        return localStorage.getItem('allPoints')
    }

}

class Game extends Observer {
    constructor() {
        super()
        this.defaultSkin = 'yelllow'
        this.player; 
        this.controler;
        this.store;
    }

    start() {
        const player = new Player()
        this.player = player
        player.create()
        player.subscribe(this)

        const controler = new Controler(player)
        this.controler = controler

        const store = new Store()
        store.setSelectedSkin()
        this.store = store

        this.startFoodGeneration()
        this.startBombGeneration()
        this.showHighScore()
    }

    startFoodGeneration() {
        const foodInterval = setInterval(()=> {
            let food = new Food()
            food.subscribe(this)
            food.generate()
        }, 2000)

        this.foodInterval = foodInterval
    }

    startBombGeneration() {
        const bombInterval = setInterval(()=> {
            let food = new Bomb()
            food.generate()
        }, 10000)

        this.bombInterval = bombInterval
    }

    stopFoodAndBombGeneration() {
        clearInterval(this.foodInterval)
        clearInterval(this.bombInterval)
    }

    displayGameOver(score) {
        if(!document.querySelector('.game-over-back-ground')) {
            const body = document.body
            const background = document.createElement('div')
            background.classList.add('game-over-back-ground')
            background.innerHTML = `
            <h2>GAME OVER</h2>
            <p><strong>SCORE:</strong> ${score}</p>
            <button class="try-again">Try Again</button>
            `
            body.append(background)
            document.querySelector('.try-again').addEventListener('click', this.reset)
        }
    }

    cacheScore(score) {
        const allPoints = localStorage.getItem('allPoints')
        localStorage.setItem('allPoints', Number(allPoints) + score)

        if(score > localStorage.getItem('highScore')) {
            localStorage.setItem('highScore', score)
        }
    }

    showHighScore() {
        const HscorePlace = document.querySelector('#Hscore')
        HscorePlace.textContent = this.highScore
    }

    reset() {
        location.reload()
    }

    removePlayer() {
        const player = this.player.HTMLlocation
        player.remove()
    }

    get highScore() {
        return localStorage.getItem('highScore')
    }

    update(type, info) {
        console.log(type)
        if(type === 'loose' && info.loose) {
            this.displayGameOver(info.score)
            this.removePlayer()
            this.cacheScore(info.score)
        } else if(type === 'score') {
            const scorePlace = document.querySelector('#score')
            scorePlace.textContent = info.score
        } else if(type === 'stopGeneration') {
            this.stopFoodAndBombGeneration()
        } else if(type === 'startGeneration') {
            this.startFoodGeneration()
            this.startBombGeneration()
        }
    }
}

function init() {
    const game = new Game()

    function setLocalStorageDefaultValues() {
        if(localStorage.getItem('skin'), localStorage.getItem('allPoints'), localStorage.getItem('buyed')) return
        localStorage.setItem('skin', 'defaulto')
        localStorage.setItem('allPoints', 0)
        localStorage.setItem('buyed', '[]')
    }

    function startGame() {
        game.start()
    }

    function setAllEvents() {
        document.addEventListener('keydown', e => {
            game.controler.handleKey(e)
        })
        document.querySelector('.mobile-controlers').addEventListener('click', e => game.controler.handleKey(e))

        window.addEventListener('resize', game.reset)

        document.querySelector('.store-icon').addEventListener('click', e => game.store.toggle())
        document.querySelector('.close-icon').addEventListener('click', e => game.store.toggle())
    }
    
    setLocalStorageDefaultValues()
    startGame()
    setAllEvents()
}
init()

//Código feito por: Victor de Andrade