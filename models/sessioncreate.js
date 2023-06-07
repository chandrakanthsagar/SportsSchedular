'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sessioncreate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  sessioncreate.init({
    starttime: DataTypes.DATE,
    venue: DataTypes.STRING,
    participants: DataTypes.ARRAY(DataTypes.STRING),
    requiredplayers: DataTypes.INTEGER,
    sportid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'sessioncreate',
  });
  return sessioncreate;
};