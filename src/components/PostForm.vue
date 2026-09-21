<script setup>
import { useIdeaForm } from "../composables/useIdeaForm";

const props = defineProps({
  teamId: {
    type: String,
    required: true,
  },
});

// 親コンポーネントへ送信完了を伝えるイベント定義
const emit = defineEmits(["posted"]);

const { title, url, isLoading, handleSubmit } = useIdeaForm(props.teamId, () =>
  emit("posted"),
);
</script>

<template>
  <form class="idea-form" @submit.prevent="handleSubmit">
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

    <div class="form-group">
      <label for="url">関連URL (任意)</label>
      <input
        id="url"
        v-model="url"
        type="url"
        placeholder="https://example.com"
        :disabled="isLoading"
      />
    </div>

    <button type="submit" :disabled="isLoading">
      {{ isLoading ? "送信中..." : "ゲームを提案する！" }}
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
