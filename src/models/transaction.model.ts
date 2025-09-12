import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class Transaction extends Model<
  InferAttributes<Transaction>, InferCreationAttributes<Transaction>
>{
  declare id:        CreationOptional<number>;
  declare userId:    number;
  declare type:      'deposit' | 'withdrawal' | 'buyin' | 'prize' | 'refund' | 'adjust';
  declare provider:  'stripe' | 'oxapay' | 'system';
  declare amount:    string;
  declare currency:  'USDT' | 'USDC' | 'BTC' | 'ETH';
  declare status:    'pending' | 'confirmed' | 'failed';
  declare ref?:      string;          // tx‑hash or Stripe id
  declare meta?:     any;             // JSON details
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  

  static initModel(sequelize:Sequelize){
    Transaction.init({
      id:{ type:DataTypes.BIGINT.UNSIGNED, autoIncrement:true, primaryKey:true },
      userId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      type:{ type:DataTypes.ENUM('deposit','withdrawal','buyin','prize','refund','adjust'), allowNull:false },
      provider:{ type:DataTypes.ENUM('stripe','oxapay','system'), allowNull:false },
      amount:{ type:DataTypes.DECIMAL(18,2), allowNull:false },
      currency:{ type:DataTypes.ENUM('USDT','USDC','BTC','ETH'), allowNull:false },
      status:{ type:DataTypes.ENUM('pending','confirmed','failed'), defaultValue:'pending' },
      ref:{ type:DataTypes.STRING(255) },
      meta:{ type:DataTypes.JSON },
      createdAt:{ type:DataTypes.DATE, allowNull:false },
      updatedAt:{ type:DataTypes.DATE, allowNull:false },
    },{ sequelize, tableName:'transactions' });
  }
}
