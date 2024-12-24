const fileFullPath = (filePath) => {
    if (!fielPath || filePath === null) return "";
    if (filePath.startsWith("http")) return filePath;
    // return " http://192.168.18.27:3002/" + imgPath;
    // return "http://192.168.18.27:3000/" + imgPath;
    return process.env.SERVER_URL + filePath;
  };
  module.exports = fileFullPath;
  