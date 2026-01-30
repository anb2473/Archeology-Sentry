#include <Arduino.h>
#include "DHT.h" // Include the DHT sensor library

// --- Pin Definitions ---
#define DHTPIN 2      // Digital pin connected to the DHT sensor (Pin 2)
#define DHTTYPE DHT11 // DHT 11 (Change to DHT22 if you use that sensor)
#define MOTION_PIN 4  // Digital pin connected to the HC-SR501 PIR sensor (Pin 4)

// Initialize DHT sensor.
DHT dht(DHTPIN, DHTTYPE);

// --- Global Variables ---
float humidity = 0;
float temperature_f = 0;
int motion_state = LOW;

// ------------------------------------------------------------------

void setup() {
  Serial.begin(9600);
  Serial.println(F("Starting Temp/Humidity and Motion Sensor System..."));

  // Initialize DHT sensor
  dht.begin(); 
  
  // Set PIR sensor pin as input
  pinMode(MOTION_PIN, INPUT); 
  
  // Give the PIR sensor time to calibrate (typically 10-60 seconds)
  Serial.println(F("PIR Sensor Calibrating (20s delay)..."));
  delay(20000); 
  Serial.println(F("PIR Sensor Ready."));
}

// ------------------------------------------------------------------

// Function to read Humidity and Temperature from DHT sensor
void get_dht_data() {
  // Read humidity
  humidity = dht.readHumidity();
  
  // Read temperature as Fahrenheit (isFahrenheit = true)
  temperature_f = dht.readTemperature(true);

  // Check if any reads failed
  if (isnan(humidity) || isnan(temperature_f)) {
    Serial.println(F("DHT Failed to read!"));
    return; // Exit function if reading failed
  }
  
  // Output data with prefixes
  Serial.print("H");
  Serial.println(humidity, 1); // Humidity in %
  
  Serial.print("T");
  Serial.println(temperature_f, 1); // Temperature in Fahrenheit
}

// Function to read PIR Motion Sensor state
void get_motion_data() {
  // Read the state of the digital pin
  motion_state = digitalRead(MOTION_PIN); 

  if (motion_state == HIGH) {
    Serial.print("M"); // Motion Detected
    Serial.println("1");
  } else {
    Serial.print("M"); // No Motion Detected
    Serial.println("0");
  }
}

// ------------------------------------------------------------------

void loop() {
  // Read and print DHT data (Temp/Humidty)
  get_dht_data();
  
  // Read and print PIR data (Motion)
  get_motion_data();
  
  // DHT sensors require at least 1-2 seconds between reads
  delay(2000); 
}