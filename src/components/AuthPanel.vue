<script setup>
defineProps({
  user: { type: Object, default: null },
  profile: { type: Object, default: null },
  displayName: { type: String, default: "Discordユーザー" },
  loading: { type: Boolean, default: false },
  authError: { type: String, default: "" },
});
defineEmits(["sign-in", "sign-out"]);
</script>
<template>
  <aside class="auth-column">
    <div v-if="loading"><p>ログイン状態を確認中...</p></div>
    <div v-else-if="user" class="profile-panel">
      <img
        :src="
          profile?.avatar_url ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          'https://cdn.discordapp.com/embed/avatars/0.png'
        "
        alt="Avatar"
        width="80"
        height="80"
      />
      <h2>{{ displayName }}</h2>
      <p class="user-id">ID: {{ user.id }}</p>
      <button class="sign-out-button" @click="$emit('sign-out')">
        ログアウト
      </button>
    </div>
    <div v-if="!loading && !user" class="login-panel">
      <p v-if="authError" class="auth-error" role="alert">
        ログインに失敗しました: {{ authError }}
      </p>
      <p>ご利用にはログインが必要です。</p>
      <button class="discord-button" @click="$emit('sign-in')">
        Discordでログイン
      </button>
    </div>
  </aside>
</template>
<style scoped>
.auth-column {
  flex: 0 1 360px;
  width: 100%;
  max-width: 360px;
  margin: 40px 0;
  text-align: center;
}
.profile-panel,
.login-panel {
  width: 100%;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-sizing: border-box;
}
img {
  border-radius: 50%;
  object-fit: cover;
}
h2 {
  margin: 15px 0;
}
.user-id {
  font-size: 0.8em;
  color: var(--text);
}
button {
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}
.sign-out-button {
  margin-top: 10px;
}
.discord-button {
  background: #5865f2;
  color: #fff;
  border: 0;
  border-radius: 4px;
  font-weight: bold;
}
.auth-error {
  color: #c0392b;
}
@media (max-width: 760px) {
  .auth-column {
    margin-top: 0;
  }
}
</style>
