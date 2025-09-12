import { Server, Socket } from 'socket.io';
import { Card } from './card';
import { Player } from './player';
import { PlayerHand } from './playerHand';
import { DeckOfCards } from './DeckOfCards';
import { PokerGame } from './pokerGame';
import { PokerHand } from './pokerHand';
import { HandEvaluator } from './handEvaluator';

// List of all poker rooms
const listOfPokerRooms: PokerGame[] = [];

export function registerPokerGameHandlers(io: Server) {
  io.on('connection', (sock: Socket) => {

    sock.on('joinAttempt', ({ username, stacksize, lobbyname, password }: { username: string; stacksize: number; lobbyname: string; password: string }) => {
      let gameFound = false;
      for (let i = 0; i < listOfPokerRooms.length; i++) {
        if (listOfPokerRooms[i].getGameID() == lobbyname) {
          gameFound = true;
          if (listOfPokerRooms[i].checkIfNameIsInGame(username)) {
            io.to(sock.id).emit('badJoin', "Someone already is using this name");
          } else if (listOfPokerRooms[i].getPassword() != password) {
            io.to(sock.id).emit('badJoin', "Incorrect password for the lobby: " + lobbyname);
          } else if (stacksize <= 0) {
            io.to(sock.id).emit('badJoin', "Stack is less than 0, please try again");
          } else {
            io.to(sock.id).emit('goodJoin');
          }
        }
      }
      if (!gameFound) {
        io.to(sock.id).emit('badJoin', "Lobby with name: " + lobbyname + " not found. :(");
      }
    });

    sock.on('createAttempt', ({ username, stacksize, lobbyname, smallBlind, bigBlind, password }: { username: string; stacksize: number; lobbyname: string; smallBlind: number; bigBlind: number; password: string }) => {
      let gameCreated = false;
      for (let i = 0; i < listOfPokerRooms.length; i++) {
        if (listOfPokerRooms[i].getGameID() == lobbyname) {
          gameCreated = true;
        }
      }

      if (gameCreated == true) {
        io.to(sock.id).emit('badCreate', "The lobby: " + lobbyname + " has already been created");
      } else if (stacksize <= 0) {
        io.to(sock.id).emit('badCreate', "Invalid Default stack size, please try again");
      } else if (smallBlind > bigBlind) {
        io.to(sock.id).emit('badCreate', "Invalid small/big blind set up");
      } else {
        io.to(sock.id).emit('goodCreate');
      }
    });

    sock.on('createRoom', ({ username, stacksize, lobbyname, smallBlind, bigBlind, password }: { username: string; stacksize: number; lobbyname: string; smallBlind: number; bigBlind: number; password: string }) => {
      const theGame = new PokerGame(lobbyname);
      theGame.setSmallBlind(Number(smallBlind));
      theGame.setBigBlind(Number(bigBlind));
      theGame.setPassword(password);
      theGame.setDefaultStackSize(Number(stacksize));
      listOfPokerRooms.push(theGame);
    });

    sock.on('joinRoom', (arrLobbynameUserNameStackSize: string[]) => {
      // Find lobby for user
      const lobbyname = arrLobbynameUserNameStackSize[0];
      const username = arrLobbynameUserNameStackSize[1];
      const stacksize = Number(arrLobbynameUserNameStackSize[2]);

      let theGame: PokerGame | null = null;
      for (let i = 0; i < listOfPokerRooms.length; i++) {
        if (listOfPokerRooms[i].getGameID() == lobbyname) {
          theGame = listOfPokerRooms[i];
        }
      }
      
      const user = new Player(username, stacksize, sock.id, lobbyname);


      // Check if the game has already started, if so they can't click button
      if (theGame && theGame.getBegun()) {
        sock.emit('gameBegun');
      }

      // Actually join the room
      sock.join(user.getRoom());

      if (theGame) {
        theGame.playerJoin(user);

        // Send users client the room name and info so it can display
        io.to(user.getRoom()).emit('roomUsers', { room: user.getRoom(), users: theGame.getAllNames(), stacksizes: theGame.getAllStackSizes() });
        io.to(theGame.getGameID()).emit('roomPlayers', theGame.emitPlayers());
        io.to(user.getRoom()).emit('message', theGame.getCurrentUser(sock.id)?.getName() + " is now spectating...");
      }
    });

    sock.on('disconnect', () => {
      // Going through array of games to see if the sock was in any of them
      const theGame = getGameFromSockID(sock.id);
      if (theGame != null) {
        const user = theGame.getCurrentUser(sock.id);
        if (user != null) {
          io.to(theGame.getGameID()).emit("message", theGame.getCurrentUser(sock.id)?.getName() + " has left the channel");
          theGame.playerLeave(sock.id);
          io.to(theGame.getGameID()).emit('roomPlayers', theGame.emitPlayers());
          io.to(theGame.getGameID()).emit('roomUsers', { room: theGame.getGameID(), users: theGame.getAllNames(), stacksizes: theGame.getAllStackSizes() });
        }
      }
    });

    sock.on('startGame', () => {
      const theGame = getGameFromSockID(sock.id);
      if (theGame != null) {
        theGame.setBegun(true);
        io.to(theGame.getGameID()).emit('gameBegun');
      }
    });

    sock.on('playerTurn', (action: string) => {
      const theGame = getGameFromSockID(sock.id);
      if (theGame != null) {
        const user = theGame.getCurrentUser(sock.id);
        if (user != null) {
          // Handle player action
          
          // Emit to all players in the room
          io.to(theGame.getGameID()).emit('message', user.getName() + " " + action);
          
          // Emit valid option to stop timer
          sock.emit('validOption');
        }
      }
    });

    sock.on('chatMessage', (message: string) => {
      const theGame = getGameFromSockID(sock.id);
      if (theGame != null) {
        const user = theGame.getCurrentUser(sock.id);
        if (user != null) {
          io.to(theGame.getGameID()).emit('message', user.getName() + ": " + message);
        }
      }
    });
  });
}

function getGameFromSockID(id: string): PokerGame | null {
  for (let i = 0; i < listOfPokerRooms.length; i++) {
    if (listOfPokerRooms[i].checkIfSockIDisInGame(id)) {
      return listOfPokerRooms[i];
    }
  }
  return null;
} 