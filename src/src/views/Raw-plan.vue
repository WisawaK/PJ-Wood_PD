<template>
  <div class="production-plan">
    <b-row>
      <b-col cols="12">
        <header class="text-center mb-4">
          <h1 class="display-4 font-weight-bold text-white">รายงานการผลิตและสถานะ </h1>
          <div class="last-update-badge">
            {{ lastUpdateText }}
          </div>
        </header>

        <div class="po-section mb-4">
          <div class="po-header d-flex justify-content-between align-items-center mb-3">
            <h3 class="text-danger m-0">🚩 รายการที่ติด PO# / PP#</h3>
            <b-button 
              variant="danger" 
              pill 
              size="sm" 
              @click="isPoExpanded = !isPoExpanded"
            >
              {{ isPoExpanded ? '🔼 ย่อรายการ' : '🔽 ขยายรายการทั้งหมด' }}
            </b-button>
          </div>
          
          <div :class="['po-dashboard', { 'collapsed': !isPoExpanded }]">
            <div v-if="poItems.length === 0" class="text-muted p-3">ไม่มีรายการติด PO ในระบบ</div>
            <div v-for="(item, index) in poItems" :key="index" class="po-card">
              <small>📅 {{ item[0] }}</small>
              <b class="d-block my-1">{{ item[11] }}</b>
              <small>{{ item[1] }} | {{ item[2] }}</small>
            </div>
          </div>
        </div>

        <div class="filter-section d-flex align-items-center justify-content-center gap-3 mb-4">
          <label class="font-weight-bold text-white m-0">🔎 ค้นหา (วันที่ผลิต):</label>
          <flat-pickr
            v-model="filterDate"
            :config="fpConfig"
            class="form-control date-input"
            placeholder="เลือกวันที่"
          />
          <b-button variant="primary" @click="resetFilter">แสดงทั้งหมด</b-button>
          <div class="ml-3">
            พบ: <span class="row-count">{{ filteredData.length }}</span> รายการ
          </div>
        </div>

        <div class="table-container shadow-lg">
          <table class="custom-table">
            <thead>
              <tr>
                <th>วันที่ผลิต</th>
                <th>ลูกค้า</th>
                <th>รายการ</th>
                <th>รายละเอียด</th>
                <th>PO</th>
                <th>ข้อมูล</th>
                <th>จำนวน</th>
                <th>จำนวนผลิต</th>
                <th>หน่วย</th>
                <th style="color: #f6ad55;">Output Price</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in filteredData" :key="idx">
                <td>{{ row[0] || '-' }}</td>
                <td>{{ row[1] || '-' }}</td>
                <td>{{ row[2] || '-' }}</td>
                <td>{{ row[3] || '-' }}</td>
                <td>{{ row[4] || '-' }}</td>
                <td>{{ row[6] || '-' }}</td>
                <td class="num-cell">{{ row[8] || '-' }}</td>
                <td class="num-cell">{{ row[9] || '-' }}</td>
                <td>{{ row[10] || '-' }}</td>
                <td class="price-cell">{{ formatPrice(row[20]) }}</td>
                <td>{{ row[11] || '-' }}</td>
              </tr>
              <tr v-if="filteredData.length === 0">
                <td colspan="11" class="text-center p-5 text-danger">
                  ❌ ไม่พบข้อมูลสำหรับวันที่เลือก
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        </b-col>
    </b-row>
  </div>
</template>

<script>
import { BRow, BCol, BButton } from 'bootstrap-vue'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
// import FormRepeaterBasic from './FormRepeaterBasic.vue' // เปิดใช้หากมีไฟล์นี้อยู่จริง

export default {
  components: {
    BRow,
    BCol,
    BButton,
    flatPickr,
    // FormRepeaterBasic,
  },
  data() {
    return {
      CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUfe59fFqNK3a6yzya8ZB4W_2dqqBg0c_06ZpH3QQ65J53FfxoEO5iPFW9LEksMEexwLOx0XTb5UcF/pub?output=csv",
      masterData: [],
      filterDate: null,
      lastUpdateText: 'กำลังโหลดข้อมูล...',
      isPoExpanded: false,
      autoRefreshInterval: null,
      fpConfig: {
        dateFormat: "m/d/Y",
        allowInput: true,
      }
    }
  },
  computed: {
    // กรองข้อมูลในตารางตามวันที่
    filteredData() {
      if (!this.filterDate) return this.masterData;
      const targetVal = this.getDateValue(this.filterDate);
      return this.masterData.filter(row => this.getDateValue(row[0]) === targetVal);
    },
    // ดึงเฉพาะรายการที่ติด PO/PP
    poItems() {
      return this.masterData
        .filter(r => (r[11] || "").includes("ติด PO") || (r[11] || "").includes("ติด PP"))
        .reverse();
    }
  },
  methods: {
    async fetchData() {
      try {
        const response = await fetch(`${this.CSV_URL}&t=${Date.now()}`);
        const text = await response.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        
        this.masterData = lines.slice(1).map(line => {
          return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => 
            cell.replace(/^"|"$/g, '').trim()
          );
        });
        
        this.lastUpdateText = "อัปเดตล่าสุด: " + new Date().toLocaleTimeString('th-TH');
      } catch (e) {
        console.error("Fetch error:", e);
        this.lastUpdateText = "โหลดข้อมูลไม่สำเร็จ";
      }
    },
    getDateValue(str) {
      if (!str || str === "-" || str === "") return null;
      let cleanStr = str.trim().replace(/-/g, '/');
      const parts = cleanStr.split('/');
      if (parts.length !== 3) return null;

      let d = parseInt(parts[0]);
      let m = parseInt(parts[1]);
      let y = parseInt(parts[2]);

      if (y > 2500) y -= 543;
      if (y < 100) y += 2000;
      return (y * 10000) + (m * 100) + d;
    },
    formatPrice(val) {
      if (!val || val === "-") return "-";
      const num = Number(val.toString().replace(/,/g, ''));
      return isNaN(num) ? val : num.toLocaleString();
    },
    resetFilter() {
      this.filterDate = null;
    }
  },
  mounted() {
    this.fetchData();
    // ตั้งค่า Auto Refresh ทุก 60 วินาที
    this.autoRefreshInterval = setInterval(this.fetchData, 60000);
  },
  beforeDestroy() {
    if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');

:root {
    --primary: #1a252f;
    --accent: #3498db;
    --bg: #ffffff;
    --success: #27ae60;
    --po-red: #e74c3c;
    --nav-bg: #718096;
    --active-green: #1abc9c;
    --white: #2d3748;
    --border: #2d3748;
}

* { box-sizing: border-box; font-family: 'Sarabun', sans-serif; }
body { margin: 0; background-color: var(--bg); color: #2d3748; }

.container { max-width: 1450px; margin: 25px auto; padding: 0 20px; }
header { text-align: center; margin-bottom: 20px; }

/* 1. จุดที่มองไม่เห็น: หัวข้อหลัก (รายงานการผลิต...) ปรับให้เข้มจัด */
header h1 { 
    font-size: 2.2rem; 
    color: #212529 !important; /* เข้มชัดเจน */
    margin-bottom: 5px; 
    text-shadow: none !important; 
    font-weight: 700;
}

/* 2. จุดที่มองไม่เห็น: อัปเดตล่าสุด */
#last-update { 
    font-size: 0.9rem; 
    color: #ffffff !important; /* เปลี่ยนฟอนต์เป็นขาวเพื่อตัดกับพื้นหลังเทาเข้ม */
    background: #4a5568; /* ปรับพื้นหลังให้เข้มขึ้นกว่าเดิม */
    padding: 5px 20px; 
    border-radius: 50px; 
    display: inline-block; 
    font-weight: bold; 
}

.po-header { 
    display: flex; justify-content: space-between; align-items: center; 
    margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid var(--po-red); 
}
.po-dashboard { 
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 15px; overflow: hidden; transition: max-height 0.4s ease; 
}
.po-dashboard.collapsed { max-height: 150px; }

.po-card { 
    background: #ffffff; border-left: 5px solid var(--po-red); 
    padding: 15px; border-radius: 10px; border: 1px solid var(--border);
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.po-card b { font-size: 1.1rem; color: #e74c3c; display: block; margin: 5px 0; font-weight: bold; }
.po-card small { color: #4a5568; }

/* 3. จุดที่มองไม่เห็น: แว่นขยายและคำว่า ค้นหา (วันที่ผลิต) */
.filter-section { 
    background: #f7fafc; padding: 20px; border-radius: 15px; margin: 20px 0; 
    display: flex; align-items: center; justify-content: center; gap: 15px; 
    border: 1px solid var(--border);
}
.filter-section label { 
    color: #000000 !important; /* ปรับให้เป็นสีดำสนิท */
    font-weight: 800; /* หนาเป็นพิเศษ */
}

/* 4. จุดที่มองไม่เห็น: ข้อความ "พบ: XX รายการ" */
.filter-section div {
    color: #2d3748 !important;
    font-weight: 600;
}

#date-filter { 
    padding: 10px; border-radius: 8px; border: 1px solid #cbd5e0; 
    width: 180px; text-align: center; cursor: pointer; background: #ffffff; 
    color: #2d3748; font-weight: bold;
}

/* ตาราง (ห้ามปรับ) */
.table-container { border-radius: 12px; overflow: auto; border: 1px solid var(--border); background: #ffffff; }
table { width: 100%; border-collapse: collapse; min-width: 1300px; }
th { background-color: #f1f5f9; color: #2d3748; padding: 15px 10px; font-size: 1rem; position: sticky; top: 0; border-bottom: 2px solid var(--border); }
td { 
    padding: 14px 10px; border-bottom: 1px solid #e2e8f0; 
    text-align: center; font-size: 0.95rem; color: #2d3748;
    font-weight: 400;
}
tr:hover { background-color: #f8fafc; }
.num-cell { font-weight: bold; color: #3182ce; font-size: 1.05rem; } 
.price-cell { font-weight: bold; color: #dd6b20; font-size: 1.05rem; }
#row-count { font-weight: bold; color: #38b2ac; font-size: 1.2rem; }
</style>