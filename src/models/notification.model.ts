import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class Notification extends Model<
  InferAttributes<Notification>, InferCreationAttributes<Notification>
>{
  declare id:       CreationOptional<number>;
  declare userId:   number;
  declare type:     'tournament_reminder' | 'tournament_created' | 'system' | 'support_reply';
  declare title:    string;
  declare body:     string;
  declare sendAt:   Date;
  declare isSent:   boolean;
  declare readAt?:  Date;
  declare data?:    string;

  static initModel(sequelize:Sequelize){
    Notification.init({
      id:{ type:DataTypes.BIGINT.UNSIGNED, autoIncrement:true, primaryKey:true },
      userId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      type:{ type:DataTypes.ENUM('tournament_reminder','tournament_created','system','support_reply'), allowNull:false },
      title:{ type:DataTypes.STRING(128), allowNull:false },
      body:{ type:DataTypes.TEXT, allowNull:false },
      sendAt:{ type:DataTypes.DATE, allowNull:false },
      isSent:{ type:DataTypes.BOOLEAN, defaultValue:false },
      readAt:{ type:DataTypes.DATE },
      data:{ type:DataTypes.TEXT },
    },{ sequelize, tableName:'notifications' });
  }
}
