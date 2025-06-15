<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">TronLink 钱包连接示例</h1>
    <div v-if="!isConnected" class="flex flex-col items-center">
      <p class="mb-4 text-gray-600">请点击按钮连接 TronLink 钱包</p>
      <button 
        @click="connectWallet" 
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
      >
        连接钱包
      </button>
    </div>
    
    <div v-else class="bg-gray-100 p-6 rounded-lg">
      <div class="flex flex-col items-center justify-between mb-4">
        <div>
          <p class="text-sm text-gray-500">当前账户</p>
          <p class="text-lg font-medium truncate max-w-xs break-all">{{ currentAddress }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">余额</p>
          <p class="text-lg font-medium">{{ balance }} TRX</p>
        </div>
      </div>
      
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-3">转账</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">接收地址</label>
            <input 
              v-model="transferTo" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">金额 (TRX)</label>
            <input 
              v-model.number="transferAmount" 
              type="number" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
        </div>
        <button 
          @click="sendTransaction" 
          class="mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all"
          :disabled="!transferTo || transferAmount <= 0"
        >
          发送转账
        </button>
      </div>
      
      <div v-if="transactionResult" class="mt-6 p-4 bg-green-100 rounded-lg">
        <p class="font-medium">交易成功!</p>
        <p class="text-sm">交易哈希: <a href="https://tronscan.org/#/transaction/{{ transactionResult.txid }}" target="_blank" class="text-blue-600">{{ transactionResult.txid }}</a></p>
      </div>
      
      <div v-if="errorMessage" class="mt-6 p-4 bg-red-100 rounded-lg">
        <p class="font-medium text-red-800">错误: {{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 状态管理
const isConnected = ref(false);
const currentAddress = ref('');
const balance = ref(0);
const transferTo = ref('');
const transferAmount = ref(0);
const transactionResult = ref<{txid: string}|null>(null);
const errorMessage = ref('');

// 检测 TronLink 是否安装
const isTronLinkInstalled = () => {
  return typeof window.tron !== 'undefined' && window.tron.tronWeb;
};

// 连接钱包
const connectWallet = async () => {
  try {
    errorMessage.value = '';
    
    if (!isTronLinkInstalled()) {
      throw new Error('请安装并解锁 TronLink 钱包扩展');
    }
    
    // 请求账户权限
    const accounts = await window.tron.request({ method: 'tron_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('用户拒绝授权');
    }
    // 切换到测试网
    await window.tron.tronWeb.setProvider('https://shasta.tronex.io/');

    // 更新状态
    currentAddress.value = window.tron.tronWeb.defaultAddress.base58;
    isConnected.value = true;
    
    // 获取余额
    await fetchBalance();
    
    // 设置账户变化监听
    setupAccountListener();
  } catch (error: any) {
    errorMessage.value = error.message || '连接钱包失败';
    console.error('连接错误:', error);
  }
};

// 获取账户余额
const fetchBalance = async () => {
  try {
    if (!isTronLinkInstalled() || !currentAddress.value) return;
    
    const tronWeb = window.tron.tronWeb;
    const balanceInSun = await tronWeb.trx.getBalance(currentAddress.value);
    balance.value = parseFloat(tronWeb.fromSun(balanceInSun));
  } catch (error: any) {
    errorMessage.value = '获取余额失败';
    console.error('获取余额错误:', error);
  }
};

// 设置账户变化监听
const setupAccountListener = () => {
  if (!window.tron) return;
  
  // 账户变化事件
  window.tron.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length > 0) {
      currentAddress.value = accounts[0];
      fetchBalance();
    } else {
      isConnected.value = false;
      currentAddress.value = '';
      balance.value = 0;
    }
  });
  
  // 网络变化事件
  window.tron.on('networkChanged', (networkId: string) => {
    console.log('网络已切换:', networkId);
    fetchBalance(); // 网络切换后重新获取余额
  });
};

// 发送交易
const sendTransaction = async () => {
  try {
    errorMessage.value = '';
    transactionResult.value = null;
    
    if (!isTronLinkInstalled() || !isConnected.value) {
      throw new Error('请先连接钱包');
    }
    
    if (!transferTo.value || transferAmount.value <= 0) {
      throw new Error('请输入有效的接收地址和金额');
    }
    
    const tronWeb = window.tron.tronWeb;
    const amountInSun = tronWeb.toSun(transferAmount.value);
    
    // 构建交易
    const transaction = await tronWeb.transactionBuilder.sendTrx(
      transferTo.value,
      amountInSun,
      currentAddress.value
    );
    
    // 签名并广播交易
    const signedTx = await tronWeb.trx.sign(transaction);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);
    
    if (result.result) {
      transactionResult.value = result;
      // 交易成功后刷新余额
      setTimeout(() => fetchBalance(), 2000);
    } else {
      throw new Error('交易失败');
    }
  } catch (error: any) {
    errorMessage.value = error.message || '转账失败';
    console.error('转账错误:', error);
  }
};

// 组件挂载时检测钱包状态
onMounted(() => {
  if (isTronLinkInstalled()) {
    // 检查是否已有授权账户
    if (window.tron.tronWeb.defaultAddress.base58) {
      currentAddress.value = window.tron.tronWeb.defaultAddress.base58;
      isConnected.value = true;
      fetchBalance();
      setupAccountListener();
    }
  }
});
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>