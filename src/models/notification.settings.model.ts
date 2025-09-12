import {
  Model, DataTypes, InferAttributes, InferCreationAttributes,
  CreationOptional, Sequelize
} from 'sequelize';

export class NotificationSettings extends Model<
  InferAttributes<NotificationSettings>,
  InferCreationAttributes<NotificationSettings>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare emailNotifications: boolean;
  declare onSiteNotifications: boolean;
  declare notifyBeforeTournament24h: boolean;
  declare notifyBeforeTournament1h: boolean;
  declare notifyBeforeTournament15m: boolean;
  declare notifyBeforeTournament5m: boolean;

  static initModel(sequelize: Sequelize) {
    NotificationSettings.init({
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
      emailNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      onSiteNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
      notifyBeforeTournament24h: { type: DataTypes.BOOLEAN, defaultValue: true },
      notifyBeforeTournament1h: { type: DataTypes.BOOLEAN, defaultValue: true },
      notifyBeforeTournament15m: { type: DataTypes.BOOLEAN, defaultValue: true },
      notifyBeforeTournament5m: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
      sequelize,
      tableName: 'notification_settings'
    });
  }
} 