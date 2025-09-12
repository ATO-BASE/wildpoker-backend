import { Server } from 'socket.io';
import { Card } from './card';
import { Player } from './player';
import { PokerGame } from './pokerGame';

export interface PlayerAction {
  player: Player;
  action: string;
  amount?: number;
}

export class PokerHand {
  private io: Server | null = null;
  private theGame: PokerGame;
  private communityCards: Card[];
  private playersInHand: Player[];
  private dealerIdx: number;
  private dealer: Player;
  private bigBlind: Player;
  private initialRaiser: Player | null;
  private currPlayer: Player;
  private moneyInPot: number;
  private currBet: number;
  private preflop: boolean;
  private handComplete: boolean;
  private flopDealt: boolean;
  private turnDealt: boolean;
  private riverDealt: boolean;

  constructor(game: PokerGame) {
    this.theGame = game;
    this.communityCards = [];
    this.playersInHand = this.theGame.getEligiblePlayers();
    this.dealerIdx = this.theGame.getDealerIdx() % this.playersInHand.length;
    this.dealer = this.getPlayers()[this.dealerIdx];
    this.bigBlind = this.getNextPlayer(this.getNextPlayer(this.dealer));
    this.initialRaiser = null;
    this.currPlayer = this.getNextPlayer(this.getNextPlayer(this.getNextPlayer(this.dealer)));
    this.moneyInPot = 0;
    this.currBet = 0;
    this.preflop = true;
    this.handComplete = false;
    this.flopDealt = false;
    this.turnDealt = false;
    this.riverDealt = false;

    this.runHand();
  }

  setIO(io: Server): void {
    this.io = io;
  }

  runHand(): void {
    for (let i = 0; i < this.playersInHand.length; i++) {
    }
    
    if (this.playersInHand.length > 1) {
      this.collectSmallBlind();
      this.collectBigBlind();
      this.currBet = this.theGame.getBB();
      
      this.theGame.shuffle();
      this.theGame.dealHands();
      this.emitEverything();

      this.initialRaiser = this.getNextPlayer(this.getNextPlayer(this.dealer));
      this.updateHand();
    }
  }

  updateHand(): void {
    
    this.emitEverything();
    
    if (this.getPlayers().length == 1) {
      if (this.io) {
        this.io.to(this.theGame.getGameID()).emit('consoleLog', this.getPlayers()[0].getName() + " has won the pot of: " + this.getPot());
        this.io.to(this.theGame.getGameID()).emit('message', this.getPlayers()[0].getName() + " has won the pot of: " + this.getPot());
      }
      this.getPlayers()[0].addToStack(this.moneyInPot);
      this.emitEverything();
      this.handComplete = true;

      if (this.io) {
        this.io.to(this.theGame.getGameID()).emit('consoleLog', "A new hand is starting in 5 seconds");
      }
      this.theGame.clearGame();
      this.handComplete = true;
    }

    if (this.handComplete == false) {
      if (this.checkIfPlayersLeftToAct()) {
        if (this.io) {
          this.io.to(this.theGame.getGameID()).emit('consoleLog', "It is " + this.getCurrPlayer().getName() + "'s turn");
        }
        this.callTurnOnNextPlayer();
      } else {
        if (this.flopDealt == false) {
          this.preflop = false;
          this.dealFlop();
          this.currBet = 0;
          this.currPlayer = this.getNextPlayer(this.dealer);
          this.initialRaiser = null;
          this.clearMoves();
          
          this.emitEverything();
          
          if (this.lessThanTwoCanPlay()) {
            setTimeout(() => {
              this.callTurnOnNextPlayer();
            }, 2000);
          } else {
            this.callTurnOnNextPlayer();
          }
          this.flopDealt = true;
        } else if (this.turnDealt == false) {
          this.dealTurn();
          this.currBet = 0;
          this.currPlayer = this.getNextPlayer(this.dealer);
          this.initialRaiser = null;
          this.clearMoves();
          
          this.emitEverything();
          
          if (this.lessThanTwoCanPlay()) {
            setTimeout(() => {
              this.callTurnOnNextPlayer();
            }, 2000);
          } else {
            this.callTurnOnNextPlayer();
          }
          this.turnDealt = true;
        } else if (this.riverDealt == false) {
          this.dealRiver();
          this.currBet = 0;
          this.currPlayer = this.getNextPlayer(this.dealer);
          this.initialRaiser = null;
          this.clearMoves();

          this.emitEverything();
          
          if (this.lessThanTwoCanPlay()) {
            setTimeout(() => {
              this.callTurnOnNextPlayer();
            }, 2000);
          } else {
            this.callTurnOnNextPlayer();
          }
          this.riverDealt = true;
        } else {
          // Showdown - calculate and award pots
          this.calculateAndAwardPots();
        }
      }
    }
  }

  calculateAndAwardPots(): void {
    // Implementation would go here - this is a complex method
    // For now, just mark hand as complete
    this.handComplete = true;
    this.theGame.clearGame();
  }

  playerTurn(valTurn: string): void {
    // Implementation would go here
  }

  validOption(valTurn: string): boolean {
    // Implementation would go here
    return true;
  }

  callTurnOnNextPlayer(): void {
    // Implementation would go here
  }

  eligibleForBlinds(person: Player): boolean {
    return person.getStackSize() > 0;
  }

  collectSmallBlind(): void {
    if (this.eligibleForBlinds(this.getNextPlayer(this.dealer))) {
      const smallBlindPlayer = this.getNextPlayer(this.dealer);
      const smallBlindAmount = Math.min(this.theGame.getSB(), smallBlindPlayer.getStackSize());
      smallBlindPlayer.minusFromStack(smallBlindAmount);
      smallBlindPlayer.addCurrMoneyInPot(smallBlindAmount);
      smallBlindPlayer.addCurrMoneyInBettingRound(smallBlindAmount);
      this.moneyInPot += smallBlindAmount;
      if (this.io) {
        this.io.to(this.theGame.getGameID()).emit('consoleLog', smallBlindPlayer.getName() + " posts small blind: $" + smallBlindAmount);
      }
    }
  }

  collectBigBlind(): void {
    if (this.eligibleForBlinds(this.getNextPlayer(this.getNextPlayer(this.dealer)))) {
      const bigBlindPlayer = this.getNextPlayer(this.getNextPlayer(this.dealer));
      const bigBlindAmount = Math.min(this.theGame.getBB(), bigBlindPlayer.getStackSize());
      bigBlindPlayer.minusFromStack(bigBlindAmount);
      bigBlindPlayer.addCurrMoneyInPot(bigBlindAmount);
      bigBlindPlayer.addCurrMoneyInBettingRound(bigBlindAmount);
      this.moneyInPot += bigBlindAmount;
      if (this.io) {
        this.io.to(this.theGame.getGameID()).emit('consoleLog', bigBlindPlayer.getName() + " posts big blind: $" + bigBlindAmount);
      }
    }
  }

  dealFlop(): void {
    this.communityCards.push(this.theGame.dealCard());
    this.communityCards.push(this.theGame.dealCard());
    this.communityCards.push(this.theGame.dealCard());
    if (this.io) {
      this.io.to(this.theGame.getGameID()).emit('consoleLog', "Flop dealt");
    }
  }

  dealTurn(): void {
    this.communityCards.push(this.theGame.dealCard());
    if (this.io) {
      this.io.to(this.theGame.getGameID()).emit('consoleLog', "Turn dealt");
    }
  }

  dealRiver(): void {
    this.communityCards.push(this.theGame.dealCard());
    if (this.io) {
      this.io.to(this.theGame.getGameID()).emit('consoleLog', "River dealt");
    }
  }

  emitEverything(): void {
    if (!this.io) return;
    
    this.io.to(this.theGame.getGameID()).emit('hands', this.theGame.returnDisplayHands());
    this.io.to(this.theGame.getGameID()).emit('roomUsers', { room: this.theGame.getGameID(), users: this.theGame.getAllNames(), stacksizes: this.theGame.getAllStackSizes() });
    this.io.to(this.theGame.getGameID()).emit('dealBoard', this.getCardPNGs());
    this.io.to(this.theGame.getGameID()).emit('potSize', this.getPot());
    this.io.to(this.theGame.getGameID()).emit('roomPlayers', this.theGame.emitPlayers());
  }

  getPlayers(): Player[] {
    return this.playersInHand;
  }

  getCurrPlayer(): Player {
    return this.currPlayer;
  }

  getDealer(): Player {
    return this.dealer;
  }

  getPot(): number {
    return this.moneyInPot;
  }

  getCurrBet(): number {
    return this.currBet;
  }

  getIndexOfPlayer(player: Player): number {
    const playersLeft = this.getPlayers();
    for (let i = 0; i < playersLeft.length; i++) {
      if (player.getName() == playersLeft[i].getName()) {
        return i;
      }
    }
    return -1;
  }

  lessThanTwoCanPlay(): boolean {
    let numPlayersNotAllIn = 0;
    for (let i = 0; i < this.playersInHand.length; i++) {
      if (!this.playersInHand[i].isAllIn()) {
        numPlayersNotAllIn++;
      }
    }
    return numPlayersNotAllIn < 2;
  }

  checkIfPlayersLeftToAct(): boolean {
    const playersLeft = this.getPlayers();
    for (let i = 0; i < playersLeft.length; i++) {
      if (playersLeft[i].getValTurn() == "undefined") {
        return true;
      }
    }

    if (this.currPlayer == this.initialRaiser) {
      this.currPlayer.setTurn(false);
      this.emitEverything();
      return false;
    }
    
    return true;
  }

  getNextPlayer(player: Player): Player {
    for (let i = 0; i < this.playersInHand.length; i++) {
      if (this.playersInHand[i].getName() == player.getName()) {
        if (i == this.playersInHand.length - 1) {
          return this.playersInHand[0];
        } else {
          return this.playersInHand[i + 1];
        }
      }
    }
    return this.playersInHand[0]; // fallback
  }

  updatePlayersLeftInHand(): Player[] {
    const playersStillLeft: Player[] = [];
    
    for (let i = 0; i < this.playersInHand.length; i++) {
      if (this.playersInHand[i].getValTurn() != "fold" && this.playersInHand[i].getValTurn() != "autoFold") {
        playersStillLeft.push(this.playersInHand[i]);
      }
    }
    return playersStillLeft;
  }

  clearMoves(): void {
    for (let i = 0; i < this.playersInHand.length; i++) {
      if (this.playersInHand[i].isAllIn()) {
        this.playersInHand[i].setValTurn("playerIsAllIn");
      } else {
        if (this.lessThanTwoCanPlay()) {
          this.playersInHand[i].setValTurn("check");
        } else {
          this.playersInHand[i].setValTurn("undefined");
          this.playersInHand[i].setCurrMoneyInBettingRound(0);
        }
      }
    }
  }

  getCardPNGs(): string[] {
    const cardPNGS: string[] = [];
    for (let i = 0; i < this.communityCards.length; i++) {
      const info = this.communityCards[i].cardToPNG();
      cardPNGS.push(info);
    }
    return cardPNGS;
  }
}

export default PokerHand; 