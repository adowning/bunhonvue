import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { type Router, useRouter } from 'vue-router'
import { ValibotWebSocketClient, wsClient } from '@ws-kit/client/valibot'
import { GetMe } from '../../../../shared/schema'
let wss: WebSocket

type ServerState = 'offline' | 'restarting' | 'booting' | 'online' | 'updating'

let router: Router

const websocketHOST = import.meta.env.VITE_WS_HOST
const websocketPORT = import.meta.env.VITE_WS_PORT
let websocketURI: string
if (websocketHOST && websocketPORT) websocketURI = `http://${websocketHOST}:${websocketPORT}/ws`

export const useWebsocketStore = defineStore('websocket', () => {
  if (!router) router = useRouter()
  const client = ref()

  client.value = wsClient({
    url: 'ws://localhost:3000/ws',
    auth: {
      getToken: async () => localStorage.getItem('access_token'),
      attach: 'query', // default
      queryParam: 'access_token' // default parameter name
    }
  })
  const history = ref([])
  //   const serverConfig = ref({} as ServerConfig)
  const serverState = ref('' as ServerState)
  const hasConfigChanged = ref(false)

  //   const pluginLoaders: PluginLoader = ['bukkit', 'folia', 'paper', 'purpur', 'spigot']
  //   const modLoaders: ModLoader = [
  //     'fabric',
  //     'forge',
  //     'liteloader',
  //     'modloader',
  //     'neoforge',
  //     'rift',
  //     'quilt'
  //   ]

  const discordAuthToken = useLocalStorage('discordAuthToken', '')
  const discordExpiry = useLocalStorage('discordExpiry', 0)
  const discordUser = useLocalStorage('discordUser', {})

  //   const isPluginsSupported = computed(() => {
  //     return pluginLoaders.includes(serverConfig.value.mod_loader)
  //   })

  //   const isModsSupported = computed(() => {
  //     return modLoaders.includes(serverConfig.value.mod_loader)
  //   })

  const isAuthed = computed(() => {
    return discordAuthToken.value.length > 0 && new Date().getTime() <= discordExpiry.value
  })

  async function connectToSocket() {
    try {
      const _token = localStorage.getItem('sb-crqbazcsrncvbnapuxcp-auth-token')
      let token
      if (_token) token = JSON.parse(_token)
      const access_token = token?.access_token
      localStorage.setItem('access_token', access_token)
      console.log(access_token)
      const connectTo = websocketURI || 'ws://' + window.location.host
      console.log(connectTo + '?token=' + access_token)
      // wss = new WebSocket(connectTo + '?token=' + access_token)
      if (client.value == undefined) return
      await client.connect()

      client.value.on(GetMe, (msg: any) => {
        // ✅ msg.payload.greeting is typed as string
        console.log(msg.payload)
      })
      const reply = await client.value.request(GetMe, undefined, PongMessage, { timeoutMs: 5000 })
    } catch (err) {
      console.error(err)
      //   connectToSocket()
    }
    client.value.onopen = () => {
      console.log('requestintg')
      requestEverything()
    }

    client.value.onmessage = (event: any) => {
      const { type, data } = JSON.parse(event.data)

      console.log('incoming message', { type, data })

      if (type === 'updateHistory') {
        history.value = data
      }

      //   if (type === 'serverConfig') {
      //     serverConfig.value = data
      //   }

      if (type === 'serverState') {
        serverState.value = data
      }

      if (type === 'hasConfigChanged') {
        hasConfigChanged.value = data
      }

      if (type === 'updateAuth') {
        discordAuthToken.value = data.auth_token
        discordExpiry.value = data.expiry
        discordUser.value = data.user

        router.push('dashboard')
      }
      if (type === 'deAuth') {
        discordAuthToken.value = ''
        discordExpiry.value = 0
        discordUser.value = {}
      }
    }

    client.value.onclose = () => {
      setTimeout(() => {
        connectToSocket()
      }, 1000)
    }
  }

  function requestEverything() {
    client.value.send(
      JSON.stringify({
        type: 'requestEverything',
        token: discordAuthToken.value
      })
    )
  }

  function postCommand(command: string) {
    client.value.send(
      JSON.stringify({
        type: 'command',
        content: command,
        token: discordAuthToken.value
      })
    )
  }

  function postAction(actionName: string) {
    client.value.send(
      JSON.stringify({
        type: 'action',
        content: actionName,
        token: discordAuthToken.value
      })
    )
  }

  //   function saveConfig() {
  //     wss.send(
  //       JSON.stringify({
  //         type: 'saveConfig',
  //         content: serverConfig.value,
  //         token: discordAuthToken.value
  //       })
  //     )
  //   }

  function discordAuth(code: string) {
    client.value.send(
      JSON.stringify({
        type: 'discordAuth',
        content: code,
        token: discordAuthToken.value
      })
    )
  }

  return {
    hasConfigChanged,
    history,
    serverState,
    // serverConfig,
    discordAuthToken,
    discordExpiry,
    discordUser,
    connectToSocket,
    // pluginLoaders,
    // modLoaders,
    // isModsSupported,
    // isPluginsSupported,
    isAuthed,
    postCommand,
    postAction,
    // saveConfig,
    discordAuth
  }
})
