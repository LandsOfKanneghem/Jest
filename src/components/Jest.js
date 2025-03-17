import React from "react"
import * as PIXI from "pixi.js";
import { Stage, Container, Sprite, Text } from '@pixi/react'
import { getUID, shuffleArr } from "./functions/otherFunctions.ts"
import { AI_chooseCardToPlay, chooseGoodCards_AI, getBadCards } from "./JestAI"

import '../styles/jest.scss'

import img_coin from './game resources/img/special card/coin_spcard.png';
import img_inversion from './game resources/img/special card/inversion_spcard.png';
import img_joker from './game resources/img/special card/joker_spcard.png';
import img_cancel from './game resources/img/special card/cancel_spcard.png';
import img_swap from './game resources/img/special card/swap_spcard.png';
import img_clover from './game resources/img/special card/clover_spcard.png';
import img_truce from './game resources/img/special card/truce_spcard.png';
import img_doubling from './game resources/img/special card/x2_spcard.png';
import img_sprint from './game resources/img/special card/sprint_spcard.png';
import img_hourglass from './game resources/img/special card/hourglass_spcard.png';
import img_champion from './game resources/img/special card/champion_spcard.png';
import img_plague from './game resources/img/special card/plague_spcard.png';

import img_avatar_player from './game resources/img/portraits/hero.png';
import img_avatar_AI0 from './game resources/img/portraits/AI_0.png';
import img_avatar_AI1 from './game resources/img/portraits/AI_1.png';
import img_avatar_AI2 from './game resources/img/portraits/AI_2.png';
import img_avatar_AI3 from './game resources/img/portraits/AI_3.png';
import img_avatar_AI4 from './game resources/img/portraits/AI_4.png';
import img_avatar_AI5 from './game resources/img/portraits/AI_5.png';
import img_avatar_AI6 from './game resources/img/portraits/AI_6.png';
import img_avatar_AI7 from './game resources/img/portraits/AI_7.png';
import img_avatar_AI8 from './game resources/img/portraits/AI_8.png';
import img_avatar_AI9 from './game resources/img/portraits/AI_9.png';

let AI_avatars = [
    img_avatar_AI0,
    img_avatar_AI1,
    img_avatar_AI2,
    img_avatar_AI3,
    img_avatar_AI4,
    img_avatar_AI5,
    img_avatar_AI6,
    img_avatar_AI7,
    img_avatar_AI8,
    img_avatar_AI9,
]

let emptyCard = {id: null, color: null, value: null}

let allSpecialCards = [
    {value: 'coin'},
    {value: 'inversion'},
    {value: 'doubling'},
    {value: 'joker'},
    {value: 'cancel'},
    {value: 'clover'},
    {value: 'sprint'},
    {value: 'truce'},                            
    {value: 'swap'},
    {value: 'hourglass'},
    {value: 'champion'},
    {value: 'plague'},
]

let playerSpecialDeck_PROPS = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],//НОВИЧОК
    [3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],//ДЖОКЕР
    [3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],//ОТМЕНА
    [3, 3, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0],//СПРИНТ
    [3, 3, 2, 3, 3, 0, 1, 0, 0, 0, 0, 0],//КЛЕВЕР
    [3, 3, 2, 3, 3, 2, 1, 0, 0, 0, 0, 0],//ПЕРЕМИРИЕ    
    [3, 3, 2, 3, 3, 2, 1, 1, 0, 0, 0, 0],//ЧАСЫ
    [3, 3, 2, 3, 3, 2, 1, 1, 0, 1, 0, 0],//СВАП
    [3, 3, 2, 3, 3, 2, 1, 1, 1, 1, 0, 0],//ЧЕМПИОН
    [3, 3, 2, 3, 3, 2, 1, 1, 1, 1, 1, 0],//СМЕРТЬ
]

let getImg = {
    'coin': img_coin,
    'inversion': img_inversion,
    'doubling': img_doubling,
    'joker': img_joker,
    'cancel': img_cancel,  
    'clover': img_clover,
    'sprint': img_sprint,
    'truce': img_truce,
    'swap': img_swap,
    'hourglass': img_hourglass,
    'champion': img_champion,
    'plague': img_plague,
}

let getDesc = {
    'coin': ["Монетка", "Игрок сбрасывает 3 выбранные карты и берет 3 верхние карты из общей колоды."],
    'inversion': ["Инверсия", "Игрок в этот же ход может разыграть одну обычную карту как карту с противоположным цветом."],
    'joker': ["Джокер", "Вместо джокера игрок выбирает зеленый или красный цвет карты и любое значение от -5 до +5 и разыгрывает ее."],
    'cancel': ["Отмена", "Игрок отменяет последнюю разыгранную карту оппонента, если она является обычной картой или Джокером."],
    'swap': ["Обмен", "Количество очков у обоих игроков меняется местами (только если оно у обоих игроков неотрицательное)."],
    'clover': ["Клевер", "Игрок сбрасывает 2 выбранные карты и берет из общей колоды 2 любые карты на выбор."],
    'truce': ["Перемирие", "Очки обоих игроков обнуляются (если счет игрока меньше 0 - без изменений)."],
    'doubling': ["Удвоение", "Очки игрока удваиваются."],
    'sprint': ["Спринт", "Игрок в этот ход имеет возможность разыграть две обычные карты подряд."],
    'hourglass': ["Песочные часы", "Пропускает 2 хода для обоих игроков, следующий ходит снова игрок."],
    'champion': ["Чемпион", "Увеличивает очки любого игрока на выбор на 10 единиц."],
    'plague': ["Чума", "Счет оппонента становится -12. Пока счет оппонента отрицательный - его можно понижать еще больше (можно разыграть только в первый ход)."],
}

function initgeneralDeckCards() {
    let arr = []
    let count = 0
    for (let i = 1; i <= 4; i++) {
        //сколько раз добавить
        for (let k = 1; k <= 4; k++) {
            arr.push({color: "green", value: i, id: count++})
            arr.push({color: "red", value: -i, id: count++})
            arr.push({color: "green", value: -i, id: count++})
            arr.push({color: "red", value: i, id: count++})
        }     
    }
    for (let i = 0; i < 3; i++) shuffleArr(arr)
    return arr
}

let spcards_pl = [
    ['NULL', 'NULL', 'NULL'],//НОВИЧОК
    ['joker', 'NULL', 'NULL'],//ДЖОКЕР
    ['cancel', 'cancel', 'cancel'],//ОТМЕНА
    ['sprint', 'joker', 'joker'],//СПРИНТ
    ['clover', 'clover', 'joker'],//КЛЕВЕР
    ['truce', 'truce', 'joker'],//ПЕРЕМИРИЕ   
    ['hourglass', 'joker', 'truce'],//ЧАСЫ
    ['swap', 'swap', 'clover'],//СВАП
    ['champion', 'joker', 'joker'],//ЧЕМПИОН
    ['plague', 'truce', 'cancel'],//ЧУМА
]

export default function Jest(props) {
    //выбор режима сложности (ВРЕМЕННО)
    //КАК НАДО: сложность передается в зависимости от того, с кем играешь
    let [difficulty, setDifficulty] = React.useState(null)
    React.useEffect(()=> {
        if (difficulty !== null) {
            setAiStrategy(difficulty)
            setAiInitialSpCards([...spcards_pl[difficulty]])
            //КАК НАДО: вместо сложности передается массив наподобие "playerSpecialDeck_PROPS[difficulty]",
            //только из реальной имеющейся на текущей момент колоды у игрока
            initSpecialDeck_AI(difficulty)
        }
    }, [difficulty])

    const maxValue = 15;
    const lastTurn = 11;
    let [aiStrategy, setAiStrategy] = React.useState(null)//props.aiStrategy
    let [aiInitialSpCards, setAiInitialSpCards] = React.useState(null)//зависит от стратегии
    let [rulesOn, setRulesOn] = React.useState(false)
    let [gameStatus, setGameStatus] = React.useState(null)
    let [playerSpecialDeck, setPlayerSpecialDeck] = React.useState([])
    let [choosingCardsFromDeck, setChoosingCardsFromDeck] = React.useState(false) 
    let [chosenCards, setChosenCards] = React.useState([])
    let [choiceAccepted, setChoiceAccepted] = React.useState(false)

    //игровые данные
    let [roundWinner, setRoundWinner] = React.useState(null)
    let [isPlayerTurn, setIsPlayerTurn] = React.useState()
    let [playerScore, setPlayerScore] = React.useState(0)
    let [aiScore, setAiScore] = React.useState(0)
    let [turn, setTurn] = React.useState(0)
    let [playerPoints, setPlayerPoints] = React.useState(0)
    let [prevPlayerPoints, setPrevPlayerPoints] = React.useState(0)
    let [aiPoints, setAiPoints] = React.useState(0)
    let [prevAiPoints, setPrevAiPoints] = React.useState(0)
    let [description, setDescription] = React.useState(null)//описание в нижней части экрана

    //колоды в игре + выполненные действия
    let [playerHand, setPlayerHand] = React.useState([])//обычная рука игрока
    let [playerSpecialHand, setPlayerSpecialHand] = React.useState([])//особая рука игрока
    let [playerPlayedCards, setPlayerPlayedCards] = React.useState([])//сыгранные карты игрока
    let [playerDoneActions, setPlayerDoneActions] = React.useState([])//выполненные действия игрока (действие - сыгранная карта или сброс)
    let [aiHand, setAiHand] = React.useState([])//обычная рука ИИ
    let [aiSpecialHand, setAiSpecialHand] = React.useState([])//особая рука ИИ
    let [aiPlayedCards, setAiPlayedCards] = React.useState([])//сыгранные карты ИИ
    let [aiDoneActions, setAiDoneActions] = React.useState([])//выполненные действия ИИ (действие - сыгранная карта или сброс)
    let [generalDeck, setGeneralDeck] = React.useState([])//общая колода

    //режимы
    let [counter, setCounter] = React.useState(0)//счетчик (исп. в разных местах)
    let [maxCounter, setMaxCounter] = React.useState(0)//максимальное значение счетчика (исп. в разных местах)
    let [discardBeforeStart, setDiscardBeforeStart] = React.useState(false)//сброс карт перед началом раунда
    let [sprintCount, setSprintCount] = React.useState(0)//для розыгрыша Спринта (сколько карт сыграно)
    let [discardNCards, setDiscardNCards] = React.useState(false)//сброс N карт
    let [specialCardParams, setSpecialCardParams] = React.useState(null)//выбор хар-к спец карты
    let [specialCardState, setSpecialCardState] = React.useState(null)//состояние спец карты (зависит от разыгранной спец карты)
    
    //вызвать в самом начале
    React.useEffect(()=>{

    }, [])

    //вызвать, когда изменился статус игры
    React.useEffect(()=> {
        if (gameStatus === 'before start') setSpecialHandForNewRound_player()
        else if (gameStatus === 'round finished') {}
    }, [gameStatus])

    //вызвать, когда выбираешь карты (для расчета оффсета)
    let [offsetFromTop, setOffsetFromTop] = React.useState(0)
    React.useEffect(()=> {
        //СДЕЛАТЬ ПО-ДРУГОМУ
        if (choosingCardsFromDeck) {
            let cardsListBlock = document.getElementsByClassName("select-cards--menu")[0]
            let computedStyle = getComputedStyle(cardsListBlock).getPropertyValue("height")
            setOffsetFromTop(computedStyle)
        }
    }, [choosingCardsFromDeck])

    //вызвать, когда закончился раунд (заканчиваем игру или начинаем новый раунд)
    React.useEffect(()=> {
        if (roundWinner !== null) {
            let desc_winner, restMsg
            if (roundWinner === 'player') desc_winner = "Победа. "
            else if (roundWinner === 'AI') desc_winner = "Поражение. "
            else if (roundWinner === 'draw') desc_winner = "Ничья. "
            //условие окончания игры
            if ((aiScore >= 2 && aiScore > playerScore) || (playerScore >= 2 && playerScore > aiScore)) {
                setGameStatus('game finished')
            } else {
                setGameStatus('round finished')
                restMsg = "Начать следующий раунд?"
            }
            setDescription([desc_winner, restMsg])
        }
    }, [roundWinner])

    //вызвать при передаче хода
    React.useEffect(()=> {
        if (isPlayerTurn !== null && gameStatus === "started" && !checkOverkill()) {
            if (isPlayerTurn === false) aiTurn()
            else {
                setSpecialCardState(null)
                setTurn(prevState => prevState + 1)
            }
        }
    }, [isPlayerTurn])

    //вызвать, когда настал последний ход
    React.useEffect(()=> {
        if (turn > lastTurn) {
            checkOverkill()
            if (playerPoints > aiPoints) finishGame('player')
            else if (aiPoints > playerPoints) finishGame('AI')
            else finishGame('draw')
            setGameStatus('round finished')
        }
    }, [turn])

    //выбираем карты до начала игры
    React.useEffect(()=> {
        if (choiceAccepted && counter <= maxCounter) {
            //выбор спец карт перед началом игры
            if (gameStatus === 'before start') {
                let chosenCardsCopy = chosenCards.length ? [...chosenCards] : []
                for (let i = 0; i < maxCounter - counter; i++) chosenCardsCopy.push({...emptyCard})
                setPlayerSpecialHand(chosenCardsCopy)
                chosenCardsCopy.forEach(item => {
                    setPlayerSpecialDeck(prevState => prevState.filter(card => card.id !== item.id))
                })
                setChosenCards([])
                setChoiceAccepted(false)
                startNewGame()
            }
            //клевер: выбор карт из колоды после сброса (надо выбрать ровно 2 карты)
            else if (gameStatus === 'started' && counter === maxCounter) {
                setChoosingCardsFromDeck(false)
                setCounter(0)
                setMaxCounter(0)
                let chosenCardsCopy = [...chosenCards]
                setPlayerHand(prevState => [...prevState, ...chosenCards])
                setGeneralDeck(prevState => prevState.filter(card => (card.id !== chosenCardsCopy[0].id && card.id !== chosenCardsCopy[1].id)))
                setChosenCards([])
                setSpecialCardState(null)
                setIsPlayerTurn(false)
            }
        }
    }, [choiceAccepted])

    //вызвать, когда надо сбросить N карт
    React.useEffect(()=> {
        if (gameStatus === 'started' && !turn && maxCounter && counter === maxCounter) {
            setDiscardedCards_player()
        }
        if (gameStatus === 'started' && !choosingCardsFromDeck && maxCounter && counter === maxCounter) {
            setDiscardNCards(false)
            if (specialCardState === 'coin_state') {
                let lastGlobalCards = generalDeck.slice(-maxCounter)//последние 3 элемента
                setPlayerHand(prevState => [...prevState, ...lastGlobalCards])
                setGeneralDeck(prevState => prevState.slice(0, -maxCounter))//все, кроме последних 3-ех эл-нтов
                setCounter(0)
                setMaxCounter(0)
                setSpecialCardState(null)
                setIsPlayerTurn(false)
            }
            if (specialCardState === 'clover_state') {
                setCounter(0)
                setMaxCounter(2)
                setChoosingCardsFromDeck(true)
            }
        }
    }, [counter])

    //вызвать при розыгрыше джокера или чемпиона
    React.useEffect(()=> {
        if (specialCardParams !== null) {
            let {color, value} = specialCardParams
            let newID = getUID()
            if (specialCardState === 'joker_state') {
                setPlayerPlayedCards(prevState => [...prevState, {value: 'joker', color: 'purple', specialCardColor: color, id: newID}])
                setPlayerDoneActions(prevState => [...prevState, {value: 'joker', color: 'purple', specialCardColor: color, id: newID}])
            } else {
                setPlayerPlayedCards(prevState => [...prevState, {value: 'champion', color: 'gold', specialCardColor: color, id: newID}])
                setPlayerDoneActions(prevState => [...prevState, {value: 'champion', color: 'gold', specialCardColor: color, id: newID}])
            }
            playCasualCard('player', color, value)
            setSpecialCardParams(null)
            setSpecialCardState(null)
            setIsPlayerTurn(false)
        }
    }, [specialCardParams])

    //СОСТОЯНИЯ СПЕЦ КАРТ ИИ
    //вызвать, когда ИИ делает второй ход (после розыгрыша Песочных часов или на след. ход после Спринта)
    let [secondTurn_AI, setSecondTurn_AI] = React.useState(false)
    let [sprinted_AI, setSprinted_AI] = React.useState(false)
    React.useEffect(()=> {
        if (secondTurn_AI) {
            aiTurn()
            setSecondTurn_AI(false)
        }
    }, [secondTurn_AI])

    React.useEffect(()=> {
        if (sprinted_AI) {
            aiTurn()
            setSprinted_AI(false)
        }
    }, [sprinted_AI])


    //МЕТОДЫ


    //задать спец карты ИИ в зависимости от его уровня
    function initSpecialDeck_AI(difficulty) {
        //сколько каких спец карт до начала игры (ПОКА ТАК)
        //КАК НАДО: зависит не от сложности, а приходит из props (см. выше)
        let initialAmountsOfSpCards = allSpecialCards.map((item, id) => {
            return {value: item.value, amount: playerSpecialDeck_PROPS[difficulty][id]}
        })

        let newSpecialDeck = []
        initialAmountsOfSpCards.forEach(item => {
            for (let i = 0; i < item.amount; i++) {
                let color = checkGoldCard(item.value) ? 'gold' : 'purple'
                newSpecialDeck.push({color, value: item.value, id: getUID()})
            }
        })
        setPlayerSpecialDeck(newSpecialDeck)
        setGameStatus('before start')
    }

    //обновление спец руку ИИ в начале раунда
    function setSpecialHandForNewRound_AI() {
        let newSpDeck = aiInitialSpCards.map(item => {
            if (item === 'NULL') return {...emptyCard}
            else {
                let color = checkGoldCard(item) ? 'gold' : 'purple'
                return {value: item, color, id: getUID()}
            }
        })
        setAiSpecialHand(newSpDeck)
    }

    //выбор спец руки из всех спец карт игрока перед началом раунда
    function setSpecialHandForNewRound_player() {
        //если колода пустая, то выбирать не из чего -> сразу переходим к игре
        if (!playerSpecialDeck.length) {
            setChoiceAccepted(true)
        } else {
            setChoiceAccepted(false)
            setChoosingCardsFromDeck(true)
        }
        setMaxCounter(3)
        setCounter(0)
    }

    //подготовка к началу игры в начале раунда
    function startNewGame() {
        let amountOfCardsInHand = 6
        let newgeneralDeck = initgeneralDeckCards(), newplayerHand = [], newaiHand = []
        //у спринта изначально в руке две красные карты +4
        if (difficulty === 3) {
            let k = 0
            for (let i = 0; i < newgeneralDeck.length; i++) {
                let card = newgeneralDeck[i]
                if (card.value === 4 && card.color === 'red') {
                    newaiHand.push({...card})
                    newgeneralDeck.splice(i, 1);
                    k++
                    if (k === 2) break
                }
            }
            for (let i = 0; i < amountOfCardsInHand - 2; i++) newaiHand.push(newgeneralDeck.pop())
            for (let i = 0; i < amountOfCardsInHand; i++) newplayerHand.push(newgeneralDeck.pop())
        }
        else {
            for (let i = 0; i < amountOfCardsInHand; i++) {
                newplayerHand.push(newgeneralDeck.pop())
                newaiHand.push(newgeneralDeck.pop())
            }
        }
        
        setRoundWinner(null)
        setGeneralDeck(newgeneralDeck)
        setPlayerHand(newplayerHand)
        setAiHand(newaiHand)
        setSpecialHandForNewRound_AI()//спец карты у ИИ
        setPlayerPlayedCards([])
        setAiPlayedCards([])
        setPlayerDoneActions([])
        setAiDoneActions([])
        setPlayerPoints(0)
        setAiPoints(0)
        setPrevPlayerPoints(0)
        setPrevAiPoints(0)
        setTurn(0)
        setChoosingCardsFromDeck(false)
        setSpecialCardState(null)
        setGameStatus('started')
        setDiscardBeforeStart(true)
        setDescription(["", "Перед началом раунда можете сбросить до 3-ех карт."])
        setCounter(0)
        setMaxCounter(3)
    }

    //игра началась, карты в начале раунда сброшены
    function setDiscardedCards_player() {
        if (counter > 0) {
            let lastGlobalCards = generalDeck.slice(-counter)
            setPlayerHand(prevState => [...prevState, ...lastGlobalCards])
            setGeneralDeck(prevState => prevState.slice(0, -counter))
            setCounter(0)
        }   
        setDiscardBeforeStart(false)
        setMaxCounter(0)
        setDiscardedCards_AI(3)
        setDescription(null)
    }  

    //начать новую игру / закончить сброс карт в начале раунда
    function handleStartGameButton() {
        if (discardBeforeStart) setDiscardedCards_player()
        else {
            setDescription(null)
            setGameStatus('before start')
        }
    }

    //сброс карт ИИ перед началом
    function setDiscardedCards_AI(amount, isClover = false) {
        let AI_maxCounter = amount
        //let AI_counter = 0
        //let cardsIDToDiscard = []//записываем сюда ID карт, которые надо скинуть

        let {AI_counter, cardsIDToDiscard} = getBadCards(aiStrategy, aiHand, AI_maxCounter)
        
        //сброс в начале раунда
        if (!isClover) {
            if (AI_counter > 0) {
                let lastGlobalCards = generalDeck.slice(-AI_counter)
                setAiHand(prevState => {
                    let res = prevState.filter(item => !cardsIDToDiscard.includes(item.id))
                    return [...res, ...lastGlobalCards]
                })
                setGeneralDeck(prevState => prevState.slice(0, -AI_counter))
            }      
        } 
        //сброс при розыгрыше клевера
        else {
            let goodCards = chooseGoodCards_AI(aiStrategy, generalDeck, aiHand, playerHand, playerSpecialHand)
            setAiHand(prevState => {
                let res = prevState.filter(item => !cardsIDToDiscard.includes(item.id))
                return [...res, ...goodCards]
            })
            setGeneralDeck(prevState => prevState.filter(card => (card.id !== goodCards[0].id && card.id !== goodCards[1].id)))
        }
        setIsPlayerTurn(true)
    }

    //раунд окончен
    function finishGame(winner) {
        setIsPlayerTurn(null)
        setRoundWinner(winner)
        if (winner === "player") setPlayerScore(prevState => prevState + 1)
        else if (winner === "AI") setAiScore(prevState => prevState + 1) 
        else if (winner === "draw") {
            setPlayerScore(prevState => prevState + 0.5)
            setAiScore(prevState => prevState + 0.5)
        }
    }

    //проверка на перебор после каждой смены хода
    function checkOverkill() {
        if (playerPoints > maxValue) {
            finishGame('AI')
            return true
        }
        else if (aiPoints > maxValue) {
            finishGame('player')
            return true
        } 
        else return false
    }

    //ход ИИ
    function aiTurn(){
        //ИИ выбирает, какое действие выполнить
        let {AI_chosenCard, cardIsPlayed, chosenColor, chosenValue} = AI_chooseCardToPlay(aiStrategy, turn, lastTurn, aiPoints, playerPoints, aiHand, aiSpecialHand, playerHand, playerSpecialHand, maxValue, playerPlayedCards, generalDeck, sprinted_AI)
        let {value, color, id} = AI_chosenCard

        setTimeout(() => {
            if (cardIsPlayed) {
                //разыграли особенную карту
                if (color === 'purple' || color === 'gold') {
                    handleSpecialCard_AI(value, id, chosenColor, chosenValue)
                }
                //разыграли обычную карту
                else {
                    playCasualCard('AI', color, value)
                    discard(id)
                }
            }
            //просто сбросили карту (особенные не сбрасывают)
            else discard(id, false)

            //если сыграны Песочные часы или на предыдущий ход был сыгран Спринт - после хода делаем еще один ход
            if (value === 'hourglass') setSecondTurn_AI(true)
            else if (value === 'sprint') setSprinted_AI(true)
            else if (sprinted_AI === true) {
                setSprinted_AI(false)
                setSecondTurn_AI(true)
            } else setIsPlayerTurn(true)
        }, 300)
    }

    //ИИ разыгрывает особую карту
    function handleSpecialCard_AI(value, id, chosenColor = null, chosenValue = null) {
        let newPrevPlayerPoints = playerPoints, newPrevAiPoints = aiPoints
        if (value === 'joker') {
            if (chosenColor === 'green') {
                setAiPoints(prevState => prevState + chosenValue > 0 ? prevState + chosenValue : 0)
                setPrevAiPoints(newPrevAiPoints)
            } 
            else {
                setPlayerPoints(prevState => prevState + chosenValue > 0 ? prevState + chosenValue : 0)
                setPrevPlayerPoints(newPrevPlayerPoints)
            } 
        }
        else if (value === 'cancel') {
            if (playerPlayedCards.length) {
                let lastPlayedCard = {...playerPlayedCards[playerPlayedCards.length - 1]}
                let playedCardColor = lastPlayedCard.color
                let specialColor = lastPlayedCard.specialCardColor ? lastPlayedCard.specialCardColor : undefined
                let playedCardID = lastPlayedCard.id
                if (playedCardColor === 'green' || specialColor === 'green') setPlayerPoints(prevPlayerPoints)
                if (playedCardColor === 'red' || specialColor === 'red') setAiPoints(prevAiPoints)
                setPlayerPlayedCards(prevState => prevState.filter(card => card.id !== playedCardID))
                setPlayerDoneActions(prevState => prevState.map(action => {
                    return (action.id === playedCardID) ? {...action, canceled: true} : action
                }))
            }
        }
        else if (value === 'clover') {
            setDiscardedCards_AI(2, true)
        }
        else if (value === 'sprint') {
            //setSprinted_AI(true)
        }
        else if (value === 'truce') {
            if (playerPoints > 0) {
                setPlayerPoints(0)
                setPrevPlayerPoints(newPrevPlayerPoints)
            } 
            if (aiPoints > 0) {
                setAiPoints(0)
                setPrevAiPoints(newPrevAiPoints)
            } 
        }
        else if (value === 'swap') {
            if (aiPoints >= 0 && playerPoints >= 0) {
                let newPlayerPoints = aiPoints, newaiPoints = playerPoints
                setAiPoints(newaiPoints)
                setPlayerPoints(newPlayerPoints)
            }
        }
        else if (value === 'hourglass') {
            setTurn(prevState => prevState + 2)
        }
        else if (value === 'champion') {
            if (chosenColor === 'red') {
                setPlayerPoints(prevState => prevState + 10)
                setPrevPlayerPoints(newPrevPlayerPoints)
            } 
            else {
                setAiPoints(prevState => prevState + 10)
                setPrevAiPoints(newPrevAiPoints)
            } 
        }
        else if (value === 'plague') {
            setPlayerPoints(-12)
            setPrevPlayerPoints(newPrevPlayerPoints)
        }

        let color = checkGoldCard(value) ? 'gold' : 'purple'
        let lastPlayedCard = {value, color, id}
        //для джокера и чемпиона сохраняем выбранный цвет, чтобы можно было отменить (джокера)
        if (chosenColor === 'red' || chosenColor === 'green') lastPlayedCard.specialCardColor = chosenColor
        setAiSpecialHand(prevState => {
            let newState = prevState.filter(card => card.id !== id)
            return [...newState, {...emptyCard}]
        })
        setAiPlayedCards(prevState => [...prevState, lastPlayedCard])
        setAiDoneActions(prevState => [...prevState, lastPlayedCard])
    }

    //ВЗАИМОДЕЙСТВИЕ С КАРТАМИ

    //розыгрыш обычной карты [игроком или ИИ]
    function playCasualCard(currentPlayer, color, value) {
        value = Number(value)
        let newPrevPlayerPoints = playerPoints, newPrevAiPoints = aiPoints
        if (currentPlayer === 'player') {
            if ((color === 'green' && specialCardState !== 'inversion_state') || (color === 'red' && specialCardState === 'inversion_state')) {
                let newValue = playerPoints + value
                if (playerPoints >= 0 && newValue < 0) setPlayerPoints(0)
                else setPlayerPoints(newValue)
                setPrevPlayerPoints(newPrevPlayerPoints)
            }
            else if ((color === 'red' && specialCardState !== 'inversion_state') || (color === 'green' && specialCardState === 'inversion_state')) {
                let newValue = aiPoints + value
                if (aiPoints >= 0 && newValue < 0) setAiPoints(0)
                else setAiPoints(newValue)
                setPrevAiPoints(newPrevAiPoints)
            }
            if (specialCardState === 'inversion_state') setSpecialCardState(null)
        }
        else {
            if (color === 'green') {
                let newValue = aiPoints + value
                if (aiPoints >= 0 && newValue < 0) setAiPoints(0)
                else setAiPoints(newValue)
                setPrevAiPoints(newPrevAiPoints)
            }
            else if (color === 'red') {
                let newValue = playerPoints + value
                if (playerPoints >= 0 && newValue < 0) setPlayerPoints(0)
                else setPlayerPoints(newValue)
                setPrevPlayerPoints(newPrevPlayerPoints)
            }
        }
    }

    //[ИИ или игрок]
    //сбросить карту и взять из колоды [cardWasPlayed - была ли карта разыграна или просто сброшена]
    //если карта сброшена - она не отображается в разыгранных картах (и ее нельзя отменить)
    function discard(id, cardWasPlayed = true) {
        let lastGlobalCard = {}, playedCard = {}
        //если колода закончилась, карты не добавляем
        if (generalDeck.length) lastGlobalCard = {...generalDeck[generalDeck.length - 1]}
        if (isPlayerTurn) {
            playerHand.forEach(card => {if (card.id === id) playedCard = {...card}})
            if (cardWasPlayed) {
                //при инверсии меняем цвет разыгранной карты
                if (specialCardState === 'inversion_state') {
                    let color = playedCard.color
                    if (color === 'red') playedCard.color = 'green'
                    else if (color === 'green') playedCard.color = 'red'
                }
                setPlayerPlayedCards(prevState => [...prevState, playedCard])
                setPlayerDoneActions(prevState => [...prevState, playedCard])
            } else {
                setPlayerDoneActions(prevState => [...prevState, 'DISCARDED'])
            }
            setPlayerHand(prevState => {
                let res = prevState.filter(card => card.id !== id)
                return (generalDeck.length) ? [...res, lastGlobalCard] : res
            })
        } else {
            aiHand.forEach(card => {if (card.id === id) playedCard = {...card}})
            if (cardWasPlayed) {
                setAiPlayedCards(prevState => [...prevState, playedCard])
                setAiDoneActions(prevState => [...prevState, playedCard])
            } else {
                setAiDoneActions(prevState => [...prevState, 'DISCARDED'])
            }
            setAiHand(prevState => {
                let res = prevState.filter(card => card.id !== id)
                return (generalDeck.length) ? [...res, lastGlobalCard] : res
            })
        }
        
        if (generalDeck.length) setGeneralDeck(prevState => prevState.slice(0, -1))
    }

    //взаимодействие игрока с картой
    function handleCard_player(e, id, value, color) {
        e.preventDefault()
        //только при нажатии ПКМ или ЛКМ
        if (e.nativeEvent.button !== 0 && e.nativeEvent.button !== 2) return
        //сброс карт перед началом игры
        if (turn === 0 && discardBeforeStart) {
            setCounter(prevState => prevState + 1)
            setPlayerHand(prevState => prevState.filter(card => card.id !== id))
            return
        }
        //во время игры можно взаимодействовать только во время своего хода
        if (gameStatus !== 'started' || !isPlayerTurn) return
        //если надо сбросить N карт
        if (discardNCards) {
            setPlayerHand(prevState => prevState.filter(card => card.id !== id))
            setCounter(prevState => prevState + 1)
            return
        }
        //ПКМ - сброс карты
        if (e.nativeEvent.button === 2) discard(id, false)
        //ЛКМ - розыгрыш карты
        else if (e.nativeEvent.button === 0) {
            playCasualCard('player', color, value)
            discard(id)
        }

        //логика для розыгрыша карт во время Спринта
        if (sprintCount > 0) setSprintCount(prevState => prevState - 1)
        if (sprintCount <= 1) setIsPlayerTurn(false)
    }

    //взаимодействие игрока со спец картой
    function handleSpecialCard_player(e, id, value, color) {
        e.preventDefault()       
        if (gameStatus !== 'started' || !turn) return
        if (e.nativeEvent.button === 2) return//нельзя сбросить особую карту
        if (specialCardState === 'coin_state' || specialCardState === 'clover_state' || sprintCount > 0) return
        
        let newPrevPlayerPoints = playerPoints, newPrevAiPoints = aiPoints
        if (value === 'coin') {
            if (!generalDeck.length) return//если общая колода пустая
            setSpecialCardState('coin_state')
            setDiscardNCards(true)
            setMaxCounter((generalDeck.length >= 3) ? 3 : generalDeck.length)
            setPlayerSpecialHand(prevState => prevState.filter(card => card.id !== id))
        }
        else if (value === 'inversion') {
            setSpecialCardState('inversion_state')
            setPlayerSpecialHand(prevState => prevState.filter(card => card.id !== id))
        }
        else if (value === 'clover') {
            if (!generalDeck.length) return//если общая колода пустая
            setSpecialCardState('clover_state')
            setDiscardNCards(true)
            setMaxCounter((generalDeck.length >= 2) ? 2 : generalDeck.length)
            setPlayerSpecialHand(prevState => prevState.filter(card => card.id !== id))
        }
        else if (value === 'joker') {
            setSpecialCardState('joker_state')
            setPlayerSpecialHand(prevState => {
                let newState = prevState.filter(card => card.id !== id)
                return [...newState, {...emptyCard}]
            })
            return
        }
        else if (value === 'cancel') {
            if (aiPlayedCards.length) {
                let lastPlayedCard = {...aiPlayedCards[aiPlayedCards.length - 1]}
                let playedCardValue = lastPlayedCard.value
                let playedCardColor = lastPlayedCard.color
                let specialColor = lastPlayedCard.specialCardColor ? lastPlayedCard.specialCardColor : undefined
                let playedCardID = lastPlayedCard.id
                if ((playedCardColor === 'purple' && playedCardValue !== 'joker') || playedCardColor === 'gold') return
                else {
                    if (playedCardColor === 'red' || specialColor === 'red') setPlayerPoints(prevPlayerPoints)
                    if (playedCardColor === 'green' || specialColor === 'green') setAiPoints(prevAiPoints)
                    setAiPlayedCards(prevState => prevState.filter(card => card.id !== playedCardID))
                    setAiDoneActions(prevState => prevState.map(action => {
                        return (action.id === playedCardID) ? {...action, canceled: true} : action
                    }))
                }
            }
        }
        else if (value === 'swap') {
            if (playerPoints >= 0 && aiPoints >= 0) {
                setPlayerPoints(newPrevAiPoints)
                setPrevPlayerPoints(newPrevPlayerPoints)
                setAiPoints(newPrevPlayerPoints)
                setPrevAiPoints(newPrevAiPoints)
            }
        }
        else if (value === 'truce') {
            if (playerPoints > 0) {
                setPlayerPoints(0)
                setPrevPlayerPoints(newPrevPlayerPoints)
            } 
            if (aiPoints > 0) {
                setAiPoints(0)
                setPrevAiPoints(newPrevAiPoints)
            }           
        }
        else if (value === 'doubling') {
            setPlayerPoints(prevState => prevState * 2)
            setPrevPlayerPoints(newPrevPlayerPoints)
        }
        else if (value === 'sprint') {
            setSprintCount(2)
            setPlayerSpecialHand(prevState => prevState.filter(card => card.id !== id))
        }
        else if (value === 'hourglass') {
            setTurn(prevState => prevState + 2)
        }
        else if (value === 'champion') {
            setSpecialCardState('champion_state')
            setPlayerSpecialHand(prevState => {
                let newState = prevState.filter(card => card.id !== id)
                return [...newState, {...emptyCard}]
            })
            return
        }
        else if (value === 'plague') {
            if (turn > 1) return
            setAiPoints(-12)
        }
        let lastPlayedCard = {value, color, id}
        setPlayerSpecialHand(prevState => {
            let newState = prevState.filter(card => card.id !== id)
            return [...newState, {...emptyCard}]
        })
        setPlayerPlayedCards(prevState => [...prevState, lastPlayedCard])
        setPlayerDoneActions(prevState => [...prevState, lastPlayedCard])
        setDescription(null)

        if (['coin', 'inversion', 'sprint', 'clover', 'hourglass'].includes(value)) return
        setIsPlayerTurn(false)
    }

    //является ли спец карта золотой
    function checkGoldCard(value) {
        return (value === 'champion' || value === 'plague' || value === 'hourglass' || value === 'swap') ? true : false
    }

    //получить описание особой карты
    function getSpecialCardDescription(value) {
        if (!discardBeforeStart && gameStatus === 'started') setDescription(getDesc[value])
    }

    //сбросить описание
    function resetDescription() {
        if (!discardBeforeStart && gameStatus === 'started') setDescription(null)
    }

    //ПРАВИЛЬНО ЛИ ТАК ДЕЛАТЬ?

    let playerCardItems = [], aiCardItems = [], playerSpecialCardItems = [], aiSpecialCardItems = []
    playerHand.forEach((item, i) => {
        playerCardItems.push(
            <Card   key={i} 
                    id={item.id}
                    color={item.color}
                    value={item.value}
                    handleClick={handleCard_player}/>
        )       
    })
    aiHand.forEach((item, i) => {
        aiCardItems.push(
            <Card   key={i} 
                    id={i}
                    color={item.color}
                    value={item.value}/>
        )       
    })
    playerSpecialHand.forEach((item, i) => {
        playerSpecialCardItems.push(
            <Card   key={i} 
                    id={item.id}
                    color={item.color}
                    value={item.value}
                    handleClick={handleSpecialCard_player}
                    handlePover={value => {if (!discardBeforeStart && gameStatus === 'started') setDescription(getDesc[value])}}
                    handlePout={() => {if (!discardBeforeStart && gameStatus === 'started') setDescription(null)}}/>
        )       
    })
    aiSpecialHand.forEach((item, i) => {
        aiSpecialCardItems.push(
            <Card   key={i} 
                    id={item.id}
                    color={item.color}
                    value={item.value}
                    handlePover={value => {if (!discardBeforeStart && gameStatus === 'started') setDescription(getDesc[value])}}
                    handlePout={() => {if (!discardBeforeStart && gameStatus === 'started') setDescription(null)}}/>
        )       
    })

    let lastPlayedCardObj_player = (!playerPlayedCards.length) ? {...emptyCard}
                                                           : {...playerPlayedCards[playerPlayedCards.length - 1]}
    let lastPlayedCardItem_player = <Card id={lastPlayedCardObj_player.id}
                                     color={lastPlayedCardObj_player.color}
                                     value={lastPlayedCardObj_player.value}
                                     handlePover={value => getSpecialCardDescription(value)}
                                     handlePout={() => resetDescription()}/>

    let lastPlayedCardObj_ai = (!aiPlayedCards.length) ? {...emptyCard}
                                     : {...aiPlayedCards[aiPlayedCards.length - 1]}
    let lastPlayedCardItem_ai = <Card id={lastPlayedCardObj_ai.id}
                                    color={lastPlayedCardObj_ai.color}
                                    value={lastPlayedCardObj_ai.value}
                                    handlePover={value => getSpecialCardDescription(value)}
                                    handlePout={() => resetDescription()}/>


    let globalStyle = "jest-global-style"
    if (rulesOn) globalStyle += " hide"
    
    let gameStyle = "jest"
    if (specialCardState === 'joker_state' || specialCardState === 'champion_state') gameStyle += " blackout"
    if (choosingCardsFromDeck) gameStyle += " hide"


    return(
        <div onContextMenu={(e)=> e.preventDefault()}>
            <button className="rules-button" style={{textAlign:"center"}} onMouseDown={() => setRulesOn(prevState => !prevState)}>Правила</button>
            {rulesOn && <JestRules />}
            <div className={globalStyle}>
                {difficulty === null && <SetDifficulty setDifficulty={setDifficulty}/>}
                {difficulty !== null && 
                <>
                {choosingCardsFromDeck && <SelectCardsMenu  deck={(gameStatus === 'before start') ? playerSpecialDeck : generalDeck} 
                                                            gameStatus={gameStatus}
                                                            counter={counter}
                                                            maxCounter={maxCounter}
                                                            offsetFromTop={offsetFromTop}
                                                            setCounter={setCounter} 
                                                            setChosenCards={setChosenCards}
                                                            setChoiceAccepted={setChoiceAccepted}/>}
                {(specialCardState === 'joker_state' || specialCardState === 'champion_state') && 
                    <SettingSpecialCardParams setSpecialCardParams={setSpecialCardParams} state={(specialCardState === 'joker_state') ? 'joker_state' : 'champion_state'}/>}
                {(gameStatus === "started" || gameStatus === "round finished" || gameStatus === "game finished") && 
                <div className={gameStyle}>
                    <div className="turn-number">
                        <div>Ход {turn}</div>
                        <div>Счет {playerScore}:{aiScore}</div>
                    </div>
                    <Content   difficulty={difficulty}
                               aiCardItems={aiCardItems}
                               aiPoints={aiPoints}
                               lastPlayedCardItem_ai={lastPlayedCardItem_ai}
                               aiSpecialCardItems={aiSpecialCardItems}
                               playerCardItems={playerCardItems}
                               playerDoneActions={playerDoneActions}
                               aiDoneActions={aiDoneActions}
                               getSpecialCardDescription={getSpecialCardDescription}
                               resetDescription={resetDescription}
                               playerPoints={playerPoints}
                               lastPlayedCardItem_player={lastPlayedCardItem_player}
                               playerSpecialCardItems={playerSpecialCardItems}
                               gameStatus={gameStatus}
                               description={description}
                               discardBeforeStart={discardBeforeStart}
                               handleStartGameButton={handleStartGameButton}/>
                </div>}
                </>}
            </div>
        </div>
    )
} 

//выбор сложности
function SetDifficulty(props) {
    return (
        <div className="set-difficulty">
            <div className="set-difficulty--button emerald-button" onMouseDown={() => props.setDifficulty(0)}>Новичок</div>
            <div className="set-difficulty--button emerald-button" onMouseDown={() => props.setDifficulty(1)}>Джокер</div>
            <div className="set-difficulty--button ruby-button" onMouseDown={()=> props.setDifficulty(2)}>Отмена</div>
            <div className="set-difficulty--button ruby-button" onMouseDown={()=> props.setDifficulty(3)}>Спринт</div>
            <div className="set-difficulty--button saphire-button" onMouseDown={()=> props.setDifficulty(4)}>Клевер</div>
            <div className="set-difficulty--button saphire-button" onMouseDown={()=> props.setDifficulty(5)}>Перемирие</div>
            <div className="set-difficulty--button topaz-button" onMouseDown={() => props.setDifficulty(6)}>Песочные часы</div>
            <div className="set-difficulty--button topaz-button" onMouseDown={() => props.setDifficulty(7)}>Обмен</div>
            <div className="set-difficulty--button topaz-button" onMouseDown={() => props.setDifficulty(8)}>Чемпион</div>
            <div className="set-difficulty--button death-button" onMouseDown={() => props.setDifficulty(9)}>Смерть</div>
        </div>
    )
}

//правила игры
function JestRules(props) {
    return (
        <div className="rules">
            <p>Правила игры:</p>
            <ol>
                <li>побеждает игрок, который первым набрал 2 победы в раундах</li>
                <li>если оба игрока одновременно набрали 2 победы, то игра длится до первой победы в раунде</li>
                <li>у игрока есть 2 руки: 
                    <ol>
                        <li><span style={{fontWeight: "bold"}}>особая</span> - состоит из своих особых карт, во время раунда она не восполняется</li>
                        <li><span style={{fontWeight: "bold"}}>обычная</span> - состоит из 6 карт из общей колоды, восполняется до 6 карт каждый ход</li>
                    </ol>
                </li>
                <li>перед началом каждого раунда игрок может выбрать из собственной колоды до 3-ех особых карт, которые будут составлять его <span style={{fontWeight: "bold"}}>особую</span> руку, при этом в следующем раунде он их использовать не сможет</li>
                <li>перед началом каждого раунда игрок может сбросить до 3-ех <span style={{fontWeight: "bold"}}>обычных</span> карт</li>
                <li>один раунд длится не более 11 ходов</li>
                <li>игрок может за один ход разыграть (ЛКМ) одну обычную или особую карту либо сбросить (ПКМ) одну обычную карту</li>
                <li>если игрок получает больше 15 очков (т.е. <span style={{fontWeight: "bold"}}>перебор</span>) - он проигрывает раунд</li>
                <li>если на начало 12 хода у обоих игроков одинаковое количество очков - <span style={{fontWeight: "bold"}}>ничья</span> (в этом случае оба игрока получают по 0.5 победы в раунде)</li>
            </ol>
            <p style={{marginTop: "15px"}}>Цель игрока:</p>
            <ol>
                <li>сделать перебор у оппонента, <span style={{fontWeight: "bold"}}>или</span></li>
                <li>набрать наибольшее количество очков без перебора к началу 12 раунда</li>
            </ol>
            <p style={{marginTop: "15px"}}>Карты:</p>
            <ol>
                <li><span style={{color: "green"}}>зеленые</span> - изменяют очки самого игрока</li>
                <li><span style={{color: "rgb(195, 2, 2)"}}>красные</span> - изменяют очки оппонента</li>
                <li><span style={{color: "rgb(115, 0, 131)"}}>фиолетовые</span> и <span style={{color: "rgb(103, 84, 3)"}}>золотые</span> - особые, обладают уникальными свойствами</li>
            </ol>
        </div>
    )
}

//основной контент: основной блок + нижний блок
function Content(props) {
    return (
        <div className="jest--content">
            <MainBlock  difficulty={props.difficulty}
                        playerPoints={props.playerPoints}
                        aiPoints={props.aiPoints}
                        aiCardItems={props.aiCardItems}
                        playerCardItems={props.playerCardItems}
                        aiSpecialCardItems={props.aiSpecialCardItems}
                        playerSpecialCardItems={props.playerSpecialCardItems}
                        playerDoneActions={props.playerDoneActions}
                        aiDoneActions={props.aiDoneActions}
                        getSpecialCardDescription={props.getSpecialCardDescription}
                        resetDescription={props.resetDescription}/>
            {props.description && <BottomBlock gameStatus={props.gameStatus}
                                               description={props.description}
                                               discardBeforeStart={props.discardBeforeStart}
                                               handleStartGameButton={props.handleStartGameButton}/>}
        </div>
    )
}

//основной блок: карты + сыгранные карты + портреты + счет
function MainBlock(props) {
    return (
        <div className="jest--main-block">
            <div className="player-block">
                <PlayerInfo points={props.playerPoints} img={img_avatar_player}/>
                <ViewCards  cardItems={props.playerCardItems}
                            specialCardItems={props.playerSpecialCardItems}
                            isPlayer={true}/>
                <ViewDoneActions doneActions={props.playerDoneActions}
                            getSpecialCardDescription={props.getSpecialCardDescription}
                            resetDescription={props.resetDescription}
                            isPlayer={true}/>
            </div>
            <div className="AI-block">
                <ViewDoneActions doneActions={props.aiDoneActions}
                            getSpecialCardDescription={props.getSpecialCardDescription}
                            resetDescription={props.resetDescription}
                            isPlayer={false}/>
                <ViewCards  cardItems={props.aiCardItems}
                            specialCardItems={props.aiSpecialCardItems}
                            isPlayer={false}/>
                
                <PlayerInfo points={props.aiPoints} img={AI_avatars[props.difficulty]}/>
            </div>
        </div>
    )
}

//аватар игрока + кол-во очков
function PlayerInfo(props) {
    return (
        <div className="player-info"> 
            <div className="player-avatar">
                <img className="player-avatar--img" src={props.img} alt=""/>
            </div>
            <div className="player-points">Очки:{props.points}</div>
        </div>
    )
}

//отображение карт игрока и ИИ на доске
function ViewCards(props) {
    let blockStyle = "jest--view-cards"
    let offsetStyle = (props.isPlayer) ? " player-cards" : " AI-cards"

    return (
        <div className={blockStyle + offsetStyle}>
            <div className="casual-cards">{props.cardItems}</div>
            <div className="special-cards">{props.specialCardItems}</div>
        </div>   
    )
}

//отображение всех выполненных действий игрока
function ViewDoneActions(props) {
    let doneActionItems = []
    props.doneActions.forEach((action, i) => {
        doneActionItems.push(<DoneAction key={i} 
                                         action={action} 
                                         handlePover={props.getSpecialCardDescription}
                                         handlePout={props.resetDescription}/>)
    })

    let offsetStyle = (props.isPlayer) ? " player-actions" : " AI-actions"
    let doneActionsStyle = "jest--done-actions" + offsetStyle

    return (
        <div className={doneActionsStyle}>{doneActionItems}</div>
    )
}

//отображение выполненного действия (действие - розыгрыш карты или сброс)
function DoneAction(props) {
    let action = props.action
    let color = (action === 'DISCARDED') ? 'black' : action.color
    let value = (action === 'DISCARDED') ? 'сброс' : action.value
    let sign = (action !== 'DISCARDED' && action.value > 0) ? "+" : ""
    
    let actionColor = color + "-action"
    let canceledStyle = (action.canceled) ? " canceled-action" : ""
    //let cantBeHovered = (color === 'purple' || color === 'gold') ? "" : " not-clickable"
    let actionStyle = "action " + actionColor + canceledStyle
    let actionViewValue = (color === 'purple' || color === 'gold') ? <img className="action-img" src={getImg[value]} alt=""/> : sign + value

    return (
        <div className={actionStyle}
             onMouseOver={() => props.handlePover(value)}
             onMouseOut={() => props.handlePout()}>
            <div className="action-value">{actionViewValue}</div> 
        </div>
    )
}

//отображение карты
function Card(props) {
    let color = props.color
    let value = (props.value !== null) ? props.value : ""
    let sign = (props.value > 0) ? "+" : ""
    let itemStyle = (props.value !== null) ? "card " + color : "null-card"
    let itemValueStyle = (props.value !== null) ? "card-value" : "card-value hide"
    let itemImgStyle = (color === 'purple' || color === 'gold') ? "spcard-img" : null
    if (props.specialStyle === 'mini') {
        itemStyle += " mini-card"
        itemValueStyle += " mini-value"
        itemImgStyle += " mini-spcard-img"
    }
    if (props.isChosen) itemStyle += " is-chosen"

    let cardViewValue = (color === 'purple' || color === 'gold') ? <img className={itemImgStyle} src={getImg[props.value]} alt=""/> : sign + value

    return (
        <div className={itemStyle} 
             id={props.id} 
             onMouseDown={(e) => {if (props.handleClick && props.value !== null) props.handleClick(e, props.id, props.value, props.color)}}
             onMouseOver={()=>{if (props.handlePover) props.handlePover(props.value)}}
             onMouseOut={()=>{if (props.handlePout) props.handlePout()}}>
            <div className={itemValueStyle}>{cardViewValue}</div>    
        </div>
    )
}

//описание + кнопка начала игры
function BottomBlock(props) {
    let {gameStatus, description, discardBeforeStart, handleStartGameButton} = props

    return (
        <div className="jest--bottom-block">
            <div className="info">
                {gameStatus === 'round finished' ? 
                <span style={{fontWeight: "bold"}}>{description[0]}</span> : 
                <p style={{fontWeight: "bold"}}>{description[0]}</p>}
                {description[1]}
            </div>
            {(discardBeforeStart || gameStatus === 'round finished') && 
            <button className="jest--bottom-block--start--button"
                    onMouseDown={() => handleStartGameButton()}>
                    Начать
            </button>}
        </div>
    )
}

//описание особой карты
function SpecialCardDescription(props) {
    let cardName = props.description ? props.description[0] : ""
    let cardDesc = props.description ? props.description[1] : ""
    let offsetValue = parseInt(props.offsetFromTop) + 10
    const offsetStyle = {top: `${offsetValue}px`}

    return (
        <div className="info card-description" style={offsetStyle}> 
            <p style={{fontWeight: "bold"}}>{cardName}</p>
             {cardDesc}  
        </div>
    )
}

//выбор карт из колоды
function SelectCardsMenu(props) {
    //вывод колоды, из которой происходит выбор карт
    function initAllCards() {
        let deck = [...props.deck]
        let deck_allCards = [], deck_redCards = [], deck_greenCards = [], deck_specialCards = []
        deck.forEach(item => {
            if (item.color === 'green') deck_greenCards.push(item)
            else if (item.color === 'red') deck_redCards.push(item)
            else if (item.color === 'purple' || item.color === 'gold') deck_specialCards.push(item)
        })

        deck_greenCards.sort((a, b) => a.value - b.value)
        deck_redCards.sort((a, b) => a.value - b.value)
        deck_allCards = [...deck_specialCards, ...deck_greenCards, ...deck_redCards]
        return deck_allCards.map(item => {return {...item, isChosen: false}})
    }

    function acceptChoice() {
        props.setChosenCards(local_chosenCards)
        props.setChoiceAccepted(true)
    }

    function checkIfCardWasChosen(id) {
        let thisCard = deck_allCards.find(item => item.id === id)
        return (thisCard.isChosen) ? true : false
    }

    function chooseCard(e, id, value, color) {
        e.preventDefault()
        if (checkIfCardWasChosen(id)) {
            props.setCounter(prevState => prevState - 1)
            setDeck_allCards(prevState => prevState.map(item => (item.id === id) ? {...item, isChosen: false} : item))
            setLocal_chosenCards(prevState => prevState.filter(item => item.id !== id))
        }
        else {
            if (local_chosenCards.length === props.maxCounter) return
            props.setCounter(prevState => prevState + 1)
            setDeck_allCards(prevState => prevState.map(item => (item.id === id) ? {...item, isChosen: true} : item))
            setLocal_chosenCards(prevState => [...prevState, {id, value, color}])
        }
        props.setChoiceAccepted(false)
    }

    let [deck_allCards, setDeck_allCards] = React.useState(initAllCards())
    let [local_chosenCards, setLocal_chosenCards] = React.useState([])
    let [description, setDescription] = React.useState(null)

    let generalDeckItems = deck_allCards.map((item, i) => <Card  key={i} 
                                                                id={item.id}
                                                                color={item.color}
                                                                value={item.value}
                                                                specialStyle={'mini'}
                                                                isChosen={item.isChosen}
                                                                handleClick={chooseCard}
                                                                handlePover={value => setDescription(getDesc[value])}
                                                                handlePout={() => setDescription(null)}/>)

    let bottomBlockMsg = (props.gameStatus === 'before start') ? 
        "Можно выбрать 0-3 особых карт для следующего раунда" :
        "Необходимо выбрать " + props.maxCounter + " карты из общей колоды"
    
    let bottomBlockStyle = "info choose-cards--top-block"

    return (
        <div className="select-cards--menu">
            {description && <SpecialCardDescription description={description} offsetFromTop={props.offsetFromTop}/>}
            <button className="select-cards--button"
                    onMouseDown={() => acceptChoice()}>
                <div id="tick-mark"></div>
            </button>
            {generalDeckItems}
            <div className={bottomBlockStyle}>
                {bottomBlockMsg}.<br/>
                Выбрано {props.counter}/{props.maxCounter} карт.
            </div>
        </div>
    )
}

//выбор параметров карты (например, при розыгрыше Джокера или Чемпиона)
function SettingSpecialCardParams(props) {
    let state = props.state
    let [color, setColor] = React.useState('green')
    let [value, setValue] = React.useState(state === 'champion_state' ? 10 : 5)
    let sign = (value > 0) ? "+" : ""
    let itemStyle = "card " + color
    let rightButtonsStyle = (state === 'champion_state') ? "set-new-card--panel hide" : "set-new-card--panel"

    function increaseValue() {
        if (value + 1 > 5) return
        else if (value + 1 === 0) setValue(1)
        else setValue(prevState => prevState + 1)
    }

    function decreaseValue() {
        if (value - 1 < -5) return
        else if (value - 1 === 0) setValue(-1)
        else setValue(prevState => prevState - 1)
    }

    return (
        <div className="set-new-card">
            <div className="set-new-card--panel">
                <button className="modify-value-button green" onMouseDown={() => setColor('green')}></button>
                <button className="modify-value-button red" onMouseDown={() => setColor('red')}></button>
            </div>
            <div className={itemStyle} 
                 id={props.id}
                 onMouseDown={() => props.setSpecialCardParams({id: getUID(), value, color})}>
                <div className="card-value">{sign+value}</div>    
            </div>
            <div className={rightButtonsStyle}>
                <button className="modify-value-button" onMouseDown={() => increaseValue()}>+</button>
                <button className="modify-value-button" onMouseDown={() => decreaseValue()}>-</button>
            </div>
        </div>
    )
}