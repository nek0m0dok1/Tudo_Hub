<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { supabase } from "./supabase";
import PostForm from "./components/PostForm.vue";

// 認証ユーザー情報（Supabase Auth）
const user = ref(null);
const session = ref(null);
// データベースから取得したプロフィール（public.profiles）
const profile = ref(null);
// ローディング状態（初期値 true）
const loading = ref(true);

// プロフィール情報の取得
const fetchProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (error) throw error;
    profile.value = data;
  } catch (error) {
    console.error("Error fetching profile:", error.message);
  }
};

// 初期化および認証状態の監視
let removeAuthListener;

const applySession = async (nextSession) => {
  session.value = nextSession;
  user.value = nextSession?.user ?? null;

  if (user.value) {
    await fetchProfile(user.value.id);
  } else {
    profile.value = null;
  }

  loading.value = false;
};

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  await applySession(data.session);

  const { data: authData } = supabase.auth.onAuthStateChange(
    (_event, nextSession) => {
      void applySession(nextSession);
    },
  );
  removeAuthListener = authData.subscription.unsubscribe;
});

onUnmounted(() => {
  removeAuthListener?.();
});

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

// 送信成功時に発火するイベントのテスト
const handlePosted = () => {
  console.log("received an event");
};
</script>

<template>
  <h1 class="page-title">Game Inbox</h1>

  <div class="app-layout">
    <main v-if="session" class="post-form-column">
      <PostForm @posted="handlePosted" />
    </main>

    <div class="auth-column">
      <!-- 読込中（セッション復元待ち） -->
      <div v-if="loading">
        <p>ログイン状態を確認中...</p>
      </div>

      <!-- ログイン済み -->
      <div
        v-else-if="user"
        style="border: 1px solid #ccc; padding: 20px; border-radius: 8px"
      >
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
          style="border-radius: 50%; object-fit: cover"
        />

        <div style="margin: 15px 0">
          <h2>
            {{
              user.user_metadata?.user_name ||
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              "Discordユーザー"
            }}
          </h2>
        </div>

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
        <p>ログインが必要です。</p>
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
  </div>
</template>

<style scoped>
.page-title {
  width: 100%;
  margin: 24px 0 0;
  text-align: center;
}

.app-layout {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: center;
}

.post-form-column {
  flex: 0 1 600px;
  min-width: 0;
  max-width: 600px;
  box-sizing: border-box;
}

.post-form-column {
  margin: 40px 0;
}

.auth-column {
  flex: 0 1 360px;
  width: 100%;
  max-width: 360px;
  margin: 40px 0;
  font-family: sans-serif;
  text-align: center;
}

.auth-column > div {
  width: 100%;
  box-sizing: border-box;
}

.auth-column h1 {
  font-size: 36px;
  margin: 20px 0;
}

.auth-column button {
  max-width: 280px;
  box-sizing: border-box;
}

@media (max-width: 760px) {
  .app-layout {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .post-form-column,
  .auth-column {
    flex-basis: auto;
    width: 100%;
    max-width: 600px;
  }

  .auth-column {
    margin-top: 0;
  }
}
.title {
  text-align: center;
  margin-top: 20px;
  margin-bottom: 24px;
}
</style>
