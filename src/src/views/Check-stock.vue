<template>
  <div class="dashboard-wrapper">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="font-weight-bold mb-0">Stock Dashboard</h3>
      <div class="btn-group shadow-sm">
        <button @click="changeChartType('pie')" :class="['btn', chartType === 'pie' ? 'btn-primary' : 'btn-light']">Pie Chart</button>
        <button @click="changeChartType('bar')" :class="['btn', chartType === 'bar' ? 'btn-primary' : 'btn-light']">Bar Chart</button>
      </div>
    </div>

    <div class="search-card shadow-sm mb-4 bg-white p-4" style="border-radius: 12px;">
      <div class="row align-items-end">
        <div class="col-md-5">
          <label class="small font-weight-bold text-secondary">ระบุรหัส FG code:</label>
          <input type="text" v-model="sapInput" class="form-control" placeholder="กรอกรหัส FG code..." @keyup.enter="processDisplay">
        </div>
        <div class="col-md-7 mt-2">
          <button @click="processDisplay" class="btn btn-primary px-4 mr-2" style="background-color: #7367f0; border: none;">search</button>
          <button @click="resetSearch" class="btn btn-outline-secondary px-4">see all</button>
        </div>
      </div>
    </div>

    <div v-if="!isLoading && chartType === 'pie'" class="row mb-4">
      <div class="col-12">
        <div class="chart-card shadow-sm p-4 bg-white border" style="border-radius: 12px; border-top: 5px solid #28c76f !important;">
          <h5 class="font-weight-bold text-success mb-3 text-center">ยอดสต็อกรวม (Total Summary)</h5>
          <div ref="totalChartRef" style="width: 100%; height: 500px;"></div>
        </div>
      </div>
    </div>

    <div class="position-relative" style="min-height: 400px;">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 font-weight-bold text-primary">Loading...</p>
      </div>

      <div v-else class="row">
        <div v-for="(group, sapId, index) in groupedData" :key="sapId" class="col-md-6 mb-4">
          <div class="chart-card shadow-sm p-4 bg-white border" style="border-radius: 12px; height: 100%;">
            <div class="header-section mb-4" style="border-left: 5px solid #7367f0; padding-left: 15px;">
              <div class="font-weight-bold" style="color: #333; font-size: 1.15rem;">{{ group.name }}</div>
              <div class="text-muted small mt-1">รหัส FG Code: <span style="color: #7367f0; font-weight: bold;">{{ sapId }}</span></div>
            </div>
            <div :ref="'chartRef' + index" style="width: 100%; height: 380px;"></div>
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
  name: 'StockDashboard',
  data() {
    return {
      URL_1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-sDov5Hl1nWrRBz9jCiiBeatitpYjZp0fqPYngNmvdY1teoDLQrhPBNkMZATc-rktKV37X2Q1qzkm/pub?output=csv",
      URL_2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vShU_0KepJ0kBsIYP6zPhKVuZEE4TbCDyvx81yzPMBbdtO3SJp1kf1bRc4hbFfs4ErULD0oDyK39CkE/pub?output=csv",
      sapInput: "",
      chartType: 'pie',
      masterList: [],
      stockDictionary: {},
      groupedData: {},
      chartInstances: [],
      totalChartInstance: null,
      currentFilteredData: [],
      isLoading: true
    };
  },
  async mounted() {
    await this.fetchData();
    window.addEventListener('resize', this.handleResize);
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      try {
        const [csv1, csv2] = await Promise.all([
          fetch(this.URL_1).then(r => r.text()),
          fetch(this.URL_2).then(r => r.text())
        ]);

        // ดึงสต็อกจริงจาก Link 2 (Col H)
        const stockRows = Papa.parse(csv2, { header: false, skipEmptyLines: true }).data;
        this.stockDictionary = {};
        stockRows.forEach((row, i) => {
          if (i === 0) return;
          const partCode = row[1] ? String(row[1]).trim() : ""; 
          const stockVal = parseFloat(String(row[7]).replace(/,/g, ''));
          if (partCode) this.stockDictionary[partCode] = isNaN(stockVal) ? 0 : stockVal;
        });

        // ดึง Master Link 1
        const masterRows = Papa.parse(csv1, { header: false, skipEmptyLines: true }).data;
        let lastSap = "", lastProd = "";
        this.masterList = [];
        masterRows.forEach((row, i) => {
          if (i === 0) return;
          if (row[0]?.trim()) lastSap = row[0].trim();
          if (row[1]?.trim()) lastProd = row[1].trim();
          const pCode = row[2] ? String(row[2]).trim() : "";
          const pName = row[3] ? row[3].trim() : pCode;

          if (pCode) {
            const qty = this.stockDictionary[pCode] || 0;
            this.masterList.push({ sap: lastSap, prod: lastProd, code: pCode, name: pName, value: qty });
          }
        });
        this.processDisplay(); 
      } catch (err) { console.error(err); } 
      finally { this.isLoading = false; }
    },

    changeChartType(type) {
      this.chartType = type;
      this.renderAllCharts();
    },

    processDisplay() {
      const search = this.sapInput.trim().toLowerCase();
      this.currentFilteredData = search 
        ? this.masterList.filter(item => item.sap.toLowerCase().includes(search))
        : this.masterList;

      const groups = {};
      this.currentFilteredData.forEach(item => {
        if (!groups[item.sap]) groups[item.sap] = { name: item.prod, items: [] };
        groups[item.sap].items.push(item);
      });
      this.groupedData = groups;
      this.renderAllCharts();
    },

    renderAllCharts() {
      this.chartInstances.forEach(chart => chart.dispose());
      this.chartInstances = [];
      if (this.totalChartInstance) { this.totalChartInstance.dispose(); this.totalChartInstance = null; }

      setTimeout(() => {
        if (this.chartType === 'pie') this.initTotalChart();
        this.initGroupedCharts();
      }, 100);
    },

    initTotalChart() {
      const container = this.$refs.totalChartRef;
      if (!container) return;
      this.totalChartInstance = echarts.init(container);

      // Unique Logic: ป้องกันเลข 80,000 (ดึงรหัสละ 1 ครั้งเท่านั้น)
      const finalData = [];
      const usedCodes = new Set();
      this.currentFilteredData.forEach(item => {
        if (!usedCodes.has(item.code)) {
          finalData.push({ name: item.name, value: item.value });
          usedCodes.add(item.code);
        }
      });

      this.totalChartInstance.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b>', confine: true },
        legend: { orient: 'horizontal', bottom: 0, type: 'scroll' },
        series: [{
          type: 'pie',
          radius: ['30%', '60%'],
          label: { show: false }, // ปิดเส้นระโยงระยาง
          emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold', formatter: '{b}\n{c}' } },
          data: finalData.filter(i => i.value > 0).sort((a,b) => b.value - a.value)
        }]
      });
    },

    initGroupedCharts() {
      Object.keys(this.groupedData).forEach((sapId, index) => {
        const container = this.$refs['chartRef' + index];
        if (!container || !container[0]) return;
        const myChart = echarts.init(container[0]);
        const dataSet = this.groupedData[sapId];

        myChart.setOption(this.chartType === 'pie' ? this.getPieConfig(dataSet.items) : this.getBarConfig(dataSet.items));
        this.chartInstances.push(myChart);
      });
    },

    getPieConfig(data) {
      return {
        tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b>', confine: true },
        legend: { orient: 'horizontal', bottom: 0, type: 'scroll' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          label: { show: false }, // ปิดเส้นระโยงระยาง
          emphasis: { label: { show: true, fontWeight: 'bold' } },
          data: data.filter(i => i.value > 0).map(it => ({ value: it.value, name: it.name }))
        }]
      };
    },

    getBarConfig(data) {
      return {
        tooltip: { trigger: 'axis', confine: true },
        grid: { bottom: '25%', top: '10%' },
        xAxis: { type: 'category', data: data.map(it => it.name), axisLabel: { rotate: 35, interval: 0, fontSize: 10 } },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: data.map(it => it.value),
          itemStyle: { color: '#7367f0', borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', fontSize: 10 }
        }]
      };
    },

    resetSearch() { this.sapInput = ""; this.processDisplay(); },
    handleResize() {
      this.chartInstances.forEach(chart => chart.resize());
      if (this.totalChartInstance) this.totalChartInstance.resize();
    }
  }
};
</script>

<style scoped>
.dashboard-wrapper { padding: 25px; background-color: #f8f7fa; min-height: 100vh; }
.btn-primary { background-color: #7367f0 !important; border-color: #7367f0 !important; }
.chart-card { border: none !important; transition: transform 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.chart-card:hover { transform: translateY(-5px); }
</style>