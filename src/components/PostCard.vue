<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "../supabase";

const props = defineProps({
  idea: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["updated"]);
const hasLiked = ref(false);
const isLoading = ref(false);
const currentUser = ref(null);

onMounted(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  currentUser.value = user;
  if (!user) return;

  const { data, error } = await supabase
    .from("idea_likes")
    .select("id")
    .eq("idea_id", props.idea.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error checking idea like:", error.message);
    return;
  }

  hasLiked.value = Boolean(data);
});

const handleLike = async () => {
  if (isLoading.value) return;

  if (!currentUser.value) {
    alert("「やりたい」を押すにはログインが必要です。");
    return;
  }

  isLoading.value = true;

  if (hasLiked.value) {
    const { error: unlikeError } = await supabase
      .from("idea_likes")
      .delete()
      .eq("idea_id", props.idea.id)
      .eq("user_id", currentUser.value.id);

    if (unlikeError) {
      alert("エラーが発生しました: " + unlikeError.message);
      isLoading.value = false;
      return;
    }

    const { error: countError } = await supabase
      .from("ideas")
      .update({ likes: Math.max((props.idea.likes || 0) - 1, 0) })
      .eq("id", props.idea.id);

    if (countError) {
      await supabase.from("idea_likes").insert({
        idea_id: props.idea.id,
        user_id: currentUser.value.id,
      });
      alert("エラーが発生しました: " + countError.message);
    } else {
      hasLiked.value = false;
      emit("updated");
    }
    isLoading.value = false;
    return;
  }

  const { error: likeError } = await supabase.from("idea_likes").insert({
    idea_id: props.idea.id,
    user_id: currentUser.value.id,
  });

  if (likeError) {
    if (likeError.code === "23505") {
      hasLiked.value = true;
    } else {
      alert("エラーが発生しました: " + likeError.message);
    }
    isLoading.value = false;
    return;
  }

  const { error } = await supabase
    .from("ideas")
    .update({ likes: (props.idea.likes || 0) + 1 })
    .eq("id", props.idea.id);

  if (error) {
    await supabase
      .from("idea_likes")
      .delete()
      .eq("idea_id", props.idea.id)
      .eq("user_id", currentUser.value.id);
    alert("エラーが発生しました: " + error.message);
  } else {
    hasLiked.value = true;
    emit("updated");
  }
  isLoading.value = false;
};
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
    <div
      v-if="idea.url"
      class="card-link"
    >
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
</template>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  background-color: #f59e0b;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
}

.like-btn:hover {
  background-color: #e2e8f0;
}

.like-btn.is-liked {
  background-color: #cbd5e0;
  color: #718096;
}

.like-btn:disabled {
  cursor: not-allowed;
}
</style>
