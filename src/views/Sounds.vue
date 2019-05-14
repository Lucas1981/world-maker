<template>
  <div>
    <button class="btn btn-primary mx-1" @click="loadSoundFileProxy($event)" v-blur>Load sound</button>
    <input type="file" class="d-none" ref="imageLoadSelection" @change="handleFile($event)"></button>

    <div class="mt-2 row">
      <div v-for="(sound, index) of sounds" class="col-3">
        <div class="card mt-1">
          <div class="card-body">
            <div class="my-1">
              <input type="text" class="form-control" v-model="sound.key" />
              <!-- Audio source doesn't seem to update without a hard v-if retriggering initiation -->
              <audio v-if="!refresh" class="mt-2" controls>
                <source :src="sound.sound" />
              </audio>
              <button class="btn btn-danger btn-sm ml-1" @click="removeSound(index)" v-blur>Remove sound</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import FileHandler from '../classes/FileHandler';

@Component
export default class Sounds extends Vue {
  public get sounds(): object { return this.$store.getters.sounds; }
  public refresh: boolean = false;

  public async handleFile(event: object): void {
    const result: string = await FileHandler.handleSoundFile(event);
    this.$store.commit('addSound', {
      key: `new-sound${Object.keys(this.sounds).length}`,
      sound: result
    });
  }

  public removeSound(index) {
    this.$store.commit('removeSound', index);
    // Make sure the audio files are reinitiated
    this.refresh = true;
    this.$nextTick(() => this.refresh = false);
  }

  public loadSoundFileProxy(event: object): void {
    const imageLoadSelectionPointer: any = this.$refs.imageLoadSelection;
    imageLoadSelectionPointer.click();
  }
}
</script>
