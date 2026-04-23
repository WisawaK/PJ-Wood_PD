 
<template>

   <b-row>
    <!-- basic select -->
    <b-col md="6">
      <h6>Basic Select</h6>
      <b-card-text>
        <code>vue-select</code>
        <span> accepts arrays of primitive values or objects to use as </span>
        <code>options</code>
        <span> through the options prop:</span>
      </b-card-text>

      <b-form-group>
        <v-select
          v-model="selected"
          :dir="$store.state.appConfig.isRTL ? 'rtl' : 'ltr'"
          label="title"
          :options="option"
        />
      </b-form-group>
    </b-col>


  </b-row>
</template>

<script>
import { BRow, BCol, BFormGroup } from 'bootstrap-vue'
import vSelect from 'vue-select'

export default {
  components: {
    BRow,
    BCol,
    BFormGroup,
    vSelect,
  },
  data() {
    return {
    }
  },
}
</script>

<style lang="scss">
@import '@core/scss/vue/libs/vue-select.scss';
</style>
 