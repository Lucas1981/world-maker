<template>
  <div>
    <!-- Modal -->
    <div class="modal fade" :ref="modalRef" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">{{ modalTitle }}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="onFirstButtonClick()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="onFirstButtonClick()">Cancel</button>
            <button type="button" class="btn btn-primary" data-dismiss="modal" @click="onSecondButtonClick()">Ok</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import $ from 'jquery';

@Component({
  name: 'Modal'
})
export default class Modal extends Vue {

  @Prop({ default: '' })
  open: boolean

  @Prop({ default: '' })
  modalRef: string

  @Prop({ default: '' })
  modalTitle: string

  @Watch('open')
  onPropertyChanged(value: any) {
    if(value === true) {
      $(this.$refs[this.modalRef]).modal('show');
    }
  }

  public onFirstButtonClick() {
    this.$emit('modal-close', false);
    $(this.$refs[this.modalRef]).modal('hide');
  }

  public onSecondButtonClick() {
    this.$emit('modal-close', true);
    $(this.$refs[this.modalRef]).modal('hide');
  }
}
</script>
