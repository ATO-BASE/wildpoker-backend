import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize, Association
} from 'sequelize';

export class Room extends Model<
  InferAttributes<Room>, InferCreationAttributes<Room>
> {
  declare id: CreationOptional<number>;
  declare tournamentId: number;
  declare roomMembers: number[]; // Array of user IDs
  declare roomPassword: string;
  declare roomState: 'waiting' | 'playing' | 'completed' | 'cancelled';
  declare createdDate: CreationOptional<Date>;
  declare createdBy: number;
  declare maxMembers: number;
  declare minMembers: number;

  // Association declarations
  declare creator?: any; // Will be properly typed when associations are set up
  declare Tournament?: any;

  declare static associations: {
    creator: Association<Room, any>;
    Tournament: Association<Room, any>;
  };

  static initModel(sequelize: Sequelize) {
    Room.init({
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      tournamentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      roomMembers: { 
        type: DataTypes.JSON, 
        allowNull: false, 
        defaultValue: [],
        validate: {
          isValidMemberCount(value: number[]) {
            if (value.length > 8) {
              throw new Error('Room cannot have more than 8 members');
            }
            // Allow empty rooms for initial creation
          }
        }
      },
      roomPassword: { type: DataTypes.STRING(128), allowNull: false },
      roomState: { 
        type: DataTypes.ENUM('waiting', 'playing', 'completed', 'cancelled'), 
        defaultValue: 'waiting' 
      },
      createdDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      maxMembers: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 8 },
      minMembers: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 2 }
    }, { 
      sequelize, 
      tableName: 'rooms',
      timestamps: true,
      createdAt: 'createdDate',
      updatedAt: false
    });
  }
}
