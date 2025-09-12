export type Suit = 's' | 'c' | 'h' | 'd';
export type CardNumber = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export class Card {
  private suit: Suit;
  private number: CardNumber;

  constructor(suit: Suit, number: CardNumber) {
    this.suit = suit;
    this.number = number;
  }

  getSuit(): Suit {
    return this.suit;
  }

  getNumber(): CardNumber {
    return this.number;
  }

  static numberToString(number: CardNumber): string | null {
    switch (number) {
      case 2: return "Two";
      case 3: return "Three";
      case 4: return "Four";
      case 5: return "Five";
      case 6: return "Six";
      case 7: return "Seven";
      case 8: return "Eight";
      case 9: return "Nine";
      case 10: return "Ten";
      case 11: return "Jack";
      case 12: return "Queen";
      case 13: return "King";
      case 14: return "Ace";
      default: return null;
    }
  }

  abbreviatedString(): string {
    let cardString = "";
    
    switch (this.number) {
      case 2: cardString += "2"; break;
      case 3: cardString += "3"; break;
      case 4: cardString += "4"; break;
      case 5: cardString += "5"; break;
      case 6: cardString += "6"; break;
      case 7: cardString += "7"; break;
      case 8: cardString += "8"; break;
      case 9: cardString += "9"; break;
      case 10: cardString += "10"; break;
      case 11: cardString += "J"; break;
      case 12: cardString += "Q"; break;
      case 13: cardString += "K"; break;
      case 14: cardString += "A"; break;
    }
    
    cardString += this.suit;
    return cardString;
  }

  cardToString(): string {
    const number = this.number;
    const suit = this.suit;
    let cardString = "";
    
    switch (number) {
      case 2: cardString += "Two"; break;
      case 3: cardString += "Three"; break;
      case 4: cardString += "Four"; break;
      case 5: cardString += "Five"; break;
      case 6: cardString += "Six"; break;
      case 7: cardString += "Seven"; break;
      case 8: cardString += "Eight"; break;
      case 9: cardString += "Nine"; break;
      case 10: cardString += "Ten"; break;
      case 11: cardString += "Jack"; break;
      case 12: cardString += "Queen"; break;
      case 13: cardString += "King"; break;
      case 14: cardString += "Ace"; break;
    }

    switch (suit) {
      case 's': cardString += " of Spades"; break;
      case 'c': cardString += " of Clubs"; break;
      case 'h': cardString += " of Hearts"; break;
      case 'd': cardString += " of Diamonds"; break;
    }
    
    return cardString;
  }

  cardToPNG(): string {
    const number = this.number;
    const suit = this.suit;
    let cardString = "" + number;

    switch (suit) {
      case 's': cardString += "S"; break;
      case 'c': cardString += "C"; break;
      case 'h': cardString += "H"; break;
      case 'd': cardString += "D"; break;
    }
    
    cardString += ".png";
    return cardString;
  }
}

export default Card; 