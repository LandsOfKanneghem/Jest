export function AI_chooseCardToPlay(AI_strategy, 
                                    turn, 
                                    lastTurn, 
                                    AIPoints, 
                                    playerPoints, 
                                    AICards, 
                                    AISpecialCards, 
                                    playerCards, 
                                    playerSpecialCards, 
                                    maxValue, 
                                    playerPlayedCards, 
                                    globalDeck) {
    let cardIsPlayed = true//сыграть или сбросить карту
    let chosenColor = null//если выбираем цвет карты
    let chosenValue = null//если выбираем значение разыгрываемой карты
    let AI_chosenCard = null
    let AI_redValues = AICards.filter(item => item.color === 'red').map(item => item.value)
    let AI_greenValues = AICards.filter(item => item.color === 'green').map(item => item.value)
    let lastPlayedCard = (playerPlayedCards.length) ? playerPlayedCards[playerPlayedCards.length - 1] : null
    
    //получить карту по точному значению и цвету
    function getCardByProps(value, color, isPlayer = false) {
        if (!isPlayer) {
            if (color === 'purple' || color === 'gold') return AISpecialCards.find(card => (card.value === value && card.color === color))
            else return AICards.find(card => (card.value === value && card.color === color))
        } else {
            if (color === 'purple' || color === 'gold') return playerSpecialCards.find(card => (card.value === value && card.color === color))
            else return playerCards.find(card => (card.value === value && card.color === color))
        }
    }

    //получить первую попавшуюся карту по цвету и значению относительно 0 (для сброса)
    function getAnyCardByProps(isValuePositive, color) {
        if (isValuePositive) return AICards.find(card => (card.value > 0 && card.color === color))
        else return AICards.find(card => (card.value < 0 && card.color === color))
    }

    //проверить, есть ли подходящая карта в данном диапазоне
    function checkCardInRange(minLimit, maxLimit, color) {
        if (color === 'green') {
            let sortedDownGreenValues = AI_greenValues.sort((a, b) => b - a)
            if (maxLimit - minLimit > 4) return sortedDownGreenValues[0]
            else return sortedDownGreenValues.find(greenValue => minLimit <= greenValue && greenValue <= maxLimit)
        }
    }

    //выбор минимальной необходимой карты, чтобы перебить "XValue" [если метод вызван - подразумевается, что какая-то карта точно есть]
    function getNecessaryCard(XValue, color) {
        if (color === 'red') {
            let sortedDownRedValues = AI_redValues.sort((a, b) => b - a)
            let minRedValue = sortedDownRedValues[sortedDownRedValues.length - 1]
            if (XValue >= 5 || XValue >= -minRedValue) return getCardByProps(minRedValue, 'red')
            else {
                let res = sortedDownRedValues.find(redValue => redValue + XValue <= 0)
                return getCardByProps(res, 'red')
            }
        } 
        else if (color === 'green') {
            let sortedDownGreenValues = AI_greenValues.sort((a, b) => b - a)
            let minGreenValue = sortedDownGreenValues[sortedDownGreenValues.length - 1]
            if (XValue >= 5 || XValue >= -minGreenValue) return getCardByProps(minGreenValue, 'green')
            else {
                let res = sortedDownGreenValues.find(greenValue => greenValue + XValue <= 0)
                return getCardByProps(res, 'green')
            }
        }
    }

    //есть ли у игрока данная спец карта
    function checkSpecialCard_player(value) {
        return playerSpecialCards.find(item => item.value === value) ? true : false
    }

    //проверить наличие спец карты у ИИ
    function checkSpecialCard_AI(value) {
        return AISpecialCards.find(item => item.value === value) ? true : false
    } 

    //проверить, есть ли бесполезные карты для сброса
    function checkIfCardsAreBad() {
        let count = 0
        //КЛЕВЕР
        if (AI_strategy === 3) {
            //в первую очередь скидываем карты с очень низким значением либо положительные красные
            AICards.forEach(item => {
                if (item.color === 'red' && item.value > 0) count++
                else if ([1, -1].includes(item.value)) count++
            })
            //во вторую - если много отрицательных зеленых карт - избавляемся от них
            if (countAmountOfCards_AI('green', false, AICards) > 2) AICards.forEach(item => {
                if (item.color === 'green' && item.value < -1) count++
            })
            //в третью - скидываем положительные зеленые +2
            AICards.forEach(item => {
                if (item.color === 'green' && item.value === 2) count++
            })
        }
        //ОБМЕН
        if (AI_strategy === 7) {
            AICards.forEach(item => {
                if (item.color === 'green' && item.value > 0) count++
                if (item.color === 'red' && item.value < 0) count++
            })
        }
        return (count >= 2) ? true : false
    }

    //оценка опасности сыгранной карты [зависит от сложности] - для отмены
    function checkIfLastPlayedCardIsDangerous() {
        if (!lastPlayedCard) return false
        let value = lastPlayedCard.value, color = lastPlayedCard.color

        //ОТМЕНА
        if (AI_strategy === 2) {
            if (value === 'joker') return true
            else if (color === 'red' && value > 0 && AIPoints > 10) return true
            else if (color === 'green' && value > 2 && playerPoints > AIPoints && playerPoints <= 10) return true
            return false
        }  

        //ЧУМА
        else if (AI_strategy === 9) {
            if (value === 'joker') return true
            else if (color === 'red' && value === 4) return true
            else if (color === 'green' && value === 4) return true
            return false
        }
    }

    //ФУНКЦИИ ДЛЯ ПРОСЧИТЫВАНИЯ ПОТЕНЦИАЛЬНЫХ ВОЗМОЖНОСТЕЙ ИГРОКА / ИИ

    //может ли оппонент залеталить за 1 ход
    function checkPotentialPush() {
        let count = 0, sum = 0, dangerValue = maxValue - AIPoints + 1
        
        let player_redValues = playerCards.filter(item => item.color === 'red')
                                          .map(item => item.value)
                                          .sort((a, b) => a - b)

        let player_greenValues = playerCards.filter(item => item.color === 'green')
                                            .map(item => item.value)
                                            .sort((a, b) => a - b)

        let championValue = checkSpecialCard_player('champion') ? 10 : 0
        let jokerVal = checkSpecialCard_player('joker') ? 5 : 0
        let inversionVal = (checkSpecialCard_player('inversion') && player_greenValues[player_greenValues.length - 1] > 0) ? player_greenValues[player_greenValues.length - 1] : 0
        let amountOfCards = checkSpecialCard_player('sprint') ? 2 : 1
        while (count < amountOfCards) {
            //если в колоде есть положительные красные карты - добавляем в потенциальный пуш макс. значение
            if (player_redValues.length && player_redValues[player_redValues.length - 1] > 0) {
                sum += player_redValues[player_redValues.length - 1]
                count++
                player_redValues.pop()
            } 
            //иначе опасных карт не осталось
            else break 
        }
        let pushValue = Math.max(championValue, jokerVal, inversionVal, sum)
        let playerCanFinish = pushValue < dangerValue ? false : true
        return {pushValue, playerCanFinish}
    }

    //может ли ИИ залеталить за 2 хода
    function checkPotentialPush_AI(N) {
        let count = 0, sum = 0, dangerValue = maxValue - playerPoints + 1
        
        let AI_redValues = AICards.filter(item => item.color === 'red')
                                          .map(item => item.value)
                                          .sort((a, b) => a - b)
        if (checkSpecialCard_AI('joker')) {
            count++
            sum += 5
        }
        while (count < N) {
            //если в колоде есть положительные красные карты - добавляем в потенциальный пуш макс. значение
            if (AI_redValues.length && AI_redValues[AI_redValues.length - 1] > 0) {
                sum += AI_redValues[AI_redValues.length - 1]
                count++
                AI_redValues.pop()
            } 
            //иначе опасных карт не осталось
            else break 
        }

        return sum < dangerValue ? false : true
    }

    //на сколько игрок может себя занизить
    function checkIfPlayerCanDefend() {
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)

        if (checkSpecialCard_player('joker')) return true
        if (checkSpecialCard_player('cancel')) return true
        if (checkSpecialCard_player('inversion') && minRedValue < 0) return true
        if (minGreenValue < 0) return true
        else return false
    }

    //СТРАТЕГИИ ИГРЫ

    //НОВИЧОК
    if (AI_strategy === 0) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход меньше очков, но можно сделать больше - делаем
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //играем что есть - играем аккуратно против пуша, занижаем оппонента, завышаем себя
        else if (turn < lastTurn && minGreenValue < 0 && AIPoints > 10) AI_chosenCard = getNecessaryCard(AIPoints - 10, 'green')
        else if (turn < lastTurn && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        else if (turn < lastTurn && maxGreenValue > 0 && AIPoints < 11 && AIPoints >= 0 && checkCardInRange(1, 11 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 11 - AIPoints, 'green'), 'green')
        }
        //в последнюю - очередь сбрасываем увеличение счета оппоненту и понижение своего счета
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(true, 'red') || getAnyCardByProps(false, 'green') || getAnyCardByProps(false, 'red') || getAnyCardByProps(true, 'green')
        }
    }

    //ДЖОКЕР
    if (AI_strategy === 1) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        let {pushValue, playerCanFinish} = checkPotentialPush()
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        else if (playerPoints > 10 && checkSpecialCard_AI('joker')) {
            chosenValue = 5
            chosenColor = 'red'
            AI_chosenCard = getCardByProps('joker', 'purple')
        } 
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход меньше очков, но можно сделать больше - делаем
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 5 && checkSpecialCard_AI('joker')) {
            if (playerPoints > 5) {
                chosenValue = -5
                chosenColor = 'red'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
            else if (AIPoints <= 10) {
                chosenValue = 5
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            } else {
                chosenValue = maxValue - AIPoints
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
        }
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //опасность перебора - занижаем свой балл (если ход не последний)
        else if (turn < lastTurn && minGreenValue < 0 && playerCanFinish && -minGreenValue >= pushValue - maxValue + AIPoints) AI_chosenCard = getNecessaryCard(pushValue - maxValue + AIPoints, 'green')
        else if (turn < lastTurn && AIPoints > 10 && checkSpecialCard_AI('joker') && playerCanFinish) {
            chosenValue = 10 - AIPoints//желательно понизиться до 10 очков
            chosenColor = 'green'
            AI_chosenCard = getCardByProps('joker', 'purple')
        }
        //играем что есть - играем аккуратно против пуша, занижаем оппонента, завышаем себя
        else if (turn < lastTurn && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        else if (turn < lastTurn && maxGreenValue > 0 && AIPoints < 9 && AIPoints >= 0 && checkCardInRange(1, 9 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 9 - AIPoints, 'green'), 'green')
        }
        //в последнюю - очередь сбрасываем увеличение счета оппоненту и понижение своего счета
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(true, 'red') || getAnyCardByProps(false, 'green') || getAnyCardByProps(false, 'red') || getAnyCardByProps(true, 'green')
        }
    }

    //ОТМЕНА
    if (AI_strategy === 2) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход меньше очков, но можно сделать больше - делаем
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //если оппонент разыграл потенциально опасную карту - отмена
        else if (checkSpecialCard_AI('cancel') && lastPlayedCard && checkIfLastPlayedCardIsDangerous()) {
            AI_chosenCard = getCardByProps('cancel', 'purple')
        }

        //ХОДЫ 1 - 5
        //держим счет не больше 6
        else if (turn >= 1 && turn <= 5 && minGreenValue < 0 && AIPoints > 6) AI_chosenCard = getNecessaryCard(AIPoints - 6, 'green')
        //занижаем оппонента
        else if (turn >= 1 && turn <= 5 && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        //повышаем себя на небольшое значение
        else if (turn >= 1 && turn <= 5 && maxGreenValue > 0 && AIPoints < 4 && AIPoints >= 0 && checkCardInRange(1, 4 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 4 - AIPoints, 'green'), 'green')
        }     

        //ХОДЫ 6 - 10
        //опасность перебора - занижаем свой балл (если ход не последний)
        else if (turn >= 6 && turn <= 10 && minGreenValue < 0 && AIPoints > 10) AI_chosenCard = getNecessaryCard(AIPoints - 10, 'green')
        //занижаем оппонента
        else if (turn >= 6 && turn <= 10 && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        //повышаем себя не больше, чем на 10
        else if (turn >= 6 && turn <= 10 && maxGreenValue > 0 && AIPoints < 10 && AIPoints >= 0 && checkCardInRange(1, 10 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 10 - AIPoints, 'green'), 'green')
        }
        //в последнюю - очередь сбрасываем увеличение счета оппоненту и понижение своего счета
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(true, 'red') || getAnyCardByProps(false, 'green') || getAnyCardByProps(false, 'red') || getAnyCardByProps(true, 'green')
        }
    }

    //СПРИНТ
    if (AI_strategy === 3) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        else if (playerPoints > 10 && checkSpecialCard_AI('joker')) {
            chosenValue = 5
            chosenColor = 'red'
            AI_chosenCard = getCardByProps('joker', 'purple')
        } 
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход разница в очках не больше 5 и можно сделать больше - делаем (всегда)
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 5 && checkSpecialCard_AI('joker')) {
            if (playerPoints > 5) {
                chosenValue = -5
                chosenColor = 'red'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
            else if (AIPoints <= 10) {
                chosenValue = 5
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            } else {
                chosenValue = maxValue - AIPoints
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
        }
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //если счет очень высокий и оппонент может сделать перебор - занижаемся
        else if (turn < lastTurn && AIPoints > 10 && minGreenValue < 0 && AIPoints + minGreenValue <= 10 && checkPotentialPush()) {
            AI_chosenCard = getCardByProps(minGreenValue, 'green')
        }
        else if (turn < lastTurn && AIPoints > 10 && checkSpecialCard_AI('joker') && checkPotentialPush()) {
            chosenValue = AIPoints === maxValue ? -5 : 9 - AIPoints//желательно понизиться до 9 очков
            chosenColor = 'green'
            AI_chosenCard = getCardByProps('joker', 'purple')
        }
        //если нет опасности - пушим
        else if ([1, 2].includes(turn) && checkSpecialCard_AI('joker')) {
            chosenValue = 5
            chosenColor = 'red'
            AI_chosenCard = getCardByProps('joker', 'purple')
        }
        //играем спринт, если можем запушить оппонента за 2 хода
        else if (checkSpecialCard_AI('sprint') && checkPotentialPush_AI(2)) AI_chosenCard = getCardByProps('sprint', 'purple')
        //если сыграли спринт для пуша
        else if (!checkSpecialCard_AI('sprint') && checkPotentialPush_AI(2)) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        //на последний ход играем спринт, если не получилось использовать его ранее
        //здесь мы пытаемся выйти вперед по счету - занижаем на максимум оппонента или завышаем на максимум себя
        else if (turn === lastTurn && checkSpecialCard_AI('sprint')) AI_chosenCard = getCardByProps('sprint', 'purple')
        else if (turn === lastTurn && !checkSpecialCard_AI('sprint') && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0 && AIPoints + maxGreenValue <= maxValue) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }

        //если опасности нет - пытаемся держать оппонента в зоне риска и держать себя на безопасном уровне
        else if (turn < lastTurn && maxRedValue > 0) {
            AI_chosenCard = getCardByProps(maxRedValue, 'red')
        }
        //повышаем себя на небольшое значение [ходы 1-5]
        else if (turn >= 1 && turn <= 5 && maxGreenValue > 0 && AIPoints < 4 && checkCardInRange(1, 4 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 4 - AIPoints, 'green'), 'green')
        }   

        //ХОДЫ 6 - 10
        //опасность перебора - занижаем свой балл (если ход не последний)
        else if (turn >= 6 && turn <= 10 && minGreenValue < 0 && AIPoints > 10) AI_chosenCard = getNecessaryCard(AIPoints - 10, 'green')
        //повышаем себя не больше, чем на 9
        else if (turn >= 6 && turn <= 10 && maxGreenValue > 0 && AIPoints < 9 && checkCardInRange(1, 9 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 9 - AIPoints, 'green'), 'green')
        }
        //скидываем ненужные карты и копим нужные
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(false, 'red') || getAnyCardByProps(false, 'green') || getAnyCardByProps(true, 'green') || getAnyCardByProps(true, 'red')
        }
    }

    //КЛЕВЕР
    if (AI_strategy === 4) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        let {pushValue, playerCanFinish} = checkPotentialPush()
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        else if (playerPoints > 10 && checkSpecialCard_AI('joker')) {
            chosenValue = 5
            chosenColor = 'red'
            AI_chosenCard = getCardByProps('joker', 'purple')
        } 
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход меньше очков, но можно сделать больше - делаем (всегда)
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 5 && checkSpecialCard_AI('joker')) {
            if (playerPoints > 5) {
                chosenValue = -5
                chosenColor = 'red'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
            else if (AIPoints <= 10) {
                chosenValue = 5
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            } else {
                chosenValue = maxValue - AIPoints
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
        }
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //опасность перебора - занижаемся
        else if (turn < lastTurn && minGreenValue < 0 && playerCanFinish && -minGreenValue >= pushValue - maxValue + AIPoints) AI_chosenCard = getNecessaryCard(pushValue - maxValue + AIPoints, 'green')
        else if (turn < lastTurn && AIPoints > 10 && checkSpecialCard_AI('joker') && playerCanFinish) {
            chosenValue = AIPoints === maxValue ? -5 : 9 - AIPoints//желательно понизиться до 9 очков
            chosenColor = 'green'
            AI_chosenCard = getCardByProps('joker', 'purple')
        }
        //возможность запушить за 2 хода, если у игрока нет возможности задефаться
        else if (!checkIfPlayerCanDefend() && checkPotentialPush_AI(2) && maxRedValue > 0) {
            AI_chosenCard = getCardByProps(maxRedValue, 'red')
        }
        //разыгрываем клевер, если: а)ход < 9, 
        //б)на 10/11 ход, если счет ИИ больше игрока (опасности проигрыша по счету нет, а опасность пуша - есть)
        else if (turn < lastTurn && checkSpecialCard_AI('clover') && globalDeck.length > 2 && checkIfCardsAreBad() &&
                    (turn < 9 || ([9, 10].includes(turn) && AIPoints >= playerPoints))) {
            AI_chosenCard = getCardByProps('clover', 'purple')
        }


        //ХОДЫ 1 - 5
        //держим счет не больше 4
        else if (turn >= 1 && turn <= 5 && minGreenValue < 0 && AIPoints > 4) AI_chosenCard = getNecessaryCard(AIPoints - 4, 'green')
        //занижаем оппонента
        else if (turn >= 1 && turn <= 5 && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        //повышаем себя на небольшое значение
        else if (turn >= 1 && turn <= 5 && maxGreenValue > 0 && AIPoints < 3 && checkCardInRange(1, 3 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 3 - AIPoints, 'green'), 'green')
        }     

        //ХОДЫ 6 - 10
        //опасность перебора - занижаем свой балл (если ход не последний)
        else if (turn >= 6 && turn <= 10 && minGreenValue < 0 && AIPoints > 8) AI_chosenCard = getNecessaryCard(AIPoints - 8, 'green')
        //занижаем оппонента
        else if (turn >= 6 && turn <= 10 && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        //повышаем себя не больше, чем на 8
        else if (turn >= 6 && turn <= 10 && maxGreenValue > 0 && AIPoints < 8 && checkCardInRange(1, 8 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 8 - AIPoints, 'green'), 'green')
        }
        //в первую очередь - повышение оппонента, во вторую - понижение (т.к. если понижать нечего, значит этих карт больше, чем надо)
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(true, 'red') || getAnyCardByProps(false, 'red') || getAnyCardByProps(false, 'green') || getAnyCardByProps(true, 'green')
        }
    }

    //ПЕРЕМИРИЕ
    if (AI_strategy === 5) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        let {pushValue, playerCanFinish} = checkPotentialPush()
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        else if (playerPoints > 10 && checkSpecialCard_AI('joker')) {
            chosenValue = 5
            chosenColor = 'red'
            AI_chosenCard = getCardByProps('joker', 'purple')
        } 
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход разница в очках не больше 5 и можно сделать больше - делаем (всегда)
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 5 && checkSpecialCard_AI('joker')) {
            if (playerPoints > 5) {
                chosenValue = -5
                chosenColor = 'red'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
            else if (AIPoints <= 10) {
                chosenValue = 5
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            } else {
                chosenValue = maxValue - AIPoints
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
        }
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //если на последний ход нельзя перегнать оппонента и есть перемирие - сводим в ничью
        else if (turn === lastTurn &&  AIPoints < playerPoints && checkSpecialCard_AI('truce')) {
            AI_chosenCard = getCardByProps('truce', 'purple')
        }
        //если счет очень высокий и оппонент может сделать перебор - обнуляемся (или занижаемся)
        else if (turn < lastTurn && AIPoints >= 8 && checkSpecialCard_AI('truce') && playerCanFinish) AI_chosenCard = getCardByProps('truce', 'purple')
        else if (turn < lastTurn && minGreenValue < 0 && playerCanFinish && -minGreenValue >= pushValue - maxValue + AIPoints) AI_chosenCard = getNecessaryCard(pushValue - maxValue + AIPoints, 'green')
        else if (turn < lastTurn && 5 >= pushValue - maxValue + AIPoints && checkSpecialCard_AI('joker') && playerCanFinish) {
            chosenValue = -(pushValue - maxValue + AIPoints)//желательно понизиться до 10 очков
            chosenColor = 'green'
            AI_chosenCard = getCardByProps('joker', 'purple')
        }

        //ПОСЛЕ 7 ХОДА (маловероятное развитие событий)
        //если из нас выбили перемирие, у оппонента высокий счет
        //если мы проигрываем по счету, нам нечем завышаться и у нас есть чем пушить оппонента -
        //остается только дожимать, других способов нет
        else if (turn >= 7 && turn < lastTurn && !checkSpecialCard_AI('truce') 
                    && maxRedValue > 0 && playerPoints > 5 && playerPoints > AIPoints && maxGreenValue < 0) {
            AI_chosenCard = getCardByProps(maxRedValue, 'red')
        }

        //если опасности нет - держим свой счет на приемлимом уровне и дестабилизируем оппонента
        else if (turn < lastTurn && maxRedValue > 0 && playerPoints > 6) {
            AI_chosenCard = getCardByProps(maxRedValue, 'red')
        }
        else if (turn < lastTurn && maxGreenValue > 0 && AIPoints < 6) {
            AI_chosenCard = getCardByProps(maxGreenValue, 'green')
        }
        else if (turn < lastTurn && minGreenValue < 0 && AIPoints > 10) {
            AI_chosenCard = getCardByProps(minGreenValue, 'green')
        }
        else if (turn < lastTurn && minRedValue < 0 && playerPoints > 0) {
            AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        }
        //скидываем ненужные карты и копим нужные
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(false, 'green') || getAnyCardByProps(false, 'red') || getAnyCardByProps(true, 'red') || getAnyCardByProps(true, 'green')
        }
    }

    //ПЕСОЧНЫЕ ЧАСЫ
    if (AI_strategy === 6) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        let {pushValue, playerCanFinish} = checkPotentialPush()
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        else if (playerPoints > 10 && checkSpecialCard_AI('joker')) {
            chosenValue = 5
            chosenColor = 'red'
            AI_chosenCard = getCardByProps('joker', 'purple')
        } 
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход разница в очках не больше 5 и можно сделать больше - делаем (всегда)
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 5 && checkSpecialCard_AI('joker')) {
            if (playerPoints > 5) {
                chosenValue = -5
                chosenColor = 'red'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
            else if (AIPoints <= 10) {
                chosenValue = 5
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            } else {
                chosenValue = maxValue - AIPoints
                chosenColor = 'green'
                AI_chosenCard = getCardByProps('joker', 'purple')
            }
        }
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //если на 9-11 ход очков больше - выигрываем
        else if (turn >= lastTurn - 2 && checkSpecialCard_AI('hourglass') && AIPoints > playerPoints) {
            AI_chosenCard = getCardByProps('hourglass', 'gold')
        }
        //если на 9 ход можем сделать больше очков - играем время и выигрываем
        else if (turn === lastTurn - 2 && checkSpecialCard_AI('hourglass') && 
                    ((playerPoints >= AIPoints && playerPoints - AIPoints <= 5 && checkSpecialCard_AI('joker')) || 
                    (playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)))) {
            AI_chosenCard = getCardByProps('hourglass', 'gold')
        }
        //если на последний ход нельзя перегнать оппонента и есть перемирие - сводим в ничью
        else if (turn === lastTurn &&  AIPoints < playerPoints && checkSpecialCard_AI('truce')) {
            AI_chosenCard = getCardByProps('truce', 'purple')
        }
        //если счет очень высокий и оппонент может сделать перебор - занижаемся       
        else if (turn < lastTurn && minGreenValue < 0 && playerCanFinish && -minGreenValue >= pushValue - maxValue + AIPoints) AI_chosenCard = getNecessaryCard(pushValue - maxValue + AIPoints, 'green')
        else if (turn < lastTurn && 5 >= pushValue - maxValue + AIPoints && checkSpecialCard_AI('joker') && playerCanFinish) {
            chosenValue = -(pushValue - maxValue + AIPoints)//желательно понизиться до 10 очков
            chosenColor = 'green'
            AI_chosenCard = getCardByProps('joker', 'purple')
        }
        else if (turn < lastTurn && AIPoints >= 8 && checkSpecialCard_AI('truce') && playerCanFinish) AI_chosenCard = getCardByProps('truce', 'purple')

        //ХОДЫ 1 - 5
        //держим счет не больше 6
        else if (turn >= 1 && turn <= 5 && minGreenValue < 0 && AIPoints > 6) AI_chosenCard = getNecessaryCard(AIPoints - 6, 'green')
        //занижаем оппонента
        else if (turn >= 1 && turn <= 5 && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        //повышаем себя на небольшое значение
        else if (turn >= 1 && turn <= 5 && maxGreenValue > 0 && AIPoints < 4 && AIPoints >= 0 && checkCardInRange(1, 4 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 4 - AIPoints, 'green'), 'green')
        }     

        //ПОСЛЕ 7 ХОДА (маловероятное развитие событий)
        //если из нас выбили джокера и перемирие, у оппонента высокий счет
        //если мы проигрываем по счету, нам нечем завышаться и у нас есть чем пушить оппонента -
        //остается только дожимать, других способов нет
        else if (turn > 8 && !checkSpecialCard_AI('truce') && !checkSpecialCard_AI('joker')  
            && maxRedValue > 0 && playerPoints > 7 && AIPoints < 4) {
            getCardByProps(maxRedValue, 'red')
        }
        else if (turn >= 7 && !checkSpecialCard_AI('truce') && !checkSpecialCard_AI('joker')  
                    && maxRedValue > 0 && playerPoints > 7 && AIPoints < playerPoints && maxGreenValue < 0) {
            getCardByProps(maxRedValue, 'red')
        }

        //ХОДЫ 6 - 10
        //опасность перебора - занижаем свой балл (если ход не последний)
        else if (turn >= 6 && turn <= 10 && minGreenValue < 0 && AIPoints > 10) AI_chosenCard = getNecessaryCard(AIPoints - 10, 'green')
        //занижаем оппонента
        else if (turn >= 6 && turn <= 10 && minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        //повышаем себя не больше, чем на 8
        else if (turn >= 6 && turn <= 10 && maxGreenValue > 0 && AIPoints < 8 && AIPoints >= 0 && checkCardInRange(1, 8 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 8 - AIPoints, 'green'), 'green')
        }
        //в последнюю - очередь сбрасываем увеличение счета оппоненту и понижение своего счета
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(true, 'red') || getAnyCardByProps(false, 'red') || getAnyCardByProps(false, 'green') || getAnyCardByProps(true, 'green')
        }
    }

    //СВАП
    if (AI_strategy === 7) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        let {pushValue, playerCanFinish} = checkPotentialPush()
        //перебор (всегда)
        if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //свап на последний ход, если у оппонента больше очков
        else if (turn === lastTurn && checkSpecialCard_AI('swap') && playerPoints > AIPoints)  AI_chosenCard = getCardByProps('swap', 'gold')
        //если на последний ход кол-во очков одинаково или меньше, но свапов больше нет - увеличиваем свой счет или занижаем чужой
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //если ход не последний, а счет ИИ очень высок - меняемся местами
        else if (turn < lastTurn && checkSpecialCard_AI('swap') && playerCanFinish && playerPoints + pushValue <= maxValue) AI_chosenCard = getCardByProps('swap', 'gold')
        else if (turn < lastTurn && minGreenValue < 0 && playerCanFinish) AI_chosenCard = getCardByProps(minGreenValue, 'green')
        //если опасности нет и есть ненужные карты - разыгрываем клевер
        else if (turn < lastTurn && checkSpecialCard_AI('clover') && globalDeck.length > 2 && checkIfCardsAreBad()) {
            AI_chosenCard = getCardByProps('clover', 'purple')
        }
        //разыгрываем что есть: занижаем себя если есть что занижать и пушим оппонента (МБ НАОБОРОТ)
        else if (turn < lastTurn && maxRedValue > 0) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        else if (turn < lastTurn && minGreenValue < 0 && AIPoints > 3) AI_chosenCard = getCardByProps(minGreenValue, 'green')       
        //после середины игры важно иметь как минимум 1 карту положительную, ели оппонент играем пассивно
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(false, 'red') || getAnyCardByProps(true, 'red') || getAnyCardByProps(false, 'green') || getAnyCardByProps(true, 'green')
        }
    }

    //ЧЕМПИОН
    if (AI_strategy === 8) {
        let maxRedValue = Math.max(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        //перебор (всегда)
        if (checkSpecialCard_AI('champion') && playerPoints > 5) {
            AI_chosenCard = getCardByProps('champion', 'gold')
            chosenColor = 'red'
        } 
        else if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //на последний ход увеличить свой счет на максимум
        else if (turn === lastTurn && AIPoints <= 5) {
            AI_chosenCard = getCardByProps('champion', 'gold')
            chosenColor = 'green'
        } 
        //опасность - пассивно понижаем свой счет
        else if (AIPoints >= 8 && checkSpecialCard_AI('joker')) {
            chosenValue = -5
            chosenColor = 'green'
            AI_chosenCard = getCardByProps('joker', 'purple')
        }
        else if (AIPoints >= 8 && minGreenValue < 0) AI_chosenCard = getCardByProps(minGreenValue, 'green')
        //если опасности нет - пушим оппонента
        else if (!checkSpecialCard_player('swap') && checkSpecialCard_AI('joker') && playerPoints > 0) {
            AI_chosenCard = getCardByProps('joker', 'purple')
            chosenValue = 5
            chosenColor = 'red'
        }

        //если у оппонента есть Время - логика немного меняется
        //пушим в начале, если не удалось - перестаем
        else if (checkSpecialCard_player('hourglass') && turn <= 5 && maxRedValue > 0) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        //после середины завышаем себя не больше, чем на 6
        else if (checkSpecialCard_player('hourglass') && turn >= 5 && turn <= 10 && maxGreenValue > 0 && AIPoints < 6 && checkCardInRange(1, 6 - AIPoints, 'green')) {
            AI_chosenCard = getCardByProps(checkCardInRange(1, 8 - AIPoints, 'green'), 'green')
        }
        //после середины занижаем оппонента
        else if (checkSpecialCard_player('hourglass') && turn >= 5 && turn <= 10 && minRedValue < 0 && playerPoints > 0) {
            AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        }

        //разыгрываем что есть, пуш в приоритете (если у оппонента часы - играем по-другому)
        else if (turn < lastTurn && !checkSpecialCard_player('hourglass') && maxRedValue > 0) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        else if (turn < lastTurn && !checkSpecialCard_player('hourglass') && minGreenValue < 0 && AIPoints > 0) AI_chosenCard = getNecessaryCard(AIPoints, 'green')
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(false, 'red') || getCardByProps(-1, 'green') || 
            getAnyCardByProps(true, 'green') || getAnyCardByProps(false, 'green') || getAnyCardByProps(true, 'red')
        }
    }


    //ЧУМА
    if (AI_strategy === 9) {
        let maxRedValue = Math.max(...AI_redValues)
        let maxGreenValue = Math.max(...AI_greenValues)
        let minRedValue = Math.min(...AI_redValues)
        let minGreenValue = Math.min(...AI_greenValues)
        let {pushValue, playerCanFinish} = checkPotentialPush()
        //1-ый ход - всегда Чума
        if (turn === 1 && checkSpecialCard_AI('plague')) AI_chosenCard = getCardByProps('plague', 'gold')
        //перебор (всегда)
        else if (playerPoints + maxRedValue > maxValue) AI_chosenCard = getCardByProps(maxRedValue, 'red')
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход меньше очков, но можно сделать больше - делаем
        else if (turn === lastTurn && playerPoints >= AIPoints && playerPoints - AIPoints <= 4 && (maxGreenValue > 0 || minRedValue < 0)) {
            let val1 = (maxGreenValue > 0) ? maxGreenValue : 0
            let val2 = (minRedValue < 0 && playerPoints > 0) ? minRedValue : 0
            AI_chosenCard = (val1 > -val2) ? getCardByProps(maxGreenValue, 'green') : getCardByProps(minRedValue, 'red')
        }
        //если на последний ход больше очков - ничего не делать (всегда)
        else if (turn === lastTurn && AIPoints > playerPoints) {
            cardIsPlayed = false
            AI_chosenCard = {...AICards[0]}
        }
        //если на последний ход нельзя перегнать оппонента и есть перемирие - сводим в ничью
        else if (turn === lastTurn &&  AIPoints < playerPoints && checkSpecialCard_AI('truce')) {
            AI_chosenCard = getCardByProps('truce', 'purple')
        }
        //если оппонент разыграл потенциально опасную карту - отмена
        else if (checkSpecialCard_AI('cancel') && lastPlayedCard && checkIfLastPlayedCardIsDangerous()) {
            AI_chosenCard = getCardByProps('cancel', 'purple')
        }
        //опасность - обнуляемся или сбрасываем очки
        else if (turn < lastTurn && AIPoints >= 6 && checkSpecialCard_AI('truce') && playerCanFinish) AI_chosenCard = getCardByProps('truce', 'purple')
        else if (AIPoints > 0 && minGreenValue < 0) AI_chosenCard = getNecessaryCard(AIPoints, 'green')
        //если опасности нет - занижаем оппонента еще больше
        else if (minRedValue < 0 && playerPoints < 0) AI_chosenCard = getCardByProps(minRedValue, 'red')
        else if (minRedValue < 0 && playerPoints > 0) AI_chosenCard = getNecessaryCard(playerPoints, 'red')
        //ближе к концу стараемся выйти в плюс, если оппонент вышел из минуса
        else if (turn > 8 && AIPoints < 7 && playerPoints >= 0 && maxGreenValue > 0) AI_chosenCard = getCardByProps(maxGreenValue, 'green')
        //разыгрываем что есть
        else {
            cardIsPlayed = false
            AI_chosenCard = getAnyCardByProps(true, 'red') || getAnyCardByProps(true, 'green') || getAnyCardByProps(false, 'green') || getAnyCardByProps(false, 'red')
        }
    }

    return {AI_chosenCard, cardIsPlayed, chosenColor, chosenValue}
}

//для розыгрыша клевера
export function chooseGoodCards_AI(AI_strategy, globalDeck, AICards, playerCards, playerSpecialCards) {
    let count = 0, goodCards = []

    //ищем в колоде хорошие карты [ПЕРЕПИСАТЬ НА ОБЫЧНЫЙ ЦИКЛ С ВЫХОДОМ]
    function scoutForGoodCards_AI(color, value, amountWeNeed, amountWeHave = 0) {
        globalDeck.forEach(card => {
            if (card.color === color && card.value === value && count + amountWeHave < amountWeNeed) {
                count++
                goodCards.push({...card})
            }
        })
    }

    //нужны ли нам карты с определенным свойством (amountWeNeed - минимальное необходимое кол-во)
    function checkDoWeNeedCardsOfSuchType(color, isValuePositive, amountWeNeed) {
        let k = 0
        //для клевера - есть ли у нас зеленые карты с хорошим значением
        if (color === 'green' && isValuePositive) {
            AICards.forEach(card => {
                if (card.color === color && card.value > 1) k++
            })
        }
        //устраивают только зеленые -3 / -4
        else if (color === 'green' && !isValuePositive) {
            AICards.forEach(card => {
                if (card.color === color && card.value < -2) k++
            })
        }
        return {amountWeHave: k, needMore: k < amountWeNeed ? true : false}
    }

    //есть ли у игрока данная спец карта
    function checkSpecialCard_player(value) {
        return playerSpecialCards.find(item => item.value === value) ? true : false
    }

    //КЛЕВЕР
    if (AI_strategy === 4) {
        //вначале смотрим, есть ли необходимое кол-во карт на деф: зеленая -3 / -4
        //если у оппонента есть Спринт - надо готовиться к пушу и иметь минимум 2 карты
        //если нет - достаточно одной
        /*if (checkSpecialCard_player('sprint')) {
            if (checkDoWeNeedCardsOfSuchType('green', false, 2).needMore) {
                let amountWeHave = checkDoWeNeedCardsOfSuchType('green', false, 2).amountWeHave
                if (count < 2) scoutForGoodCards_AI('green', -4, 2, amountWeHave)
                if (count < 2) scoutForGoodCards_AI('green', -3, 2, amountWeHave)
            }
        } else {
            if (checkDoWeNeedCardsOfSuchType('green', false, 1).needMore) {
                if (count < 1) scoutForGoodCards_AI('green', -4, 1)
                if (count < 1) scoutForGoodCards_AI('green', -3, 1)
            }
        }*/

        //вначале смотрим, есть ли хотя бы одна карта на деф: зеленая -3 / -4
        if (checkDoWeNeedCardsOfSuchType('green', false, 1).needMore) {
            if (count < 1) scoutForGoodCards_AI('green', -4, 1)
            if (count < 1) scoutForGoodCards_AI('green', -3, 1)
        }
        
        //если зеленых положительных карт мало   
        if (checkDoWeNeedCardsOfSuchType('green', true, 2).needMore) {
            if (count < 2) scoutForGoodCards_AI('green', 4, 2)
            if (count < 2) scoutForGoodCards_AI('green', 3, 2)
            if (count < 2) scoutForGoodCards_AI('green', 2, 2)
            //остальное на всякий случай (если вообще нет нужных карт)
            if (count < 2) scoutForGoodCards_AI('red', -1, 2)
            if (count < 2) scoutForGoodCards_AI('green', -2, 2)
            if (count < 2) scoutForGoodCards_AI('red', -4, 2)
            if (count < 2) scoutForGoodCards_AI('red', -3, 2)
            if (count < 2) scoutForGoodCards_AI('red', -2, 2)
            if (count < 2) scoutForGoodCards_AI('green', 1, 2)
            if (count < 2) scoutForGoodCards_AI('green', -1, 2)
            if (count < 2) scoutForGoodCards_AI('red', 1, 2)
            if (count < 2) scoutForGoodCards_AI('red', 2, 2)
            if (count < 2) scoutForGoodCards_AI('red', 3, 2)
            if (count < 2) scoutForGoodCards_AI('red', 4, 2)     
        }
        //если достаточно - добираем красные отрицательные
        else {
            if (count < 2) scoutForGoodCards_AI('red', -4, 2)
            if (count < 2) scoutForGoodCards_AI('red', -3, 2)
            if (count < 2) scoutForGoodCards_AI('red', -2, 2)
            if (count < 2) scoutForGoodCards_AI('red', -1, 2)
            //остальное на всякий случай (если вообще нет нужных карт)
            if (count < 2) scoutForGoodCards_AI('green', -2, 2)
            if (count < 2) scoutForGoodCards_AI('green', 4, 2)
            if (count < 2) scoutForGoodCards_AI('green', 3, 2)
            if (count < 2) scoutForGoodCards_AI('green', 2, 2)
            if (count < 2) scoutForGoodCards_AI('green', 1, 2)
            if (count < 2) scoutForGoodCards_AI('green', -1, 2)
            if (count < 2) scoutForGoodCards_AI('red', 1, 2)
            if (count < 2) scoutForGoodCards_AI('red', 2, 2)
            if (count < 2) scoutForGoodCards_AI('red', 3, 2)
            if (count < 2) scoutForGoodCards_AI('red', 4, 2)     
        }
    }

    //ОБМЕН
    if (AI_strategy === 7) {
        if (count < 2) scoutForGoodCards_AI('green', -4, 2)
        if (count < 2) scoutForGoodCards_AI('green', -3, 2)
        if (count < 2) scoutForGoodCards_AI('red', 4, 2)
        if (count < 2) scoutForGoodCards_AI('red', 3, 2)
        if (count < 2) scoutForGoodCards_AI('green', -2, 2)
        if (count < 2) scoutForGoodCards_AI('red', 2, 2)
        if (count < 2) scoutForGoodCards_AI('green', -1, 2)
        if (count < 2) scoutForGoodCards_AI('red', 1, 2)
        //остальное на всякий случай (если вообще нет нужных карт)
        if (count < 2) scoutForGoodCards_AI('red', -1, 2)
        if (count < 2) scoutForGoodCards_AI('red', -2, 2)
        if (count < 2) scoutForGoodCards_AI('red', -3, 2)
        if (count < 2) scoutForGoodCards_AI('red', -4, 2)
        if (count < 2) scoutForGoodCards_AI('green', 1, 2)
        if (count < 2) scoutForGoodCards_AI('green', 2, 2)
        if (count < 2) scoutForGoodCards_AI('green', 3, 2)
        if (count < 2) scoutForGoodCards_AI('green', 4, 2)
    }
    return goodCards
}


//получить ID плохих карт для сброса
export function getBadCards(AI_strategy, AICards, AI_maxCounter) {
    let AI_counter = 0
    let cardsIDToDiscard = []

    //новичок и джокер (стараемся не занижать себя и не завышать оппонента)
    if ([0, 1].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if ((item.color === 'green' && item.value < 0) || (item.color === 'red' && item.value > 0)) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    }
    //отмена и песочные часы (нельзя завышать оппонента)
    else if ([2, 6].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if (item.color === 'red' && item.value > 0) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    }
    //обмен (нельзя понижать оппонента и крайне нежелательно завышать себя)
    else if ([7].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if ((item.color === 'red' && item.value < 0) || (item.color === 'green' && item.value > 0)) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    }
    //перемирие (нельзя занижать себя)
    else if ([5].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if (item.color === 'green' && item.value < 0) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    }
    //чемпион (нельзя завышать себя и крайне нежелательно понижать оппонента)
    else if ([8].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if ((item.color === 'green' && item.value > 0) || (item.color === 'red' && item.value < 0)) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    }
    //смерть (нельзя завышать себя или оппонента)
    else if ([9].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if ((item.color === 'green' && item.value > 0) || (item.color === 'red' && item.value > 0)) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    }
    //клевер
    else if ([4].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if ((item.color === 'red' && item.value > 0) || [1, -1].includes(item.value) && !cardsIDToDiscard.includes(item.id)) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
        //если слишком много отрицательных зеленых карт
        if (AI_counter < AI_maxCounter && countAmountOfCards_AI('green', false, AICards) > 2) AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if (item.color === 'green' && item.value < -1 && !cardsIDToDiscard.includes(item.id)) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
        if (AI_counter < AI_maxCounter) AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if (item.color === 'green' && item.value === 2 && !cardsIDToDiscard.includes(item.id)) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    } 
    //спринт (самое важное - оставить карты на пуш оппонента)
    else if ([3].includes(AI_strategy)) {
        AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if ((item.color === 'red' && item.value < 0) || (item.color === 'green' && [1, -1].includes(item.value))) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
        if (AI_counter < AI_maxCounter) AICards.forEach(item => {
            if (AI_counter < AI_maxCounter) {
                if (item.color === 'green' && item.value < -1) {
                    cardsIDToDiscard.push(item.id)
                    AI_counter++;
                }
            }
        })
    }

    return {AI_counter, cardsIDToDiscard}
}

//посчитать кол-во карт с заданным св-вом
function countAmountOfCards_AI(color, isValuePositive, AICards) {
    let count = 0
    if (color === 'green') {
        let AI_greenValues = AICards.filter(item => item.color === 'green').map(item => item.value)
        if (isValuePositive) AI_greenValues.forEach(value => {if (value > 0) count++})
        else AI_greenValues.forEach(value => {if (value < 0) count++})
    } else if (color === 'red') {
        let AI_redValues = AICards.filter(item => item.color === 'red').map(item => item.value)
        if (isValuePositive) AI_redValues.forEach(value => {if (value > 0) count++})
        else AI_redValues.forEach(value => {if (value < 0) count++})
    }
    return count
}