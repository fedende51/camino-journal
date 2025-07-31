import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

interface GarminActivityRequest {
  email: string
  password: string
  days?: number
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, days = 30 }: GarminActivityRequest = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate days parameter
    if (days && (days < 1 || days > 90)) {
      return NextResponse.json(
        { success: false, error: 'Days parameter must be between 1 and 90' },
        { status: 400 }
      )
    }

    console.log(`Fetching Garmin activities for last ${days} days...`)

    // Get the path to the Python script and virtual environment
    const scriptPath = path.join(process.cwd(), 'scripts', 'garmin_fetch.py')
    const venvPython = path.join(process.cwd(), 'venv', 'bin', 'python3')

    // Execute Python script using virtual environment
    const pythonProcess = spawn(venvPython, [
      scriptPath,
      '--email', email,
      '--password', password,
      '--days', days.toString()
    ], {
      timeout: 120000, // 120 second timeout for 30 days of data
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    // Wait for process to complete
    const result = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse JSON output from Python script
            const output = JSON.parse(stdout.trim())
            resolve({ success: true, data: output })
          } catch (parseError) {
            console.error('Failed to parse Python script output:', parseError)
            console.error('Raw output:', stdout)
            resolve({ 
              success: false, 
              error: 'Failed to parse activity data' 
            })
          }
        } else {
          console.error('Python script failed with code:', code)
          console.error('stderr:', stderr)
          
          // Try to parse error from stdout if it's JSON
          try {
            const errorOutput = JSON.parse(stdout.trim())
            resolve({ 
              success: false, 
              error: errorOutput.error || 'Python script execution failed' 
            })
          } catch {
            resolve({ 
              success: false, 
              error: stderr || 'Failed to execute Garmin data fetch' 
            })
          }
        }
      })

      pythonProcess.on('error', (error) => {
        console.error('Python process error:', error)
        resolve({ 
          success: false, 
          error: 'Failed to start Python process. Ensure Python 3 is installed.' 
        })
      })

      // Handle timeout
      setTimeout(() => {
        pythonProcess.kill('SIGTERM')
        resolve({ 
          success: false, 
          error: 'Request timeout. Garmin Connect may be slow to respond.' 
        })
      }, 115000) // Kill 5 seconds before the spawn timeout
    })

    if (result.success && result.data) {
      return NextResponse.json(result.data)
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Garmin API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}