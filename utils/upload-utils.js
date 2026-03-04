const fs = require("fs");
const path = require("path");

const UPLOADS_ROUTE_PREFIX = "/uploads/";

const isRemoteUrl = (value = "") => /^https?:\/\//i.test(value);

const toUploadRoute = (filename) => `${UPLOADS_ROUTE_PREFIX}${filename}`;

const normalizeImageList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => `${item || ""}`.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeImageList(parsed);
    } catch (error) {
      return [trimmed];
    }
  }

  return [];
};

const getUploadFilePath = (imagePath) => {
  if (
    typeof imagePath !== "string" ||
    !imagePath.startsWith(UPLOADS_ROUTE_PREFIX)
  ) {
    return null;
  }

  const relativePath = imagePath.replace(UPLOADS_ROUTE_PREFIX, "");
  if (!relativePath) return null;

  return path.join(__dirname, "..", "uploads", relativePath);
};

const deleteLocalUpload = (imagePath) => {
  const filePath = getUploadFilePath(imagePath);
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
};

module.exports = {
  deleteLocalUpload,
  getUploadFilePath,
  isRemoteUrl,
  normalizeImageList,
  toUploadRoute,
  UPLOADS_ROUTE_PREFIX,
};
