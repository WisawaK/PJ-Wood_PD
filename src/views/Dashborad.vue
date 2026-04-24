<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-header mb-0">
      <h1 class="h1 font-weight-bolder mb-0">PD PARAWOOD Dashboard</h1>
      <p class="timestamp small">อัปเดตล่าสุด: {{ currentTime }}</p>
    </div>

    <div class="stats-grid mb-0">
      <div class="stat-card ">
        <div class="card-indicator "></div>
        <div class="stat-body">
          <div class="stat-header">
      
            <h3>เป้าหมายรายวัน</h3>
          </div>
          <p class="stat-value ">{{ dailyTarget.toLocaleString() }}</p>
          <p class="stat-label text-muted">เป้าหมายที่ตั้งไว้ (หน่วย)</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="card-indicator"></div>
        <div class="stat-body">
          <div class="stat-header">
            
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
            
            <h3>ส่วนต่างจากเป้าหมาย</h3>
          </div>
          <p class="stat-value" :class="(alreadyProduced - dailyTarget) >= 0 ? 'text-success' : 'text-danger'">
            {{ (alreadyProduced - dailyTarget).toLocaleString() }}
          </p>
          <p class="stat-label text-muted">เปรียบเทียบจากเป้าหมายวันนี้</p>
        </div>
      </div>
    </div>

    
    <div class="search-card mb-0  p-1" style="border-radius: 12px;"> 
      <div class="d-flex flex-wrap align-items-end">
        <div class="position-relative mr-3" style="flex: 1; max-width: 400px;">
          <label class="h1 font-weight-bolder mt-2">ระบุรหัส SAP/FG code:</label>
          <p class="timestamp small font-weight-bold">เช่น: FTB7006-070S13W17N </p>
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

    <div class="position-relative mb-0" style="min-height: 400px;">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 font-weight-bold text-primary">Loading Charts...</p>
      </div>

      <div v-else>
        <div v-show="displayList.length > 0" class="row mb-0 align-items-stretch">
          
          <div class="col-lg-8 col-12 mb-0 mb-lg-0">
            <div class="chart-card shadow-sm p-3 bg-white border d-flex flex-column" style="border-radius: 12px; height: 100%;">
              <h5 class="h1 font-weight-bolder mb-0  text-dark text-left">
                
                {{ isSearching ? 'ยอดสต็อกตามการค้นหา (Filtered Summary)' : 'Total Summary (ยอดสต็อกรวม)' }}
              </h5>
              <p class="h5 timestamp text-left  ">รวมชิ้นส่วนไม้ที่มีทั้งหมด: </p>
              <div ref="totalChartRef" style="width: 100%; flex-grow: 1; min-height: 400px;"></div>
            </div>
          </div>

          <div class="col-lg-4 col-12">
            <div class="chart-card shadow-sm p-3 bg-white border d-flex flex-column" style="border-radius: 12px; height: 100%;">
              <h5 class="font-weight-bold mb-3" style="color: #5e5873; border-bottom: 2px solid #f3f2f7; padding-bottom: 10px; font-size: 1.1rem;">
                <span class="mr-2"></span> 10 ยอดสต็อกสูงสุด
              </h5>
              
              <div v-if="topStockItems.length > 0" class="top-items-list flex-grow-1 d-flex flex-column justify-content-between">
                <div v-for="(item, index) in topStockItems" :key="index" class="d-flex align-items-center" style="border-bottom: 1px dashed #ebe9f1; padding-bottom: 6px; margin-bottom: 6px;">
                  <div class="mr-2 font-weight-bold text-center rounded" 
                       :class="index < 3 ? 'bg-light-success text-success' : 'bg-light text-secondary'" 
                       style="width: 26px; height: 26px; line-height: 26px; font-size: 0.85rem;">
                    {{ index + 1 }}
                  </div>
                  
                  <div class="flex-grow-1" style="width: 55%; line-height: 1.2;">
                    <div class="font-weight-bold text-dark text-truncate" :title="item.name" style="font-size: 0.9rem;">
                      {{ item.name }}
                    </div>
                    <div class="text-muted text-truncate" style="font-size: 0.75rem;">{{ item.code }}</div>
                  </div>
                  
                  <div class="font-weight-bold text-success text-right ml-1" style="font-size: 1rem;">
                    {{ item.value.toLocaleString() }}
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-5 text-muted flex-grow-1 d-flex align-items-center justify-content-center">
                ไม่มีข้อมูล
              </div>
            </div>
          </div>

        </div>
        
        <div v-if="displayList.length === 0" class="row">
          <div class="col-12 text-center py-5">
              <p class="text-muted">ไม่พบข้อมูลรหัส SAP/FG Code นี้ในระบบ</p>
          </div>
        </div>
      </div>
    </div>



    <div class="production-report-wrapper ">
      <b-card no-body class="bg-transparent border-0 shadow-none production-report-container">
        <div class="d-flex justify-content-between align-items-center mb-0">
          <div>
            <h1 class="font-weight-bolder mt-3"> Production Yield (รายงานยอดผลิต)</h1>
            <p v-if="lastUpdate" class="font-weight-bold">อัปเดตล่าสุด: {{ lastUpdate }}</p>
          </div>
          <div class="d-flex align-items-center">
            <div class="text-right mr-3">
              <small class="text-muted d-block font-weight-bold">รวมมูลค่าตามการกรอง</small>
              <h4 class="mb-0 text-danger font-weight-bolder">{{ totalPriceFormatted }} บาท</h4>
            </div>
            
            <b-button 
              variant="primary" 
              @click="fetchAndSortProductionData" 
              :disabled="yieldLoading"
              v-ripple.400="'rgba(255, 255, 255, 0.15)'"
              class="shadow-sm"
            >
              <span v-if="yieldLoading">Retrieving....</span>
              <span v-else>Retrieve data</span>
            </b-button>
          </div>
        </div>

        <b-row class="mb-0 bg-light mx-0 py-1 rounded border">
          <b-col md="2" sm="6">
            <b-form-group label="ปี" label-class="font-weight-bold mb-0">
              <b-form-select v-model="filters.year" :options="yearOptions" @change="updateYieldOptions" size="sm" class="custom-v-select" />
            </b-form-group>
          </b-col>
          <b-col md="2" sm="6">
            <b-form-group label="เดือน" label-class="font-weight-bold mb-0">
              <b-form-select v-model="filters.month" @change="updateYieldOptions" size="sm" class="custom-v-select">
                <option v-for="(m, index) in months" :key="index" :value="index + 1">{{ m }}</option>
              </b-form-select>
            </b-form-group>
          </b-col>
          <b-col md="5" sm="12">
            <b-form-group label="เลือกช่วงสัปดาห์" label-class="font-weight-bold mb-0">
              <b-form-select v-model="filters.week" size="sm" class="custom-v-select">
                <option value="all">ดูข้อมูลทั้งเดือน</option>
                <option v-for="w in weekOptions" :key="w.value" :value="w.value">{{ w.text }}</option>
              </b-form-select>
            </b-form-group>
          </b-col>
          <b-col md="3" sm="6">
            <b-form-group label="ระบุวันที่" label-class="font-weight-bold mb-0">
              <b-form-select v-model="filters.day" size="sm" class="custom-v-select">
                <option value="all">ทั้งหมด</option>
                <option v-for="d in dayOptions" :key="d" :value="d">{{ d }}</option>
              </b-form-select>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="table-responsive rounded border shadow-sm bg-white">
          <table class="table table-hover mb-0 vuexy-table">
            <thead class="bg-light text-secondary small font-weight-bold"> 
              <tr>
                <th style="width: 40px;">
                  <span style="font-size: 16px;">#</span>
                  </th>

                <th style="width: 80px;">
                  <span style="font-size: 16px;">เวลา</span>
                </th>
                
                <th style="width: 100px;">
                  <span style="font-size: 16px;">วันที่</span>
                </th>
                <th style="width: 130px;">
                  
                  <span style="font-size: 16px;">ใบผลิต (MO)</span>
                  <b-form-input v-model="colFilters.moNo"  placeholder="Search..." class="mt-1 mt-input" />
                </th>

                <th style="width: 200px;">
                  <span style="font-size: 16px;">รหัสสินค้า</span>
                  <b-form-input v-model="colFilters.pCode" size="sm" placeholder="Search..." class="mt-1 mt-input" />
                </th>

                <th style="width: 220px;">
                  <span style="font-size: 16px;">รายละเอียดสินค้า</span>
                  <b-form-input v-model="colFilters.pDesc"  placeholder="Search..." class="mt-1 mt-input" />
                </th>

                <th style="width: 180px;">
                  
                  <span style="font-size: 16px;">สี</span>
                  <b-form-select v-model="colFilters.color"  class="mt-1 mt-input">
                    <option value="">ทั้งหมด</option>
                    <option v-for="c in colorOptions" :key="c" :value="c">{{ c }}</option>
                  </b-form-select>
                </th>
                <th style="width: 100px;" class="text-right">
                 
                  <span style="font-size: 16px;">จำนวน</span>
                </th>
                <th style="width: 120px;" class="text-right">
                  <span style="font-size: 16px;">มูลค่า (บาท)</span>
                </th>
              </tr>
            </thead>

            <tbody class="small font-weight-bold text-dark">
              <tr v-if="yieldLoading" class="text-center">
                <td colspan="9" class="py-5 text-muted">กำลังดึงข้อมูล...</td>
              </tr>
              <tr v-for="(item, index) in paginatedYieldItems" :key="index" class="data-row">
                <td class="text-center text-muted border-right">{{ (currentPage - 1) * perPage + index + 1 }}</td>
                <td class="border-right"><span class="text-muted">{{ item.displayTime }}</span></td>
                <td class="border-right">
                  <b-badge variant="light-success" class="badge-sm">{{ item.displayDate }}</b-badge>
                </td>
                <td class="border-right">{{ item.moNo }}</td>
                <td class="border-right">
                  <code class="text-danger bg-light-danger px-1 rounded">{{ item.pCode }}</code>
                </td>
                <td class="border-right desc-column text-truncate" style="max-width: 250px;">{{ item.pDesc }}</td>
                <td class="border-right">{{ item.color }}</td>
                <td class="border-right text-right text-primary">{{ item.qty.toLocaleString() }}</td>
                <td class="text-right font-weight-bolder">{{ item.priceStr }}</td>
              </tr>
              
              <tr v-if="!yieldLoading && filteredYieldItems.length === 0" class="text-center">
                <td colspan="9" class="py-4 text-muted">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td>
              </tr>
            </tbody>
          </table>
        </div>
        


        <div v-if="filteredYieldItems.length > 0" class="d-flex justify-content-between align-items-center mt-3 p-2">
          
          <div class="small text-muted">
            แสดงรายการที่ {{ (currentPage - 1) * perPage + 1 }} 
            ถึง {{ Math.min(currentPage * perPage, filteredYieldItems.length) }} 
            จากทั้งหมด {{ filteredYieldItems.length }} รายการ
          </div>

          <b-pagination
            v-model="currentPage"
            :total-rows="filteredYieldItems.length"
            :per-page="perPage"
            size="sm"
            class="mb-0"
          ></b-pagination>

        </div>


      </b-card>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import Papa from 'papaparse';
import axios from 'axios';
import { BCard, BRow, BCol, BButton, BFormGroup, BFormSelect, BBadge, BFormInput } from 'bootstrap-vue';
import Ripple from 'vue-ripple-directive';
import { BPagination } from 'bootstrap-vue';

export default {
  name: 'FullProductionDashboard',
  components: { BCard, BRow, BCol, BButton, BFormGroup, BFormSelect, BBadge, BFormInput, BPagination },
  directives: { Ripple },
  data() {
    return {
      // Dashboard States
      dailyTarget: 20000,
      alreadyProduced: 3120,
      currentTime: '',
      URL_1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-sDov5Hl1nWrRBz9jCiiBeatitpYjZp0fqPYngNmvdY1teoDLQrhPBNkMZATc-rktKV37X2Q1qzkm/pub?output=csv",
      URL_2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vShU_0KepJ0kBsIYP6zPhKVuZEE4TbCDyvx81yzPMBbdtO3SJp1kf1bRc4hbFfs4ErULD0oDyK39CkE/pub?output=csv",
      sapInput: "",
      showSuggestions: false,
      isSearching: false,
      masterList: [],
      displayList: [], 
      stockDictionary: {},
      chartInstances: [],
      totalChartInstance: null,
      isLoading: true,

      // Production Yield States
      YIELD_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpJBH3HzXDIWC0B_WuHdAfSJiyZPfMTVldJVcH9b4LNStGfZpUewPPEjfHIvIowGua2fhdOApJT1E4/pub?output=csv',
      yieldLoading: false,
      lastUpdate: '',
      yieldItems: [],
      filters: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        week: 'all',
        day: 'all'
      },
      colFilters: {
        date: '',
        moNo: '',
        pCode: '',
        pDesc: '',
        color: ''
      },
      months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
      yearOptions: [],
      dayOptions: [],
      weekOptions: [],
      currentPage: 1,
      perPage: 15,
    };
  },
  computed: {
    // --- Dashboard Logic ---
    filteredSuggestions() {
      const searchTxt = this.sapInput.trim().toLowerCase();
      if (!searchTxt) return [];
      const uniqueMap = new Map();
      this.masterList.forEach(item => {
        if (item.sap && item.sap.trim() !== "") {
          const sapStr = item.sap.toLowerCase();
          if (sapStr.includes(searchTxt)) {
            if (!uniqueMap.has(item.sap)) {
              uniqueMap.set(item.sap, { sap: item.sap, prod: item.prod });
            }
          }
        }
      });
      return Array.from(uniqueMap.values());
    },
    
    topStockItems() {
      const finalData = [];
      const usedCodes = new Set();
      
      this.displayList.forEach(item => {
        if (!usedCodes.has(item.code)) {
          finalData.push({ name: item.name, value: item.value, code: item.code });
          usedCodes.add(item.code);
        }
      });
      
      return finalData
        .filter(i => i.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); 
    },

    // --- Production Yield Logic ---
    filteredYieldItems() {
      return this.yieldItems.filter(item => {
        return (
          item.displayDate.toLowerCase().includes(this.colFilters.date.toLowerCase()) &&
          item.moNo.toLowerCase().includes(this.colFilters.moNo.toLowerCase()) &&
          item.pCode.toLowerCase().includes(this.colFilters.pCode.toLowerCase()) &&
          item.pDesc.toLowerCase().includes(this.colFilters.pDesc.toLowerCase()) &&
          (this.colFilters.color === '' || item.color === this.colFilters.color)
        );
      });
    },
    totalPriceFormatted() {
      const total = this.filteredYieldItems.reduce((sum, item) => {
        const val = parseFloat(item.priceStr.replace(/,/g, '')) || 0;
        return sum + val;
      }, 0);
      return total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    },
    colorOptions() {
      const colors = this.yieldItems.map(i => i.color).filter(v => v && v !== '-');
      return [...new Set(colors)].sort();
    },
    paginatedYieldItems() {
      
      const start = (this.currentPage - 1) * this.perPage;
      const end = start + this.perPage;
      
      return this.filteredYieldItems.slice(start, end);
    }
  },
  async mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
    
    // Init Dashboard
    await this.fetchData();
    window.addEventListener('resize', this.handleResize);

    // Init Yield Report
    this.setupYearSelect();
    this.updateYieldOptions();
    this.fetchAndSortProductionData();
  },
  methods: {
    // --- DASHBOARD METHODS ---
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
        
        this.displayList = [...this.masterList];
        this.processDisplay(); 
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        this.isLoading = false;
      }
    },
    selectSuggestion(item) {
      this.sapInput = item.sap; 
      this.showSuggestions = false;
      this.$nextTick(() => this.processDisplay());
    },
    handleBlur() {
      setTimeout(() => { this.showSuggestions = false; }, 200);
    },
    processDisplay() {
      this.showSuggestions = false;
      const search = this.sapInput.trim().toLowerCase();
      this.isSearching = search !== "";
      
      this.displayList = this.isSearching 
        ? this.masterList.filter(item => item.sap && item.sap.toLowerCase() === search)
        : this.masterList;

      this.renderAllCharts();
    },
    renderAllCharts() {
      if (this.totalChartInstance) { this.totalChartInstance.dispose(); this.totalChartInstance = null; }
      setTimeout(() => {
        this.initTotalChart();
      }, 200);
    },
    initTotalChart() {
      const container = this.$refs.totalChartRef;
      if (!container) return;
      this.totalChartInstance = echarts.init(container);
      
      const finalData = [];
      const usedCodes = new Set();
      
      this.displayList.forEach(item => {
        if (!usedCodes.has(item.code)) {
          finalData.push({ name: item.name, value: item.value });
          usedCodes.add(item.code);
        }
      });
      
      const sortedData = finalData.filter(i => i.value > 0).sort((a, b) => b.value - a.value);
      this.totalChartInstance.setOption(this.getPieOption(sortedData), true);
    },



    getPieOption(data) {
      return {
        tooltip: { 
          trigger: 'item', 
          formatter: '{b} <br/>สต็อก: <b>{c}</b> ชิ้น ({d}%)', 
          confine: true 
        },
        legend: { 
          type: 'scroll', 
          orient: 'vertical', 
          right: '1%',       // วางแถบอธิบายชิดขวา
          top: 'center',
          itemWidth: 16,     // ขยายขนาดไอคอนสีให้ใหญ่ขึ้น
          itemHeight: 16,
          textStyle: { 
            fontSize: 12, 
            color: '#6e6b7b' 
          },
          tooltip: {
            show: true       // เพิ่ม Tooltip ให้ Legend เผื่อชื่อโดนตัด
          },
          formatter: function (name) {
            // ตัดคำที่ยาวเกิน 22 ตัวอักษรใส่ ... ป้องกันไม่ให้ข้อความดันไปทับกราฟวงกลม
            return name.length > 40 ? name.substring(0, 40) + '...' : name;
          }
        },
        series: [{
          type: 'pie',
          radius: ['10%', '85%'], 
          center: ['35%', '50%'], 
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5, // เพิ่มความมนให้ชิ้นโดนัท
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false },
          emphasis: { 
            label: { 
              show: true, 
              fontSize: '18', 
              fontWeight: 'bold', 
              formatter: '{c}\nชิ้น' 
            } 
          },
          data: data
        }]
      };
    },
    resetSearch() { 
      this.sapInput = ""; 
      this.showSuggestions = false;
      this.processDisplay(); 
    },
    handleResize() {
      if (this.totalChartInstance) this.totalChartInstance.resize();
    },

    // --- PRODUCTION YIELD METHODS ---
    setupYearSelect() {
      const cur = new Date().getFullYear();
      this.yearOptions = [cur - 1, cur, cur + 1];
    },
    updateYieldOptions() {
      const year = parseInt(this.filters.year);
      const month = parseInt(this.filters.month) - 1;
      const lastDate = new Date(year, month + 1, 0);
      this.dayOptions = Array.from({ length: lastDate.getDate() }, (_, i) => i + 1);

      this.weekOptions = [];
      let current = new Date(year, month, 1);
      let weekNum = 1;
      while (current <= lastDate) {
        let start = new Date(current);
        let end = new Date(current);
        end.setDate(current.getDate() + (6 - current.getDay()));
        if (end > lastDate) end = new Date(lastDate);
        this.weekOptions.push({
          value: `${start.getDate()}|${end.getDate()}`,
          text: `สัปดาห์ที่ ${weekNum} (${start.getDate().toString().padStart(2,'0')}/${(month+1).toString().padStart(2,'0')})`
        });
        current.setDate(end.getDate() + 1);
        weekNum++;
      }
    },
    async fetchAndSortProductionData() {
      this.yieldLoading = true;
      try {
        const res = await axios.get(`${this.YIELD_CSV_URL}&t=${Date.now()}`);
        const lines = res.data.split(/\r?\n/);
        
        let dStart = 1, dEnd = 31;
        if (this.filters.day !== 'all') dStart = dEnd = parseInt(this.filters.day);
        else if (this.filters.week !== 'all') [dStart, dEnd] = this.filters.week.split('|').map(Number);

        let temp = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = this.parseCSV(lines[i]);
          const rawDate = cols[0] || "";
          const datePart = rawDate.split(" ")[0];
          if(!datePart.includes('/')) continue;

          const [m, d, yRaw] = datePart.split('/').map(Number);
          let y = yRaw < 2000 ? yRaw + 2000 : (yRaw > 2500 ? yRaw - 543 : yRaw);

          if (y === this.filters.year && m === this.filters.month && d >= dStart && d <= dEnd) {
            const price = parseFloat((cols[14] || "0").replace(/,/g, '')) || 0;
            temp.push({
              day: d,
              displayDate: datePart,
              displayTime: rawDate.split(" ")[1]?.substring(0,5) || "-",
              moNo: cols[3] || "-",
              pCode: cols[7] || "-",
              pDesc: cols[8] || "-",
              qty: parseInt((cols[9] || "0").replace(/,/g, '')) || 0,
              color: cols[13] || "-",
              priceStr: price.toLocaleString('th-TH', { minimumFractionDigits: 2 })
            });
          }
        }
        this.yieldItems = temp.sort((a, b) => a.day - b.day);
        this.lastUpdate = new Date().toLocaleString('th-TH');
      } catch (err) { 
        console.error("Yield Fetch Error:", err); 
      } finally { 
        this.yieldLoading = false; 
      }
    },
    parseCSV(text) {
      const result = [];
      let cur = '', inQuote = false;
      for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) { result.push(cur.trim()); cur = ''; }
        else cur += char;
      }
      result.push(cur.trim());
      return result;
    }
  }
};
</script>

<style lang="scss" scoped>
/* Main Styles */
.dashboard-wrapper { padding: 25px; background-color: #f8f7fa; min-height: 100vh; font-family: 'Public Sans', 'Sarabun', sans-serif; }
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
.bg-light-success { background: rgba(40, 199, 111, 0.12) !important; color: #28c76f !important; }
.bg-light-danger { background: rgba(234, 84, 85, 0.12) !important; color: #ea5455 !important; }
.bg-light { background-color: #f8f7fa !important; }
.custom-btn-search { background-color: #7367f0 !important; border-color: #7367f0 !important; color: white; border-radius: 6px; }
.custom-btn-seeall { color: #6e6b7b; border-color: #d8d6de; border-radius: 6px; }
.chart-card { border: none !important; transition: transform 0.2s; background: #fff; }
.chart-card:hover { transform: translateY(-3px); }

/* Autocomplete */
/* Autocomplete */
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

/* Production Yield Table Styles */
.production-report-container {
  .vuexy-table {
    table-layout: fixed !important;
    width: 100% !important;
    th { font-size: 0.82rem; padding: 12px 10px; vertical-align: middle; border: none; }
    td { padding: 10px; vertical-align: middle; border-bottom: 1px solid #ebe9f1; 
         &.border-right { border-right: 1px solid #f3f2f7; } }
    .mt-input { background-color: white; border: 1px solid #d8d6de; height: 30px !important; font-size: 0.75rem;
                &:focus { border-color: #7367f0; box-shadow: none; } }
  }
  .badge-light-success { background-color: rgba(40, 199, 111, 0.12); color: #28c76f; font-weight: 800; }
  .bg-light-danger { background-color: rgba(234, 84, 85, 0.12) !important; color: #ea5455 !important; }
  code { font-weight: 700; }
  .shadow-xs { box-shadow: 0 2px 4px 0 rgba(34, 41, 47, 0.05) !important; }
}

@media (max-width: 992px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>