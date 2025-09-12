import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class ChatMessage extends Model<
  InferAttributes<ChatMessage>, InferCreationAttributes<ChatMessage>
>{
  declare id:           CreationOptional<number>;
  declare tournamentId: number;
  declare tableId:      number;
  declare userId:       number;
  declare body:         string;

  static initModel(sequelize:Sequelize){
    ChatMessage.init({
      id:{ type:DataTypes.BIGINT.UNSIGNED, autoIncrement:true, primaryKey:true },
      tournamentId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      tableId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      userId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      body:{ type:DataTypes.STRING(512), allowNull:false },
    },{ sequelize, tableName:'chat_messages' });
  }
}
