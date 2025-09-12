// handaction.model.ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class HandAction extends Model<
  InferAttributes<HandAction>, InferCreationAttributes<HandAction>
>{
  declare id:      CreationOptional<number>;
  declare handId:  number;
  declare registrationId: number;
  declare street:  'preflop' | 'flop' | 'turn' | 'river';
  declare action:  'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
  declare amount?: string;
  declare order:   number;

  static initModel(sequelize:Sequelize){
    HandAction.init({
      id:{ type:DataTypes.BIGINT.UNSIGNED, autoIncrement:true, primaryKey:true },
      handId:{ type:DataTypes.BIGINT.UNSIGNED, allowNull:false },
      registrationId:{ type:DataTypes.BIGINT.UNSIGNED, allowNull:false },
      street:{ type:DataTypes.ENUM('preflop','flop','turn','river'), allowNull:false },
      action:{ type:DataTypes.ENUM('fold','check','call','bet','raise','allin'), allowNull:false },
      amount:{ type:DataTypes.DECIMAL(18,2) },
      order:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
    },{ sequelize, tableName:'hand_actions', timestamps:false });
  }
}
