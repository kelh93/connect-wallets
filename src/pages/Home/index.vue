<template>
  <div class="mx-auto p-2">
    <h1 class="text-base font-bold mb-4">TronLink 钱包连接示例</h1>
    <div v-if="!isConnected" class="flex flex-col items-center">
      <p class="text-sm mb-4 text-gray-600">请点击按钮连接 TronLink 钱包</p>
      <van-button 
        @click="connectWallet" 
        size="small"
        type="primary"
        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
      >
        连接钱包
      </van-button>
    </div>
    
    <div v-else class="bg-gray-100 p-3 rounded-lg">
      <div class="text-sm mb-4">
        <div class="text-sm flex items-center mb-4">
          <p class="text-gray-500">当前账户</p>
          <p class="font-medium truncate max-w-xs break-all">{{ getShortAddress(currentAddress) }}</p>
        </div>
        <div class="flex items-center">
          <van-field v-model="balance" label="余额(TRX)" disabled />
        </div>
      </div>
      
      <div class="mt-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <van-field class="text-sm" v-model="transferTo" label="转账接收地址" placeholder="请输入" />
          </div>
          <div>
            <van-field v-model="transferAmount" label="金额 (TRX)" placeholder="请输入" />
          </div>
        </div>
        <van-button 
          @click="sendTransaction" 
          size="small"
          type="primary"
          class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all"
          :disabled="!transferTo || transferAmount <= 0"
        >
          发送转账
        </van-button>
      </div>
      
      <div v-if="transactionResult" class="mt-6 p-4 bg-green-100 rounded-lg">
        <p class="font-medium">交易成功!</p>        
        <van-field v-model="transactionResult.txid" label="交易哈希" placeholder="请输入">
          <template #button>
            <van-button @click="copyTransactionHash" type="primary" size="small" class="ml-2">
              COPY
            </van-button>
          </template>
        </van-field>
        <!-- <p class="text-sm break-all">
          测试网交易哈希: <a class="text-blue-600">{{ transactionResult.txid }}</a>
          <span class="ml-2 text-sm text-gray-500 cursor-pointer" @click="copyTransactionHash">copy</span>
        </p> -->
      </div>
      <div v-if="errorMessage" class="mt-6 p-4 bg-red-100 rounded-lg">
        <p class="font-medium text-red-800">错误: {{ errorMessage }}</p>
      </div>
      <!-- 输入地址查询余额 -->
       <div class="mt-6">
        <van-field v-model="transferTo" label="查询余额地址" placeholder="请输入" />
        <van-button @click="queryBalance" size="small" type="primary" class="ml-2">
          查询余额
        </van-button>
      </div>
      <!-- 查询余额结果 -->
      <div v-if="queryResult" class="mt-6 p-4 bg-green-100 rounded-lg">
        <p class="font-medium">查询余额成功!</p>
        <van-field v-model="queryResult.balance" label="余额(TRX)" disabled />
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 状态管理
const isConnected = ref(true);
const currentAddress = ref('');
const balance = ref(0);
const transferTo = ref('TDM4ZhQSHkRj71VR6uF9mCAuVK2KN9VEUn');
const transferAmount = ref(0);
const transactionResult = ref<{txid: string}|null>(null);
const errorMessage = ref('');
const queryResult = ref<{address: string, balance: number}>({
  address: '',
  balance: 0
});

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

// 复制交易哈希
const copyTransactionHash = async () => {
  if (!transactionResult.value) return;
  try {
    await navigator.clipboard.writeText(transactionResult.value.txid);
    alert('交易哈希已复制');
  } catch (error) {
    console.error('复制哈希错误:', error);
    alert('复制哈希失败');
  }
};

const getShortAddress = (address: string) => {
  if (!address) return '';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

const queryBalance = async () => {
  try {
    if (!transferTo.value) {
      throw new Error('请输入查询地址');
    }
    const tronWeb = window.tron.tronWeb;
    const balanceInSun = await tronWeb.trx.getBalance(transferTo.value);
    queryResult.value = {
      address: transferTo.value,
      balance: parseFloat(tronWeb.fromSun(balanceInSun))
    };
  } catch (error: any) {
    errorMessage.value = error.message || '查询余额失败';
    console.error('查询余额错误:', error);
  }
}

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