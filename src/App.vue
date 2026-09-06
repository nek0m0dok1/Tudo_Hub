<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "./supabase";

// 認証ユーザー情報（Supabase Auth）
const user = ref(null);
// データベースから取得したプロフィール（public.profiles）
const profile = ref(null);
// ローディング状態（初期値 true）
const loading = ref(true);

// 編集機能用変数
const isEditing = ref(false);
const newUsername = ref("");
const updateLoading = ref(false);

// プロフィール情報の取得
const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single();

    if (error) throw error;
    profile.value = data;
    newUsername.value = data.username;
  } catch (error) {
    console.error("Error fetching profile:", error.message);
  }
};

// 初期化および認証状態の監視（ログイン保持の核心部分）
onMounted(async () => {
  // 1. 認証状態の変化を監視するリスナーを登録
  // ※Supabaseは自動でlocalStorageからセッションを復元し、INITIAL_SESSIONイベントを発行します
  supabase.auth.onAuthStateChange(async (event, session) => {
    user.value = session?.user ?? null;

    if (user.value) {
      await fetchProfile(user.value.id);
    } else {
      profile.value = null;
    }

    // セッション判定とプロフィール取得が完了したタイミングでローディングを解除
    loading.value = false;
  });
});

// プロフィール（ユーザー名）更新処理
const updateProfile = async () => {
  if (!newUsername.value.trim()) return;

  try {
    updateLoading.value = true;
    const { error } = await supabase
      .from("profiles")
      .update({
        username: newUsername.value,
        updated_at: new Date(),
      })
      .eq("id", user.value.id);

    if (error) throw error;

    profile.value.username = newUsername.value;
    isEditing.value = false;
  } catch (error) {
    console.error("Error updating profile:", error.message);
    alert("更新に失敗しました");
  } finally {
    updateLoading.value = false;
  }
};

// Discord ログイン処理
const signInWithDiscord = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) console.error("Error logging in:", error.message);
};

// ログアウト処理（ローカルストレージのセッション情報を自動破棄）
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Error logging out:", error.message);
};
</script>

<template>
  <div
    style="
    width: 90%;
      margin: 40px auto;
      font-family: sans-serif;
      text-align: center;
      max-width: 500px;
    font-family: sans-serif;
    "
  >
    <h1>Game Inbox</h1>

    <!-- 読込中（セッション復元待ち） -->
    <div v-if="loading">
      <p>ログイン状態を確認中...</p>
    </div>

    <!-- ログイン済み -->
    <div
      v-else-if="user"
      style="border: 1px solid #ccc; padding: 20px; border-radius: 8px"
    >
      <template v-if="profile">
        <img
          :src="profile.avatar_url"
          alt="Avatar"
          width="80"
          height="80"
          style="border-radius: 50%; object-fit: cover"
        />

        <div style="margin: 15px 0">
          <div v-if="!isEditing">
            <h2>{{ profile.username }}</h2>
            <button
              @click="isEditing = true"
              style="font-size: 0.8em; cursor: pointer"
            >
              ユーザー名を変更
            </button>
          </div>

          <div
            v-else
            style="
              display: flex;
              gap: 8px;
              justify-content: center;
              align-items: center;
            "
          >
            <input
              v-model="newUsername"
              type="text"
              placeholder="新しいユーザー名"
              style="padding: 6px; border-radius: 4px; border: 1px solid #ccc"
            />
            <button
              @click="updateProfile"
              :disabled="updateLoading"
              style="padding: 6px 12px; cursor: pointer"
            >
              保存
            </button>
            <button
              @click="isEditing = false"
              style="padding: 6px 12px; cursor: pointer"
            >
              キャンセル
            </button>
          </div>
        </div>
      </template>

      <p style="font-size: 0.8em; color: #666">ID: {{ user.id }}</p>

      <button
        @click="signOut"
        style="padding: 8px 16px; cursor: pointer; margin-top: 10px"
      >
        ログアウト
      </button>
    </div>

    <!-- 未ログイン -->
    <div
      v-else
      style="border: 1px solid #ccc; padding: 20px; border-radius: 8px"
    >
      <p>アプリを利用するにはログインしてください。</p>
      <button
        @click="signInWithDiscord"
        style="
          padding: 10px 20px;
          background-color: #5865f2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        "
      >
        <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="white">
          <path
            d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.91-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.8,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.11,53,91.08,65.69,84.69,65.69Z"
          />
        </svg>
        Discordでログイン
      </button>
    </div>
  </div>
</template>
