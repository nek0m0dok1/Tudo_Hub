<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './supabase'

const user = ref(null)

// ログイン状態の確認と監視
onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data.user

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
})

// Discordログインの実行
const signInWithDiscord = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: window.location.origin // ログイン完了後に戻ってくるURL
    }
  })
  if (error) console.error('Error logging in:', error.message)
}

// ログアウト
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Error logging out:', error.message)
}
</script>

<template>
  <div style="padding: 20px;">
    <div v-if="user">
      <p>ようこそ、{{ user.user_metadata.full_name }} さん！</p>
      <img :src="user.user_metadata.avatar_url" alt="Avatar" width="50" style="border-radius: 50%;" />
      <br /><br />
      <button @click="signOut">ログアウト</button>
    </div>
    <div v-else>
      <button @click="signInWithDiscord">Discordでログイン</button>
    </div>
  </div>
</template>