import { computed, ref } from "vue";
import { supabase } from "../supabase";

const getMetadataValue = (user, key) =>
  user?.user_metadata?.custom_claims?.[key] ||
  user?.user_metadata?.[key] ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name;

export function useAuth() {
  const user = ref(null);
  const session = ref(null);
  const profile = ref(null);
  const loading = ref(true);
  const authError = ref("");
  const displayName = computed(
    () => getMetadataValue(user.value, "global_name") || "Discordユーザー",
  );

  const saveProfile = async (authUser) => {
    const profileData = {
      user_id: authUser.id,
      username: getMetadataValue(authUser, "username") || "Discordユーザー",
      display_name:
        getMetadataValue(authUser, "global_name") || "Discordユーザー",
      avatar_url:
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        null,
    };
    const { error } = await supabase.from("profiles").upsert(profileData, {
      onConflict: "user_id",
    });
    if (error) {
      console.error("Error saving profile:", error.message);
      return;
    }
    profile.value = { avatar_url: profileData.avatar_url };
  };

  const applySession = async (nextSession, loadTeams) => {
    session.value = nextSession;
    user.value = nextSession?.user ?? null;
    loading.value = true;
    if (user.value) {
      await saveProfile(user.value);
      await loadTeams(user.value.id);
    } else {
      profile.value = null;
    }
    loading.value = false;
  };

  const initialize = async (loadTeams) => {
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
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
    await applySession(currentSession, loadTeams);
    return supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => void applySession(nextSession, loadTeams), 0);
    }).data.subscription;
  };

  const signInWithDiscord = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: window.location.origin },
    });
    if (error) console.error("Error logging in:", error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error.message);
  };

  return {
    user,
    session,
    profile,
    loading,
    authError,
    displayName,
    initialize,
    signInWithDiscord,
    signOut,
  };
}
