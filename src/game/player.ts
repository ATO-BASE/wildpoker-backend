import { PlayerHand } from './playerHand';
import { Card } from './card';

export class Player {
  private hand: PlayerHand | null;
  private stackSize: number;
  private sockID: string;
  private name: string;
  private handsWon: number;
  private room: string;
  private valTurn: string;
  private currMoneyInPot: number;
  private currMoneyInBettingRound: number;
  private allIn: boolean;
  private isTurn: boolean;
  private hasHand: boolean;

  constructor(name: string, stackSize: number, sockID: string, room: string) {
    this.hand = null;
    this.stackSize = stackSize;
    this.sockID = sockID;
    this.name = name;
    this.handsWon = 0;
    this.room = room;
    this.valTurn = "undefined";
    this.currMoneyInPot = 0;
    this.currMoneyInBettingRound = 0;
    this.allIn = false;
    this.isTurn = false;
    this.hasHand = true;
  }

  setHasHand(hasHand: boolean): void {
    this.hasHand = hasHand;
  }

  getHasHand(): boolean {
    return this.hasHand;
  }

  setTurn(isTurn: boolean): void {
    this.isTurn = isTurn;
  }

  getTurn(): boolean {
    return this.isTurn;
  }

  isAllIn(): boolean {
    return this.allIn;
  }

  setAllIn(): void {
    this.allIn = true;
  }

  minusFromStack(num: number): void {
    this.stackSize -= num;
  }

  getStackSize(): number {
    return this.stackSize;
  }

  addToStack(num: number): void {
    this.stackSize += Number(num);
  }

  addCurrMoneyInPot(amount: number): void {
    this.currMoneyInPot += amount;
  }

  getCurrMoneyInPot(): number {
    return this.currMoneyInPot;
  }

  setCurrMoneyInPot(num: number): void {
    this.currMoneyInPot = num;
  }

  getCurrMoneyInBettingRound(): number {
    return this.currMoneyInBettingRound;
  }

  addCurrMoneyInBettingRound(num: number): void {
    this.currMoneyInBettingRound += num;
  }

  setCurrMoneyInBettingRound(num: number): void {
    this.currMoneyInBettingRound = num;
  }

  setValTurn(valTurn: string): void {
    this.valTurn = valTurn;
  }

  getValTurn(): string {
    return this.valTurn;
  }

  getRoom(): string {
    return this.room;
  }

  setName(name: string): void {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  getSock(): string {
    return this.sockID;
  }

  getHand(): PlayerHand | null {
    return this.hand;
  }

  resetInfo(): void {
    this.currMoneyInPot = 0;
    this.valTurn = "undefined";
    this.currMoneyInBettingRound = 0;
    this.allIn = false;
  }

  setHand(card1: Card, card2: Card): void {
    this.hand = new PlayerHand(card1, card2);
  }
}

export default Player; 