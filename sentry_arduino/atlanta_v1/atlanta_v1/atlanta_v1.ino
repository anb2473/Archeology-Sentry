#include <Wire.h>
#include "DHT.h"
#include <Adafruit_BMP280.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_LTR390.h>

#define DHTPIN 3
#define DHTTYPE DHT22          // Changed from DHT11 to DHT22
#define MOTION_PIN 2
#define SOIL_PIN A1
#define RAIN_PIN 4             // Rain sensor digital output on D4

const int SOIL_DRY = 493;
const int SOIL_WET = 300;

DHT dht(DHTPIN, DHTTYPE);     // Now initialises as DHT22
Adafruit_BMP280 bmp;
Adafruit_MPU6050 mpu;
Adafruit_LTR390 ltr;

volatile bool motionDetected = false;
unsigned long lastMotionTime = 0;
unsigned long lastReadTime = 0;
unsigned long lastSampleTime = 0;
float cumGyroX = 0, cumGyroY = 0, cumGyroZ = 0;
float cumAccelX = 0, cumAccelY = 0, cumAccelZ = 0;
unsigned long sampleCount = 0;

const unsigned long MOTION_DEBOUNCE = 5000;
const unsigned long READ_INTERVAL = 30000;

void motionISR() {
  motionDetected = true;
}

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

  Wire.begin();
  dht.begin();
  if (!bmp.begin(0x76)) delay(5);
  if (!mpu.begin()) delay(5);

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  if (!ltr.begin()) delay(5);
  ltr.setMode(LTR390_MODE_ALS);

  pinMode(MOTION_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(MOTION_PIN), motionISR, RISING);

  pinMode(RAIN_PIN, INPUT_PULLUP);  // Rain sensor: LOW = rain detected

  delay(30000);
  lastSampleTime = millis();
}

void updateCumulativeIMU() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  unsigned long now = millis();
  float dt = (now - lastSampleTime) / 1000.0;
  lastSampleTime = now;

  cumGyroX += g.gyro.x * dt;
  cumGyroY += g.gyro.y * dt;
  cumGyroZ += g.gyro.z * dt;
  cumAccelX += a.acceleration.x;
  cumAccelY += a.acceleration.y;
  cumAccelZ += a.acceleration.z;
  sampleCount++;
}

// Reads the rain sensor and prints Rain 1 (raining) or Rain 0 (dry).
// Most rain sensor modules pull the DO pin LOW when moisture is detected.
void readRain() {
  bool raining = (digitalRead(RAIN_PIN) == LOW);
  Serial.print("Rain "); Serial.println(raining ? 1 : 0);
  delay(5);
}

void readEnvironment() {
  float humidity = dht.readHumidity();
  float temp_f = dht.readTemperature(true);

  if (!isnan(humidity)) { Serial.print("External_Humidity "); Serial.println(humidity, 1); delay(5); }
  if (!isnan(temp_f))   { Serial.print("External_Temperature "); Serial.println(temp_f, 1); delay(5); }

  int soilRaw = analogRead(SOIL_PIN);
  int soilPercent = constrain(map(soilRaw, SOIL_DRY, SOIL_WET, 0, 100), 0, 100);
  Serial.print("Soil_Moisture "); Serial.println(soilPercent); delay(5);

  readRain();   // Rain sensor reading added here

  Serial.print("Pressure "); Serial.println(bmp.readPressure() / 100.0F, 2); delay(5);
  Serial.print("Internal_Temp "); Serial.println((bmp.readTemperature() * 9.0 / 5.0) + 32.0, 1); delay(5);

  Serial.print("Light "); Serial.println(ltr.readALS()); delay(5);
  ltr.setMode(LTR390_MODE_UVS);
  delay(150);
  Serial.print("UV "); Serial.println(ltr.readUVS()); delay(5);
  ltr.setMode(LTR390_MODE_ALS);

  Serial.print("Gyro_X "); Serial.println(cumGyroX, 3); delay(5);
  Serial.print("Gyro_Y "); Serial.println(cumGyroY, 3); delay(5);
  Serial.print("Gyro_Z "); Serial.println(cumGyroZ, 3); delay(5);

  if (sampleCount > 0) {
    Serial.print("Accel_X "); Serial.println(cumAccelX / sampleCount, 3); delay(5);
    Serial.print("Accel_Y "); Serial.println(cumAccelY / sampleCount, 3); delay(5);
    Serial.print("Accel_Z "); Serial.println(cumAccelZ / sampleCount, 3); delay(5);
  }

  cumGyroX = cumGyroY = cumGyroZ = 0;
  cumAccelX = cumAccelY = cumAccelZ = 0;
  sampleCount = 0;
}

void loop() {
  unsigned long currentTime = millis();
  updateCumulativeIMU();

  if (motionDetected) {
    if (currentTime - lastMotionTime >= MOTION_DEBOUNCE) {
      lastMotionTime = currentTime;
      Serial.println("Motion 1");
      readEnvironment();
    }
    motionDetected = false;
  }

  if (currentTime - lastReadTime >= READ_INTERVAL) {
    lastReadTime = currentTime;
    readEnvironment();
  }
}