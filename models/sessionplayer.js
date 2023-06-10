'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sessionplayer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sessionplayer.belongsTo(models.Admin,{
        foreignKey: 'adminId'
      })
        Sessionplayer.belongsTo(models.Player,{
          foreignKey: 'playerId'
              })
        Sessionplayer.belongsTo(models.Sport,{
          foreignKey: 'sportId'
              })
            }
          }
  Sessionplayer.init({
    playername: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Sessionplayer',
  });
  return Sessionplayer;
};