<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-header">
      <h1>Dashboard PU</h1>
      <div class="header-right">
        <span class="date-label">เลือกวันที่:</span>
        <input type="date" v-model="selectedDate" class="date-input" />
        <button class="settings-btn">⚙️</button>
      </div>
    </div>

    <div class="dashboard-title">
      <h2>PJ PARAWOOD Inbound Dashboard</h2>
      <p class="timestamp">อัปเดตล่าสุด: {{ currentTime }}</p>
    </div>

    <div class="stats-grid mb-4">
      <div class="stat-card">
        <div class="stat-icon" style="background-color: #2563eb;"></div>
        <div class="stat-content">
          <h3>เหลือที่ต้องผลิต</h3>
          <p class="stat-value">{{ remainingToProduce.toLocaleString() }}</p>
          <p class="stat-label">จำนวนที่ยังต้องผลิต</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background-color: #10b981;"></div>
        <div class="stat-content">
          <h3>ผลิตไปแล้ว</h3>
          <p class="stat-value">{{ alreadyProduced.toLocaleString() }}</p>
          <p class="stat-label">จำนวนที่ผลิตเสร็จแล้ว</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background-color: #ef4444;"></div>
        <div class="stat-content">
          <h3>เหลือที่ยังไม่ผลิต</h3>
          <p class="stat-value">{{ notYetProduced.toLocaleString() }}</p>
          <p class="stat-label">จำนวนที่ยังไม่ได้เริ่มผลิต</p>
        </div>
      </div>
    </div>


<b-row class="match-height mb-4 d-flex flex-row"> 
  <b-col lg="6" md="6" sm="12" class="mb-2">
    <b-card title="Daily Production Output" class="shadow-sm h-100">
      <div class="chart-container">
        <v-chart :options="barChartOptions" :autoresize="true" />
      </div>
    </b-card>
  </b-col>

  <b-col lg="6" md="6" sm="12" class="mb-2">
    <b-card title="Production Status Distribution" class="shadow-sm h-100">
      <div class="chart-container">
        <v-chart :options="pieChartOptions" :autoresize="true" />
      </div>
    </b-card>
  </b-col>
</b-row>

    <b-row>
      <b-col cols="12">
        <b-card no-body class="shadow-sm">
          <b-card-header class="d-flex justify-content-between align-items-center">
            <h4 class="mb-0">รายการผลิตแบบเรียลไทม์ (Live Production)</h4>
            <b-button variant="success" size="sm">Export Excel</b-button>
          </b-card-header>
          <b-table hover responsive :items="productionList" :fields="tableFields" class="mb-0">
            <template #cell(status)="data">
              <b-badge :variant="statusColor(data.value)">
                {{ data.value }}
              </b-badge>
            </template>
          </b-table>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import ECharts from 'vue-echarts'
import 'echarts/lib/chart/bar'
import 'echarts/lib/chart/pie'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/title'

export default {
  name: 'ProductionDashboard',
  components: { 'v-chart': ECharts },
  data() {
    return {
      // Data สถิติ
      remainingToProduce: 5450,
      alreadyProduced: 3120,
      notYetProduced: 2330,
      selectedDate: new Date().toISOString().split('T')[0],
      currentTime: '',

      // Data ตาราง
      tableFields: [
        { key: 'sap_code', label: 'SAP Code' },
        { key: 'product_name', label: 'สินค้า' },
        { key: 'target', label: 'เป้าหมาย' },
        { key: 'actual', label: 'ทำได้' },
        { key: 'status', label: 'สถานะ' }
      ],
      productionList: [
        { sap_code: 'SAP-101', product_name: 'ไม้พาราแปรรูป A', target: 1000, actual: 1000, status: 'Completed' },
        { sap_code: 'SAP-102', product_name: 'ไม้พาราแปรรูป B', target: 500, actual: 200, status: 'In Progress' },
        { sap_code: 'SAP-103', product_name: 'โต๊ะไม้สำเร็จรูป', target: 200, actual: 0, status: 'Waiting' }
      ],

      // กราฟแท่ง
      barChartOptions: {
        tooltip: { trigger: 'axis' },
        legend: { data: ['เป้าหมาย', 'ผลิตได้จริง'], bottom: 0 },
        xAxis: { data: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'] },
        yAxis: { type: 'value' },
        series: [
          { name: 'เป้าหมาย', type: 'bar', data: [800, 800, 800, 800, 800, 800], itemStyle: { color: '#BABFC7' } },
          { name: 'ผลิตได้จริง', type: 'bar', data: [750, 820, 600, 800, 900, 400], itemStyle: { color: '#7367f0' } }
        ]
      },

      // กราฟวงกลม
      pieChartOptions: {
        tooltip: { trigger: 'item' },
        legend: { bottom: '0' },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            data: [
              { value: 3120, name: 'เสร็จแล้ว', itemStyle: { color: '#28c76f' } },
              { value: 1200, name: 'กำลังทำ', itemStyle: { color: '#ff9f43' } },
              { value: 1130, name: 'ค้างจ่าย', itemStyle: { color: '#ea5455' } }
            ]
          }
        ]
      }
    }
  },
  mounted() {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  },
  methods: {
    updateTime() {
      this.currentTime = new Date().toLocaleString('th-TH');
    },
    statusColor(status) {
      if (status === 'Completed') return 'light-success'
      if (status === 'In Progress') return 'light-warning'
      return 'light-danger'
    }
  }
}
</script>

<style scoped>
.dashboard-wrapper {
  padding: 20px;
  background-color: #f8f9fa;
}

/* Header & Title */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.header-right { display: flex; align-items: center; gap: 10px; }
.date-input { padding: 5px 10px; border-radius: 6px; border: 1px solid #ddd; }
.settings-btn { background: #7367f0; color: white; border: none; padding: 5px 12px; border-radius: 6px; }

.dashboard-title h2 { font-size: 24px; font-weight: bold; color: #333; }
.timestamp { color: #888; font-size: 14px; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: white;
}

.stat-value { font-size: 28px; font-weight: bold; margin: 0; }
.stat-content h3 { font-size: 14px; color: #666; margin-bottom: 5px; }
.stat-label { font-size: 12px; color: #999; margin: 0; }

@media (max-width: 992px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
