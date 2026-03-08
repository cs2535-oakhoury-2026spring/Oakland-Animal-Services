import dotenv from "dotenv";
dotenv.config();
export default {
    port: Number(process.env.PORT) || 3000,
    rescueGroupsApiKey: process.env.RESCUE_GROUPS_API_KEY || "",
    aws: {
        region: process.env.AWS_REGION ?? "us-east-1",
        endpoint: process.env.AWS_ENDPOINT ?? "http://localhost:4566",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    },
};
