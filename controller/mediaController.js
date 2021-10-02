const catchAsync = require("../util/catchAsync");
const { getFileSignedUrl } = require("../util/uploadFile");

exports.getFileFromBucket = catchAsync(async (req, res, next) => {
  const { folder, file } = req.params;

  const signedUrl = await getFileSignedUrl(`${folder}/${file}`);

  res.send(signedUrl);
});
