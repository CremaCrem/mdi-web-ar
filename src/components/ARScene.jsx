import { useEffect, useRef, useState } from 'react'

const TARGET_FILE = `${import.meta.env.BASE_URL}targets/bookmark.mind`
const SANTO_NINO_MODEL = `${import.meta.env.BASE_URL}santo_nino.glb`
const TLR_CAMERA_MODEL = `${import.meta.env.BASE_URL}tlr_camera.glb`
const MODEL_HIDE_DELAY_MS = 5000

function ARScene() {
  const sceneRef = useRef(null)
  const activeTargetRef = useRef(null)
  const hideTimerRef = useRef(null)
  const rafRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraError, setCameraError] = useState('')
  const [activeTarget, setActiveTarget] = useState(null)

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return

    const target0El = sceneEl.querySelector('#target-0')
    const target1El = sceneEl.querySelector('#target-1')
    const displayAnchorEl = sceneEl.querySelector('#display-anchor')

    const clearHideTimer = () => {
      if (!hideTimerRef.current) return
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    const activateTarget = (targetIndex) => {
      clearHideTimer()
      activeTargetRef.current = targetIndex
      setActiveTarget(targetIndex)
    }

    const scheduleHide = (targetIndex) => {
      if (activeTargetRef.current !== targetIndex) return
      clearHideTimer()
      hideTimerRef.current = setTimeout(() => {
        activeTargetRef.current = null
        setActiveTarget(null)
      }, MODEL_HIDE_DELAY_MS)
    }

    const syncAnchorTransform = () => {
      const targetIndex = activeTargetRef.current
      if (targetIndex !== null && displayAnchorEl?.object3D) {
        const sourceEl = targetIndex === 0 ? target0El : target1El
        const sourceObject = sourceEl?.object3D
        const displayObject = displayAnchorEl.object3D

        if (sourceObject?.visible) {
          displayObject.position.copy(sourceObject.position)
          displayObject.quaternion.copy(sourceObject.quaternion)
          displayObject.scale.copy(sourceObject.scale)
        }
      }

      rafRef.current = requestAnimationFrame(syncAnchorTransform)
    }

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

    const handleTarget0Found = () => activateTarget(0)
    const handleTarget0Lost = () => scheduleHide(0)
    const handleTarget1Found = () => activateTarget(1)
    const handleTarget1Lost = () => scheduleHide(1)

    sceneEl.addEventListener('arReady', handleARReady)
    sceneEl.addEventListener('arError', handleARError)
    target0El?.addEventListener('targetFound', handleTarget0Found)
    target0El?.addEventListener('targetLost', handleTarget0Lost)
    target1El?.addEventListener('targetFound', handleTarget1Found)
    target1El?.addEventListener('targetLost', handleTarget1Lost)
    syncAnchorTransform()

    return () => {
      clearHideTimer()
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      sceneEl.removeEventListener('arReady', handleARReady)
      sceneEl.removeEventListener('arError', handleARError)
      target0El?.removeEventListener('targetFound', handleTarget0Found)
      target0El?.removeEventListener('targetLost', handleTarget0Lost)
      target1El?.removeEventListener('targetFound', handleTarget1Found)
      target1El?.removeEventListener('targetLost', handleTarget1Lost)

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
    <main className="ar-root fixed inset-0 z-0 h-[100svh] w-screen overflow-hidden text-white">
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

        <a-entity id="target-0" mindar-image-target="targetIndex: 0" />
        <a-entity id="target-1" mindar-image-target="targetIndex: 1" />

        <a-entity id="display-anchor" visible={activeTarget !== null}>
          {activeTarget === 0 && (
            <a-gltf-model
              src={SANTO_NINO_MODEL}
              position="0 0 0"
              rotation="0 0 0"
              scale="1 1 1"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 18000; easing: linear;"
            />
          )}
          {activeTarget === 1 && (
            <a-gltf-model
              src={TLR_CAMERA_MODEL}
              position="0 0 0"
              rotation="0 0 0"
              scale="1 1 1"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 18000; easing: linear;"
            />
          )}
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
        {activeTarget === null
          ? 'Aim your camera at the bookmark target image.'
          : 'Target locked. Keep viewing this model or scan another target.'}
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
