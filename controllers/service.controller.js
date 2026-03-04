const { Service } = require("../models");

exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await Service.destroy({ where: { id: req.params.id } });
    res.json({ message: "O'chirildi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
