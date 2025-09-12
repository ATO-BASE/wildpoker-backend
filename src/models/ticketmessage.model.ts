// ticketmessage.model.ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class TicketMessage extends Model<
  InferAttributes<TicketMessage>, InferCreationAttributes<TicketMessage>
>{
  declare id:       CreationOptional<number>;
  declare ticketId: number;
  declare senderId: number;
  declare body:     string;

  static initModel(sequelize:Sequelize){
    TicketMessage.init({
      id:{ type:DataTypes.BIGINT.UNSIGNED, autoIncrement:true, primaryKey:true },
      ticketId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      senderId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      body:{ type:DataTypes.TEXT, allowNull:false },
    },{ sequelize, tableName:'ticket_messages' });
  }
}
