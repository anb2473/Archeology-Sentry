#include <Arduino.h>
#include "DHT.h" // Include the DHT sensor library

// H Humidity
// T Temperature
// E Error
// I Info

// --- Pin Definitions ---
#define DHTPIN 2      // Digital pin connected to the DHT sensor (Pin 2)
#define DHTTYPE DHT11 // DHT 11 (Change to DHT22 if you use that sensor)

// Initialize DHT sensor.
DHT dht(DHTPIN, DHTTYPE);

// --- Global Variables ---
float humidity = 0;
float temperature_f = 0;

// ------------------------------------------------------------------

void setup() {
  Serial.begin(9600);
  Serial.println(F("IStarting Temp/Humidity and Motion Sensor System..."));

  // Initialize DHT sensor
  dht.begin();  
  
  // Give the sensor time to calibrate (typically 10-60 seconds)
  Serial.println(F("ISensor Calibrating (20s delay)..."));
  delay(20000); 
  Serial.println(F("ISensor Ready."));
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
    Serial.println(F("EDHT Failed to read!"));
    return; // Exit function if reading failed
  }
  
  // Output data with prefixes
  Serial.print("H");
  Serial.println(humidity, 1); // Humidity in %
  
  Serial.print("T");
  Serial.println(temperature_f, 1); // Temperature in Fahrenheit
}

// ------------------------------------------------------------------

void loop() {
  // Read and print DHT data (Temp/Humidty)
  get_dht_data();
  
  // DHT sensors require at least 1-2 seconds between reads
  delay(2000); 
}