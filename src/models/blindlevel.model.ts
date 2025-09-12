import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class BlindLevel extends Model<
  InferAttributes<BlindLevel>, InferCreationAttributes<BlindLevel>
>{
  declare id:       CreationOptional<number>;
  declare tournamentId: number;
  declare levelNo:  number;
  declare small:    number;
  declare big:      number;
  declare ante:     number;
  declare duration: number;  // seconds

  static initModel(sequelize:Sequelize){
    BlindLevel.init({
      id:{ type:DataTypes.INTEGER.UNSIGNED, autoIncrement:true, primaryKey:true },
      tournamentId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      levelNo:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      small:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      big:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      ante:{ type:DataTypes.INTEGER.UNSIGNED, defaultValue:0 },
      duration:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
    },{ sequelize, tableName:'blind_levels' });
  }
}
