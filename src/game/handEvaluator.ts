import { Card, CardNumber } from './card';
import { PlayerHand } from './playerHand';

// Used for the numeric value of hands
const tenNegTwo = 0.01;
const tenNegFour = 0.0001;
const tenNegSix = 0.000001;
const tenNegEight = 0.00000001;
const tenNegTen = 0.0000000001;

export class HandEvaluator {
  private cardsOnBoard: Card[];

  constructor(communityCards: Card[]) {
    this.cardsOnBoard = communityCards;
  }

  // Helper function to the main function of the class. Returns a number with the ones place being the type of hand
  // (straight flush == 8, Quads == 7, Full House == 6, etc) and the tenths - ten thousandths place being the necessary part comparable if both players have the same type of 
  // hand (Player A and Player B both have Quad A's but Player A has King high and Player B has 10 high) (for Example: 07.1413 vs 07.1410).
  evaluateHandNumberValue(hand1: PlayerHand): number | null {
    // 8 - Straight Flush
    if (this.returnStraightFlushNumber(hand1) != null) {
      return this.returnStraightFlushNumber(hand1);
    }
    // 7 - Quads
    if (this.returnQuadsNumber(hand1) != null) {
      return this.returnQuadsNumber(hand1);
    }
    // 6 - Full House
    if (this.returnFullHouseNumber(hand1) != null) {
      return this.returnFullHouseNumber(hand1);
    }
    // 5 - Flush
    if (this.returnFlushNumber(hand1) != null) {
      return this.returnFlushNumber(hand1);
    }
    // 4 - Straight
    if (this.returnStraightNumber(hand1) != null) {
      return this.returnStraightNumber(hand1);
    }
    // 3 - Trips
    if (this.returnTripsNumber(hand1) != null) {
      return this.returnTripsNumber(hand1);
    }
    // 2 - Two Pair
    if (this.returnTwoPairNumber(hand1) != null) {
      return this.returnTwoPairNumber(hand1);
    }
    // 1 - Pair
    if (this.returnPairNumber(hand1) != null) {
      return this.returnPairNumber(hand1);
    }
    // 0 - High Card
    if (this.returnHighCardNumber(hand1) != null) {
      return this.returnHighCardNumber(hand1);
    }
    return null;
  }

  // Main function of the class: Returns the better hand when two poker hands are entered into parameters of the method.
  // Returns the better hand between the two
  returnBestHand(hand1: PlayerHand, hand2: PlayerHand): PlayerHand | null {
    const hand1number = this.evaluateHandNumberValue(hand1);
    const hand2number = this.evaluateHandNumberValue(hand2);
    
    if (hand1number && hand2number) {
      if (hand1number > hand2number) {
        return hand1;
      } else if (hand2number > hand1number) {
        return hand2;
      }
    }
    // Both hands the same
    return null;
  }

  // String function of class: returns the best 5 card hand of what you have (ex. One pair: 10's, Ace King Jack) (ex. Two Pair Queens and Fours)
  evaluateHandForString(hand1: PlayerHand): string {
    // If preflop (no cards on the board)
    if (this.cardsOnBoard.length == 0) {
      if (hand1.getHoleCard1().getNumber() > hand1.getHoleCard2().getNumber()) {
        return "High Card: " + hand1.getHoleCard1().cardToString() + ", " + hand1.getHoleCard2().cardToString();
      } else if (hand1.getHoleCard1().getNumber() < hand1.getHoleCard2().getNumber()) {
        return "High Card: " + hand1.getHoleCard2().cardToString() + ", " + hand1.getHoleCard1().cardToString();
      } else {
        return "Pair of: " + Card.numberToString(hand1.getHoleCard1().getNumber()) + "'s";
      }
    } else {
      const handNum = this.evaluateHandNumberValue(hand1);
      if (!handNum) return "Invalid hand";

      // If Straight Flush
      if (handNum > 8) {
        const topOfStraight = Math.floor((handNum - Math.floor(handNum)) * 100);
        return "Straight Flush: " + Card.numberToString(topOfStraight as CardNumber) + " to " + Card.numberToString((topOfStraight - 4) as CardNumber);
      }
      // If Quads
      else if (handNum > 7) {
        const QuadsNum = Math.floor((handNum - Math.floor(handNum)) * 100);
        const highCard = Math.floor((handNum * 100 - Math.floor(handNum * 100)) * 100);
        return "Four of a Kind: " + Card.numberToString(QuadsNum as CardNumber) + "'s, " + Card.numberToString(highCard as CardNumber) + " high";
      }
      // If Full House
      else if (handNum > 6) {
        const tripsNum = Math.floor((handNum - Math.floor(handNum)) * 100);
        const pairNum = Math.floor((handNum * 100 - Math.floor(handNum * 100)) * 100);
        return "Full House: " + Card.numberToString(tripsNum as CardNumber) + "'s full of " + Card.numberToString(pairNum as CardNumber) + "'s";
      }
      // If Flush
      else if (handNum > 5) {
        const highestFlushCard = Math.floor((handNum - Math.floor(handNum)) * 100);
        const secondFlushCard = Math.floor((handNum * 100 - Math.floor(handNum * 100)) * 100);
        const thirdFlushCard = Math.floor((handNum * 10000 - Math.floor(handNum * 10000)) * 100);
        const fourthFlushCard = Math.floor((handNum * 1000000 - Math.floor(handNum * 1000000)) * 100);
        const fifthFlushCard = Math.floor((handNum * 100000000 - Math.floor(handNum * 100000000)) * 100);

        return "Flush: " + Card.numberToString(highestFlushCard as CardNumber) + ", " + Card.numberToString(secondFlushCard as CardNumber) + ", " + Card.numberToString(thirdFlushCard as CardNumber) + ", " + Card.numberToString(fourthFlushCard as CardNumber) + ", " + Card.numberToString(fifthFlushCard as CardNumber);
      }
      // If Straight
      else if (handNum > 4) {
        const straightCard = Math.floor((handNum - Math.floor(handNum)) * 100);
        return "Straight: " + Card.numberToString(straightCard as CardNumber) + " to " + Card.numberToString((straightCard - 4) as CardNumber);
      }
      // If Trips
      else if (handNum > 3) {
        const tripsNum = Math.floor((handNum - Math.floor(handNum)) * 100);
        const highCard = Math.floor((handNum * 100 - Math.floor(handNum * 100)) * 100);
        const secondHighCard = Math.floor((handNum * 10000 - Math.floor(handNum * 10000)) * 100);

        return "Three of a Kind: " + Card.numberToString(tripsNum as CardNumber) + "'s, " + Card.numberToString(highCard as CardNumber) + ", " + Card.numberToString(secondHighCard as CardNumber) + " high";
      }
      // If TwoPair
      else if (handNum > 2) {
        const highPair = Math.floor((handNum - Math.floor(handNum)) * 100);
        const lowPair = Math.floor((handNum * 100 - Math.floor(handNum * 100)) * 100);
        const highCard = Math.floor((handNum * 10000 - Math.floor(handNum * 10000)) * 100);

        return "Two Pair: " + Card.numberToString(highPair as CardNumber) + "'s & " + Card.numberToString(lowPair as CardNumber) + "'s, " + Card.numberToString(highCard as CardNumber) + " high";
      }
      // If Pair
      else if (handNum > 1) {
        const pair = Math.floor((handNum - Math.floor(handNum)) * 100);
        const highCard = Math.floor((handNum * 100 - Math.floor(handNum * 100)) * 100);
        const secondHighCard = Math.floor((handNum * 10000 - Math.floor(handNum * 10000)) * 100);
        const thirdHighCard = Math.floor((handNum * 1000000 - Math.floor(handNum * 1000000)) * 100);

        return "Pair of: " + Card.numberToString(pair as CardNumber) + "'s, " + Card.numberToString(highCard as CardNumber) + ", " + Card.numberToString(secondHighCard as CardNumber) + ", " + Card.numberToString(thirdHighCard as CardNumber) + " high";
      }
      // If High Card
      else {
        const highCard = Math.floor((handNum - Math.floor(handNum)) * 100);
        const secondHighCard = Math.floor((handNum * 100 - Math.floor(handNum * 100)) * 100);
        const thirdHighCard = Math.floor((handNum * 10000 - Math.floor(handNum * 10000)) * 100);
        const fourthHighCard = Math.floor((handNum * 1000000 - Math.floor(handNum * 1000000)) * 100);
        const fifthHighCard = Math.floor((handNum * 100000000 - Math.floor(handNum * 100000000)) * 100);

        return "High Card: " + Card.numberToString(highCard as CardNumber) + ", " + Card.numberToString(secondHighCard as CardNumber) + ", " + Card.numberToString(thirdHighCard as CardNumber) + ", " + Card.numberToString(fourthHighCard as CardNumber) + ", " + Card.numberToString(fifthHighCard as CardNumber);
      }
    }
  }

  // Placeholder methods for the hand evaluation functions
  returnHighCardNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnPairNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnTwoPairNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnTripsNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnStraightNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnFlushNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnFullHouseNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnQuadsNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  returnStraightFlushNumber(hand1: PlayerHand): number | null {
    // Implementation would go here
    return null;
  }

  currentNumCardsOnBoard(): number {
    return this.cardsOnBoard.length;
  }

  cardNumberIsOnTheBoard(cardNumber: CardNumber): boolean {
    for (let i = 0; i < this.cardsOnBoard.length; i++) {
      if (this.cardsOnBoard[i].getNumber() == cardNumber) {
        return true;
      }
    }
    return false;
  }

  updateBoard(newBoard: Card[]): void {
    this.cardsOnBoard = newBoard;
  }

  getCurrentBoard(): Card[] {
    return this.cardsOnBoard;
  }

  insertionSort(arr: CardNumber[]): CardNumber[] {
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        j = j - 1;
      }
      arr[j + 1] = key;
    }
    return arr;
  }

  returnArrayOfSortedBoardAndHandCards(hand1: PlayerHand): CardNumber[] {
    const allCards: CardNumber[] = [];
    
    // Add board cards
    for (let i = 0; i < this.cardsOnBoard.length; i++) {
      allCards.push(this.cardsOnBoard[i].getNumber());
    }
    
    // Add hand cards
    allCards.push(hand1.getHoleCard1().getNumber());
    allCards.push(hand1.getHoleCard2().getNumber());
    
    return this.insertionSort(allCards);
  }
}

export default HandEvaluator; 