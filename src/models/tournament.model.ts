import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class Tournament extends Model<
  InferAttributes<Tournament>, InferCreationAttributes<Tournament>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare banner: string;
  declare theme?: string;
  declare status: 'registering' | 'running' | 'completed' | 'cancelled';
  declare startsAt: Date;
  declare entryFee: string;
  declare pool: string;
  declare startingStack: number;
  declare maxPlayers?: number;
  declare lateRegMin: number;      // minutes after start
  declare duration: number;        // hours
  declare repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  declare prizeStructure: any;         // JSON e.g. [{place:1,pct:50},...]
  declare createdBy: number;

  static initModel(sequelize: Sequelize) {
    Tournament.init({
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(128), allowNull: false },
      banner: { type: DataTypes.STRING },
      theme: { type: DataTypes.STRING(64) },
      status: { type: DataTypes.ENUM( 'registering', 'running', 'completed', 'cancelled'), defaultValue: 'registering' },
      startsAt: { type: DataTypes.DATE, allowNull: false },
      entryFee: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
      pool: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: '0.00' },
      startingStack: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      maxPlayers: { type: DataTypes.INTEGER.UNSIGNED },
      lateRegMin: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      duration: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      repeat: { type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly'), allowNull: false, defaultValue: 'none' },
      prizeStructure: { type: DataTypes.JSON },
      createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    }, { sequelize, tableName: 'tournaments' });
  }
}
