<script setup>
import { useIdeaLike } from "../composables/useIdeaLike";
import { useIdeaDelete } from "../composables/useIdeaDelete";

const props = defineProps({
  idea: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["updated"]);
const { hasLiked, isLoading, handleLike } = useIdeaLike(props.idea, () =>
  emit("updated"),
);
const {
  canDelete,
  isLoading: isDeleting,
  errorMessage,
  handleDelete,
} = useIdeaDelete(props.idea, () => emit("updated"));
</script>

<template>
  <div class="card">
    <div class="card-header">
      <h3 class="idea-title">
        {{ idea.title }}
      </h3>
      <span class="user-name">
        by {{ idea.display_name || "Discordユーザー" }}
      </span>
    </div>

    <!-- 🔗 URLが存在する場合のみリンク枠を表示 -->
    <div v-if="idea.url" class="card-link">
      <a
        :href="idea.url"
        target="_blank"
        rel="noopener noreferrer"
        class="url-btn"
      >
        🔗 関連リンクを開く
      </a>
    </div>

    <div class="card-footer">
      <div class="card-actions">
        <button
          v-if="canDelete"
          class="delete-btn"
          :disabled="isDeleting"
          @click="handleDelete"
        >
          {{ isDeleting ? "削除中..." : "削除" }}
        </button>
        <button
          class="like-btn"
          :class="{ 'is-liked': hasLiked }"
          :disabled="isLoading"
          @click="handleLike"
        >
          {{ hasLiked ? "キャンセル" : "🙌 やりたい！" }}
          <span class="like-count">{{ idea.likes }}</span>
        </button>
      </div>
    </div>
    <p v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped src="../styles/PostCard.css"></style>
