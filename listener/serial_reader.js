import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import dotenv from 'dotenv'

dotenv.config();

const ARDUINO_PORT = process.env.ARDUINO_PORT || "COM3";
const BAUD_RATE = 115200;

// Initialize serial port + parser ONCE
const port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

port.on("open", () => {
  console.log(`✅ Arduino connected on ${ARDUINO_PORT}`);
});

port.on("error", (err) => {
  console.error("❌ Arduino connection error:", err.message);
});

export default async function startSerialReader(onData) {
  console.log("📡 Starting serial reader loop...");

  try {
    for await (const raw of parser) {
      const data = raw.toString().trim();
      if (!data) continue;

      if (onData) {
        try {
          await onData(data);
        } catch (err) {
          console.error("Error in onData callback:", err);
        }
      } else {
        console.log("Received data:", data);
      }
    }
  } catch (err) {
    console.error("⚠️ Serial reader loop stopped:", err);
  } finally {
    console.warn("🔌 Serial parser ended or port closed.");
  }
}