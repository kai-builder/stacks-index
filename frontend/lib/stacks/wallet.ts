import { AppConfig, showConnect, UserSession } from '@stacks/connect'

const appConfig = new AppConfig(['store_write', 'publish_data'])
export const userSession = new UserSession({ appConfig })

export interface ConnectResult {
  address: string
  publicKey: string
}

export async function connectWallet(): Promise<ConnectResult> {
  return new Promise((resolve, reject) => {
    showConnect({
      appDetails: {
        name: 'StacksIndex',
        icon: typeof window !== 'undefined' ? window.location.origin + '/logo.svg' : '/logo.svg',
      },
      onFinish: () => {
        const userData = userSession.loadUserData()
        const address = userData.profile.stxAddress.mainnet
        const publicKey = userData.appPrivateKey
        resolve({ address, publicKey })
      },
      onCancel: () => {
        reject(new Error('User cancelled connection'))
      },
      userSession,
    })
  })
}

export function disconnectWallet(): void {
  userSession.signUserOut()
}

export function isWalletConnected(): boolean {
  return userSession.isUserSignedIn()
}

export function getWalletAddress(): string | null {
  if (!isWalletConnected()) return null
  const userData = userSession.loadUserData()
  return userData.profile.stxAddress.mainnet
}
