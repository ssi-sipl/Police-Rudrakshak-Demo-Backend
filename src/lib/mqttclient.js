// mqttClient.js
import mqtt from "mqtt";
import prisma from "./prisma.js";
import { broadcastAlert } from "./websocket.js";

const {
  MQTT_BROKER_URL,
  MQTT_BROKER_PORT,
  MQTT_BROKER_USERNAME,
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_TOPIC,
} = process.env;

const client = mqtt.connect(MQTT_BROKER_URL, {
  port: MQTT_BROKER_PORT,
  username: MQTT_BROKER_USERNAME,
  password: MQTT_BROKER_PASSWORD,
});

client.on("connect", () => {
  console.log("✅ MQTT connected");
  client.subscribe(MQTT_BROKER_TOPIC);
});

client.on("message", async (topic, payload) => {
  try {
    const alertData = JSON.parse(payload.toString());
    console.log("📩 Received MQTT message:", alertData);
    const { type, message, confidence, drone_id } = alertData;

    if (!type || !message || !drone_id || !confidence) {
      console.error("❌ Missing fields in MQTT message");
      return;
    }

    // Check if drone exists
    const drone = await prisma.drone.findUnique({
      where: { drone_id: drone_id },
    });
    if (!drone) {
      return res
        .status(404)
        .json({ status: false, message: "Drone not found" });
    }

    const newAlert = await prisma.alert.create({
      data: {
        type,
        message,
        confidence: parseFloat(confidence),
        drone: {
          connect: { id: drone.id },
        },
      },
    });

    try {
      broadcastAlert(newAlert);
    } catch (err) {
      console.error("❌ Failed to broadcast alert:", err.message);
      return;
    }

    console.log("✅ Alert broadcasted to WebSocket clients");
  } catch (err) {
    console.error("❌ Failed to process MQTT message:", err.message);
  }
});

// client.on("message", async (topic, payload) => {
// try {
//   const alertData = JSON.parse(payload.toString());
//   console.log("📩 Received MQTT message:", alertData);
//   const { type, message, image, confidence } = alertData;

//   if (!type || !message || !image || !confidence) {
//     console.error("❌ Missing fields in MQTT message");
//     return;
//   }

// Handle base64 image saving
// Handle raw base64 image saving
// let savedImagePath = null;
// try {
//   const buffer = Buffer.from(image, "base64"); // no prefix stripping needed

//   const fileName = `${uuidv4()}.jpg`; // change to .png or .webp if needed
//   const uploadDir = path.join(process.cwd(), "public", "uploads");

//   // Ensure the directory exists
//   fs.mkdirSync(uploadDir, { recursive: true });

//   const filePath = path.join(uploadDir, fileName);
//   fs.writeFileSync(filePath, buffer);

//   savedImagePath = `/uploads/${fileName}`;
//   console.log("✅ Image saved successfully:", savedImagePath);
// } catch (err) {
//   console.error("Image save failed:", err);
//   return res.status(500).json({ error: "Failed to save image" });
// }

//     const newAlert = await prisma.alert.create({
//       data: { type, message, image, confidence },
//     });
//     console.log("✅ New alert created:", newAlert);
//     // Broadcast to WebSocket clients
//     broadcastAlert(newAlert);

//     console.log("✅ Alert broadcasted to WebSocket clients");
//   } catch (err) {
//     console.error("❌ Failed to process MQTT message:", err.message);
//   }
// });

// client.on("message", async (topic, message) => {
//   try {
//     // Step 1: Read metadata length
//     let metadataLength;
//     try {
//       metadataLength = message.readUInt32BE(0);
//     } catch (err) {
//       console.error("❌ Failed to read metadata length:", err);
//       return;
//     }

//     // Step 2: Extract and parse metadata
//     let metadata;
//     try {
//       const metadataStart = 4;
//       const metadataEnd = metadataStart + metadataLength;
//       const metadataBuffer = message.slice(metadataStart, metadataEnd);
//       const metadataJson = metadataBuffer.toString("utf-8");
//       metadata = JSON.parse(metadataJson);
//     } catch (err) {
//       console.error("❌ Failed to parse metadata:", err);
//       return;
//     }

//     const { type, message: alertMessage, confidence, filename } = metadata;

//     // Step 3: Extract image buffer
//     let imageBuffer;
//     try {
//       imageBuffer = message.slice(4 + metadataLength);
//     } catch (err) {
//       console.error("❌ Failed to extract image buffer:", err);
//       return;
//     }

//     // Step 4: Create file name and storage path
//     const fileName = filename || `image_${Date.now()}.jpg`;
//     const storagePath = `alerts/${fileName}`;

//     // Step 5: Upload to Supabase
//     let uploadResult;
//     try {
//       uploadResult = await supabase.storage
//         .from("images")
//         .upload(storagePath, imageBuffer, {
//           contentType: "image/jpeg",
//           upsert: true,
//           cacheControl: "3600",
//         });

//       if (uploadResult.error) {
//         console.error(
//           "❌ Upload to Supabase failed:",
//           uploadResult.error.message
//         );
//         return;
//       }
//       console.log("✅ Uploaded to Supabase Storage:", fileName);
//     } catch (err) {
//       console.error("❌ Upload exception:", err);
//       return;
//     }

//     let publicUrl;
//     try {
//       const { data: publicUrlData, error: urlError } = supabase.storage
//         .from("images")
//         .getPublicUrl(storagePath);
//       if (urlError) {
//         console.error("❌ Failed to get public URL:", urlError.message);
//         return;
//       }
//       publicUrl = publicUrlData.publicUrl;
//     } catch (err) {
//       console.error("❌ Public URL generation failed:", err);
//       return;
//     }

//     // let signedUrl;
//     // try {
//     //   const { data: signedUrlData, error: signedUrlError } =
//     //     await supabase.storage
//     //       .from("images")
//     //       .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

//     //   if (signedUrlError) {
//     //     console.error(
//     //       "❌ Failed to generate signed URL:",
//     //       signedUrlError.message
//     //     );
//     //     return;
//     //   }

//     //   signedUrl = signedUrlData.signedUrl;
//     // } catch (err) {
//     //   console.error("❌ Signed URL generation failed:", err);
//     //   return;
//     // }

//     // Step 7: Create alert in DB
//     try {
//       const newAlert = await prisma.alert.create({
//         data: { type, message: alertMessage, image: signedUrl, confidence },
//       });
//       console.log("✅ New alert created:", newAlert);

//       // Step 8: Broadcast to WebSocket clients
//       broadcastAlert(newAlert);
//       console.log("✅ Alert broadcasted to WebSocket clients");
//     } catch (err) {
//       console.error("❌ Failed to store alert or broadcast:", err);
//     }
//   } catch (err) {
//     console.error("❌ Uncaught error in message handler:", err);
//   }
// });

// client.on("message", async (topic, message) => {
//   try {
//     // Step 1: Read metadata length
//     let metadataLength;
//     try {
//       metadataLength = message.readUInt32BE(0);
//       console.log("📏 Metadata length:", metadataLength);
//     } catch (err) {
//       console.error("❌ Failed to read metadata length:", err);
//       return;
//     }

//     // Step 2: Extract and parse metadata
//     let metadata;
//     try {
//       const metadataStart = 4;
//       const metadataEnd = metadataStart + metadataLength;
//       const metadataBuffer = message.slice(metadataStart, metadataEnd);
//       const metadataJson = metadataBuffer.toString("utf-8");
//       metadata = JSON.parse(metadataJson);
//       console.log("📄 Metadata parsed:", metadata);
//     } catch (err) {
//       console.error("❌ Failed to parse metadata:", err);
//       return;
//     }

//     const { type, message: alertMessage, confidence, filename } = metadata;

//     // Step 3: Extract image buffer
//     let imageBuffer;
//     try {
//       imageBuffer = message.slice(4 + metadataLength);
//     } catch (err) {
//       console.error("❌ Failed to extract image buffer:", err);
//       return;
//     }

//     // Step 4: Create file name and storage path
//     const fileName = filename || `image_${Date.now()}.jpg`;
//     const storagePath = `alerts/${fileName}`;

//     // Step 5: Upload to Supabase
//     let uploadResult;
//     try {
//       uploadResult = await supabase.storage
//         .from("images")
//         .upload(storagePath, imageBuffer, {
//           contentType: "image/jpeg",
//           upsert: true,
//           cacheControl: "3600",
//         });

//       if (uploadResult.error) {
//         console.error(
//           "❌ Upload to Supabase failed:",
//           uploadResult.error.message
//         );
//         return;
//       }

//       console.log("✅ Uploaded to Supabase Storage:", fileName);
//     } catch (err) {
//       console.error("❌ Upload exception:", err);
//       return;
//     }

//     // ✅ Step 6: Wait for CDN to update
//     await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 second delay

//     // Step 7: Get public URL after delay
//     let publicUrl;
//     try {
//       const { data: publicUrlData, error: urlError } = supabase.storage
//         .from("images")
//         .getPublicUrl(storagePath);

//       if (urlError) {
//         console.error("❌ Failed to get public URL:", urlError.message);
//         return;
//       }

//       publicUrl = publicUrlData.publicUrl;
//     } catch (err) {
//       console.error("❌ Public URL generation failed:", err);
//       return;
//     }

//     // Step 8: Create alert in DB
//     try {
//       const newAlert = await prisma.alert.create({
//         data: { type, message: alertMessage, image: publicUrl, confidence },
//       });
//       // console.log("✅ New alert created:", newAlert);

//       // Step 9: Broadcast to WebSocket clients
//       broadcastAlert(newAlert);
//       console.log("✅ Alert broadcasted to WebSocket clients");
//     } catch (err) {
//       console.error("❌ Failed to store alert or broadcast:", err);
//     }
//   } catch (err) {
//     console.error("❌ Uncaught error in message handler:", err);
//   }
// });

export { client as mqttClient };
