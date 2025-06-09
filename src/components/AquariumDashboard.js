import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt/dist/mqtt.min';
import CustomGauge from './CustomGauge';

const fishTypes = {
  nila: { name: 'Ikan Nila', min: 28, max: 30 },
  lele: { name: 'Ikan Lele', min: 26, max: 28 },
  mas: { name: 'Ikan Mas', min: 24, max: 26 },
  cupang: { name: 'Ikan Cupang', min: 26, max: 28 }
};

const AquariumDashboard = () => {
  const [currentTemp, setCurrentTemp] = useState(29);
  const [targetTemp, setTargetTemp] = useState(29);
  const [selectedFish, setSelectedFish] = useState('nila');
  const [peltierStatus, setPeltierStatus] = useState(false);
  const [mqttStatus, setMqttStatus] = useState('Menghubungkan...');
  
  const clientRef = useRef(null);

  useEffect(() => {
    const host = "420170827cf84a91a23a1f49e62ad579.s1.eu.hivemq.cloud";
    const port = 8884;
    const clientId = `sipantao-web-${Math.random().toString(16).substr(2, 8)}`;
    const url = `wss://${host}:${port}/mqtt`;
    const client = mqtt.connect(url, {
      clientId,
      username: process.env.REACT_APP_MQTT_USERNAME || "admin",
      password: process.env.REACT_APP_MQTT_PASSWORD || "Admin123",
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      rejectUnauthorized: false,
      protocolVersion: 5, // Wajib untuk HiveMQ Cloud
      properties: {
        sessionExpiryInterval: 3600 // Sesuai dokumentasi
      }
    });
  
    clientRef.current = client;

    client.on('connect', () => {
      console.log('Connected to HiveMQ Cloud');
      setMqttStatus('Terhubung');
      client.subscribe('sipantao/temperature', { qos: 0 }, (err) => {
        if (!err) console.log('Subscribed to temperature');
        });
      client.subscribe('sipantao/peltier/status',{ qos: 1 }, (err) => {
        if (!err) console.log('error status');
        });
      client.subscribe('sipantao/target', { qos: 2 }, (err) => {
        if (!err) console.log('tidak ada target');
        });
    });

    client.on('message', (topic, message) => {
      const payload = message.toString();
      if (topic === 'sipantao/temperature') {
        const temp = parseFloat(payload);
        if (!isNaN(temp)) setCurrentTemp(temp);
      } else if (topic === 'sipantao/peltier/status') {
        setPeltierStatus(payload === 'ON');
      } else if (topic === 'sipantao/target') {
        const target = parseFloat(payload);
        if (!isNaN(target)) setTargetTemp(target);
      }
    });

    client.on('error', (err) => {
      console.error('Kesalahan koneksi:', err);
      setMqttStatus(`Error: ${err.message}`);
        // Coba reconnect setelah 5 detik
      setTimeout(() => {
        console.log('Attempting reconnect...');
        client.reconnect();
        }, 5000);
    });

    client.on('close', () => {
      setMqttStatus('Terputus');
    });

    return () => {
      if (client) client.end();
    };
  }, []);

  const handleFishChange = (e) => {
    const fishKey = e.target.value;
    setSelectedFish(fishKey);
    const newTarget = fishTypes[fishKey].min;
    setTargetTemp(newTarget);
    
    if (clientRef.current?.connected) {
      clientRef.current.publish('sipantao/target', newTarget.toString());
    }
  };

  const adjustTargetTemp = (amount) => {
    const newTarget = targetTemp + amount;
    const fish = fishTypes[selectedFish];
    
    if (newTarget >= fish.min && newTarget <= fish.max) {
      setTargetTemp(newTarget);
      
      if (clientRef.current?.connected) {
        clientRef.current.publish('sipantao/target', newTarget.toString());
      }
    }
  };

  const togglePeltier = () => {
    const newStatus = !peltierStatus;
    setPeltierStatus(newStatus);
    
    if (clientRef.current?.connected) {
      clientRef.current.publish('sipantao/peltier/control', newStatus ? 'ON' : 'OFF');
    }
  };

  return (
    <div className="dashboard-container">
      <h1>SIPANTAO</h1>
      <p className="status">Status: {mqttStatus}</p>
      
      <div className="temperature-display">
        <div className="current-temp">{currentTemp.toFixed(1)}°C</div>
        <div className="temp-label">Suhu</div>
      </div>
      
      <div className="gauge-section">
        <CustomGauge value={currentTemp} min={20} max={40} size={200} />
      </div>
      
      <div className="peltier-control">
        <h3>Kontrol Manual Peltier</h3>
        <div className="toggle-switch">
          <label>
            <input 
              type="checkbox" 
              checked={peltierStatus}
              onChange={togglePeltier}
            />
            <span className="slider"></span>
          </label>
          <span className="toggle-label">
            {peltierStatus ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
      
      <div className="target-display">
        <h3>Suhu Target</h3>
        <div className="target-value">{targetTemp.toFixed(1)}°C</div>
      </div>
      
      <div className="fish-selection">
        <h3>Pilih Jenis Ikan</h3>
        <select value={selectedFish} onChange={handleFishChange}>
          {Object.entries(fishTypes).map(([key, fish]) => (
            <option key={key} value={key}>{fish.name}</option>
          ))}
        </select>
      </div>
      
      <div className="target-control">
        <h3>Atur Suhu Target</h3>
        <div className="adjuster">
          <button onClick={() => adjustTargetTemp(-0.5)}>-</button>
          <span className="target-value">{targetTemp.toFixed(1)}°C</span>
          <button onClick={() => adjustTargetTemp(0.5)}>+</button>
        </div>
      </div>
      
      <div className="ideal-range">
        <h3>Rentang Ideal</h3>
        <p>
          {fishTypes[selectedFish].min.toFixed(1)}°C - {fishTypes[selectedFish].max.toFixed(1)}°C
        </p>
      </div>
    </div>
  );
};

export default AquariumDashboard;
