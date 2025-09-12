import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, NonAttribute, Sequelize,
  INTEGER
} from 'sequelize';
import bcrypt from 'bcryptjs';

export class User extends Model<
  InferAttributes<User, {omit:'password'}>,
  InferCreationAttributes<User, {omit:'password'}> & { password: string }
> {
  declare id:            CreationOptional<number>;
  declare username:      string;
  declare firstName:     string;
  declare country:       string;
  declare email:         string;
  declare passwordHash:  string;          // ← persisted
  declare avatar?:       string;
  declare role:          'player' | 'admin' | 'staff';
  declare balance:       CreationOptional<string>;
  declare points:        CreationOptional<number>;
  declare status:        'active' | 'banned' | 'suspended';
  declare isEmailVerified:CreationOptional<boolean>;
  declare verifiedCode?: string;
  
  // Room and Tournament tracking
  declare currentRoomId?: CreationOptional<number>;
  declare currentTournamentId?: CreationOptional<number>;
  declare roomState:     'waiting' | 'playing' | 'completed' | 'left' | null;
  declare tournamentState: 'registered' | 'in_lobby' | 'playing' | 'completed' | 'left' | null;
  
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /* helpers (not columns) */
  declare password?:     NonAttribute<string>;   // ← transient
  checkPassword(pw:string){ return bcrypt.compare(pw,this.passwordHash); }

  static initModel(sequelize:Sequelize){
    User.init({
      id:       { type:DataTypes.INTEGER.UNSIGNED, autoIncrement:true, primaryKey:true },
      username: { type:DataTypes.STRING(32), allowNull:false, unique:true},
      firstName:{ type:DataTypes.STRING(32), allowNull:false },
      country:  { type:DataTypes.STRING(64), allowNull:false },
      email:    { type:DataTypes.STRING(128), allowNull:false, unique:true },
      passwordHash:{ type:DataTypes.STRING(60), allowNull:false },
      avatar:   { type:DataTypes.STRING },
      role:     { type:DataTypes.ENUM('player','admin','staff'), defaultValue:'player' },
      balance:  { type:DataTypes.DECIMAL(18,2), defaultValue:'0.00' },
      points:   { type:DataTypes.INTEGER.UNSIGNED, defaultValue:0 },
      status:   { type:DataTypes.ENUM('active','banned','suspended'), defaultValue:'active' },
      isEmailVerified:{ type:DataTypes.BOOLEAN, defaultValue:false },
      verifiedCode: {type:DataTypes.STRING(32), allowNull:true},
      
      // Room and Tournament tracking
      currentRoomId: { type:DataTypes.INTEGER.UNSIGNED, allowNull:true, references: { model:'rooms', key:'id' } },
      currentTournamentId: { type:DataTypes.INTEGER.UNSIGNED, allowNull:true, references: { model:'tournaments', key:'id' } },
      roomState: { type:DataTypes.ENUM('waiting','playing','completed','left'), allowNull:true, defaultValue:null },
      tournamentState: { type:DataTypes.ENUM('registered','in_lobby','playing','completed','left'), allowNull:true, defaultValue:null },
    },{
      sequelize, tableName:'users', hooks:{
        beforeCreate: async (u:any)=>{
          if(u.password){ u.passwordHash = await bcrypt.hash(u.password,12); }
        }
      }
    });
  }
}
