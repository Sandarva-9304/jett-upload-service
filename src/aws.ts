import pkg from "aws-sdk";
const { S3 } = pkg;
import fs from "fs";

const endpoint = process.env.S3_ENDPOINT ?? "";
const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "";
const s3 = new S3({
  endpoint: endpoint,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

export const uploadFile = async (filename: string, localfilepath: string) => {
  const fileContent = fs.readFileSync(localfilepath);
  const response = await s3
    .upload({
      Bucket: "jett",
      Key: filename,
      Body: fileContent,
    })
    .promise();
  //   console.log(response);
};
