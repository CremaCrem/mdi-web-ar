import { useEffect, useRef, useState } from 'react'

const TARGET_FILE = `${import.meta.env.BASE_URL}targets/bookmark.mind`
const SANTO_NINO_MODEL = `${import.meta.env.BASE_URL}santo_nino.glb`
const TLR_CAMERA_MODEL = `${import.meta.env.BASE_URL}tlr_camera.glb`

function ARScene() {
  const sceneRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraError, setCameraError] = useState('')

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    const handleARReady = () => {
      setIsLoading(false)
      setCameraError('')
    }

    const handleARError = (event) => {
      const errorMessage = event?.detail?.error
      setCameraError(
        errorMessage || 'Camera access failed. Allow camera permissions and try again.',
      )
      setIsLoading(false)
    }

    sceneEl.addEventListener('arReady', handleARReady)
    sceneEl.addEventListener('arError', handleARError)

    return () => {
      sceneEl.removeEventListener('arReady', handleARReady)
      sceneEl.removeEventListener('arError', handleARError)

      const mindarSystem = sceneEl.systems?.['mindar-image-system']
      if (mindarSystem?.stop) {
        mindarSystem.stop()
      }

      // Extra camera cleanup to prevent camera lock between route changes.
      const videoEls = document.querySelectorAll('video')
      videoEls.forEach((video) => {
        const stream = video.srcObject
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => track.stop())
        }
      })
    }
  }, [])

  return (
    <main className="fixed inset-0 z-0 h-[100svh] w-screen overflow-hidden text-white">
      <a-scene
        ref={sceneRef}
        mindar-image={`imageTargetSrc: ${TARGET_FILE}; autoStart: true; uiScanning: false; uiLoading: false; uiError: false; filterMinCF: 0.0001; filterBeta: 0.0005;`}
        color-space="sRGB"
        embedded
        renderer="colorManagement: true, physicallyCorrectLights; alpha: true"
        style={{ backgroundColor: 'transparent', width: '100vw', height: '100svh' }}
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-camera position="0 0 0" look-controls="enabled: false" />

        <a-entity mindar-image-target="targetIndex: 0">
          <a-gltf-model
            src={SANTO_NINO_MODEL}
            position="0 0 0"
            rotation="0 0 0"
            scale="1 1 1"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 18000; easing: linear;"
          />
        </a-entity>

        <a-entity mindar-image-target="targetIndex: 1">
          <a-gltf-model
            src={TLR_CAMERA_MODEL}
            position="0 0 0"
            rotation="0 0 0"
            scale="1 1 1"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 18000; easing: linear;"
          />
        </a-entity>
      </a-scene>

      {isLoading && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 text-lg font-semibold">
          Loading AR...
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
        <div className="h-60 w-60 rounded-2xl border-4 border-white/80 shadow-[0_0_30px_rgba(255,255,255,0.35)]" />
      </div>

      <p className="pointer-events-none fixed bottom-8 left-1/2 z-10 w-[90%] max-w-md -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-center text-sm">
        Aim your camera at the bookmark target image.
      </p>

      {cameraError && (
        <div className="fixed inset-x-4 top-4 z-30 rounded-xl border border-red-500/60 bg-red-900/75 p-3 text-sm text-red-100">
          {cameraError}
        </div>
      )}
    </main>
  )
}

export default ARScene
