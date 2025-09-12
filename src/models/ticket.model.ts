// ticket.model.ts
import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class Ticket extends Model<
  InferAttributes<Ticket>, InferCreationAttributes<Ticket>
>{
  declare id:       CreationOptional<number>;
  declare userId:   number;
  declare subject:  string;
  declare status:   'open' | 'awaiting_user' | 'closed';
  declare priority: 'low' | 'normal' | 'high';

  static initModel(sequelize:Sequelize){
    Ticket.init({
      id:{ type:DataTypes.INTEGER.UNSIGNED, autoIncrement:true, primaryKey:true },
      userId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      subject:{ type:DataTypes.STRING(128), allowNull:false },
      status:{ type:DataTypes.ENUM('open','awaiting_user','closed'), defaultValue:'open' },
      priority:{ type:DataTypes.ENUM('low','normal','high'), defaultValue:'normal' },
    },{ sequelize, tableName:'tickets' });
  }
}
