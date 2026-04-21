<template>
  <div class="production-yield-container">
    <div class="card-main">
      <header class="header-section">
        <h1> ยอดผลิต</h1>
        <div id="last-update" v-if="lastUpdate">อัปเดตล่าสุด: {{ lastUpdate }}</div>
      </header>

      <div class="filter-section-grid">
        <div class="form-group">
          <label>ปี:</label>
          <select v-model="filters.year" @change="updateOptions">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>เดือน:</label>
          <select v-model="filters.month" @change="updateOptions">
            <option v-for="(m, index) in months" :key="index" :value="index + 1">{{ m }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>สัปดาห์:</label>
          <select v-model="filters.week">
            <option value="all">ดูทั้งเดือน</option>
            <option v-for="w in weekOptions" :key="w.value" :value="w.value">{{ w.text }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>หรือ ระบุวันที่:</label>
          <select v-model="filters.day">
            <option value="all">ทั้งหมด</option>
            <option v-for="d in dayOptions" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <button class="btn-submit" @click="fetchAndSortData" :disabled="loading">
          {{ loading ? '⏳ กำลังดึง...' : '🔍 ดึงข้อมูล' }}
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>ใบผลิต</th>
              <th>รหัสสินค้า</th>
              <th>รายละเอียดสินค้า</th>
              <th class="text-right">จำนวน</th>
              <th>สี</th>
              <th class="text-right">มูลค่า (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="items.length === 0 && !loading">
              <td colspan="8" class="empty-state">กรุณากดปุ่ม "ดึงข้อมูล"</td>
            </tr>
            <tr v-for="(item, index) in items" :key="index">
              <td><span class="badge-green">{{ item.displayDate }}</span></td>
              <td><span class="badge-time">🕒 {{ item.displayTime }}</span></td>
              <td>{{ item.moNo }}</td>
              <td><code>{{ item.pCode }}</code></td>
              <td class="text-left">{{ item.pDesc }}</td>
              <td class="num-cell">{{ item.qty }}</td>
              <td>{{ item.color }}</td>
              <td class="price-cell"><span class="badge-red">{{ item.priceStr }}</span></td>
            </tr>
            <tr v-if="items.length > 0" class="summary-row">
              <td colspan="7" class="total-label">รวมมูลค่าตามการกรอง:</td>
              <td class="total-value">{{ totalPriceFormatted }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductionYield',
  data() {
    return {
      CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSpJBH3HzXDIWC0B_WuHdAfSJiyZPfMTVldJVcH9b4LNStGfZpUewPPEjfHIvIowGua2fhdOApJT1E4/pub?output=csv',
      loading: false,
      lastUpdate: '',
      items: [],
      totalPrice: 0,
      filters: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        week: 'all',
        day: 'all'
      },
      months: [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ],
      yearOptions: [],
      dayOptions: [],
      weekOptions: []
    }
  },
  computed: {
    totalPriceFormatted() {
      return this.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    }
  },
  mounted() {
    this.setupYearSelect();
    this.updateOptions();
  },
  methods: {
    setupYearSelect() {
      const currentYear = new Date().getFullYear();
      for (let i = -1; i <= 1; i++) {
        this.yearOptions.push(currentYear + i);
      }
    },
    updateOptions() {
      const year = parseInt(this.filters.year);
      const month = parseInt(this.filters.month) - 1;

      // 1. Update Day Options
      const lastDateOfMonth = new Date(year, month + 1, 0);
      const totalDays = lastDateOfMonth.getDate();
      this.dayOptions = Array.from({ length: totalDays }, (_, i) => i + 1);

      // 2. Update Week Options (Logic เดิมเป๊ะ)
      this.weekOptions = [];
      let current = new Date(year, month, 1);
      let weekNum = 1;
      while (current <= lastDateOfMonth) {
        let startOfThisWeek = new Date(current);
        let daysUntilSaturday = 6 - current.getDay();
        let endOfThisWeek = new Date(current);
        endOfThisWeek.setDate(current.getDate() + daysUntilSaturday);
        if (endOfThisWeek > lastDateOfMonth) endOfThisWeek = new Date(lastDateOfMonth);

        this.weekOptions.push({
          value: `${startOfThisWeek.getDate()}|${endOfThisWeek.getDate()}`,
          text: `สัปดาห์ที่ ${weekNum} (${startOfThisWeek.getDate().toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')} - ${endOfThisWeek.getDate().toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')})`
        });
        current.setDate(endOfThisWeek.getDate() + 1);
        weekNum++;
      }
    },
    async fetchAndSortData() {
      this.loading = true;
      this.items = [];
      this.totalPrice = 0;

      try {
        const response = await fetch(`${this.CSV_URL}&t=${Date.now()}`);
        const csvText = await response.text();
        const lines = csvText.split(/\r?\n/);
        
        let dayStart = 1;
        let dayEnd = 31;

        if (this.filters.day !== "all") {
          dayStart = dayEnd = parseInt(this.filters.day);
        } else if (this.filters.week !== "all") {
          const parts = this.filters.week.split('|');
          dayStart = parseInt(parts[0]);
          dayEnd = parseInt(parts[1]);
        }

        let tempItems = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = this.parseCSV(lines[i]);
          const rawDateStr = cols[0] || "";
          if (!rawDateStr) continue;

          const dateSplitParts = rawDateStr.split(" ");
          const datePart = dateSplitParts[0];
          const dateSplit = datePart.split('/');

          if (dateSplit.length === 3) {
            let m = parseInt(dateSplit[0]);
            let d = parseInt(dateSplit[1]);
            let y = parseInt(dateSplit[2]);
            if (y < 2000) y += 2000;
            if (y > 2500) y -= 543;

            if (y == this.filters.year && m == this.filters.month && d >= dayStart && d <= dayEnd) {
              let numericPrice = parseFloat((cols[14] || "0").replace(/,/g, '')) || 0;
              this.totalPrice += numericPrice;
              tempItems.push({
                day: d,
                displayDate: datePart,
                displayTime: dateSplitParts[1] ? dateSplitParts[1].substring(0, 5) : "-",
                moNo: cols[3] || "-",
                pCode: cols[7] || "-",
                pDesc: cols[8] || "-",
                qty: cols[9] || "0",
                color: cols[13] || "-",
                priceStr: numericPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })
              });
            }
          }
        }
        this.items = tempItems.sort((a, b) => a.day - b.day);
        this.lastUpdate = new Date().toLocaleString('th-TH');
      } catch (e) {
        console.error("Error fetching data:", e);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        this.loading = false;
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
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');

.production-yield-container {
  padding: 25px;
  background-color: #f1f5f9;
  min-height: 100vh;
  font-family: 'Sarabun', sans-serif;
}

.card-main {
  background: #ffffff;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.header-section {
  text-align: center;
  margin-bottom: 25px;
}

header h1 {
  color: #2d3748;
  font-size: 2.2rem;
  margin-bottom: 10px;
}

#last-update {
  background: #edf2f7;
  color: #4a5568;
  padding: 6px 20px;
  border-radius: 50px;
  display: inline-block;
  font-weight: 600;
  font-size: 0.85rem;
}

/* Filter Section */
.filter-section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  background: #f8fafc;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 30px;
  align-items: flex-end;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: #2d3748;
}

select {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #2d3748;
  font-weight: 600;
}

.btn-submit {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* Table Section */
.table-container {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

th {
  background: #2c3e50;
  color: #ffffff;
  padding: 15px;
  text-align: center;
  font-weight: 600;
}

td {
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #2d3748;
  text-align: center;
}

.text-left { text-align: left; }
.text-right { text-align: right; }

/* Badges & Special Cells */
.badge-green { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
.badge-time { background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
.badge-red { color: #b91c1c; font-weight: 800; }
code { background: #fff1f2; padding: 3px 8px; border-radius: 6px; color: #e11d48; font-weight: 700; font-size: 0.9rem; }

.num-cell { font-weight: 700; color: #3182ce; text-align: right; }

.summary-row {
  background: #f8fafc;
  border-top: 2px solid #2c3e50;
}

.total-label {
  text-align: right;
  font-weight: 800;
  color: #2d3748;
  padding: 20px;
}

.total-value {
  text-align: right;
  color: #b91c1c;
  font-size: 1.3rem;
  font-weight: 800;
}

.empty-state {
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
}
</style>