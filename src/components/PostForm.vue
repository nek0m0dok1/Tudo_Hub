<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'

// 親コンポーネントへ送信完了を伝えるイベント定義
const emit = defineEmits(['posted'])

const title = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!title.value.trim()) return

  isLoading.value = true

  const { data: { user } } = await supabase.auth.getUser()
  const discordUsername = user?.user_metadata?.user_name
    || user?.user_metadata?.name
    || user?.user_metadata?.full_name
    || '名無し'

  // Supabase の ideas テーブルへ insert 処理
  const { error } = await supabase.from('ideas').insert([
    {
      title: title.value.trim(),
      user_name: discordUsername,
    },
  ])

  isLoading.value = false

  if (error) {
    alert('投稿に失敗しました: ' + error.message)
    console.error(error)
  } else {
    // フォームのリセット
    title.value = ''
    
    // 親コンポーネントへイベント通知（一覧の再取得などを促す）
    emit('posted')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="idea-form">
    <div class="form-group">
      <label for="title">やりたいこと (必須)</label>
      <input
        id="title"
        v-model="title"
        type="text"
        placeholder="例: ねこもどきをフルボッコにするゲーム"
        required
        :disabled="isLoading"
      />
    </div>

    <button type="submit" :disabled="isLoading">
      {{ isLoading ? '送信中...' : 'ゲームを提案する！' }}
    </button>
  </form>
</template>

<style scoped>
.idea-form {
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 4px;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}

button:disabled {
  background-color: #a0d9bb;
  cursor: not-allowed;
}
</style>