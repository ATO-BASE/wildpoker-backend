import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable('rooms', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    tournamentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'tournaments',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    roomMembers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    roomPassword: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    roomState: {
      type: DataTypes.ENUM('waiting', 'playing', 'completed', 'cancelled'),
      defaultValue: 'waiting'
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    maxMembers: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 8
    },
    minMembers: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 2
    }
  });

  // Add indexes for better performance
  await queryInterface.addIndex('rooms', ['tournamentId']);
  await queryInterface.addIndex('rooms', ['createdBy']);
  await queryInterface.addIndex('rooms', ['roomState']);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('rooms');
}

