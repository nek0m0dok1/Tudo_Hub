<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { Analytics } from "@vercel/analytics/vue";
import { supabase } from "./supabase";
import PostForm from "./components/PostForm.vue";
import PostCard from "./components/PostCard.vue";

// 認証ユーザー情報（Supabase Auth）
const user = ref(null);
const session = ref(null);
const teams = ref([]);
const selectedTeamId = ref("");
const ideas = ref([]);
const showTeamModal = ref(false);
const teamName = ref("");
const teamInviteCode = ref("");
const joinInviteCode = ref("");
const joiningTeam = ref(false);
const joinTeamError = ref("");
const creatingTeam = ref(false);
const teamError = ref("");
// データベースから取得したプロフィール（public.profiles）
const profile = ref(null);
// ローディング状態（初期値 true）
const loading = ref(true);
const authError = ref("");
const selectedTeam = computed(() =>
  teams.value.find((team) => team.id === selectedTeamId.value),
);

// プロフィール情報の取得
const fetchProfile = async (authUser) => {
  const username =
    authUser.user_metadata?.user_name ||
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    "Discordユーザー";
  const avatarUrl =
    authUser.user_metadata?.avatar_url ||
    authUser.user_metadata?.picture ||
    null;

  const profileData = {
    user_id: authUser.id,
    username,
    avatar_url: avatarUrl,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "user_id" });

  if (error) {
    console.error("Error saving profile:", error.message);
    return;
  }

  profile.value = { avatar_url: avatarUrl };
};

const fetchTeams = async (userId) => {
  const { data: memberships, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  if (membershipError) {
    console.error("Error fetching team memberships:", membershipError.message);
    teams.value = [];
    selectedTeamId.value = "";
    return;
  }

  const teamIds = memberships.map((membership) => membership.team_id);
  if (!teamIds.length) {
    teams.value = [];
    selectedTeamId.value = "";
    return;
  }

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, invite_code")
    .in("id", teamIds)
    .order("name");

  if (error) {
    console.error("Error fetching teams:", error.message);
    return;
  }

  teams.value = data ?? [];
  if (!teams.value.some((team) => team.id === selectedTeamId.value)) {
    selectedTeamId.value = teams.value[0]?.id ?? "";
  }
};

const fetchIdeas = async () => {
  if (!selectedTeamId.value) {
    ideas.value = [];
    return;
  }

  const { data, error } = await supabase
    .from("ideas")
    .select("id, title, user_id, user_name, team_id, url, likes")
    .eq("team_id", selectedTeamId.value)
    .order("id", { ascending: false });

  if (error) {
    console.error("Error fetching ideas:", error.message);
    return;
  }

  ideas.value = data ?? [];
};

// 初期化および認証状態の監視
let removeAuthListener;
let authStateTimer;
let sessionRequestId = 0;

const applySession = async (nextSession) => {
  const requestId = ++sessionRequestId;
  session.value = nextSession;
  user.value = nextSession?.user ?? null;

  if (user.value) {
    loading.value = true;
    await fetchProfile(user.value);
    await fetchTeams(user.value.id);
    await fetchIdeas();
  } else {
    profile.value = null;
    teams.value = [];
    selectedTeamId.value = "";
    ideas.value = [];
  }

  if (requestId !== sessionRequestId) return;
  loading.value = false;
};

onMounted(async () => {
  const { data: authData } = supabase.auth.onAuthStateChange(
    (_event, nextSession) => {
      authStateTimer = window.setTimeout(() => {
        void applySession(nextSession);
      }, 0);
    },
  );
  removeAuthListener = authData.subscription.unsubscribe;

  const callbackParams = new URLSearchParams(window.location.search);
  const callbackError = callbackParams.get("error_description");
  if (callbackError) authError.value = callbackError;

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    authError.value = sessionError.message;
    console.error("Error getting auth session:", sessionError.message);
  }

  let currentSession = data.session;
  const callbackCode = callbackParams.get("code");

  if (!currentSession && callbackCode) {
    const { data: exchangedData, error } =
      await supabase.auth.exchangeCodeForSession(callbackCode);

    if (error) {
      authError.value = error.message;
      console.error("Error exchanging OAuth code:", error.message);
    } else {
      currentSession = exchangedData.session;
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  await applySession(currentSession);
});

onUnmounted(() => {
  window.clearTimeout(authStateTimer);
  removeAuthListener?.();
});

watch(selectedTeamId, () => {
  void fetchIdeas();
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

const closeTeamModal = () => {
  if (creatingTeam.value) return;
  showTeamModal.value = false;
  teamName.value = "";
  teamInviteCode.value = "";
  teamError.value = "";
};

const generateInviteCode = () =>
  crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

const openTeamModal = () => {
  teamInviteCode.value = generateInviteCode();
  showTeamModal.value = true;
};

const createTeam = async () => {
  const name = teamName.value.trim();
  if (!name || !user.value) {
    teamError.value = "チーム名を入力してください。";
    return;
  }

  creatingTeam.value = true;
  teamError.value = "";

  const { data: team, error: teamErrorResponse } = await supabase
    .from("teams")
    .insert({ name, invite_code: teamInviteCode.value })
    .select("id, name")
    .single();

  if (teamErrorResponse) {
    teamError.value = "チームを作成できませんでした。";
    console.error("Error creating team:", teamErrorResponse.message);
    creatingTeam.value = false;
    return;
  }

  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: user.value.id,
  });

  if (memberError) {
    teamError.value = `チームは作成されましたが、所属登録に失敗しました: ${memberError.message}`;
    console.error("Error adding team member:", memberError.message);
    creatingTeam.value = false;
    return;
  }

  await fetchTeams(user.value.id);
  selectedTeamId.value = team.id;
  creatingTeam.value = false;
  closeTeamModal();
};

const joinTeam = async () => {
  const code = joinInviteCode.value.trim().toUpperCase();
  if (!code || !user.value) {
    joinTeamError.value = "招待コードを入力してください。";
    return;
  }

  joiningTeam.value = true;
  joinTeamError.value = "";

  const { data: teamId, error: memberError } = await supabase.rpc(
    "join_team_by_invite_code",
    { invite_code_input: code },
  );

  if (memberError) {
    if (memberError.message.includes("Invalid invite code")) {
      joinTeamError.value = "招待コードが正しくありません。";
    } else {
      joinTeamError.value = "チームへの参加に失敗しました。";
    }
    console.error("Error joining team:", memberError.message);
    joiningTeam.value = false;
    return;
  }

  await fetchTeams(user.value.id);
  selectedTeamId.value = teamId;
  joinInviteCode.value = "";
  joiningTeam.value = false;
};

const handleKeydown = (event) => {
  if (event.key === "Escape") closeTeamModal();
};

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));

// 送信成功時に発火するイベントのテスト
const handlePosted = () => {
  void fetchIdeas();
};
</script>

<template>
  <h1 class="page-title">Tudo Hub</h1>

  <div class="app-layout">
    <main v-if="session" class="post-form-column">
      <label class="team-selector" for="team-select">
        チーム
        <select id="team-select" v-model="selectedTeamId">
          <option v-for="team in teams" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
      </label>
      <p v-if="selectedTeam" class="team-invite-code">
        招待コード: <strong>{{ selectedTeam.invite_code }}</strong>
      </p>
      <p v-if="!teams.length" class="team-empty">
        所属しているチームがありません。
      </p>
      <PostForm
        v-if="selectedTeamId"
        :team-id="selectedTeamId"
        @posted="handlePosted"
      />
      <div class="post-list">
        <PostCard
          v-for="idea in ideas"
          :key="idea.id"
          :idea="idea"
          @updated="fetchIdeas"
        />
      </div>
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

      <button v-if="user" class="create-team-button" @click="openTeamModal">
        チームを新規作成
      </button>

      <form v-if="user" class="join-team-form" @submit.prevent="joinTeam">
        <label class="team-name-field" for="join-team-code">
          招待コードで参加
          <input
            id="join-team-code"
            v-model="joinInviteCode"
            type="text"
            maxlength="8"
            placeholder="招待コード"
            :disabled="joiningTeam"
          />
        </label>
        <p v-if="joinTeamError" class="team-error" role="alert">
          {{ joinTeamError }}
        </p>
        <button class="modal-submit" type="submit" :disabled="joiningTeam">
          {{ joiningTeam ? "参加中..." : "チームに参加" }}
        </button>
      </form>

      <div
        v-if="showTeamModal"
        class="modal-backdrop"
        role="presentation"
        @click.self="closeTeamModal"
      >
        <section
          class="team-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-modal-title"
        >
          <div class="modal-header">
            <h2 id="team-modal-title">チームを新規作成</h2>
            <button
              class="modal-close"
              type="button"
              aria-label="モーダルを閉じる"
              :disabled="creatingTeam"
              @click="closeTeamModal"
            >
              ×
            </button>
          </div>
          <form @submit.prevent="createTeam">
            <label class="team-name-field" for="new-team-name">
              チーム名
              <input
                id="new-team-name"
                v-model="teamName"
                type="text"
                maxlength="50"
                placeholder="例：開発チーム"
                :disabled="creatingTeam"
                autofocus
              />
            </label>
            <label class="team-name-field" for="new-team-invite-code">
              招待コード
              <input
                id="new-team-invite-code"
                :value="teamInviteCode"
                type="text"
                readonly
              />
            </label>
            <p v-if="teamError" class="team-error" role="alert">{{ teamError }}</p>
            <div class="modal-actions">
              <button
                type="button"
                class="modal-cancel"
                :disabled="creatingTeam"
                @click="closeTeamModal"
              >
                キャンセル
              </button>
              <button type="submit" class="modal-submit" :disabled="creatingTeam">
                {{ creatingTeam ? "作成中..." : "作成する" }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <!-- 未ログイン -->
      <div
        v-if="!loading && !user"
        style="border: 1px solid #ccc; padding: 20px; border-radius: 8px"
      >
        <p v-if="authError" class="auth-error" role="alert">
          ログインに失敗しました: {{ authError }}
        </p>
        <p>ご利用にはログインが必要です。</p>
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

  <Analytics />
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

.team-selector {
  display: block;
  margin-bottom: 12px;
  text-align: left;
}

.team-selector select {
  width: 100%;
  margin-top: 4px;
  padding: 8px 12px;
  box-sizing: border-box;
}

.team-invite-code {
  margin: -4px 0 16px;
  color: var(--text);
  font-size: 14px;
  text-align: left;
}

.team-invite-code strong {
  color: var(--text-h);
  letter-spacing: 1px;
}

.team-empty {
  margin-bottom: 12px;
  text-align: left;
}

.post-list {
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
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

.create-team-button {
  width: 100%;
  margin-top: 12px;
  padding: 10px 16px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--accent);
  background: transparent;
  cursor: pointer;
  font-weight: 600;
}

.create-team-button:hover {
  background: var(--accent-bg);
}

.join-team-form {
  width: 100%;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-sizing: border-box;
  text-align: left;
}

.join-team-form .modal-submit {
  display: block;
  width: auto;
  margin-top: 12px;
  margin-right: auto;
  margin-left: auto;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(0 0 0 / 45%);
}

.team-modal {
  width: min(100%, 420px);
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  box-shadow: var(--shadow);
  box-sizing: border-box;
  text-align: left;
}

.modal-header,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header {
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
}

.modal-close {
  padding: 0 6px;
  border: 0;
  color: var(--text);
  background: transparent;
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
}

.team-name-field {
  display: block;
  color: var(--text-h);
  font-size: 15px;
  font-weight: 600;
}

.team-name-field input {
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text-h);
  box-sizing: border-box;
  font: inherit;
  font-size: 16px;
}

.team-name-field input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.team-error {
  margin-top: 8px;
  color: #c0392b;
  font-size: 14px;
}

.modal-actions {
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.modal-cancel,
.modal-submit {
  padding: 9px 14px;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
}

.modal-cancel {
  border: 1px solid var(--border);
  color: var(--text);
  background: transparent;
}

.modal-submit {
  border: 1px solid var(--accent);
  color: #fff;
  background: var(--accent);
}

.modal-cancel:disabled,
.modal-submit:disabled,
.modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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
