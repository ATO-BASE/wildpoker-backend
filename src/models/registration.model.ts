import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class Registration extends Model<
  InferAttributes<Registration>, InferCreationAttributes<Registration>
>{
  declare id:           CreationOptional<number>;
  declare userId:       number;
  declare tournamentId: number;
  declare tableNo?:     number;       // current table
  declare seatNo?:      number;       // 0‑7
  declare stack:        string;       // chip count
  declare status:       'registered' | 'in_lobby' | 'playing' | 'busted' | 'paid';
  declare finishingPos?:number;
  declare prize?:       string;
  declare pointsAwarded?:number;

  static initModel(sequelize:Sequelize){
    Registration.init({
      id:{ type:DataTypes.BIGINT.UNSIGNED, autoIncrement:true, primaryKey:true },
      userId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      tournamentId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      tableNo:{ type:DataTypes.INTEGER.UNSIGNED },
      seatNo:{ type:DataTypes.TINYINT.UNSIGNED },
      stack:{ type:DataTypes.DECIMAL(18,2), allowNull:false, defaultValue:'0' },
      status:{ type:DataTypes.ENUM('registered','in_lobby','playing','busted','paid'), defaultValue:'registered' },
      finishingPos:{ type:DataTypes.INTEGER.UNSIGNED },
      prize:{ type:DataTypes.DECIMAL(18,2) },
      pointsAwarded:{ type:DataTypes.INTEGER.UNSIGNED },
    },{ sequelize, tableName:'registrations' });
  }
}
