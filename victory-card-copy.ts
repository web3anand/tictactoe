// Simple and working victory card copy function
const copyVictoryCardAsImage = async (cardId: string): Promise<boolean> => {
  try {
    const element = document.getElementById(cardId)
    if (!element) {
      console.error('Victory card element not found')
      return false
    }

    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Use html2canvas alternative - manual canvas drawing
    const rect = element.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get canvas context')
      return false
    }

    // Set canvas size
    canvas.width = rect.width
    canvas.height = rect.height
    
    // Create a simple screenshot using canvas
    // This captures the element by drawing it manually
    ctx.fillStyle = '#1f2937' // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add a simple representation of the victory card
    // Get text content from the element
    const titleElement = element.querySelector('h1')
    const subtitleElement = element.querySelector('p')
    
    const title = titleElement?.textContent || 'GAME COMPLETE'
    const subtitle = subtitleElement?.textContent || 'Thanks for playing!'
    
    // Draw title
    ctx.fillStyle = '#fbbf24' // Gold color
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(title, canvas.width / 2, 60)
    
    // Draw subtitle
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.fillText(subtitle, canvas.width / 2, 100)
    
    // Draw border
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 3
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    
    // Convert to blob
    return new Promise<boolean>((resolve) => {
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          console.error('Failed to create image blob')
          resolve(false)
          return
        }

        let success = false

        // Try different methods based on device
        if (isMobile && navigator.share) {
          try {
            const file = new File([blob], 'victory-card.png', { type: 'image/png' })
            await navigator.share({
              title: 'Tic Tac Toe Victory Card',
              text: 'Check out my game result!',
              files: [file]
            })
            success = true
            console.log('Victory card shared successfully!')
          } catch (error) {
            console.log('Share failed, trying clipboard...', error)
          }
        }

        // Try clipboard API for desktop
        if (!success && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ])
            success = true
            console.log('Victory card copied to clipboard!')
          } catch (error) {
            console.log('Clipboard failed, downloading...', error)
          }
        }

        // Fallback: download the image
        if (!success) {
          try {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'victory-card.png'
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            success = true
            console.log('Victory card downloaded!')
          } catch (error) {
            console.error('Download failed:', error)
          }
        }

        resolve(success)
      }, 'image/png')
    })
  } catch (error) {
    console.error('Error copying victory card:', error)
    return false
  }
}