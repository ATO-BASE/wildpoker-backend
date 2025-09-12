import { Card } from './card';

export class PlayerHand {
  private holeCard1: Card;
  private holeCard2: Card;

  constructor(card1: Card, card2: Card) {
    this.holeCard1 = card1;
    this.holeCard2 = card2;
  }

  getHoleCard1(): Card {
    return this.holeCard1;
  }

  getHoleCard2(): Card {
    return this.holeCard2;
  }

  getStringHand(): string {
    return `${this.holeCard1.cardToString()} and ${this.holeCard2.cardToString()}`;
  }

  getPNGHand(): string {
    return `${this.holeCard1.cardToPNG()} ${this.holeCard2.cardToPNG()}`;
  }
}

export default PlayerHand; 