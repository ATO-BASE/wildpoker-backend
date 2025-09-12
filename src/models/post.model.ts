import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class Post extends Model<
  InferAttributes<Post>, InferCreationAttributes<Post>
>{
  declare id:         CreationOptional<number>;
  declare authorId:   number;
  declare title:      string;
  declare slug:       string;
  declare excerpt?:   string;
  declare body:       string;
  declare status:     'draft' | 'published';
  declare publishedAt?:Date;
  declare tags?:      string[];     // stored as JSON array

  static initModel(sequelize:Sequelize){
    Post.init({
      id:{ type:DataTypes.INTEGER.UNSIGNED, autoIncrement:true, primaryKey:true },
      authorId:{ type:DataTypes.INTEGER.UNSIGNED, allowNull:false },
      title:{ type:DataTypes.STRING(128), allowNull:false },
      slug:{ type:DataTypes.STRING(128), allowNull:false, unique:true },
      excerpt:{ type:DataTypes.STRING(255) },
      body:{ type:DataTypes.TEXT('long'), allowNull:false },
      status:{ type:DataTypes.ENUM('draft','published'), defaultValue:'draft' },
      publishedAt:{ type:DataTypes.DATE },
      tags:{ type:DataTypes.JSON },
    },{ sequelize, tableName:'posts' });
  }
}
