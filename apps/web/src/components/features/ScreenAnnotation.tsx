import React, { useRef, useState, useEffect } from 'react'

interface AnnotationTool {
  type: 'pen' | 'highlighter' | 'arrow' | 'text'
  color: string
  size: number
}

interface Annotation {
  id: string
  tool: AnnotationTool
  points: { x: number; y: number }[]
  text?: string
}

export function ScreenAnnotation({ streamId }: { streamId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<AnnotationTool>({ type: 'pen', color: '#ff0000', size: 3 })
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const annotation: Annotation = {
      id: Date.now().toString(),
      tool,
      points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]
    }
    setCurrentAnnotation(annotation)
  }

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setCurrentAnnotation({
      ...currentAnnotation,
      points: [...currentAnnotation.points, point]
    })
  }

  const stopDrawing = () => {
    if (currentAnnotation) {
      setAnnotations([...annotations, currentAnnotation])
      setCurrentAnnotation(null)
    }
    setIsDrawing(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all annotations
    ;[...annotations, currentAnnotation].filter(Boolean).forEach(ann => {
      if (!ann) return
      ctx.strokeStyle = ann.tool.color
      ctx.lineWidth = ann.tool.size
      ctx.lineCap = 'round'
      ctx.globalAlpha = ann.tool.type === 'highlighter' ? 0.5 : 1

      ctx.beginPath()
      ann.points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    })
  }, [annotations, currentAnnotation])

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ position: 'absolute', top: 0, left: 0, cursor: 'crosshair' }}
      />
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px' }}>
        <button onClick={() => setTool({ ...tool, type: 'pen' })}>Pen</button>
        <button onClick={() => setTool({ ...tool, type: 'highlighter' })}>Highlighter</button>
        <button onClick={() => setTool({ ...tool, type: 'arrow' })}>Arrow</button>
        <button onClick={() => setAnnotations([])}>Clear</button>
      </div>
    </div>
  )
}
