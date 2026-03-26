import { useEffect, useRef, useState } from 'react'

const TARGET_FILE = `${import.meta.env.BASE_URL}targets/bookmark.mind`
const SANTO_NINO_MODEL = `${import.meta.env.BASE_URL}santo_nino.glb`
const TLR_CAMERA_MODEL = `${import.meta.env.BASE_URL}tlr_camera.glb`

function ARScene() {
  const sceneRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraError, setCameraError] = useState('')
  
  // Track which target is currently "locked" (0, 1, or null)
  const [activeTarget, setActiveTarget] = useState(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    const sceneEl = sceneRef.current
    if (!sceneEl) return
    const targetEntities = sceneEl.querySelectorAll('[mindar-image-target]')
    const targetListeners = []

    const handleARReady = () => {
      setIsLoading(false)
      setCameraError('')
    }

    const handleARError = (event) => {
      setCameraError(event?.detail?.error || 'Camera access failed.')
      setIsLoading(false)
    }

    const getTargetIndex = (event, entity) => {
      const detailIndex = event?.detail?.targetIndex
      if (Number.isInteger(detailIndex)) return detailIndex

      const targetAttr = entity.getAttribute('mindar-image-target')
      if (typeof targetAttr === 'object' && targetAttr !== null) {
        const parsed = Number(targetAttr.targetIndex)
        if (!Number.isNaN(parsed)) return parsed
      }

      if (typeof targetAttr === 'string') {
        const match = targetAttr.match(/targetIndex:\s*(\d+)/)
        if (match) return Number(match[1])
      }

      return null
    }

    sceneEl.addEventListener('arReady', handleARReady)
    sceneEl.addEventListener('arError', handleARError)

    // Mind-AR target events can emit with null detail, so derive index safely.
    targetEntities.forEach((entity) => {
      const handleTargetFound = (event) => {
        const index = getTargetIndex(event, entity)
        if (index === null) return

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setActiveTarget(index)
      }

      const handleTargetLost = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          setActiveTarget(null)
        }, 5000)
      }

      entity.addEventListener('targetFound', handleTargetFound)
      entity.addEventListener('targetLost', handleTargetLost)
      targetListeners.push({ entity, handleTargetFound, handleTargetLost })
    })

    return () => {
      sceneEl.removeEventListener('arReady', handleARReady)
      sceneEl.removeEventListener('arError', handleARError)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      targetListeners.forEach(({ entity, handleTargetFound, handleTargetLost }) => {
        entity.removeEventListener('targetFound', handleTargetFound)
        entity.removeEventListener('targetLost', handleTargetLost)
      })
      
      const mindarSystem = sceneEl.systems?.['mindar-image-system']
      if (mindarSystem?.stop) mindarSystem.stop()
    }
  }, [])

  return (
    <main className="ar-root fixed inset-0 z-0 h-[100svh] w-screen overflow-hidden text-white bg-black">
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

        {/* Target 0: Santo Nino */}
        <a-entity mindar-image-target="targetIndex: 0">
          <a-gltf-model
            src={SANTO_NINO_MODEL}
            visible={activeTarget === 0}
            position="0 0 0"
            rotation="0 0 0"
            scale="1 1 1"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 18000; easing: linear;"
          />
        </a-entity>

        {/* Target 1: TLR Camera */}
        <a-entity mindar-image-target="targetIndex: 1">
          <a-gltf-model
            src={TLR_CAMERA_MODEL}
            visible={activeTarget === 1}
            position="0 0 0"
            rotation="0 0 0"
            scale="1 1 1"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 18000; easing: linear;"
          />
        </a-entity>
      </a-scene>

      {/* Overlays */}
      {isLoading && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black text-lg font-semibold">
          Initializing Camera...
        </div>
      )}

      {/* Instruction text (Removed the square div) */}
      {!isLoading && activeTarget === null && (
        <p className="pointer-events-none fixed bottom-12 left-1/2 z-10 w-[80%] -translate-x-1/2 rounded-xl bg-black/40 px-6 py-3 text-center text-sm backdrop-blur-md">
          Scan the illustration on your bookmark
        </p>
      )}

      {cameraError && (
        <div className="fixed inset-x-4 top-4 z-30 rounded-xl border border-red-500/60 bg-red-900/75 p-3 text-sm text-red-100">
          {cameraError}
        </div>
      )}
    </main>
  )
}

export default ARScene