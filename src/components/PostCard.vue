<script setup>
import { supabase } from '../supabase'

const props = defineProps({
  idea: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['updated'])

const handleLike = async () => {
  const { error } = await supabase
    .from('ideas')
    .update({ likes: props.idea.likes + 1 })
    .eq('id', props.idea.id)

  if (error) {
    alert('エラーが発生しました: ' + error.message)
  } else {
    emit('updated')
  }
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h3 class="idea-title">{{ idea.title }}</h3>
      <span class="user-name">by {{ idea.user_name || 'John Doe' }}</span>
    </div>

    <!-- 🔗 URLが存在する場合のみリンク枠を表示 -->
    <div v-if="idea.url" class="card-link">
      <a :href="idea.url" target="_blank" rel="noopener noreferrer" class="url-btn">
        🔗 関連リンクを開く
      </a>
    </div>
    
    <div class="card-footer">
      <button @click="handleLike" class="like-btn">
        🙌 やりたい！ <span class="like-count">{{ idea.likes }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.idea-title {
  margin: 0;
  font-size: 1.1rem;
  word-break: break-word;
}

.user-name {
  font-size: 0.85rem;
  color: #666;
}

/* URL用スタイル */
.card-link {
  margin-bottom: 12px;
}

.url-btn {
  display: inline-block;
  font-size: 0.85rem;
  color: #3182ce;
  text-decoration: none;
  background-color: #ebf8ff;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all; /* 長いURLの溢れ防止 */
  transition: background-color 0.2s;
}

.url-btn:hover {
  background-color: #bee3f8;
  text-decoration: underline;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.like-btn {
  background-color: #edf2f7;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
}

.like-btn:hover {
  background-color: #e2e8f0;
}
</style>