// Client-side HTML to image export utilities
// Uses html-to-image for PNG generation

import { toPng } from 'html-to-image'
import { saveAs } from 'file-saver'

export interface ExportOptions {
  filename: string
  quality?: number
  backgroundColor?: string
  width?: number
  height?: number
}

/**
 * Export a DOM element to PNG and trigger download
 */
export async function exportToPNG(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const {
    filename,
    quality = 0.95,
    backgroundColor = '#000000',
    width,
    height,
  } = options

  try {
    // Generate PNG blob
    const dataUrl = await toPng(element, {
      quality,
      backgroundColor,
      width,
      height,
      pixelRatio: 2, // 2x for retina displays
      cacheBust: true,
      style: {
        // Ensure fonts and styles are loaded
        fontFamily: 'inherit',
      },
    })

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Trigger download
    saveAs(blob, `${filename}.png`)
  } catch (error) {
    console.error('Error exporting to PNG:', error)
    throw new Error('Failed to export cheat sheet. Please try again.')
  }
}

/**
 * Generate PNG blob without downloading (for upload to storage)
 */
export async function generatePNGBlob(
  element: HTMLElement,
  options: Omit<ExportOptions, 'filename'>
): Promise<Blob> {
  const {
    quality = 0.95,
    backgroundColor = '#000000',
    width,
    height,
  } = options

  try {
    const dataUrl = await toPng(element, {
      quality,
      backgroundColor,
      width,
      height,
      pixelRatio: 2,
      cacheBust: true,
    })

    const response = await fetch(dataUrl)
    return await response.blob()
  } catch (error) {
    console.error('Error generating PNG blob:', error)
    throw new Error('Failed to generate image')
  }
}

/**
 * Copy share link to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    throw new Error('Failed to copy link')
  }
}

/**
 * Share using Web Share API if available
 */
export async function shareViaWebShare(
  title: string,
  text: string,
  url: string
): Promise<boolean> {
  if (!navigator.share) {
    return false
  }

  try {
    await navigator.share({
      title,
      text,
      url,
    })
    return true
  } catch (error) {
    // User cancelled or share failed
    console.log('Share cancelled or failed:', error)
    return false
  }
}

/**
 * Prepare element for export (hide interactive elements, etc.)
 */
export function prepareElementForExport(element: HTMLElement): () => void {
  // Store original styles
  const interactiveElements = element.querySelectorAll('button, a, input')
  const originalStyles = new Map<Element, string>()

  interactiveElements.forEach(el => {
    const htmlEl = el as HTMLElement
    originalStyles.set(el, htmlEl.style.cssText)
    // Hide interactive elements during export
    htmlEl.style.opacity = '0'
    htmlEl.style.pointerEvents = 'none'
  })

  // Return cleanup function
  return () => {
    interactiveElements.forEach(el => {
      const htmlEl = el as HTMLElement
      htmlEl.style.cssText = originalStyles.get(el) || ''
    })
  }
}
