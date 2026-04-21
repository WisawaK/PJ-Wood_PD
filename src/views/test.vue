<template>
  <div class="demo-spacing-0">
    <b-pagination
      v-model="currentPage"
      :total-rows="rows"
      first-number
      last-number
      prev-class="prev-item"
      next-class="next-item"
    >
      <template #prev-text>
        <feather-icon
          icon="ChevronLeftIcon"
          size="18"
        />
      </template>
      <template #next-text>
        <feather-icon
          icon="ChevronRightIcon"
          size="18"
        />
      </template>
    </b-pagination>
  </div>
</template>

<script>
import { BPagination } from 'bootstrap-vue'

export default {
  components: {
    BPagination,
  },
  data: () => ({
    currentPage: 1,
    perPage: 1,
    rows: 200,
  }),
}
</script>
 