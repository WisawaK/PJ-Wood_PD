<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-header mb-4">
      <h1 class="h4 font-weight-bold mb-0">PJ PARAWOOD Inbound Dashboard</h1>
      <p class="timestamp text-muted small">อัปเดตล่าสุด: {{ currentTime }}</p>
    </div>

    <div class="stats-grid mb-5">
      <div class="stat-card">
        <div class="card-indicator purple"></div>
        <div class="stat-body">
          <div class="stat-header">
            <span class="icon">🎯</span>
            <h3>เป้าหมายรายวัน</h3>
          </div>
          <p class="stat-value">{{ dailyTarget.toLocaleString() }}</p>
          <p class="stat-label text-muted">เป้าหมายที่ตั้งไว้ (หน่วย)</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-indicator green"></div>
        <div class="stat-body">
          <div class="stat-header">
            <span class="icon">📦</span>
            <h3>ผลิตได้</h3>
          </div>
          <p class="stat-value">{{ alreadyProduced.toLocaleString() }}</p>
          <div class="status-badge" :class="alreadyProduced >= dailyTarget ? 'bg-light-success' : 'bg-light-danger'">
            {{ alreadyProduced >= dailyTarget ? '✓ ได้ตามเป้า' : '✗ ยังไม่ถึงเป้า' }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-indicator" :class="(alreadyProduced - dailyTarget) >= 0 ? 'green' : 'red'"></div>
        <div class="stat-body">
          <div class="stat-header">
            <span class="icon">{{ (alreadyProduced - dailyTarget) >= 0 ? '📈' : '📉' }}</span>
            <h3>ส่วนต่างจากเป้าหมาย</h3>
          </div>
          <p class="stat-value" :class="(alreadyProduced - dailyTarget) >= 0 ? 'text-success' : 'text-danger'">
            {{ (alreadyProduced - dailyTarget).toLocaleString() }}
          </p>
          <p class="stat-label text-muted">เปรียบเทียบจากเป้าหมายวันนี้</p>
        </div>
      </div>
    </div>

    <div class="search-card shadow-sm mb-4 bg-white p-4" style="border-radius: 12px;">
      <div class="d-flex flex-wrap align-items-end">
        <div class="position-relative mr-3" style="flex: 1; max-width: 400px;">
          <label class="small text-muted font-weight-bold mb-2">ระบุรหัส SAP/FG code:</label>
          <input 
            type="text" 
            v-model="sapInput" 
            class="form-control" 
            placeholder="กรอกรหัส SAP/FG code..." 
            @focus="showSuggestions = true"
            @input="showSuggestions = true" 
            @blur="handleBlur"
            @keyup.enter="processDisplay"
          >
          
          <ul v-if="showSuggestions && filteredSuggestions.length > 0" class="custom-autocomplete shadow">
            <li 
              v-for="(item, index) in filteredSuggestions" 
              :key="index" 
              @mousedown.prevent="selectSuggestion(item)"
              class="autocomplete-item"
            >
              <span class="font-weight-bold" style="color: #7367f0;">{{ item.sap }}</span>
              <span v-if="item.prod" class="text-muted small ml-2">| {{ item.prod }}</span>
            </li>
          </ul>
        </div>

        <div class="d-flex">
          <button @click="processDisplay" class="btn btn-primary px-4 mr-3 custom-btn-search">search</button>
          <button @click="resetSearch" class="btn btn-outline-secondary px-4 custom-btn-seeall">see all</button>
        </div>
      </div>
    </div>

    <div class="position-relative" style="min-height: 400px;">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 font-weight-bold text-primary">Loading...</p>
      </div>

      <div v-else>
        <div v-if="!isSearching" class="row mb-4">
          <div class="col-12">
            <div class="chart-card shadow-sm p-4 bg-white border" style="border-radius: 12px; border-top: 5px solid #28c76f !important;">
              <h5 class="font-weight-bold text-success mb-3 text-center">ยอดสต็อกรวม (Total Summary) </h5>
              <div ref="totalChartRef" style="width: 100%; height: 550px;"></div>
            </div>
          </div>
        </div>

        <div v-else class="row">
          <div v-for="(group, sapId, index) in groupedData" :key="sapId" class="col-md-6 mb-4">
            <div class="chart-card shadow-sm p-4 bg-white border" style="border-radius: 12px;">
              <div class="header-section mb-4" style="border-left: 5px solid #7367f0; padding-left: 15px;">
                <div class="font-weight-bold" style="color: #333; font-size: 1.15rem;">{{ group.name }}</div>
                <div class="text-muted small mt-1">
                  รหัส SAP/FG Code: <span style="color: #7367f0; font-weight: bold;">{{ sapId }}</span>
                </div>
              </div>
              <div :ref="'chartRef' + index" style="width: 100%; height: 380px;"></div>
            </div>
          </div>
          <div v-if="Object.keys(groupedData).length === 0" class="col-12 text-center py-5">
             <p class="text-muted">ไม่พบข้อมูลรหัส SAP/FG Code นี้ในระบบ</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import Papa from 'papaparse';

export default {
  name: 'FullDashboard',
  data() {
    return {
      dailyTarget: 20000,
      alreadyProduced: 3120,
      currentTime: '',
      URL_1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-sDov5Hl1nWrRBz9jCiiBeatitpYjZp0fqPYngNmvdY1teoDLQrhPBNkMZATc-rktKV37X2Q1qzkm/pub?output=csv",
      URL_2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vShU_0KepJ0kBsIYP6zPhKVuZEE4TbCDyvx81yzPMBbdtO3SJp1kf1bRc4hbFfs4ErULD0oDyK39CkE/pub?output=csv",
      sapInput: "",
      showSuggestions: false,
      isSearching: false,
      masterList: [],
      stockDictionary: {},
      groupedData: {},
      chartInstances: [],
      totalChartInstance: null,
      isLoading: true
    };
  },
  computed: {
    filteredSuggestions() {
      const searchTxt = this.sapInput.trim().toLowerCase();
      if (!searchTxt) return [];

      const uniqueMap = new Map();
      this.masterList.forEach(item => {
        if (item.sap && item.sap.trim() !== "") {
          const sapStr = item.sap.toLowerCase();
          // ค้นหาว่ารหัส SAP มีตัวอักษรที่พิมพ์อยู่หรือไม่
          if (sapStr.includes(searchTxt)) {
            if (!uniqueMap.has(item.sap)) {
              uniqueMap.set(item.sap, {
                sap: item.sap,
                prod: item.prod
              });
            }
          }
        }
      });
      
      // คืนค่ารายการทั้งหมดที่ตรงกัน ให้สามารถเลื่อนดูได้ครบ
      // (ถ้ากังวลว่าข้อมูลเยอะเป็นหมื่นรายการแล้วเว็บจะค้าง สามารถใส่ .slice(0, 300) ตรงนี้ได้ครับ แต่ถ้าไม่เยอะมากก็ใช้แบบนี้ได้เลย)
      return Array.from(uniqueMap.values());
    }
  },
  async mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
    await this.fetchData();
    window.addEventListener('resize', this.handleResize);
  },
  methods: {
    updateTime() {
      this.currentTime = new Date().toLocaleString('th-TH');
    },

    async fetchData() {
      this.isLoading = true;
      try {
        const [csv1, csv2] = await Promise.all([
          fetch(this.URL_1).then(r => r.text()),
          fetch(this.URL_2).then(r => r.text())
        ]);

        const stockRows = Papa.parse(csv2, { header: false, skipEmptyLines: true }).data;
        this.stockDictionary = {};
        stockRows.forEach((row, i) => {
          if (i === 0) return;
          const partCode = row[1] ? String(row[1]).trim() : ""; 
          const stockVal = parseFloat(String(row[7]).replace(/,/g, ''));
          if (partCode) this.stockDictionary[partCode] = isNaN(stockVal) ? 0 : stockVal;
        });

        const masterRows = Papa.parse(csv1, { header: false, skipEmptyLines: true }).data;
        let lastSap = "", lastProd = "";
        this.masterList = [];
        masterRows.forEach((row, i) => {
          if (i === 0) return;
          if (row[0] && String(row[0]).trim() !== "") lastSap = String(row[0]).trim();
          if (row[1] && String(row[1]).trim() !== "") lastProd = String(row[1]).trim();

          const pCode = row[2] ? String(row[2]).trim() : "";
          const pName = row[3] ? String(row[3]).trim() : pCode;

          if (pCode) {
            const qty = this.stockDictionary[pCode] || 0;
            this.masterList.push({ sap: lastSap, prod: lastProd, code: pCode, name: pName, value: qty });
          }
        });
        this.processDisplay(); 
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        this.isLoading = false;
      }
    },

    selectSuggestion(item) {
      this.sapInput = item.sap; 
      this.showSuggestions = false;
      this.$nextTick(() => {
        this.processDisplay();
      });
    },

    // ฟังก์ชันสำหรับปิด dropdown ตอนคลิกไปที่อื่น (ย้ายมาจาก inline เพื่อกันบัค)
    handleBlur() {
      setTimeout(() => {
        this.showSuggestions = false;
      }, 200);
    },

    processDisplay() {
      this.showSuggestions = false;
      const search = this.sapInput.trim().toLowerCase();
      this.isSearching = search !== "";

      const filtered = this.isSearching 
        ? this.masterList.filter(item => item.sap && item.sap.toLowerCase() === search)
        : this.masterList;

      const groups = {};
      filtered.forEach(item => {
        const key = item.sap;
        if (!key) return;
        if (!groups[key]) {
          groups[key] = { name: item.prod || "ไม่มีชื่อรายการ", items: [] };
        }
        groups[key].items.push(item);
      });
      
      this.groupedData = groups;
      this.renderAllCharts();
    },

    renderAllCharts() {
      this.chartInstances.forEach(chart => chart.dispose());
      this.chartInstances = [];
      if (this.totalChartInstance) { this.totalChartInstance.dispose(); this.totalChartInstance = null; }

      setTimeout(() => {
        if (!this.isSearching) {
          this.initTotalChart();
        } else {
          this.initGroupedCharts();
        }
      }, 200);
    },

    initTotalChart() {
      const container = this.$refs.totalChartRef;
      if (!container) return;
      this.totalChartInstance = echarts.init(container);

      const finalData = [];
      const usedCodes = new Set();
      this.masterList.forEach(item => {
        if (!usedCodes.has(item.code)) {
          finalData.push({ name: item.name, value: item.value });
          usedCodes.add(item.code);
        }
      });

      const sortedData = finalData
        .filter(i => i.value > 0)
        .sort((a, b) => b.value - a.value);

      this.totalChartInstance.setOption(this.getPieOption(sortedData));
    },

    initGroupedCharts() {
      Object.keys(this.groupedData).forEach((sapId, index) => {
        const container = this.$refs['chartRef' + index];
        if (!container || !container[0]) return;
        const myChart = echarts.init(container[0]);
        const sortedItems = [...this.groupedData[sapId].items].sort((a,b) => b.value - a.value);
        myChart.setOption(this.getPieOption(sortedItems));
        this.chartInstances.push(myChart);
      });
    },

    getPieOption(data) {
      return {
        tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ชิ้น', confine: true },
        legend: { orient: 'horizontal', bottom: 0, type: 'scroll' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          label: { show: false },
          emphasis: { 
            label: { 
              show: true, 
              fontSize: '14', 
              fontWeight: 'bold',
              formatter: '{b}\n{c}' 
            } 
          },
          data: data.filter(i => i.value > 0)
        }]
      };
    },

    resetSearch() { 
      this.sapInput = ""; 
      this.showSuggestions = false;
      this.processDisplay(); 
    },
    
    handleResize() {
      this.chartInstances.forEach(chart => chart.resize());
      if (this.totalChartInstance) this.totalChartInstance.resize();
    }
  }
};
</script>

<style scoped>
.dashboard-wrapper { padding: 25px; background-color: #f8f7fa; min-height: 100vh; font-family: 'Public Sans', sans-serif; }
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.stat-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #ebe9f1; }
.card-indicator { height: 5px; width: 100%; }
.card-indicator.purple { background-color: #7367f0; }
.card-indicator.green { background-color: #28c76f; }
.card-indicator.red { background-color: #ea5455; }
.stat-body { padding: 20px; }
.stat-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.stat-header h3 { font-size: 0.95rem; font-weight: 600; color: #5e5873; margin: 0; }
.stat-value { font-size: 1.8rem; font-weight: 700; color: #5e5873; margin: 5px 0; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-top: 5px; }
.bg-light-success { background: rgba(40, 199, 111, 0.12); color: #28c76f; }
.bg-light-danger { background: rgba(234, 84, 85, 0.12); color: #ea5455; }
.custom-btn-search { background-color: #7367f0 !important; border-color: #7367f0 !important; color: white; border-radius: 6px; }
.custom-btn-seeall { color: #6e6b7b; border-color: #d8d6de; border-radius: 6px; }
.chart-card { border: none !important; transition: transform 0.2s; background: #fff; }
.chart-card:hover { transform: translateY(-3px); }

.custom-autocomplete {
  position: absolute;
  top: 100%;
  left: 0; 
  right: 0; 
  background-color: #ffffff;
  border: 1px solid #d8d6de;
  border-radius: 0 0 6px 6px;
  margin-top: 2px;
  padding: 0;
  list-style: none;
  max-height: 350px; 
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
}
.autocomplete-item {
  padding: 12px 15px;
  font-size: 0.95rem;
  color: #6e6b7b;
  cursor: pointer;
  border-bottom: 1px solid #ebe9f1;
}
.autocomplete-item:hover {
  background-color: #f8f7fa;
  color: #7367f0;
}
@media (max-width: 992px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>