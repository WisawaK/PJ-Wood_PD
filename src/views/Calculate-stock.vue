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

      <b-row class="mb-2">
        <b-col md="9">
          <b-form-group label="🔍 ค้นหา (PO | SAP | รายการ | สี):">
            <b-form-input
              v-model="searchTerm"
              placeholder="พิมพ์เลข PO, SAP หรือชื่อรายการ..."
              class="mb-1 shadow-sm"
              @input="filterPlans"
            />
            <v-select
              v-model="selectedPlan"
              :options="filteredOptions"
              label="display"
              placeholder="-- เลือกเลขที่ PO หรือรหัส SAP --"
              @input="calculateBOM"
              class="bg-white shadow-sm"
            >
              <template #no-options="{ search }">
                {{ search.length ? 'ไม่พบข้อมูล' : 'กรุณาพิมพ์ค้นหา' }}
              </template>
            </v-select>
          </b-form-group>
        </b-col>
        
        <b-col md="3">
          <div class="target-card-fixed shadow-sm border-primary">
            <div class="target-label">เป้าหมายผลิต </div>
            <div class="target-value text-primary">
              {{ targetQty.toLocaleString() }} <small>ตัว</small>
            </div>
          </div>
        </b-col>
      </b-row>

      <b-button variant="dark" block class="mb-3 font-weight-bold shadow-sm" @click="printOrder">
        🖨️ พิมพ์ใบสั่งผลิตชิ้นส่วน (A4)
      </b-button>

      <div class="table-responsive">
        <table class="table-bom">
          <thead>
            <tr>
              <th>รหัส (Part Code)</th>
              <th style="width: 25%">รายการชิ้นส่วน</th>
              <th class="text-center">ต่อตัว</th>
              <th class="text-center">ต้องใช้</th>
              <th class="text-center bg-gray">สต็อก </th>
              <th class="bg-orange text-white text-center">ผลิตเพิ่ม</th>
              <th class="bg-danger text-white text-center">ค้างผลิต</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in tableData" :key="index">
              <td class="text-center font-weight-bold font-small-3">{{ row.partCode }}</td>
              <td class="pl-1">{{ row.itemName }}</td>
              <td class="text-center">{{ row.perUnit }}</td>
              <td class="text-center text-primary font-weight-bold">{{ row.totalNeed.toLocaleString() }}</td>
              <td class="text-center bg-gray-light">{{ row.stock.toLocaleString() }}</td>
              <td class="text-center bg-orange-light text-orange font-weight-bolder">
                {{ row.toProduce.toLocaleString() }}
              </td>
              <td class="text-center bg-danger-light text-danger font-weight-bold">
                {{ row.toProduce.toLocaleString() }}
              </td>
            </tr>
            <tr v-if="selectedPlan && tableData.length === 0">
              <td colspan="7" class="text-center py-5">❌ ไม่พบข้อมูลโครงสร้าง (BOM) สำหรับรหัส SAP นี้</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div id="print-isolation-layer" class="print-only">
      <h1 class="text-center font-weight-bold mb-4">ใบสั่งผลิตชิ้นส่วน (Production Order)</h1>
      
      <div class="print-header-info">
        <div>
          <p><strong>Project Order:</strong> {{ selectedPlan ? selectedPlan.po : '-' }}</p>
          <p><strong>รหัสสินค้า (SAP):</strong> {{ selectedPlan ? selectedPlan.sap : '-' }}</p>
          <p><strong>รายการ:</strong> {{ selectedPlan ? selectedPlan.name : '-' }}</p>
        </div>
        <div class="text-right">
          <p><strong>วันที่พิมพ์:</strong> {{ new Date().toLocaleDateString('th-TH') }}</p>
          <p><strong>สี (Color):</strong> {{ selectedPlan ? selectedPlan.color : '-' }}</p>
        </div>
      </div>

      <div class="print-target-banner mb-4">
        เป้าหมายผลิตทั้งหมด: {{ targetQty.toLocaleString() }} ตัว
      </div>

      <table class="table-print">
        <thead>
          <tr>
            <th>รหัส (Part Code)</th>
            <th style="width: 30%">รายการ (Item Name)</th>
            <th>ต่อตัว</th>
            <th>ต้องผลิตทั้งหมด</th>
            <th>สต็อกที่มี</th>
            <th class="bg-print-gray">ต้องผลิตเพิ่ม</th>
            <th class="bg-print-gray">ยอดค้างผลิต</th>
            <th>เบิกทำสี</th>
            <th>ของเสีย</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tableData" :key="index">
            <td class="text-center font-weight-bold">{{ row.partCode }}</td>
            <td class="pl-2">{{ row.itemName }}</td>
            <td class="text-center">{{ row.perUnit }}</td>
            <td class="text-center">{{ row.totalNeed.toLocaleString() }}</td>
            <td class="text-center">{{ row.stock.toLocaleString() }}</td>
            <td class="text-center font-weight-bold">{{ row.toProduce.toLocaleString() }}</td>
            <td class="text-center font-weight-bold">{{ row.toProduce.toLocaleString() }}</td>
            <td class="text-center">0</td>
            <td class="text-center">0</td>
          </tr>
        </tbody>
      </table>

      <div class="footer-sign-section mt-5">
        <div class="d-flex justify-content-around text-center">
          <div>...............................<br>ผู้จัดทำแผน</div>
          <div>...............................<br>คลังสินค้า</div>
          <div>...............................<br>ฝ่ายผลิต</div>
        </div>
      </div>
    </div>
  </b-card>
</template>

<script>
import vSelect from 'vue-select'
import axios from 'axios'
import { BRow, BCol, BButton, BFormGroup, BCard, BFormInput } from 'bootstrap-vue'

export default {
  components: { vSelect, BRow, BCol, BButton, BFormGroup, BCard, BFormInput },
  data() {
    return {
      loading: false,
      searchTerm: '',
      allPlans: [],
      filteredOptions: [],
      stockMap: {},
      selectedPlan: null,
      targetQty: 0,
      tableData: [],
      bomDatabase: {
        "FTB7006-070S13W17N": [
    { "code": "STB7006-A0100070RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0200070RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0300070RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-A0400070RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-T0000070RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7006-L0100070RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0200070RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0300070RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0400070RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0500070RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0600070RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-B0100070MA", "name": "พื้นนั่ง", "perUnit": 1 },
    { "code": "STB7006-B0000005MA", "name": "หน้าท๊อปโต๊ะ (ขาว)", "perUnit": 1 }
  ],
  "FTB7006-205S13W02N": [
    { "code": "STB7006-A0100205RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0200205RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0300205RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-A0400205RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-T0000205RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7006-L0100205RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0200205RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0300205RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0400205RX", "name": "ขาหน้าขาวเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0500205RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0600205RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-B0100205MA", "name": "พื้นนั่ง", "perUnit": 1 },
    { "code": "STB7006-B0000005MA", "name": "หน้าท๊อปโต๊ะ (ขาว)", "perUnit": 1 }
  ],
  "FTB7006-077S13W17N": [
    { "code": "STB7006-A0100077RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0200077RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0300077RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-A0400077RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-T0000077RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7006-L0100077RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0200077RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0300077RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0400077RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0500077RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0600077RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-B0000005MA", "name": "หน้าท๊อปโต๊ะ (ขาว)", "perUnit": 1 },
    { "code": "STB7006-B0100005MA", "name": "พื้นนั่ง (ขาว)", "perUnit": 1 }
  ],
  "FTB7006-076S13W17N": [
    { "code": "STB7006-A0100076RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0200076RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0300076RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-A0400076RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-T0000076RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7006-L0100076RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0200076RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0300076RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0400076RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0500076RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0600076RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-B0000005MA", "name": "หน้าท๊อปโต๊ะ (ขาว)", "perUnit": 1 },
    { "code": "STB7006-B0100005MA", "name": "พื้นนั่ง (ขาว)", "perUnit": 1 }
  ],
  "FTB7006-001S13W12N": [
    { "code": "STB7001-A0100001RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-A0200001RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-A0300001RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7001-A0400001RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7001-T0000001RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7001-L0100001RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-L0200001RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-L0300001RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-L0400001RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-L0500001RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-L0600001RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-B0100001MA", "name": "พื้นนั่ง", "perUnit": 1 },
    { "code": "STB7001-B0000005MA", "name": "หน้าท๊อปโต๊ะ (ขาว)", "perUnit": 1 }
  ],
  "FST7006-005S21A05N": [
    { "code": "SST7006-S0100005RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S0200005RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A0100005RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200005RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7006-L0100005RX", "name": "ขาซ้าย 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-L0200005RX", "name": "ขาขวา 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-B0000005RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FST7006-004S21A05N": [
    { "code": "SST7006-S0100004RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S0200004RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A0100004RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200004RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7006-L0100004RX", "name": "ขาซ้าย 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-L0200004RX", "name": "ขาขวา 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-B0000004RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FST7006-150S21A05N": [
    { "code": "SST7006-S010150RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S020150RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A010150RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A020150RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7006-L010150RX", "name": "ขาซ้าย 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-L020150RX", "name": "ขาขวา 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-B000150RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FST7006-004P11P12N": [
    { "code": "SST7006-S0100004RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S0200004RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A0100004RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200004RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7006-L0100004RX", "name": "ขาซ้าย 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-L0200004RX", "name": "ขาขวา 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-B0000004RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FST7016-004S21W01N": [
    { "code": "SST7006-S0100004RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S0200004RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A0100004RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200004RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7006-L0100004RX", "name": "ขาซ้าย 24\"", "perUnit": 2 },
    { "code": "SST7006-L0200004RX", "name": "ขาขวา 24\"", "perUnit": 2 },
    { "code": "SST7016-B0000004RX", "name": "พื้นนั่ง/หัวอาร์", "perUnit": 1 }
  ],
  "FST7026-004S21A05N": [
    { "code": "SST7006-S0100004RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S0200004RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A0100004RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200004RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7026-L0100004RX", "name": "ขาซ้าย 29\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7026-L0200004RX", "name": "ขาขวา 29\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-B0000004RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FST7026-150S21A05N": [
    { "code": "SST7006-S0100150RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S0200150RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A0100150RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200150RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7026-L0100150RX", "name": "ขาซ้าย 29\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7026-L0200150RX", "name": "ขาขวา 29\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-B0000150RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FST7026-005S21A05N": [
    { "code": "STB1006-A0100005RX", "name": "พนังยาวโต๊ะ", "perUnit": 2 },
    { "code": "STB1006-A0200005RX", "name": "พนังสั้นโต๊ะ", "perUnit": 2 },
    { "code": "STB1006-L0100005RX", "name": "ขาโต๊ะ", "perUnit": 4 },
    { "code": "STB1006-C0000005RX", "name": "คอร์เนอร์", "perUnit": 4 },
    { "code": "STB1006-A0300005RX", "name": "พนังหน้าเก้าอี้", "perUnit": 4 },
    { "code": "STB1006-A0401005RX", "name": "พนังหลังเก้าอี้", "perUnit": 4 },
    { "code": "STB1006-S0101005RX", "name": "ไม้ก้อนรับพื้นนั่ง", "perUnit": 4 },
    { "code": "STB1006-L0200005RX", "name": "ขาหน้าเก้าอี้ซ้าย", "perUnit": 4 },
    { "code": "STB1006-L0300005RX", "name": "ขาหน้าเก้าอี้ขวา", "perUnit": 4 },
    { "code": "STB1006-L0401005RX", "name": "ขาหลังเก้าอี้ซ้าย", "perUnit": 4 },
    { "code": "STB1006-L0501005RX", "name": "ขาหลังเก้าอี้ขวา", "perUnit": 4 },
    { "code": "STB1006-A0501005RX", "name": "พนังข้างเก้าอี้", "perUnit": 8 },
    { "code": "STB1006-S0000005RX", "name": "ยันขาเก้าอี้", "perUnit": 8 },
    { "code": "STB1006-T0000005RX", "name": "พิงหลังบนล่าง", "perUnit": 8 }
  ],
  "FTB1006-031S15W17N": [
    { "code": "STB1006-A0100005RX", "name": "พนังยาวโต๊ะ", "perUnit": 2 },
    { "code": "STB1006-A0200005RX", "name": "พนังสั้นโต๊ะ", "perUnit": 2 },
    { "code": "STB1006-L0100005RX", "name": "ขาโต๊ะ", "perUnit": 4 },
    { "code": "STB1006-C0000005RX", "name": "คอร์เนอร์", "perUnit": 4 },
    { "code": "STB1006-A0300005RX", "name": "พนังหน้าเก้าอี้", "perUnit": 4 },
    { "code": "STB1006-A0401005RX", "name": "พนังหลังเก้าอี้", "perUnit": 4 },
    { "code": "STB1006-S0101005RX", "name": "ไม้ก้อนรับพื้นนั่ง", "perUnit": 4 },
    { "code": "STB1006-L0200005RX", "name": "ขาหน้าเก้าอี้ซ้าย", "perUnit": 4 },
    { "code": "STB1006-L0300005RX", "name": "ขาหน้าเก้าอี้ขวา", "perUnit": 4 },
    { "code": "STB1006-L0401005RX", "name": "ขาหลังเก้าอี้ซ้าย", "perUnit": 4 },
    { "code": "STB1006-L0501005RX", "name": "ขาหลังเก้าอี้ขวา", "perUnit": 4 },
    { "code": "STB1006-A0501005RX", "name": "พนังข้างเก้าอี้", "perUnit": 8 },
    { "code": "STB1006-S0000005RX", "name": "ยันขาเก้าอี้", "perUnit": 8 },
    { "code": "STB1006-T0000005RX", "name": "พิงหลังบนล่าง", "perUnit": 8 }
  ],
  "FST1007-001S21W01N": [
    { "code": "SST1007-A0100001RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST1007-A0200001RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST1007-L0100001RX", "name": "ขาซ้าย 24\"", "perUnit": 2 },
    { "code": "SST1007-L0200001RX", "name": "ขาขวา 24\"", "perUnit": 2 },
    { "code": "SST1007-R0100001RX", "name": "ไม้กลมสั้น", "perUnit": 4 },
    { "code": "SST1007-R0200001RX", "name": "ไม้กลมยาว", "perUnit": 2 },
    { "code": "SST1007-R0300001RX", "name": "ไม้กลมยาว (เจาะ)", "perUnit": 2 },
    { "code": "SST1007-B0000001RX", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FST1011-001S21P12N": [
    { "code": "SST1006-A0100001RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST1006-A0200001RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST1011-L0100001RX", "name": "ขาซ้าย 29\"", "perUnit": 2 },
    { "code": "SST1011-L0200001RX", "name": "ขาขวา 29\"", "perUnit": 2 },
    { "code": "SST1006-R0100001RX", "name": "ไม้กลมสั้น", "perUnit": 4 },
    { "code": "SST1006-R0200001RX", "name": "ไม้กลมยาว", "perUnit": 2 },
    { "code": "SST1006-R0300001RX", "name": "ไม้กลมยาว (เจาะ)", "perUnit": 2 },
    { "code": "SST1006-B0000001RX", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FCH1001-004P11A05F": [
    { "code": "SCH1001-S0100004RF", "name": "ยันข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-S0200004RF", "name": "ยันข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-S0300004RF", "name": "ยันขาหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0100004RF", "name": "พนังหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0300004RF", "name": "พนังข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-A0400004RF", "name": "พนังข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-A0200004RF", "name": "พนังหลัง", "perUnit": 1 },
    { "code": "SCH1001-T0000004RF", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH1001-L0100004RF", "name": "ขาหน้าซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0200004RF", "name": "ขาหน้าขวา", "perUnit": 1 },
    { "code": "SCH1001-L0300004RF", "name": "ขาหลังซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0400004RF", "name": "ขาหลังขวา", "perUnit": 1 },
    { "code": "SCH1001-B0000004RF", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FCH1001-005S21A05F": [
    { "code": "SCH1001-S0100005RF", "name": "ยันข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-S0200005RF", "name": "ยันข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-S0300005RF", "name": "ยันขาหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0100005RF", "name": "พนังหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0300005RF", "name": "พนังข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-A0400005RF", "name": "พนังข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-A0200005RF", "name": "พนังหลัง", "perUnit": 1 },
    { "code": "SCH1001-T0000005RF", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH1001-L0100005RF", "name": "ขาหน้าซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0200005RF", "name": "ขาหน้าขวา", "perUnit": 1 },
    { "code": "SCH1001-L0300005RF", "name": "ขาหลังซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0400005RF", "name": "ขาหลังขวา", "perUnit": 1 },
    { "code": "SCH1001-B0000005RF", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FCH7016-068P11I04F": [
    { "code": "SCH7016-A0100068RN", "name": "พนังข้าง", "perUnit": 2 },
    { "code": "SCH7016-A0200068RN", "name": "พนังยึดพื้นนั่ง", "perUnit": 2 },
    { "code": "SCH7016-T0100068RN", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH7016-L0100068RN", "name": "ขายาวซ้าย", "perUnit": 1 },
    { "code": "SCH7016-L0200068RN", "name": "ขายาวขวา", "perUnit": 1 },
    { "code": "SCH7016-L0300068RN", "name": "ขาหน้า", "perUnit": 2 },
    { "code": "SCH7016-R0100068RN", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "SCH7016-B0000068MK", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FCH7016-068P11I05F": [
    { "code": "SCH7016-A0100068RN", "name": "พนังข้าง", "perUnit": 2 },
    { "code": "SCH7016-A0200068RN", "name": "พนังยึดพื้นนั่ง", "perUnit": 2 },
    { "code": "SCH7016-T0100068RN", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH7016-L0100068RN", "name": "ขายาวซ้าย", "perUnit": 1 },
    { "code": "SCH7016-L02000068RN", "name": "ขายาวขวา", "perUnit": 1 },
    { "code": "SCH7016-L0300068RN", "name": "ขาหน้า", "perUnit": 2 },
    { "code": "SCH7016-R0100068RN", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "SCH7016-B0000068MK", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FTB7026-068P11I04F": [
    { "code": "STB7026-A0100068RN", "name": "พนังสั้น", "perUnit": 2 },
    { "code": "STB7026-A0200068RN", "name": "พนังยาว", "perUnit": 2 },
    { "code": "STB7026-L0000068RN", "name": "ขาโต๊ะ", "perUnit": 4 },
    { "code": "STB7026-B0000068MK", "name": "หน้าท๊อปโต๊ะ", "perUnit": 1 }
  ],
  "FSH1086-008P11A05N": [
    { "code": "SSH1086-L0101008RX", "name": "ขาหน้าบน", "perUnit": 2 },
    { "code": "SSH1086-L0201008RX", "name": "ขาหลังบน", "perUnit": 2 },
    { "code": "SSH1086-S0101008RX", "name": "ยึดขาบน", "perUnit": 2 },
    { "code": "SSH1086-S0201008RX", "name": "ยึดแผ่นชั้น", "perUnit": 9 },
    { "code": "SSH1086-S0301008RX", "name": "ยึดแผ่นชั้นเจาะ", "perUnit": 1 },
    { "code": "SSH1086-S0401008RX", "name": "ยึดขาล่างบน", "perUnit": 2 },
    { "code": "SSH1086-L0301008RX", "name": "ขาหน้าล่าง", "perUnit": 2 },
    { "code": "SSH1086-L0401008RX", "name": "ขาหลังล่าง", "perUnit": 2 },
    { "code": "SSH1086-S0501008RX", "name": "ยึดขาล่างล่าง", "perUnit": 2 },
    { "code": "SSH1086-B0112008MI", "name": "แผ่นชั้น 1", "perUnit": 1 },
    { "code": "SSH1086-B0212008MI", "name": "แผ่นชั้น 2", "perUnit": 1 },
    { "code": "SSH1086-B0312008MI", "name": "แผ่นชั้น 3", "perUnit": 1 },
    { "code": "SSH1086-B0412008MI", "name": "แผ่นชั้น 4", "perUnit": 1 },
    { "code": "SSH1086-B0512008MI", "name": "แผ่นชั้น 5", "perUnit": 1 }
  ],
  "FSH1086-150P11A05N": [
    { "code": "SSH1086-B0112150MI", "name": "แผ่นชั้น 1", "perUnit": 1 },
    { "code": "SSH1086-B0212150MI", "name": "แผ่นชั้น 2", "perUnit": 1 },
    { "code": "SSH1086-B0312150MI", "name": "แผ่นชั้น 3", "perUnit": 1 },
    { "code": "SSH1086-B0412150MI", "name": "แผ่นชั้น 4", "perUnit": 1 },
    { "code": "SSH1086-B0512150MI", "name": "แผ่นชั้น 5", "perUnit": 1 },
    { "code": "SSH1086-B0000150MI", "name": "ไม้ก้อน", "perUnit": 2 },
    { "code": "SSH1086-L0101150RX", "name": "ขาหน้าบน", "perUnit": 2 },
    { "code": "SSH1086-L0301150RX", "name": "ขาหน้าล่าง", "perUnit": 2 },
    { "code": "SSH1086-L0201150RX", "name": "ขาหลังบน", "perUnit": 2 },
    { "code": "SSH1086-L0401150RX", "name": "ขาหลังล่าง", "perUnit": 2 },
    { "code": "SSH1086-S0201150RX", "name": "ยึดแผ่นชั้น", "perUnit": 9 },
    { "code": "SSH1086-S0301150RX", "name": "ยึดแผ่นชั้นเจาะ", "perUnit": 1 },
    { "code": "SSH1086-S0101150RX", "name": "ยึดขาบน", "perUnit": 2 },
    { "code": "SSH1086-S0401150RX", "name": "ยึดขาล่างบน", "perUnit": 2 },
    { "code": "SSH1086-S0501150RX", "name": "ยึดขาล่างล่าง", "perUnit": 2 }
  ],
  "FSH1086-045P11A05N": [
    { "code": "SSH1086-L0101045RX", "name": "ขาหน้าบน", "perUnit": 2 },
    { "code": "SSH1086-L0201045RX", "name": "ขาหลังบน", "perUnit": 2 },
    { "code": "SSH1086-S0101045RX", "name": "ยึดขาบน", "perUnit": 2 },
    { "code": "SSH1086-S0201045RX", "name": "ยึดแผ่นชั้น", "perUnit": 9 },
    { "code": "SSH1086-S0301045RX", "name": "ยึดแผ่นชั้นเจาะ", "perUnit": 1 },
    { "code": "SSH1086-S0401045RX", "name": "ยึดขาล่างบน", "perUnit": 2 },
    { "code": "SSH1086-L0301045RX", "name": "ขาหน้าล่าง", "perUnit": 2 },
    { "code": "SSH1086-L0401045RX", "name": "ขาหลังล่าง", "perUnit": 2 },
    { "code": "SSH1086-S0501045RX", "name": "ยึดขาล่างล่าง", "perUnit": 2 },
    { "code": "SSH1086-B0112045MI", "name": "แผ่นชั้น 1", "perUnit": 1 },
    { "code": "SSH1086-B0212045MI", "name": "แผ่นชั้น 2", "perUnit": 1 },
    { "code": "SSH1086-B0312045MI", "name": "แผ่นชั้น 3", "perUnit": 1 },
    { "code": "SSH1086-B0412045MI", "name": "แผ่นชั้น 4", "perUnit": 1 },
    { "code": "SSH1086-B0512045MI", "name": "แผ่นชั้น 5", "perUnit": 1 },
    { "code": "SSH1086-B0000045MI", "name": "ไม้ก้อน", "perUnit": 2 }
  ],
  "FTB1001-001P11A05F": [
    { "code": "STB1001-B0001001RF", "name": "พื้นโต๊ะ", "perUnit": 1 },
    { "code": "STB1001-A0101001RF", "name": "พนังยาว", "perUnit": 2 },
    { "code": "STB1001-A0201001RF", "name": "พนังสั้น", "perUnit": 2 },
    { "code": "STB1001-L0101001RF", "name": "ขาโต๊ะ", "perUnit": 4 },
    { "code": "STB1001-C0001001RF", "name": "คอร์เนอร์", "perUnit": 4 }
  ],
  "FHW2001-101P30I03F": [
    { "code": "SHW2001-B0000101RN", "name": "ฐานล่าง", "perUnit": 1 },
    { "code": "SHW2001-B0100101RN", "name": "หน้าท๊อป", "perUnit": 1 }
  ],
  "FTT1001-001P61W01N": [
    { "code": "STT1001-A0100001RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200001RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000001RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100001RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200001RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000001RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700001RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTT1001-150P61W01N": [
    { "code": "STT1001-A0100150RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200150RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000150RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100150RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200150RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000150RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700150RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTB1006-031S15W01N": [
    { "code": "STB1006-A0100005RX", "name": "พนังยาวโต๊ะ", "perUnit": 2 },
    { "code": "STB1006-A0200005RX", "name": "พนังสั้นโต๊ะ", "perUnit": 2 },
    { "code": "STB1006-L0100005RX", "name": "ขาโต๊ะ", "perUnit": 4 },
    { "code": "STB1006-C0000005RX", "name": "คอร์เนอร์", "perUnit": 4 },
    { "code": "STB1006-A0303005RX", "name": "พนังหน้า-หลังเก้าอี้", "perUnit": 8 },
    { "code": "STB1006-L0203005RX", "name": "ขาหน้าเก้าอี้ซ้าย", "perUnit": 4 },
    { "code": "STB1006-L0303005RX", "name": "ขาหน้าเก้าอี้ขวา", "perUnit": 4 },
    { "code": "STB1006-L0403005RX", "name": "ขาหลังเก้าอี้ซ้าย", "perUnit": 4 },
    { "code": "STB1006-L0503005RX", "name": "ขาหลังเก้าอี้ขวา", "perUnit": 4 },
    { "code": "STB1006-A0503005RX", "name": "พนังข้างเก้าอี้", "perUnit": 8 },
    { "code": "STB1006-S0000005RX", "name": "ยันขาเก้าอี้", "perUnit": 8 },
    { "code": "STB1006-T0000005RX", "name": "พิงหลังบนล่าง", "perUnit": 8 }
  ],
  "FTT3001-038P41W01N": [
    { "code": "STT3001-S0000038RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT3001-A0100038RX", "name": "ยึดท๊อปตัวบาก", "perUnit": 2 },
    { "code": "STT3001-A0200038RX", "name": "ยึดท๊อปตัวกลาง", "perUnit": 1 },
    { "code": "STT3001-A0300038RX", "name": "ยึดท๊อปตัวข้าง", "perUnit": 2 },
    { "code": "STT3001-L0100038RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT3001-L0200038RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT3001-R0000038RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT3001-B0200038MI", "name": "หน้าท๊อป", "perUnit": 1 }
  ],
  "FTB7006-001S13L04N": [
    { "code": "STB7001-A0100001RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-A0200001RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-A0300001RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7001-A0400001RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7001-T0000001RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7001-L0100001RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-L0200001RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7001-L0300001RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-L0400001RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-L0500001RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-L0600001RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7001-B0100001MA", "name": "พื้นนั่ง", "perUnit": 1 },
    { "code": "STB7001-B0000005MA", "name": "หน้าท๊อปโต๊ะ (ขาว)", "perUnit": 1 }
  ],
  "FST1006-031S21H01F": [
    { "code": "SST1006-A0100031RF", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST1006-A0200031RF", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST1006-L0100031RF", "name": "ขาซ้าย 24\"", "perUnit": 2 },
    { "code": "SST1006-L0200031RF", "name": "ขาขวา 24\"", "perUnit": 2 },
    { "code": "SST1006-R0100031RF", "name": "ไม้กลมสั้น", "perUnit": 4 },
    { "code": "SST1006-R0200031RF", "name": "ไม้กลมยาว", "perUnit": 2 },
    { "code": "SST1006-R0300031RF", "name": "ไม้กลมยาว (เจาะ)", "perUnit": 2 },
    { "code": "SST1006-B0000031RF", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FTT1001-004S51A05N": [
    { "code": "STT1001-A0100004RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200004RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000004RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100004RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200004RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000004RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700004RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100004RX", "name": "เสาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0200004RX", "name": "แขนแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0300004RX", "name": "ฐานแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0400004RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500004RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT1001-008S51A05N": [
    { "code": "STT1001-A0100008RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200008RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000008RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100008RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200008RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000008RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700008RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100008RX", "name": "เสาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0200008RX", "name": "แขนแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0300008RX", "name": "ฐานแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0400008RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500008RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT1001-006S21P12N": [
    { "code": "STT1001-A0100006RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200006RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000006RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100006RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200006RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000006RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700006RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTT1001-001P11L04N": [
    { "code": "STT1001-A0100001RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200001RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000001RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100001RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200001RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000001RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700001RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTT3001-038P41W02N": [
    { "code": "STT3001-S0000038RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT3001-A0100038RX", "name": "ยึดท๊อปตัวบาก", "perUnit": 2 },
    { "code": "STT3001-A0200038RX", "name": "ยึดท๊อปตัวกลาง", "perUnit": 1 },
    { "code": "STT3001-A0300038RX", "name": "ยึดท๊อปตัวข้าง", "perUnit": 2 },
    { "code": "STT3001-L0100038RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT3001-L0200038RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT3001-R0000038RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT3001-B0200038MI", "name": "หน้าท๊อป", "perUnit": 1 }
  ],
  "FTT3001-001S51P12N": [
    { "code": "STT3001-S0000001RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT3001-A0100001RX", "name": "ยึดท๊อปตัวบาก", "perUnit": 2 },
    { "code": "STT3001-A0200001RX", "name": "ยึดท๊อปตัวกลาง", "perUnit": 1 },
    { "code": "STT3001-A0300001RX", "name": "ยึดท๊อปตัวข้าง", "perUnit": 2 },
    { "code": "STT3001-L0100001RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT3001-L0200001RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT3001-R0000001RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT3001-B0000001MI", "name": "หน้าท๊อป", "perUnit": 1 },
    { "code": "STT3001-K0100001RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT3001-K0200001RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT3001-K0300001RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT3001-K0400001RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT3001-K0500001RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT3001-001P41W01N": [
    { "code": "STT3001-B0000001MI", "name": "หน้าท๊อป", "perUnit": 1 },
    { "code": "STT3001-A0100001RX", "name": "ยึดท๊อปตัวบาก", "perUnit": 2 },
    { "code": "STT3001-A0200001RX", "name": "ยึดท๊อปตัวกลาง", "perUnit": 1 },
    { "code": "STT3001-A0300001RX", "name": "ยึดท๊อปตัวข้าง", "perUnit": 2 },
    { "code": "STT3001-L0100001RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT3001-L0200001RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT3001-R0000001RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT3001-S0000001RX", "name": "ยันขา", "perUnit": 1 }
  ],
  "FST7021-001S21H01F": [
    { "code": "SST7021-S0100001RF", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7021-S0200001RF", "name": "ยันขายาว/1รู", "perUnit": 2 },
    { "code": "SST7021-A0100001RF", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7021-A0200001RF", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7021-L0100001RF", "name": "ขาซ้าย 24\"/1รู", "perUnit": 2 },
    { "code": "SST7021-L0200001RF", "name": "ขาขวา 24\"/1รู", "perUnit": 2 },
    { "code": "SST7021-B0000001RF", "name": "พื้นนั่ง/หัวมน", "perUnit": 1 }
  ],
  "FTT1001-150P41W02N": [
    { "code": "STT1001-A0100150RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200150RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000150RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100150RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200150RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000150RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700150RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTT1001-004P41L05N": [
    { "code": "STT1001-A0100004RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200004RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000004RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100004RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200004RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000004RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700004RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTT1001-004P41L07N": [
    { "code": "STT1001-A0100004RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200004RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000004RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100004RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200004RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000004RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700004RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTT1001-001S51A05N": [
    { "code": "STT1001-A0100001RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200001RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000001RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100001RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200001RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000001RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700001RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100001RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0200001RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0300001RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0400001RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500001RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT1001-004S51C10N": [
    { "code": "STT1001-A0100004RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200004RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000004RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100004RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200004RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000004RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700004RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100004RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0200004RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0300004RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0400004RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500004RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT3001-001P11W17N": [
    { "code": "STT3001-S0000001RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT3001-A0100001RX", "name": "ยึดท๊อปตัวบาก", "perUnit": 2 },
    { "code": "STT3001-A0200001RX", "name": "ยึดท๊อปตัวกลาง", "perUnit": 1 },
    { "code": "STT3001-A0300001RX", "name": "ยึดท๊อปตัวข้าง", "perUnit": 2 },
    { "code": "STT3001-L0100001RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT3001-L0200001RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT3001-R0000001RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT3001-B0000001MI", "name": "หน้าท๊อป", "perUnit": 1 }
  ],
  "FTB7006-036S13W17N": [
    { "code": "STB7006-A0200036RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0300036RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-A0400036RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-T0000036RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7006-L0100036RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0200036RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0300036RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0400036RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0500036RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0600036RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-B0100036MA", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FTB7006-205S13W17N": [
    { "code": "STB7006-A0100205RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0200205RX", "name": "พนังสั้นโต๊ะ", "perUnit": 2 },
    { "code": "STB7006-A0300205RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-A0400205RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-T0000205RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "STB7006-L0100205RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0200205RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0300205RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0400205RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0500205RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0600205RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-B0100205MA", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FST7031-001P11L04N": [
    { "code": "SST7006-S0100001RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7011-S0200001RX", "name": "ยันขายาว", "perUnit": 2 },
    { "code": "SST7006-A0100001RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200001RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7031-L0100001RX", "name": "ขาซ้าย 29\"", "perUnit": 2 },
    { "code": "SST7031-L0200001RX", "name": "ขาขวา 29\"", "perUnit": 2 },
    { "code": "SST7006-B0000001RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FTT1001-042S31P07N": [
    { "code": "STT1001-A0100042RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200042RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000042RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100042RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200042RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000042RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1500042RX", "name": "หน้าท๊อป 15mm", "perUnit": 1 },
    { "code": "STT1001-K0100042RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0600042RX", "name": "แขนแร็ค 3PC", "perUnit": 2 },
    { "code": "STT1001-K0300042RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0400042RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500042RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FST7011-004S21T10F": [
    { "code": "SST7011-B0000004RF", "name": "พื้นนั่ง", "perUnit": 1 },
    { "code": "SST7011-A0200004RF", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7011-L0100004RF", "name": "ขาซ้าย 24\"/2รู", "perUnit": 2 },
    { "code": "SST7011-L0200004RF", "name": "ขาขวา 24\"/2รู", "perUnit": 2 },
    { "code": "SST7011-A0100004RF", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7011-S0100004RF", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7011-S0200004RF", "name": "ยันขายาวคิกเพลท", "perUnit": 2 }
  ],
  "FST7036-004S21T10F": [
    { "code": "SST7011-B0000004RF", "name": "พื้นนั่ง", "perUnit": 1 },
    { "code": "SST7011-A0200004RF", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7036-L0100004RF", "name": "ขาซ้าย 29\"/2รู", "perUnit": 2 },
    { "code": "SST7036-L0200004RF", "name": "ขาขวา 29\"/2รู", "perUnit": 2 },
    { "code": "SST7011-A0100004RF", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7011-S0100004RF", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7011-S0200004RF", "name": "ยันขายาวคิกเพลท", "perUnit": 2 }
  ],
  "FTT1001-006S51P12N": [
    { "code": "STT1001-A0100006RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200006RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000006RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100006RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200006RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000006RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700006RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100006RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0200006RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0300006RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0400006RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500006RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT1001-008S51P12N": [
    { "code": "STT1001-A0100008RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200008RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000008RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100008RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200008RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000008RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700008RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100008RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0200008RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0300008RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0400008RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500008RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT1001-150S51P12N": [
    { "code": "STT1001-A0100150RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200150RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000150RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100150RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200150RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000150RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700150RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100150RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0200150RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0300150RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0400150RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500150RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FTT3001-042S51P12N": [
    { "code": "STT3001-S0000042RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT3001-A0100042RX", "name": "ยึดท๊อปตัวบาก", "perUnit": 4 },
    { "code": "STT3001-A0200042RX", "name": "ยึดท๊อปตัวกลาง", "perUnit": 2 },
    { "code": "STT3001-A0300042RX", "name": "ยึดท๊อปตัวข้าง", "perUnit": 4 },
    { "code": "STT3001-L0100042RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT3001-L0200042RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT3001-R0000042RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT3001-B0200042MI", "name": "หน้าท๊อป", "perUnit": 2 },
    { "code": "STT3001-K0100042RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT3001-K0200042RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT3001-K0300042RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT3001-K0400042RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT3001-K0500042RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ],
  "FST7006-001P11P12N": [
    { "code": "SST7006-S0100001RX", "name": "ยันขาสั้น", "perUnit": 2 },
    { "code": "SST7006-S0200001RX", "name": "ยันขายาวคิกเพลท", "perUnit": 2 },
    { "code": "SST7006-A0100001RX", "name": "พนังยึดขา", "perUnit": 2 },
    { "code": "SST7006-A0200001RX", "name": "พนังยึดท๊อป", "perUnit": 2 },
    { "code": "SST7006-L0100001RX", "name": "ขาซ้าย 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-L0200001RX", "name": "ขาขวา 24\" คิกเพลท", "perUnit": 2 },
    { "code": "SST7006-B0000001RX", "name": "พื้นนั่ง/หัวเหลี่ยม", "perUnit": 1 }
  ],
  "FCH1001-004S21W12N": [
    { "code": "SCH1001-S0100004RX", "name": "ยันข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-S0200004RX", "name": "ยันข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-S0300004RX", "name": "ยันขาหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0100004RX", "name": "พนังหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0300004RX", "name": "พนังข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-A0400004RX", "name": "พนังข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-A0200004RX", "name": "พนังหลัง", "perUnit": 1 },
    { "code": "SCH1001-T0000004RX", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH1001-L0100004RX", "name": "ขาหน้าซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0200004RX", "name": "ขาหน้าขวา", "perUnit": 1 },
    { "code": "SCH1001-L0300004RX", "name": "ขาหลังซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0400004RX", "name": "ขาหลังขวา", "perUnit": 1 },
    { "code": "SCH1001-B0000004RX", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FTB7006-005S13H16N": [
    { "code": "STB7001-B0000005MA", "name": "หน้าท๊อปโต๊ะ (ขาว)", "perUnit": 1 },
    { "code": "STB7006-B0100005MA", "name": "พื้นนั่ง", "perUnit": 1 },
    { "code": "STB7006-A0100005RX", "name": "พนังยาวโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0200005RX", "name": "พนังสั้นโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-A0300005RX", "name": "พนังข้างเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-A0400005RX", "name": "พนังหน้าหลังเก้าอี้", "perUnit": 2 },
    { "code": "STB7006-L0100005RX", "name": "ขาซ้ายโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0200005RX", "name": "ขาขวาโต๊ะ", "perUnit": 1 },
    { "code": "STB7006-L0300005RX", "name": "ขาหน้าซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0400005RX", "name": "ขาหน้าขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0500005RX", "name": "ขาหลังซ้ายเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-L0600005RX", "name": "ขาหลังขวาเก้าอี้", "perUnit": 1 },
    { "code": "STB7006-T0000005RX", "name": "พิงหลัง", "perUnit": 1 }
  ],
  "FSH1086-080P11A05N": [
    { "code": "SSH1086-L0101080RX", "name": "ขาหน้าบน", "perUnit": 2 },
    { "code": "SSH1086-L0201080RX", "name": "ขาหลังบน", "perUnit": 2 },
    { "code": "SSH1086-S0101080RX", "name": "ยึดขาบน", "perUnit": 2 },
    { "code": "SSH1086-S0201080RX", "name": "ยึดแผ่นชั้น", "perUnit": 9 },
    { "code": "SSH1086-S0301080RX", "name": "ยึดแผ่นชั้นเจาะ", "perUnit": 1 },
    { "code": "SSH1086-S0401080RX", "name": "ยึดขาล่างบน", "perUnit": 2 },
    { "code": "SSH1086-L0301080RX", "name": "ขาหน้าล่าง", "perUnit": 2 },
    { "code": "SSH1086-L0401080RX", "name": "ขาหลังล่าง", "perUnit": 2 },
    { "code": "SSH1086-S0501080RX", "name": "ยึดขาล่างล่าง", "perUnit": 2 },
    { "code": "SSH1086-B0000080MI", "name": "ไม้ก้อน", "perUnit": 2 },
    { "code": "SSH1086-B0112080MI", "name": "แผ่นชั้น 1", "perUnit": 1 },
    { "code": "SSH1086-B0212080MI", "name": "แผ่นชั้น 2", "perUnit": 1 },
    { "code": "SSH1086-B0312080MI", "name": "แผ่นชั้น 3", "perUnit": 1 },
    { "code": "SSH1086-B0412080MI", "name": "แผ่นชั้น 4", "perUnit": 1 },
    { "code": "SSH1086-B0512080MI", "name": "แผ่นชั้น 5", "perUnit": 1 }
  ],
  "FSH1081-045P11A05N": [
    { "code": "SSH1081-S0101045RX", "name": "ยึดขาบนตัวบน", "perUnit": 2 },
    { "code": "SSH1081-S0201045RX", "name": "ยืดขาบนตัวกลาง", "perUnit": 2 },
    { "code": "SSH1081-S0301045RX", "name": "ยึดขาบนตัวล่าง", "perUnit": 2 },
    { "code": "SSH1081-L0301045RX", "name": "ขาหน้ากลาง", "perUnit": 2 },
    { "code": "SSH1081-L0401045RX", "name": "ขาหลังกลาง", "perUnit": 2 },
    { "code": "SSH1081-S0401045RX", "name": "ยึดขากลางตัวบน", "perUnit": 2 },
    { "code": "SSH1081-S0501045RX", "name": "ยึดขากลางตัวกลาง", "perUnit": 2 },
    { "code": "SSH1081-S0601045RX", "name": "ยึดขากลางตัวล่าง", "perUnit": 2 },
    { "code": "SSH1081-L0501045RX", "name": "ขาหน้าล่าง", "perUnit": 2 },
    { "code": "SSH1081-L0601045RX", "name": "ขาหลังล่าง", "perUnit": 2 },
    { "code": "SSH1081-S0701045RX", "name": "ยึดขาล่างตัวบน", "perUnit": 2 },
    { "code": "SSH1081-S0801045RX", "name": "ยึดขาล่างตัวกลาง", "perUnit": 2 },
    { "code": "SSH1081-S0901045RX", "name": "ยึดขาล่างตัวล่าง", "perUnit": 2 },
    { "code": "SSH1081-S1001045RX", "name": "ไม้ยึดหลัง", "perUnit": 3 },
    { "code": "SSH1081-S1101045RX", "name": "ไม้ยึดหลังเจาะ", "perUnit": 1 },
    { "code": "SSH1081-B0000045MI", "name": "ไม้ก้อน", "perUnit": 2 },
    { "code": "SSH1081-B0100045RX", "name": "แผ่นชั้น 1", "perUnit": 1 },
    { "code": "SSH1081-B0200045RX", "name": "แผ่นชั้น 2", "perUnit": 1 },
    { "code": "SSH1081-B0300045RX", "name": "แผ่นชั้น 3", "perUnit": 1 },
    { "code": "SSH1081-B0400045RX", "name": "แผ่นชั้น 4", "perUnit": 1 },
    { "code": "SSH1081-B0500045RX", "name": "แผ่นชั้น 5", "perUnit": 1 },
    { "code": "SSH1081-B0600045RX", "name": "แผ่นชั้น 6", "perUnit": 1 }
  ],
  "FCH1001-036P11A05": [
    { "code": "SCH1001-S0100036RF", "name": "ยันข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-S0200036RF", "name": "ยันข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-S0300036RF", "name": "ยันขาหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0100036RF", "name": "พนังหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0300036RF", "name": "พนังข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-A0400036RF", "name": "พนังข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-A0200036RF", "name": "พนังหลัง", "perUnit": 1 },
    { "code": "SCH1001-T0000036RF", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH1001-L0100036RF", "name": "ขาหน้าซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0200036RF", "name": "ขาหน้าขวา", "perUnit": 1 },
    { "code": "SCH1001-L0300036RF", "name": "ขาหลังซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0400036RF", "name": "ขาหลังขวา", "perUnit": 1 },
    { "code": "SCH1001-B0000036RF", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FCH1001-005P11A05": [
    { "code": "SCH1001-S0100005RF", "name": "ยันข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-S0200005RF", "name": "ยันข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-S0300005RF", "name": "ยันขาหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0100005RF", "name": "พนังหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0300005RF", "name": "พนังข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-A0400005RF", "name": "พนังข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-A0200005RF", "name": "พนังหลัง", "perUnit": 1 },
    { "code": "SCH1001-T0000005RF", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH1001-L0100005RF", "name": "ขาหน้าซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0200005RF", "name": "ขาหน้าขวา", "perUnit": 1 },
    { "code": "SCH1001-L0300005RF", "name": "ขาหลังซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0400005RF", "name": "ขาหลังขวา", "perUnit": 1 },
    { "code": "SCH1001-B0000005RF", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FCH1001-036S21A05": [
    { "code": "SCH1001-S0100036RF", "name": "ยันข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-S0200036RF", "name": "ยันข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-S0300036RF", "name": "ยันขาหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0100036RF", "name": "พนังหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0300036RF", "name": "พนังข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-A0400036RF", "name": "พนังข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-A0200036RF", "name": "พนังหลัง", "perUnit": 1 },
    { "code": "SCH1001-T0000036RF", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH1001-L0100036RF", "name": "ขาหน้าซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0200036RF", "name": "ขาหน้าขวา", "perUnit": 1 },
    { "code": "SCH1001-L0300036RF", "name": "ขาหลังซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0400036RF", "name": "ขาหลังขวา", "perUnit": 1 },
    { "code": "SCH1001-B0000036RF", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FCH1001-004S21A05F": [
    { "code": "SCH1001-S0100004RF", "name": "ยันข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-S0200004RF", "name": "ยันข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-S0300004RF", "name": "ยันขาหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0100004RF", "name": "พนังหน้า", "perUnit": 1 },
    { "code": "SCH1001-A0300004RF", "name": "พนังข้างซ้าย", "perUnit": 1 },
    { "code": "SCH1001-A0400004RF", "name": "พนังข้างขวา", "perUnit": 1 },
    { "code": "SCH1001-A0200004RF", "name": "พนังหลัง", "perUnit": 1 },
    { "code": "SCH1001-T0000004RF", "name": "พิงหลัง", "perUnit": 1 },
    { "code": "SCH1001-L0100004RF", "name": "ขาหน้าซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0200004RF", "name": "ขาหน้าขวา", "perUnit": 1 },
    { "code": "SCH1001-L0300004RF", "name": "ขาหลังซ้าย", "perUnit": 1 },
    { "code": "SCH1001-L0400004RF", "name": "ขาหลังขวา", "perUnit": 1 },
    { "code": "SCH1001-B0000004RF", "name": "พื้นนั่ง", "perUnit": 1 }
  ],
  "FTB5031-001S13H01F": [
    { "code": "STB5031-A0100001RF", "name": "พนังยาวใหญ่", "perUnit": 2 },
    { "code": "STB5031-A0200001RF", "name": "พนังยาวกลาง", "perUnit": 2 },
    { "code": "STB5031-A0300001RF", "name": "พนังยาวเล็ก", "perUnit": 2 },
    { "code": "STB5031-A0400001RF", "name": "พนังสั้นใหญ่", "perUnit": 2 },
    { "code": "STB5031-A0500001RF", "name": "พนังสั้นกลาง", "perUnit": 2 },
    { "code": "STB5031-A0600001RF", "name": "พนังสั้นเล็ก", "perUnit": 2 },
    { "code": "STB5031-L0100001RF", "name": "ขาใหญ่", "perUnit": 4 },
    { "code": "STB5031-L0200001RF", "name": "ขากลาง", "perUnit": 4 },
    { "code": "STB5031-L0300001RF", "name": "ขาเล็ก", "perUnit": 4 },
    { "code": "STB5031-C0000001RF", "name": "คอนเนอร์", "perUnit": 12 },
    { "code": "STB5031-B0100001RF", "name": "หน้าท๊อปใหญ่", "perUnit": 1 },
    { "code": "STB5031-B0200001RF", "name": "หน้าท๊อปกลาง", "perUnit": 1 },
    { "code": "STB5031-B0300001RF", "name": "หน้าท๊อปเล็ก", "perUnit": 1 }
  ],
  "FTB5051-075P11H01F": [
    { "code": "STB5051-B0000075RF", "name": "พื้นนั่ง 18\"", "perUnit": 1 },
    { "code": "STB5051-L0000075RF", "name": "ขา 18\"", "perUnit": 3 },
    { "code": "STB5051-S0000075RF", "name": "ยันขา 18\"", "perUnit": 3 }
  ],
  "FTT1001-150P41H01F": [
    { "code": "STT1001-A0100150RF", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200150RF", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000150RF", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100150RF", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200150RF", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000150RF", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700150RF", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FTT1001-008S21P12N": [
    { "code": "STT1001-A0100008RX", "name": "ท๊อปสั้น", "perUnit": 2 },
    { "code": "STT1001-A0200008RX", "name": "ท๊อปยาว", "perUnit": 2 },
    { "code": "STT1001-S0000008RX", "name": "ยันขา", "perUnit": 1 },
    { "code": "STT1001-L0100008RX", "name": "ขานอก", "perUnit": 2 },
    { "code": "STT1001-L0200008RX", "name": "ขาใน", "perUnit": 2 },
    { "code": "STT1001-R0000008RX", "name": "ไม้กลม", "perUnit": 1 },
    { "code": "STT1001-B1700008RX", "name": "หน้าท๊อป 17mm", "perUnit": 1 }
  ],
  "FSH3001-004P61B05N": [
    { "code": "SSH3001-S0100004RX", "name": "พนังยึดขา", "perUnit": 4 },
    { "code": "SSH3001-S0200004RX", "name": "คานรับไม้ระแนง", "perUnit": 4 },
    { "code": "SSH3001-H0000004RX", "name": "ไม้ระแนง", "perUnit": 26 },
    { "code": "SSH3001-L0000004RX", "name": "ขา", "perUnit": 4 }
  ],
  "FSH3001-005P61B05N": [
    { "code": "SSH3001-S0100005RX", "name": "พนังยึดขา", "perUnit": 4 },
    { "code": "SSH3001-S0200005RX", "name": "คานรับไม้ระแนง", "perUnit": 4 },
    { "code": "SSH3001-H0000005RX", "name": "ไม้ระแนง", "perUnit": 26 },
    { "code": "SSH3001-L0000005RX", "name": "ขา", "perUnit": 4 }
  ],
  "FTT1001-004S51L05N": [
    { "code": "STT1001-A0100004RX", "name": "ท๊อปสั้น", "perUnit": 4 },
    { "code": "STT1001-A0200004RX", "name": "ท๊อปยาว", "perUnit": 4 },
    { "code": "STT1001-S0000004RX", "name": "ยันขา", "perUnit": 2 },
    { "code": "STT1001-L0100004RX", "name": "ขานอก", "perUnit": 4 },
    { "code": "STT1001-L0200004RX", "name": "ขาใน", "perUnit": 4 },
    { "code": "STT1001-R0000004RX", "name": "ไม้กลม", "perUnit": 2 },
    { "code": "STT1001-B1700004RX", "name": "หน้าท๊อป 17mm", "perUnit": 2 },
    { "code": "STT1001-K0100004RX", "name": "เสาแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0200004RX", "name": "แขนแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0300004RX", "name": "ฐานแร็ค", "perUnit": 2 },
    { "code": "STT1001-K0400004RX", "name": "ยันขาแร็ค", "perUnit": 1 },
    { "code": "STT1001-K0500004RX", "name": "มือจับแร็ค", "perUnit": 1 }
  ]
      }
    }
  },
  mounted() { this.fetchData() },
  methods: {
    async fetchData(force = false) {
      this.loading = true
      try {
        const urlPlan = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUfe59fFqNK3a6yzya8ZB4W_2dqqBg0c_06ZpH3QQ65J53FfxoEO5iPFW9LEksMEexwLOx0XTb5UcF/pub?output=csv"
        const urlStock = "https://docs.google.com/spreadsheets/d/e/2PACX-1vShU_0KepJ0kBsIYP6zPhKVuZEE4TbCDyvx81yzPMBbdtO3SJp1kf1bRc4hbFfs4ErULD0oDyK39CkE/pub?output=csv"
        const [resPlan, resStock] = await Promise.all([axios.get(urlPlan), axios.get(urlStock)])
        
        const sLines = resStock.data.split(/\r?\n/)
        this.stockMap = {}
        sLines.forEach((line, i) => {
          if (i === 0) return
          const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          const partCode = (cols[1] || "").replace(/"/g, '').trim()
          const rawStock = (cols[7] || "0").replace(/[",]/g, '').trim()
          if (partCode) { this.stockMap[partCode] = parseInt(rawStock) || 0 }
        })

        const pLines = resPlan.data.split(/\r?\n/)
        this.allPlans = pLines.slice(1).map(line => {
          const c = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          if (!c[3]) return null
          const poStatus = (c[1] || "").replace(/"/g, '').trim()
          const poLabel = (c[2] || "").replace(/"/g, '').trim()
          const sap = (c[3] || "").replace(/"/g, '').trim()
          const name = (c[6] || "").replace(/"/g, '').trim()
          if (poStatus.toUpperCase().includes("PO") || name.toUpperCase().includes("ติด PO")) return null
          return { po: poLabel, sap, name, color: (c[7] || "").replace(/"/g, '').trim(), qty: parseInt((c[8] || "0").replace(/[",]/g, '')) || 0, display: `PO: ${poLabel} | SAP: ${sap} | ${name}` }
        }).filter(v => v !== null)
        this.filteredOptions = this.allPlans
      } catch (err) { console.error(err) } finally { this.loading = false }
    },
    filterPlans() {
      const term = this.searchTerm.toUpperCase()
      this.filteredOptions = this.allPlans.filter(p => p.display.toUpperCase().includes(term))
    },
    calculateBOM(val) {
      if (!val) { this.tableData = []; this.targetQty = 0; return }
      this.targetQty = val.qty
      const components = this.bomDatabase[val.sap] || []
      
      // แก้ไขตรงนี้: นำ .filter ออกเพื่อให้แสดงทุกรายการแม้สต็อกจะพอ
      this.tableData = components.map(item => {
        const totalNeed = item.perUnit * this.targetQty
        const stockActual = this.stockMap[item.code] || 0
        const toProduce = Math.max(0, totalNeed - stockActual)
        return { partCode: item.code, itemName: item.name, perUnit: item.perUnit, totalNeed, stock: stockActual, toProduce }
      })
    },
    printOrder() { window.print() }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');

.target-card-fixed {
  background: #f8f8ff; border: 2px solid #7367f0; border-radius: 12px; padding: 10px; text-align: center; min-height: 110px; display: flex; flex-direction: column; justify-content: center;
  .target-label { font-size: 0.8rem; font-weight: 600; color: #5e5873; }
  .target-value { font-size: 2.5rem; font-weight: 800; line-height: 1; }
}

.table-bom {
  width: 100%; border-collapse: collapse;
  th, td { border: 1px solid #dae1e7; padding: 8px; vertical-align: middle; font-size: 0.85rem; }
  th { background-color: #5d5fef; color: white; text-align: center; }
  .bg-gray-light { background-color: #f8f8f8; }
}

.print-only { display: none; }

@media print {
  /* กฎเหล็ก: ซ่อน Sidebar และ Navbar ของ Template เดิมทิ้งทั้งหมด */
  .main-menu, .header-navbar, .footer, .no-print, .horizontal-menu-wrapper, nav, aside {
    display: none !important;
  }

  body * { visibility: hidden; }
  #print-isolation-layer, #print-isolation-layer * { visibility: visible; }

  #print-isolation-layer {
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  .print-header-info { display: flex; justify-content: space-between; margin-bottom: 10px; p { margin: 0; font-size: 11pt; color: black; } }
  .print-target-banner { width: 100%; border: 2px solid #000; background-color: #f2f2f2 !important; text-align: center; font-size: 1.4rem; font-weight: bold; padding: 10px; -webkit-print-color-adjust: exact; }
  .table-print { width: 100%; border-collapse: collapse; th, td { border: 1.5px solid #000 !important; padding: 6px 4px; font-size: 10pt; color: black !important; } th { background-color: #eee !important; text-align: center; -webkit-print-color-adjust: exact; } .bg-print-gray { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; } }

  @page { size: A4 portrait; margin: 1cm; }
}
</style>