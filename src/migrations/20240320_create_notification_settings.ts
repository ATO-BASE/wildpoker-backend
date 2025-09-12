import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('notification_settings', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    onSiteNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notifyBeforeTournament24h: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notifyBeforeTournament1h: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notifyBeforeTournament15m: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notifyBeforeTournament5m: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('notification_settings');
} 