<template>
  <b-card no-body class="p-2 shadow-none border">
    <div class="no-print">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="mb-0 text-primary font-weight-bolder">ระบบคำนวณการผลิตชิ้นส่วน</h3>
        <b-button variant="flat-primary" size="sm" @click="fetchData(true)" :disabled="loading">
          <span v-if="loading">⏳ กำลังโหลด...</span>
          <span v-else>🔄 รีเฟรชข้อมูล</span>
        </b-button>
      </div>

      <b-row class="mb-3">
        <b-col md="6">
          <b-form-group>
            <template #label>
              <span class="text-primary font-weight-bold" style="font-size: 1.1rem;">
                🔍 ค้นหาด่วน (PO | SAP | รายการ | สี):
              </span>
            </template>
            <v-select
              v-model="searchTemp"
              :options="allPlans"
              :filter="customFilter"
              label="display"
              placeholder="พิมพ์เพื่อค้นหาเร็ว..."
              @input="handleSelect"
              class="bg-white shadow-sm custom-v-select"
            >
              <template #no-options="{ search }">
                {{ search.length ? 'ไม่พบข้อมูล "' + search + '"' : 'กรุณาพิมพ์เพื่อค้นหา' }}
              </template>
            </v-select>
          </b-form-group>
        </b-col>
        
        <b-col md="3">
          <b-form-group label="🎯 เป้าหมายผลิตวันนี้:" label-class="text-danger font-weight-bold">
            <b-form-input 
              v-model.number="dailyTarget" 
              type="number" 
              class="target-input-daily"
              @input="updateCalculation"
            />
          </b-form-group>
        </b-col>

        <b-col md="3">
          <div class="target-card-fixed shadow-sm border-primary">
            <div class="target-label">เป้าหมายทั้งหมดใน PO</div>
            <div class="target-value text-primary">
              {{ totalPoQty.toLocaleString() }} <small>ตัว</small>
            </div>
          </div>
        </b-col>
      </b-row>

      <div v-if="!selectedPlan" class="plan-selection-area">
        <div class="table-responsive bg-white rounded shadow-sm border">
          <table class="table table-hover mb-0">
            <thead class="bg-light text-secondary small font-weight-bold">
              <tr>
                <th style="width: 5%" class="text-center">#</th>
                <th style="width: 15%">PO BATCH
                  <b-form-input v-model="filterPO" size="sm" class="mt-1 mt-input" @input="currentPage = 1" />
                </th>
                <th style="width: 20%">CODE SAP
                  <b-form-input v-model="filterSAP" size="sm" class="mt-1 mt-input" @input="currentPage = 1" />
                </th>
                <th style="width: 45%">DESCRIPTION (รายการ)
                  <b-form-input v-model="filterName" size="sm" class="mt-1 mt-input" @input="currentPage = 1" />
                </th>
                <th style="width: 15%">COLOR (สี)
                  <b-form-input v-model="filterColor" size="sm" class="mt-1 mt-input" @input="currentPage = 1" />
                </th>
              </tr>
            </thead>
            <tbody class="small">
              <tr v-for="(p, i) in paginatedPlans" :key="i" @click="handleSelect(p)" class="cursor-pointer plan-row">
                <td class="align-middle text-center text-muted">{{ (currentPage - 1) * perPage + (i + 1) }}</td>
                <td class="align-middle">{{ p.po }}</td>
                <td class="align-middle font-weight-bold">{{ p.sap }}</td>
                <td class="align-middle">{{ p.name }}</td>
                <td class="align-middle">{{ p.color }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3 px-1">
          <div class="text-muted small font-weight-bold">แสดงทั้งหมด {{ filteredPlans.length }} รายการ</div>
          <b-pagination v-model="currentPage" :total-rows="filteredPlans.length" :per-page="perPage" align="right" class="mb-0 pagination-purple" />
        </div>
      </div>

      <div v-else class="bom-detail-area mt-4">
        <div class="px-3 py-2 bg-light border rounded mb-3 d-flex justify-content-between align-items-center shadow-sm">
          <div>
            <span class="badge badge-primary mr-2">SELECTED</span>
            <strong>PO:</strong> {{ selectedPlan.po }} | <strong>SAP:</strong> {{ selectedPlan.sap }} | <strong>วันนี้ผลิต:</strong> <span class="text-danger font-weight-bold">{{ dailyTarget.toLocaleString() }} ตัว</span>
          </div>
          <b-button variant="outline-danger" size="sm" @click="clearSelection">ยกเลิก/เปลี่ยนรายการ</b-button>
        </div>

        <b-button v-ripple.400="'rgba(255, 255, 255, 0.15)'" variant="dark" class="mb-3 font-weight-bold shadow-sm" @click="printOrder" block>
          🖨️ พิมพ์ใบสั่งผลิตชิ้นส่วน (A4)
        </b-button>

        <div class="table-responsive">
          <table class="table-bom">
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th>รหัส (Part Code)</th>
                <th style="width: 35%">รายการชิ้นส่วน</th>
                <th class="text-center">ต่อตัว</th>
                <th class="text-center">ต้องใช้ (วันนี้)</th>
                <th class="text-center bg-gray">สต็อก </th>
                <th class="bg-orange text-white text-center">ผลิตเพิ่มวันนี้</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in tableData" :key="index">
                <td class="text-center text-muted small">{{ index + 1 }}</td>
                <td class="text-center font-weight-bold">{{ row.partCode }}</td>
                <td class="pl-1">{{ row.itemName }}</td>
                <td class="text-center">{{ row.perUnit }}</td>
                <td class="text-center text-primary font-weight-bold">{{ row.totalNeed.toLocaleString() }}</td>
                <td class="text-center bg-gray-light">{{ row.stock.toLocaleString() }}</td>
                <td class="text-center bg-orange-light text-orange font-weight-bolder">{{ row.toProduce.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="print-isolation-layer" class="print-only">
      <h1 class="text-center font-weight-bold mb-4">ใบสั่งผลิตชิ้นส่วน (Production Order)</h1>
      <div class="print-header-info border-bottom pb-2 mb-3" style="position: relative;">
        <div class="d-flex justify-content-between">
          <div>
            <p><strong>Project Order:</strong> {{ selectedPlan ? selectedPlan.po : '-' }}</p>
            <p><strong>SAP Code:</strong> {{ selectedPlan ? selectedPlan.sap : '-' }}</p>
            <p><strong>รายการ:</strong> {{ selectedPlan ? selectedPlan.name : '-' }}</p>
          </div>
          <div class="text-right">
            <p><strong>วันที่สั่งผลิต:</strong> {{ new Date().toLocaleDateString('th-TH') }}</p>
            <p><strong>สี (Color):</strong> {{ selectedPlan ? selectedPlan.color : '-' }}</p>
          </div>
        </div>
        <p style="position: absolute; top: 0; right: 0; font-size: 1.4rem; font-weight: bold;">เป้าหมายวันนี้: {{ dailyTarget.toLocaleString() }} ตัว</p>
      </div>
      <table class="table-print mb-5">
        <thead>
          <tr>
            <th>#</th>
            <th>รหัสชิ้นส่วน</th>
            <th style="width: 35%">รายการชิ้นส่วน</th>
            <th>ต่อตัว</th>
            <th>ต้องใช้</th>
            <th>สต็อก</th>
            <th>ผลิตเพิ่ม</th>
            <th>หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tableData" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center font-weight-bold">{{ row.partCode }}</td>
            <td class="pl-2">{{ row.itemName }}</td>
            <td class="text-center">{{ row.perUnit }}</td>
            <td class="text-center font-weight-bold">{{ row.totalNeed.toLocaleString() }}</td>
            <td class="text-center">{{ row.stock.toLocaleString() }}</td>
            <td class="text-center font-weight-bold" style="font-size: 1.1rem;">{{ row.toProduce.toLocaleString() }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="print-footer mt-5">
        <div class="d-flex justify-content-between text-center">
          <div style="width: 30%;">
            <p>__________________________</p>
            <p>ผู้ออกเอกสาร</p>
            <p>วันที่: ___/___/___</p>
          </div>
          <div style="width: 30%;">
            <p>__________________________</p>
            <p><strong>ฝ่ายผลิต (ผู้รับงาน)</strong></p>
            <p>วันที่: ___/___/___</p>
          </div>
          <div style="width: 30%;">
            <p>__________________________</p>
            <p>ผู้ตรวจสอบ / QC</p>
            <p>วันที่: ___/___/___</p>
          </div>
        </div>
      </div>
    </div>
  </b-card>
</template>

<script>
import vSelect from 'vue-select'
import axios from 'axios'
import { BRow, BCol, BButton, BFormGroup, BCard, BFormInput, BPagination } from 'bootstrap-vue'
import Ripple from 'vue-ripple-directive'

export default {
  components: { vSelect, BRow, BCol, BButton, BFormGroup, BCard, BFormInput, BPagination },
  directives: { Ripple },
  data() {
    return {
      loading: false, allPlans: [], stockMap: {}, bomDatabase: {},
      searchTemp: null, selectedPlan: null, totalPoQty: 0, dailyTarget: 0,
      tableData: [], filterPO: '', filterSAP: '', filterName: '', filterColor: '',
      currentPage: 1, perPage: 15
    }
  },
  computed: {
    filteredPlans() {
      return this.allPlans.filter(p => {
        return (p.po || '').toLowerCase().includes(this.filterPO.toLowerCase()) &&
               (p.sap || '').toLowerCase().includes(this.filterSAP.toLowerCase()) &&
               (p.name || '').toLowerCase().includes(this.filterName.toLowerCase()) &&
               (p.color || '').toLowerCase().includes(this.filterColor.toLowerCase());
      });
    },
    paginatedPlans() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredPlans.slice(start, start + this.perPage);
    }
  },
  mounted() { this.fetchData() },
  methods: {
    async fetchData(force = false) {
      this.loading = true
      try {
        const urlPlan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUfe59fFqNK3a6yzya8ZB4W_2dqqBg0c_06ZpH3QQ65J53FfxoEO5iPFW9LEksMEexwLOx0XTb5UcF/pub?output=csv"
        const urlStock = "https://docs.google.com/spreadsheets/d/e/2PACX-1vShU_0KepJ0kBsIYP6zPhKVuZEE4TbCDyvx81yzPMBbdtO3SJp1kf1bRc4hbFfs4ErULD0oDyK39CkE/pub?output=csv"
        const urlBOM = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-sDov5Hl1nWrRBz9jCiiBeatitpYjZp0fqPYngNmvdY1teoDLQrhPBNkMZATc-rktKV37X2Q1qzkm/pub?output=csv"
        const [resPlan, resStock, resBOM] = await Promise.all([axios.get(urlPlan), axios.get(urlStock), axios.get(urlBOM)])
        
        const tempStockMap = {}
        resStock.data.split(/\r?\n/).forEach((line, i) => {
          if (i === 0 || !line) return
          const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          tempStockMap[(cols[1] || "").replace(/"/g, '').trim()] = parseInt((cols[7] || "0").replace(/[",]/g, '')) || 0
        })
        this.stockMap = Object.freeze(tempStockMap)

        const tempDB = {}
        let lastSap = ""
        resBOM.data.split(/\r?\n/).forEach((line, i) => {
          if (i === 0 || !line) return
          const c = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          let currentSap = (c[0] || "").replace(/"/g, '').trim();
          if (currentSap) lastSap = currentSap
          if (lastSap) {
            if (!tempDB[lastSap]) tempDB[lastSap] = []
            tempDB[lastSap].push({ code: (c[2] || "").replace(/"/g, ''), name: (c[3] || "").replace(/"/g, ''), perUnit: parseFloat((c[5] || "0").replace(/[",]/g, '')) || 0 })
          }
        })
        this.bomDatabase = Object.freeze(tempDB)

        this.allPlans = Object.freeze(resPlan.data.split(/\r?\n/).slice(1).map(line => {
          if (!line) return null
          const c = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          return { po: (c[2] || "").replace(/"/g, ''), sap: (c[3] || "").replace(/"/g, ''), name: (c[6] || "").replace(/"/g, ''), color: (c[7] || "").replace(/"/g, ''), qty: parseInt((c[8] || "0").replace(/[",]/g, '')) || 0, display: `PO: ${c[2]} | SAP: ${c[3]} | ${c[6]}` }
        }).filter(v => v !== null).sort((a, b) => a.name.localeCompare(b.name, 'th')))
      } catch (err) { console.error(err) } finally { this.loading = false }
    },
    handleSelect(val) {
      if (val) {
        this.selectedPlan = val; this.totalPoQty = val.qty; this.dailyTarget = val.qty;
        this.updateCalculation();
        setTimeout(() => { this.searchTemp = null; }, 50);
      }
    },
    updateCalculation() {
      if (!this.selectedPlan) return;
      const components = this.bomDatabase[this.selectedPlan.sap] || []
      this.tableData = Object.freeze(components.map(item => {
        const need = item.perUnit * this.dailyTarget
        const stock = this.stockMap[item.code] || 0
        return { partCode: item.code, itemName: item.name, perUnit: item.perUnit, totalNeed: need, stock, toProduce: Math.max(0, need - stock) }
      }))
    },
    clearSelection() { this.selectedPlan = null; this.tableData = []; this.totalPoQty = 0; this.dailyTarget = 0; },
    customFilter: (options, search) => options.filter(o => o.display.toLowerCase().includes(search.toLowerCase())).slice(0, 50),
    printOrder() { window.print() }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
@import '~vue-select/dist/vue-select.css';

/* ปรับแต่ง v-select ให้เหมือนในรูป */
::v-deep .custom-v-select {
  .vs__dropdown-toggle {
    border: 1px solid #d8d6de !important;
    border-radius: 0.357rem !important;
    padding: 6px 8px !important;
    background-color: #fff;
    min-height: 42px;
  }
  .vs__search::placeholder { color: #b9b9c3; font-size: 0.95rem; }
  .vs__search { margin-top: 0 !important; color: #6e6b7b; }
}

.target-input-daily { border: 2px solid #ea5455 !important; font-size: 1.2rem; font-weight: 700; color: #ea5455; text-align: center; }
.target-card-fixed { background-color: #f8faff; border: 2px solid #7367f0; border-radius: 12px; padding: 10px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 85px; .target-label { font-size: 0.8rem; font-weight: 600; color: #5e5873; } .target-value { font-size: 1.6rem; font-weight: 800; } }
.cursor-pointer { cursor: pointer; }
.plan-row:hover { background-color: rgba(115, 103, 240, 0.08) !important; }
.mt-input { height: 32px; font-size: 0.75rem; }
.pagination-purple { ::v-deep .page-item.active .page-link { background-color: #7367f0 !important; border-color: #7367f0 !important; } ::v-deep .page-link { color: #6e6b7b; border: none; background: #f3f2f7; margin: 0 3px; border-radius: 6px; } }
.table-bom { width: 100%; border-collapse: collapse; th, td { border: 1px solid #dae1e7; padding: 10px 8px; vertical-align: middle; font-size: 0.85rem; } th { background-color: #5d5fef; color: white; text-align: center; } .bg-orange-light { background-color: rgba(255, 159, 67, 0.1); } .text-orange { color: #ff9f43; font-weight: bold; } }

.print-only { display: none; }

@media print {
  /* บังคับซ่อนทุกอย่างยกเว้นส่วนที่ต้องการพิมพ์ */
  @page {
    margin: 1cm;
    size: A4;
  }

  html, body {
    width: 210mm;
    height: 297mm;
  }

  /* ซ่อนทุกอย่างในหน้าเว็บ */
  body > *:not(#app),
  #app > *:not(.card),
  .card > *:not(#print-isolation-layer),
  nav, header, footer, aside, .sidebar, .menu, 
  [class*="sidebar"], [class*="menu"], [class*="nav"] {
    display: none !important;
    visibility: hidden !important;
  }

  .no-print { 
    display: none !important; 
    visibility: hidden !important;
  }
  
  .print-only { 
    display: block !important; 
    visibility: visible !important;
  }

  #print-isolation-layer {
    display: block !important;
    visibility: visible !important;
    position: relative !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  .table-print { 
    width: 100%; 
    border-collapse: collapse; 
    th, td { 
      border: 1px solid black !important; 
      padding: 5px; 
      font-size: 10pt; 
    } 
  }
}
</style>