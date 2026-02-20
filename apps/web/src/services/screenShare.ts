import { SCREEN_SHARE_TIERS } from '@beacon/types'

export class ScreenShareService {
  private stream: MediaStream | null = null
  private peerConnection: RTCPeerConnection | null = null
  private isPlus: boolean = false

  async startScreenShare(hasBeaconPlus: boolean = false) {
    this.isPlus = hasBeaconPlus
    const quality = hasBeaconPlus ? '4k' : '720p'
    const fps = hasBeaconPlus ? 60 : 60

    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: hasBeaconPlus ? 3840 : 1280 },
          height: { ideal: hasBeaconPlus ? 2160 : 720 },
          frameRate: { ideal: fps, max: fps }
        },
        audio: true
      })

      const videoTrack = this.stream.getVideoTracks()[0]
      if (videoTrack) {
        await videoTrack.applyConstraints({
          width: { ideal: hasBeaconPlus ? 3840 : 1280 },
          height: { ideal: hasBeaconPlus ? 2160 : 720 },
          frameRate: { ideal: fps, max: fps }
        })
      }

      return this.stream
    } catch (error) {
      console.error('Screen share failed:', error)
      throw error
    }
  }

  async stopScreenShare() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
  }

  getQualityInfo() {
    return {
      tier: this.isPlus ? 'BEACON+' : 'FREE',
      resolution: this.isPlus ? '4K' : '720p',
      fps: 60,
      description: this.isPlus ? '4K @ 60fps - Ultra HD' : '720p @ 60fps - HD'
    }
  }

  async createPeerConnection(config: RTCConfiguration) {
    this.peerConnection = new RTCPeerConnection(config)
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.stream!)
      })
    }
    return this.peerConnection
  }
}

export const screenShareService = new ScreenShareService()
