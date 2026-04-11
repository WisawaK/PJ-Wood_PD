<template>
  <div class="dashboard-container">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Dashboard PU</h1>
      <div class="header-right">
        <span class="date-label">เลือกวันที่:</span>
        <input type="date" v-model="selectedDate" class="date-input" />
        <button class="settings-btn">⚙️</button>
      </div>
    </div>

    <!-- Title and Timestamp -->
    <div class="dashboard-title">
      <h2>PJ PARAWOOD Inbound Dashboard</h2>
      <p class="timestamp">{{ currentTime }}</p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <!-- Total Need to Produce -->
      <div class="stat-card">
        <div class="stat-icon" style="background-color: #2563eb;">
          
        </div>
        <div class="stat-content">
          <h3>เหลือที่ต้องผลิต</h3>
          <p class="stat-value">{{ remainingToProduce }}</p>
          <p class="stat-label">จำนวนที่ยังต้องผลิต</p>
        </div>
      </div>

      <!-- Already Produced -->
      <div class="stat-card">
        <div class="stat-icon" style="background-color: #10b981;">
          
        </div>
        <div class="stat-content">
          <h3>ผลิตไปแล้ว</h3>
          <p class="stat-value">{{ alreadyProduced }}</p>
          <p class="stat-label">จำนวนที่ผลิตเสร็จแล้ว</p>
        </div>
      </div>

      <!-- Not Yet Produced -->
      <div class="stat-card">
        <div class="stat-icon" style="background-color: #ef4444;">
          
        </div>
        <div class="stat-content">
          <h3>เหลือที่ยังไม่ผลิต</h3>
          <p class="stat-value">{{ notYetProduced }}</p>
          <p class="stat-label">จำนวนที่ยังไม่ได้เริ่มผลิต</p>
        </div>
      </div>
    </div>

    <!-- Additional Info Section -->
    <div class="info-section">
      <h3> ข้อมูลเพิ่มเติม</h3>
      <p>Dashboard นี้แสดงข้อมูลการผลิตของ PJ PARAWOOD</p>
      <p>อัปเดตครั้งล่าสุด: {{ lastUpdated }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      remainingToProduce: 0,
      alreadyProduced: 0,
      notYetProduced: 0,
      selectedDate: new Date().toISOString().split('T')[0],
      currentTime: '',
      lastUpdated: '',
    }
  },
  mounted() {
    this.loadDashboardData();
    this.updateTime();
    setInterval(() => this.updateTime(), 60000);
  },
  methods: {
    loadDashboardData() {
      // ในที่นี้คุณสามารถเรียก API เพื่อดึงข้อมูลจากเซิร์ฟเวอร์
      // ตัวอย่างนี้ใช้ค่าดัมมี่สำหรับการทดสอบ
      this.remainingToProduce = 0;
      this.alreadyProduced = 0;
      this.notYetProduced = 0;
      this.lastUpdated = new Date().toLocaleString('th-TH');
    },
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 30px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  font-size: 28px;
  color: #1f2937;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.date-label {
  font-weight: 500;
  color: #6b7280;
}

.date-input {
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.date-input:focus {
  outline: none;
  border-color: #7c3aed;
}

.settings-btn {
  background: #7c3aed;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.3s;
}

.settings-btn:hover {
  background: #6d28d9;
}

.dashboard-title {
  margin-bottom: 30px;
}

.dashboard-title h2 {
  font-size: 32px;
  color: #1f2937;
  margin-bottom: 5px;
}

.timestamp {
  color: #6b7280;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 40px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 13px;
  color: #9ca3af;
}

.info-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-section h3 {
  color: #1f2937;
  margin-bottom: 12px;
  font-size: 18px;
}

.info-section p {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .dashboard-title h2 {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    flex-direction: column;
  }

  .stat-icon {
    width: 100%;
  }
}
</style>