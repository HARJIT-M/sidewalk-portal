require("dotenv").config({ path: [require("path").resolve(__dirname, ".env"), require("path").resolve(__dirname, "src/.env")] });

const cloudinary = require("./src/config/cloudinary");

async function testCloudinary() {
  try {
    console.log("================================");
    console.log("Testing Cloudinary upload...");
    console.log("Cloud name exists:", !!process.env.CLOUDINARY_CLOUD_NAME);
    console.log("API key exists:", !!process.env.CLOUDINARY_API_KEY);
    console.log("API secret exists:", !!process.env.CLOUDINARY_API_SECRET);
    console.log("================================");

    const result = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      {
        folder: "smart-footpath/test",
      }
    );

    console.log("================================");
    console.log("✅ CLOUDINARY UPLOAD SUCCESS");
    console.log("URL:", result.secure_url);
    console.log("Public ID:", result.public_id);
    console.log("================================");

  } catch (error) {
    console.log("================================");
    console.log("❌ CLOUDINARY UPLOAD FAILED");
    console.log("Name:", error?.name);
    console.log("Message:", error?.message);
    console.log("HTTP Code:", error?.http_code);
    console.log("Code:", error?.code);

    console.log("--------------------------------");
    console.log("Response headers:");

    if (error?.http_headers) {
      console.log(error.http_headers);
    } else if (error?.response?.headers) {
      console.log(error.response.headers);
    } else {
      console.log("No response headers available");
    }

    console.log("--------------------------------");

    console.log(
      "X-Cld-Error:",
      error?.http_headers?.["x-cld-error"] ||
      error?.http_headers?.["X-Cld-Error"] ||
      error?.response?.headers?.["x-cld-error"] ||
      "Not available"
    );

    console.log("================================");
  }
}

testCloudinary();
