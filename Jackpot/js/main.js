function PlayBlackjack() {
    this.id = '';
    this.remainingCards = 52;
    this.playerCards = [];
    this.dealerCards = [];

    this.playerBet = 10;
    this.playerTotalPoints = 1000;
    this.playerCurrentScore = 0;
    this.dealerCurrentScore = 0;

    this.canBet = true;

    this.createDeck = async function() {
        await fetch(`https://deckofcardsapi.com/api/deck/new/`)
        .then(res => res.json())
        .then(data => {
            this.id = data.deck_id;
            this.remainingCards = data.remaining;
        });
    }.bind(this);

    this.deal = async function() {
        await fetch(`https://deckofcardsapi.com/api/deck/${this.id}/draw/?count=4`)
        .then(res => res.json())
        .then(data => {
            this.playerCards.push(...data.cards.slice(0,2));
            this.dealerCards.push(...data.cards.slice(2));
            this.dealerCurrentScore += this.dealerCards.reduce( (acc, c) => acc+this.getCardValue(c.value), 0);
            this.playerCurrentScore += this.playerCards.reduce( (acc, c) => acc+this.getCardValue(c.value), 0);
            this.remainingCards = data.remaining;
        });
    }.bind(this);

    this.drawCard = async function(type="dealer") {
        this.canBet = false;

        await fetch(`https://deckofcardsapi.com/api/deck/${this.id}/draw/?count=1`)
        .then(res => res.json())
        .then(data => {
            if (type==='dealer') {
                this.dealerCards.push(...data.cards);
                this.remainingCards = data.remaining;
                this.displayCardFacedUp('dealerCards', this.dealerCards[this.dealerCards.length-1].image);
                this.dealerCurrentScore += this.getCardValue(this.dealerCards[this.dealerCards.length-1].value);
            } else {
                this.playerCards.push(...data.cards);
                this.remainingCards = data.remaining;
                this.displayCardFacedUp('playerCards', this.playerCards[this.playerCards.length-1].image);
                this.playerCurrentScore += this.getCardValue(this.playerCards[this.playerCards.length-1].value);
                this.isBust();
            }
            
            if (this.remainingCards === 0) {
                this.createDeck();
                this.shuffle();
            }

            console.log('Add card', this, this.playerCurrentScore, this.dealerCurrentScore);
            console.log(this.remainingCards, ' cards left');
        });
    }.bind(this);

    this.shuffle = async function() {
        await fetch(`https://deckofcardsapi.com/api/deck/${this.id}/shuffle/?remaining=true`)
        .then(res => res.json())
        .then(data => {
            console.log('Shuffling deck...', data);
        });
    }.bind(this);

    this.displayCardFacedUp = function(cardOwner, url) {
        document.querySelector(`#${cardOwner}`).innerHTML += `<img src="${url}">`
    }

    this.displayCardFacedDown = function(cardOwner) {
        document.querySelector(`#${cardOwner}`).innerHTML += `<img src="https://deckofcardsapi.com/static/img/back.png">`
    }

    this.resetTable = function() {
        this.playerCards = [];
        this.dealerCards = [];

        this.canBet = true;
    
        this.playerBet = 10;
        this.playerCurrentScore = 0;
        this.dealerCurrentScore = 0;

        document.querySelector('#winner').innerText = '';

        document.querySelector('#playerCards').innerHTML = '';
        document.querySelector('#dealerCards').innerHTML = '';
    }.bind(this);

    this.setUp = async function() {
        this.resetTable();

        await this.createDeck();
        await this.shuffle();
        await this.deal();

        document.querySelector('#addCard').addEventListener('click', this.drawCard);
        document.querySelector('#stand').addEventListener('click', this.stand);
        document.querySelector('#bet-button').addEventListener('click', this.setBet);

        document.querySelector('#points').innerText = this.playerTotalPoints;
        document.querySelector('#bet-total').innerText = this.playerBet;

        this.displayCardFacedUp('playerCards', this.playerCards[0].image);
        this.displayCardFacedUp('playerCards', this.playerCards[1].image);

        this.displayCardFacedUp('dealerCards', this.dealerCards[0].image);
        this.displayCardFacedDown('dealerCards');
    }.bind(this);

    this.getCardValue = function(value) {
        if (value === 'ACE') {
            return 1;
        } else if (value === 'JACK') {
            return 10;
        } else if (value === 'QUEEN') {
            return 10;
        } else if (value === 'KING') {
            return 10;
        } else {
            return +value;
        }
    }

    this.stand = async function() {
        document.querySelector('#dealerCards').innerHTML = '';

        this.canBet = false;

        for (let i=0; i<this.dealerCards.length; i++) {
            this.displayCardFacedUp('dealerCards', this.dealerCards[i].image);
        }

        while (this.dealerCurrentScore < 17) {
            await this.drawCard();
        }

        console.log('Stand', this.playerCurrentScore, this.dealerCurrentScore);
        setTimeout(this.checkBlackjack, 2000);

    }.bind(this);

    this.isBust = function() {
        if (this.playerCurrentScore > 21) {
            console.log('bust');
            this.playerLose();

            if (this.playerTotalPoints > 0) {
                setTimeout(this.setUp, 2000);
            }
        }
    }

    this.setBet = function() {
        const bet = document.querySelector('#bet').value;
        if (!this.canBet) return;

        if (this.validateBet(bet)) {
            this.playerBet += +bet;
            document.querySelector('#bet-total').innerText = this.playerBet;
            console.log('Betting', this.playerBet);
        } else {
            document.querySelector('#invalid-bet').classList.remove('hidden');
            setTimeout( () => document.querySelector('#invalid-bet').classList.add('hidden'), 2000);
        }

        console.log(this.playerBet)
        document.querySelector('#bet').value = '';

    }.bind(this);

    this.validateBet = function(bet) {
        if (Number.isNaN(+bet) || +bet < 10 || this.playerTotalPoints < +bet ) {
            return false;
        }
        return true;
    }.bind(this);

    this.checkBlackjack = function() {
        const playerDiff = 21 - this.playerCurrentScore;
        const dealerDiff = Math.abs(21 - this.dealerCurrentScore);

        if (playerDiff < dealerDiff) {
            console.log('player wins');
            this.playerWin();
        } else if (playerDiff > dealerDiff) {
            console.log('dealer wins');
            this.playerLose();
        } else {
            console.log('draw');
            this.draw();
        }

        if (this.playerTotalPoints > 0) {
            setTimeout(this.setUp, 2000);
        }
    }.bind(this);

    this.playerLose = function() {
        document.querySelector('.winner-container').classList.remove('hidden');
        document.querySelector('#winner').innerText = "Dealer wins";
        document.querySelector('#winner').classList.add('lose');
        document.querySelector('#winner').classList.remove('win');
        this.playerTotalPoints -= this.playerBet;

        setTimeout( () => document.querySelector('.winner-container').classList.add('hidden'), 2000);
    }.bind(this)

    this.playerWin = function() {
        document.querySelector('.winner-container').classList.remove('hidden');
        document.querySelector('#winner').innerText = "Player wins!";
        document.querySelector('#winner').classList.add('win');
        document.querySelector('#winner').classList.remove('lose');
        this.playerTotalPoints += this.playerBet;

        setTimeout( () => document.querySelector('.winner-container').classList.add('hidden'), 2000);

    }.bind(this)

    this.draw = function() {
        document.querySelector('.winner-container').classList.remove('hidden');
        document.querySelector('#winner').classList.remove('lose');
        document.querySelector('#winner').classList.remove('win');
        document.querySelector('#winner').innerText = "Draw";
        setTimeout( () => document.querySelector('.winner-container').classList.add('hidden'), 2000);
    }.bind(this)
    

}
async function play() {
    let game = new PlayBlackjack();
    await game.setUp();
    console.log(game);
    
}

play();