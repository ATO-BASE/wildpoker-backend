import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { config } from '../config/environment';
dotenv.config();

/* 1.  DB connection */
export const sequelize = new Sequelize(
  config.DB_NAME, config.DB_USER, config.DB_PASS, {
  host: config.DB_HOST,
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00', // Store in UTC
  dialectOptions: {
    timezone: 'local' // Convert to local timezone when reading
  }
});

/* 2.  import every model file */
import { User } from './user.model';
import { Transaction } from './transaction.model';
import { Tournament } from './tournament.model';
import { Registration } from './registration.model';
import { BlindLevel } from './blindlevel.model';
import { Hand } from './hand.model';
import { HandAction } from './handaction.model';
import { ChatMessage } from './chatmessage.model';
import { Notification } from './notification.model';
import { NotificationSettings } from './notification.settings.model';
import { Ticket } from './ticket.model';
import { TicketMessage } from './ticketmessage.model';
import { Post } from './post.model';
import { Room } from './room.model';

/* 3.  init() every model */
User.initModel(sequelize);
Transaction.initModel(sequelize);
Tournament.initModel(sequelize);
Registration.initModel(sequelize);
BlindLevel.initModel(sequelize);
Hand.initModel(sequelize);
HandAction.initModel(sequelize);
ChatMessage.initModel(sequelize);
Notification.initModel(sequelize);
NotificationSettings.initModel(sequelize);
Ticket.initModel(sequelize);
TicketMessage.initModel(sequelize);
Post.initModel(sequelize);
Room.initModel(sequelize);

/* 4.  associations */
const associate = () => {
  User.hasMany(Transaction, { foreignKey: 'userId' }); 
  Transaction.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Tournament, { as: 'createdTournaments', foreignKey: 'createdBy' });
  Tournament.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

  Tournament.hasMany(BlindLevel, { foreignKey: 'tournamentId' }); 
  BlindLevel.belongsTo(Tournament, { foreignKey: 'tournamentId' });

  User.hasMany(Registration, { foreignKey: 'userId' }); 
  Registration.belongsTo(User, { foreignKey: 'userId' });

  Tournament.hasMany(Registration, { foreignKey: 'tournamentId' }); 
  Registration.belongsTo(Tournament, { foreignKey: 'tournamentId' });

  Registration.hasMany(HandAction, { foreignKey: 'registrationId' }); 
  HandAction.belongsTo(Registration, { foreignKey: 'registrationId' });

  Tournament.hasMany(Hand, { foreignKey: 'tournamentId' }); Hand.belongsTo(Tournament, { foreignKey: 'tournamentId' });

  Hand.hasMany(HandAction, { foreignKey: 'handId' }); HandAction.belongsTo(Hand, { foreignKey: 'handId' });

  User.hasMany(ChatMessage, { foreignKey: 'userId' }); ChatMessage.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Ticket, { foreignKey: 'userId' }); Ticket.belongsTo(User, { foreignKey: 'userId' });
  Ticket.hasMany(TicketMessage, { foreignKey: 'ticketId' }); TicketMessage.belongsTo(Ticket, { foreignKey: 'ticketId' });
  User.hasMany(TicketMessage, { as: 'sentMessages', foreignKey: 'senderId' });
  TicketMessage.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasOne(NotificationSettings, { foreignKey: 'userId', as: 'notificationSettings' });
  NotificationSettings.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Post, { as: 'posts', foreignKey: 'authorId' }); Post.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
  
  // Room associations
  Tournament.hasMany(Room, { foreignKey: 'tournamentId' });
  Room.belongsTo(Tournament, { foreignKey: 'tournamentId' });
  
  User.hasMany(Room, { as: 'createdRooms', foreignKey: 'createdBy' });
  Room.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
};

associate();

/* 5.  helper to boot DB */
export const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database - create tables if they don't exist
    await sequelize.sync({ alter: true });
    console.log('Database tables synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Export all models
export {
  User,
  Transaction,
  Tournament,
  Room,
  Registration,
  BlindLevel,
  Hand,
  HandAction,
  ChatMessage,
  Notification,
  NotificationSettings,
  Ticket,
  TicketMessage,
  Post
};
