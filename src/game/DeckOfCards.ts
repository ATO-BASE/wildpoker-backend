import { Card, Suit, CardNumber } from './card';

export class DeckOfCards {
  private totalCards: number;
  private deck: Card[];
  private suits: Suit[];
  private deckCounter: number;

  constructor() {
    this.totalCards = 52;
    this.deck = [];
    this.suits = ['s', 'c', 'h', 'd'];
    this.deckCounter = 0;

    for (let i = 0; i < this.suits.length; i++) {
      for (let j = 2; j < 15; j++) {
        this.deck[(i * 13) + (j - 2)] = new Card(this.suits[i], j as CardNumber);
      }
    }
  }

  getSuits(): Suit[] {
    return this.suits;
  }

  getDeck(): Card[] {
    return this.deck;
  }

  shuffle(): void {
    for (let i = 0; i < 52; i++) {
      const randomSpot = Math.round(Math.random() * 51);

      const temp = this.deck[i];
      this.deck[i] = this.deck[randomSpot];
      this.deck[randomSpot] = temp;
    }
  }

  deal(): Card {
    return this.deck[this.deckCounter++];
  }
}

export default DeckOfCards; 