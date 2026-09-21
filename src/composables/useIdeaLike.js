import { onMounted, ref } from "vue";
import { supabase } from "../supabase";

export function useIdeaLike(idea, onUpdated) {
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
      .eq("idea_id", idea.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) console.error("Error checking idea like:", error.message);
    hasLiked.value = Boolean(data);
  });

  const handleLike = async () => {
    if (isLoading.value) return;
    if (!currentUser.value) {
      alert("「やりたい」を押すにはログインが必要です。");
      return;
    }
    isLoading.value = true;
    const userId = currentUser.value.id;
    if (hasLiked.value) {
      const { error } = await supabase
        .from("idea_likes")
        .delete()
        .eq("idea_id", idea.id)
        .eq("user_id", userId);
      if (!error) {
        await updateCount(Math.max((idea.likes || 0) - 1, 0), userId, false);
      } else alert("エラーが発生しました: " + error.message);
    } else {
      const { error } = await supabase
        .from("idea_likes")
        .insert({ idea_id: idea.id, user_id: userId });
      if (!error) await updateCount((idea.likes || 0) + 1, userId, true);
      else if (error.code === "23505") hasLiked.value = true;
      else alert("エラーが発生しました: " + error.message);
    }
    isLoading.value = false;
  };

  const updateCount = async (likes, userId, liked) => {
    const { error } = await supabase
      .from("ideas")
      .update({ likes })
      .eq("id", idea.id);
    if (error) {
      if (liked) {
        await supabase
          .from("idea_likes")
          .delete()
          .eq("idea_id", idea.id)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("idea_likes")
          .insert({ idea_id: idea.id, user_id: userId });
      }
      alert("エラーが発生しました: " + error.message);
      return;
    }
    hasLiked.value = liked;
    onUpdated();
  };
  return { hasLiked, isLoading, handleLike };
}
