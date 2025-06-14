<template>
  <h2 class="font-bold text-left">window.tron,需要在Tron browser 中运行</h2>
  <div class="mt-8 flex flex-col gap-y-2 items-center"> 
    <van-button type="primary" class="w-[200px]" size="small" @click="startConnect">Connect</van-button>
    <van-button size="small" class="w-[200px]" @click="Signature">sign transaction</van-button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const timer = ref<number>()
const tron = ref(null)
const tronWeb = ref(null)

onMounted(() => {
  console.log('onMounted');
  timer.value = setInterval(() => {
    initialize()
  }, 2000)
})

const initialize = () => {
  console.log('initialize')
  if(tron.value){
    clearInterval(timer.value)
    return
  }
  tron.value = window.tron;
  tronWeb.value = tron.value?.tronWeb;
}

const startConnect = () => {
  if(!tron.value) {
    return
  }
}

const Signature = async () => {
  const signedTx = await tronWeb.value.trx.sign(tx);
  console.log(signedTx)
  await tronWeb.value.trx.sendRawTransaction(signedTx);
}

</script>
