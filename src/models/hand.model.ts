// hand.model.ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class Hand extends Model<
  InferAttributes<Hand>, InferCreationAttributes<Hand>
>{
  declare id:           CreationOptional<number>;
  declare tournamentId: number;
  declare tableId:      number;
  declare handNo:       number;
  declare seed:         string;
  declare board:        any;         // JSON with flop/turn/river
  declare pot:          string;

  static initModel(sequelize:Sequelize){
    Hand.init({
      id:{ type:DataTypes.BIGINT.UNSIGNED, autoIncrement:true, primaryKey:true },
      tournamentId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      tableId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      handNo:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      seed:{ type:DataTypes.STRING(128), allowNull:false },
      board:{ type:DataTypes.JSON },
      pot:{ type:DataTypes.DECIMAL(18,2) },
    },{ sequelize, tableName:'hands' });
  }
}
