// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");

// const Game = sequelize.define("Game", {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   title: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   subtitle: {
//     type: DataTypes.STRING,
//   },
//   location: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   playDate: {
//     type: DataTypes.DATE, // O'yin bo'ladigan sana va vaqt
//     allowNull: false,
//   },
//   startTime: {
//     type: DataTypes.STRING, // "23:00"
//     allowNull: false,
//   },
//   endTime: {
//     type: DataTypes.STRING, // "00:30"
//     allowNull: false,
//   },
//   price: {
//     type: DataTypes.FLOAT,
//     allowNull: false,
//   },
//   totalPlayers: {
//     type: DataTypes.INTEGER,
//     defaultValue: 14,
//   },
//   playersJoined: {
//     type: DataTypes.INTEGER,
//     defaultValue: 0,
//   },
//   isOutdoor: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: true,
//   },
//   hasLockers: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: true,
//   },
//   hasShowers: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: true,
//   },
//   type: {
//     type: DataTypes.STRING, // "7v7", "5v5"
//     defaultValue: "7v7",
//   },
//   advance: {
//     type: DataTypes.INTEGER,
//     defaultValue: 0,
//   },
//   imageUrl: {
//     type: DataTypes.TEXT,
//   },
//   rules: {
//     type: DataTypes.ARRAY(DataTypes.STRING), // PostgreSQL array
//     defaultValue: [],
//   },

//   // yangi qoshilganlar
//   scoreTeamA: {
//     type: DataTypes.INTEGER,
//     defaultValue: 0, // O'yin boshlanmagan bo'lsa 0
//   },
//   scoreTeamB: {
//     type: DataTypes.INTEGER,
//     defaultValue: 0,
//   },
//   isFinished: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false, // O'yin tugaganini bildiradi
//   },
//   mvpPlayer: {
//     type: DataTypes.STRING, // MVP o'yinchi ismi
//     allowNull: true,
//   },
// });

// module.exports = Game;










module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define("Game", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    subtitle: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING, allowNull: false },
    playDate: { type: DataTypes.DATE, allowNull: false },
    startTime: { type: DataTypes.STRING, allowNull: false },
    endTime: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    totalPlayers: { type: DataTypes.INTEGER, defaultValue: 14 },
    playersJoined: { type: DataTypes.INTEGER, defaultValue: 0 },
    isOutdoor: { type: DataTypes.BOOLEAN, defaultValue: true },
    hasLockers: { type: DataTypes.BOOLEAN, defaultValue: true },
    hasShowers: { type: DataTypes.BOOLEAN, defaultValue: true },
    type: { type: DataTypes.STRING, defaultValue: "7v7" },
    advance: { type: DataTypes.INTEGER, defaultValue: 0 },
    imageUrl: { type: DataTypes.TEXT },
    rules: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    scoreTeamA: { type: DataTypes.INTEGER, defaultValue: 0 },
    scoreTeamB: { type: DataTypes.INTEGER, defaultValue: 0 },
    isFinished: { type: DataTypes.BOOLEAN, defaultValue: false },
    mvpPlayer: { type: DataTypes.STRING, allowNull: true },
  });
  return Game;
};