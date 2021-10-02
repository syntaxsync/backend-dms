const AWS = require("aws-sdk");

AWS.config = new AWS.Config({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: "us-east-2",
  signatureVersion: "v4",
});

const s3 = new AWS.S3();

exports.uploadFileToBucket = async (file, path) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: path,
    Body: file,
  };

  const url = await s3.upload(params).promise();
  return url.key;
};

exports.getFileSignedUrl = async (path) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: path,
  };

  const url = await s3.getSignedUrl("getObject", params);
  return url;
};
