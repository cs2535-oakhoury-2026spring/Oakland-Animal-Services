import dotenv from "dotenv";
dotenv.config();

export default {
  port: Number(process.env.PORT) || 3000,
  USE_MOCK_RG_DB: process.env.USE_MOCK_RG_DB === "true",
  aws: {
    region: process.env.AWS_REGION ?? "us-east-1",
    endpoint: process.env.AWS_ENDPOINT ?? "http://localhost:4566",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
  },
  rescueGroups: {
    endpoint: process.env.RESCUE_GROUPS_ENDPOINT ?? "",
    bearer: process.env.RESCUE_GROUPS_BEARER ?? "",
  },
};
