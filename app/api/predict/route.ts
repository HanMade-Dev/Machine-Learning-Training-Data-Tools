import { NextResponse } from "next/server"
import { exec } from "child_process"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    data.action = "predict" // Mark this as a prediction request

    // Write the data to a temporary JSON file
    const tempFilePath = path.join(process.cwd(), "temp_predict_data.json")
    await writeFile(tempFilePath, JSON.stringify(data))

    // Execute the Python script
    const result = await new Promise<string>((resolve, reject) => {
      exec(`python api/ml_backend.py < ${tempFilePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Python script: ${error.message}`)
          return reject(error)
        }
        if (stderr) {
          console.error(`Python script stderr: ${stderr}`)
        }
        resolve(stdout)
      })
    })

    // Parse the result
    const parsedResult = JSON.parse(result)

    return NextResponse.json(parsedResult)
  } catch (error) {
    console.error("Error in predict API:", error)
    return NextResponse.json({ success: false, error: "Failed to make predictions" }, { status: 500 })
  }
}

