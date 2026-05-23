const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./User");

const Project = sequelize.define("Project", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { len: [3, 200] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  readme: {
  type: DataTypes.TEXT('long'),
  allowNull: true,
  },
  requirements: {
    type: DataTypes.JSON,       // { software:{}, hardware:[], networking:[] }
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON,       // array of saved image filenames
    allowNull: true,
    defaultValue: [],
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  file_size: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
});

Project.belongsTo(User, { foreignKey: "user_id", as: "uploader" });
User.hasMany(Project, { foreignKey: "user_id", as: "projects" });

module.exports = Project;
