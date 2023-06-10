'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Session.belongsTo(models.Admin,{
        foreignKey: 'adminId'
      })
      Session.belongsTo(models.Player,{
      foreignKey: 'playerId'
        })
      Session.belongsTo(models.Sport,{
       foreignKey: 'sportId'
         })
      
    }
  }
  Session.init({
    date: DataTypes.DATE,
    venue: DataTypes.STRING,
    participants: DataTypes.INTEGER,
    isCreated: DataTypes.BOOLEAN,
    message: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};