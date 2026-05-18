const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: { len: [2, 120] },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("student", "faculty", "admin"),
    defaultValue: "student",
  },
});

// ─── Instance Methods ──────────────────────────────────────────
User.prototype.validatePassword = async function (plain) {
  return bcrypt.compare(plain, this.password_hash);
};

// ─── Hooks ─────────────────────────────────────────────────────
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(12);
  user.password_hash = await bcrypt.hash(user.password_hash, salt);
});

User.beforeUpdate(async (user) => {
  if (user.changed("password_hash")) {
    const salt = await bcrypt.genSalt(12);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

module.exports = User;
